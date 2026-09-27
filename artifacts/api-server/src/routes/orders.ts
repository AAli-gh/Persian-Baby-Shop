import { Router, type IRouter } from "express";
import { eq, desc, and, sql, gte, inArray } from "drizzle-orm";
import {
  db,
  ordersTable,
  orderItemsTable,
  cartItemsTable,
  cartsTable,
  productsTable,
  discountsTable,
} from "@workspace/db";
import { UpdateOrderBody, ListOrdersQueryParams } from "@workspace/api-zod";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth";
import { evaluateDiscount } from "../lib/discount";
import { checkoutLimiter } from "../middleware/rateLimit";
import { parsePaging, requireId } from "../lib/http";
import { CreateOrderInput, MAX_CART_QUANTITY } from "../lib/validation";

const router: IRouter = Router();

const SHIPPING_COSTS: Record<string, number> = {
  express: 80_000,
  standard: 30_000,
  pickup: 0,
};

function enrichOrder(
  order: typeof ordersTable.$inferSelect,
  items: (typeof orderItemsTable.$inferSelect)[],
) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    discount: Number(order.discount),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: items.map((i) => ({ ...i, price: Number(i.price) })),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { userId, status } = params.data;
  const { page, limit, offset } = parsePaging(params.data.page, params.data.limit, {
    defaultLimit: 10,
  });

  const canViewAll = req.user?.role === "admin" || req.user?.role === "manager";
  const effectiveUserId = canViewAll ? userId : req.user!.id;

  const conditions = [];
  if (effectiveUserId) conditions.push(eq(ordersTable.userId, effectiveUserId));
  if (status) conditions.push(eq(ordersTable.status, status));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(ordersTable)
    .where(where);
  const orders = await db
    .select()
    .from(ordersTable)
    .where(where)
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const items =
    orders.length > 0
      ? await db
          .select()
          .from(orderItemsTable)
          .where(inArray(orderItemsTable.orderId, orders.map((o) => o.id)))
      : [];

  const enriched = orders.map((order) =>
    enrichOrder(order, items.filter((item) => item.orderId === order.id)),
  );

  res.json({
    orders: enriched,
    total: Number(count),
    page,
    totalPages: Math.ceil(Number(count) / limit),
  });
});

router.post("/orders", checkoutLimiter, optionalAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const orderWithItems = await db.transaction(async (tx) => {
      const [cart] = await tx
        .select()
        .from(cartsTable)
        .where(eq(cartsTable.sessionId, parsed.data.sessionId));
      if (!cart) throw new Error("CART_NOT_FOUND");
      // A cart claimed by an account may only be checked out by that account.
      if (cart.userId !== null && cart.userId !== req.user?.id) throw new Error("CART_FORBIDDEN");

      const cartItems = await tx
        .select()
        .from(cartItemsTable)
        .where(eq(cartItemsTable.cartId, cart.id));
      if (cartItems.length === 0) throw new Error("CART_EMPTY");

      const products = await tx
        .select()
        .from(productsTable)
        .where(inArray(productsTable.id, [...new Set(cartItems.map((i) => i.productId))]));
      const productsById = new Map(products.map((p) => [p.id, p]));

      // Prices are taken from the product rows inside the transaction, never
      // from the cart snapshot, so an old cart cannot replay a finished sale.
      const lines = cartItems.map((item) => {
        const product = productsById.get(item.productId);
        if (!product) throw new Error(`PRODUCT_MISSING:${item.productId}`);
        if (item.quantity < 1 || item.quantity > MAX_CART_QUANTITY) {
          throw new Error(`INVALID_QUANTITY:${item.productId}`);
        }
        return {
          product,
          quantity: item.quantity,
          unitPrice: Number(product.salePrice ?? product.price),
        };
      });

      const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
      const shippingCost = SHIPPING_COSTS[parsed.data.shippingMethod] ?? 0;

      let discount = 0;
      if (parsed.data.discountCode) {
        const [row] = await tx
          .select()
          .from(discountsTable)
          .where(eq(discountsTable.code, parsed.data.discountCode));
        const evaluation = evaluateDiscount(row, subtotal);
        if (!evaluation.valid) throw new Error(`DISCOUNT_REJECTED:${evaluation.message}`);

        discount = evaluation.amount;
        // Conditional increment inside the transaction: two concurrent orders
        // cannot both take the last remaining use of a capped code.
        const claimed = await tx
          .update(discountsTable)
          .set({ usedCount: sql`${discountsTable.usedCount} + 1` })
          .where(
            row!.maxUses === null
              ? eq(discountsTable.id, row!.id)
              : and(
                  eq(discountsTable.id, row!.id),
                  sql`${discountsTable.usedCount} < ${row!.maxUses}`,
                ),
          )
          .returning({ id: discountsTable.id });
        if (claimed.length === 0) throw new Error("DISCOUNT_REJECTED:ظرفیت کد تخفیف پر شده است");
      }

      const total = Math.max(0, subtotal + shippingCost - discount);
      const orderNumber = `KL${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

      const [order] = await tx
        .insert(ordersTable)
        .values({
          userId: req.user?.id ?? null,
          orderNumber,
          status: "pending",
          inventoryReserved: true,
          subtotal: String(subtotal),
          shippingCost: String(shippingCost),
          discount: String(discount),
          total: String(total),
          addressSnapshot: parsed.data.addressSnapshot,
          shippingMethod: parsed.data.shippingMethod,
          notes: parsed.data.notes ?? null,
          customerName: parsed.data.customerName,
          customerPhone: parsed.data.customerPhone,
        })
        .returning();

      const orderItems = [];
      for (const line of lines) {
        const [reserved] = await tx
          .update(productsTable)
          .set({
            stock: sql`${productsTable.stock} - ${line.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(eq(productsTable.id, line.product.id), gte(productsTable.stock, line.quantity)),
          )
          .returning();
        if (!reserved) throw new Error(`INSUFFICIENT_STOCK:${line.product.id}`);

        const [inserted] = await tx
          .insert(orderItemsTable)
          .values({
            orderId: order!.id,
            productId: line.product.id,
            productName: reserved.nameFa || reserved.name || "محصول",
            quantity: line.quantity,
            price: String(line.unitPrice),
            image: (reserved.images as string[])[0] || null,
          })
          .returning();
        orderItems.push(inserted!);
      }

      await tx.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
      return enrichOrder(order!, orderItems);
    });

    res.status(201).json(orderWithItems);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "CART_NOT_FOUND") { res.status(400).json({ error: "سبد خرید یافت نشد" }); return; }
    if (message === "CART_FORBIDDEN") { res.status(403).json({ error: "دسترسی به این سبد خرید مجاز نیست" }); return; }
    if (message === "CART_EMPTY") { res.status(400).json({ error: "سبد خرید خالی است" }); return; }
    if (message.startsWith("DISCOUNT_REJECTED:")) {
      res.status(400).json({ error: message.slice("DISCOUNT_REJECTED:".length) });
      return;
    }
    if (message.startsWith("INVALID_QUANTITY:")) {
      res.status(400).json({ error: "تعداد یکی از کالاهای سبد خرید نامعتبر است" });
      return;
    }
    if (message.startsWith("PRODUCT_MISSING:")) {
      res.status(409).json({ error: "یکی از محصولات سبد خرید حذف شده است" });
      return;
    }
    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      res.status(409).json({ error: "یکی از محصولات درخواستی موجودی کافی ندارد" });
      return;
    }
    throw error;
  }
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const id = requireId(req, res);
  if (id === null) return;

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "سفارش یافت نشد" }); return; }

  const canView =
    req.user?.role === "admin" || req.user?.role === "manager" || order.userId === req.user?.id;
  if (!canView) { res.status(403).json({ error: "دسترسی غیرمجاز" }); return; }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  res.json(enrichOrder(order, items));
});

router.patch("/orders/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = requireId(req, res);
  if (id === null) return;

  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!current) return null;

    const isCancelling =
      parsed.data.status === "cancelled" &&
      current.status !== "cancelled" &&
      current.inventoryReserved;

    if (isCancelling) {
      const items = await tx
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, id));
      for (const item of items) {
        await tx
          .update(productsTable)
          .set({ stock: sql`${productsTable.stock} + ${item.quantity}`, updatedAt: new Date() })
          .where(eq(productsTable.id, item.productId));
      }
    }

    const [order] = await tx
      .update(ordersTable)
      .set({
        ...parsed.data,
        inventoryReserved: parsed.data.status === "cancelled" ? false : current.inventoryReserved,
        updatedAt: new Date(),
      })
      .where(eq(ordersTable.id, id))
      .returning();
    const items = await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
    return enrichOrder(order!, items);
  });

  if (!result) { res.status(404).json({ error: "سفارش یافت نشد" }); return; }
  res.json(result);
});

export default router;
