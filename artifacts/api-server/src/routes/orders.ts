import { Router, type IRouter } from "express";
import { eq, desc, and, sql, gte } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, cartItemsTable, cartsTable, productsTable, discountsTable } from "@workspace/db";
import { CreateOrderBody, UpdateOrderBody, UpdateOrderParams, GetOrderParams, ListOrdersQueryParams } from "@workspace/api-zod";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth";

const router: IRouter = Router();

function enrichOrder(order: typeof ordersTable.$inferSelect, items: typeof orderItemsTable.$inferSelect[]) {
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
  const { userId, status, page = 1, limit = 10 } = params.data;
  const conditions = [];
  const canViewAll = req.user?.role === "admin" || req.user?.role === "manager";
  const effectiveUserId = canViewAll ? userId : req.user!.id;
  if (effectiveUserId) conditions.push(eq(ordersTable.userId, effectiveUserId));
  if (status) conditions.push(eq(ordersTable.status, status));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(where);
  const orders = await db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt)).limit(Number(limit)).offset((Number(page) - 1) * Number(limit));
  const enriched = await Promise.all(orders.map(async (o) => {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, o.id));
    return enrichOrder(o, items);
  }));
  res.json({ orders: enriched, total: Number(count), page: Number(page), totalPages: Math.ceil(Number(count) / Number(limit)) });
});

router.post("/orders", optionalAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const orderWithItems = await db.transaction(async (tx) => {
      const [cart] = await tx.select().from(cartsTable).where(eq(cartsTable.sessionId, parsed.data.sessionId));
      if (!cart) throw new Error("CART_NOT_FOUND");

      const cartItems = await tx.select().from(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
      if (cartItems.length === 0) throw new Error("CART_EMPTY");

      const subtotal = cartItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
      const shippingCost = parsed.data.shippingMethod === "express" ? 80000 : parsed.data.shippingMethod === "standard" ? 30000 : 0;
      let discount = 0;
      if (parsed.data.discountCode) {
        const [disc] = await tx.select().from(discountsTable).where(eq(discountsTable.code, parsed.data.discountCode));
        if (disc && disc.isActive && (!disc.expiresAt || disc.expiresAt >= new Date())) {
          discount = disc.type === "percent" ? subtotal * Number(disc.value) / 100 : Number(disc.value);
          await tx.update(discountsTable).set({ usedCount: disc.usedCount + 1 }).where(eq(discountsTable.id, disc.id));
        }
      }
      const total = subtotal + shippingCost - discount;
      const orderNumber = `KL${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

      const [order] = await tx.insert(ordersTable).values({
        userId: req.user?.id ?? null, orderNumber, status: "pending", inventoryReserved: true,
        subtotal: String(subtotal), shippingCost: String(shippingCost), discount: String(discount), total: String(total),
        addressSnapshot: parsed.data.addressSnapshot, shippingMethod: parsed.data.shippingMethod,
        notes: parsed.data.notes ?? null, customerName: parsed.data.customerName, customerPhone: parsed.data.customerPhone,
      }).returning();

      const orderItems = [];
      for (const ci of cartItems) {
        const [product] = await tx
          .update(productsTable)
          .set({
            stock: sql`${productsTable.stock} - ${ci.quantity}`,
            updatedAt: new Date(),
          })
          .where(and(eq(productsTable.id, ci.productId), gte(productsTable.stock, ci.quantity)))
          .returning();
        if (!product) throw new Error(`INSUFFICIENT_STOCK:${ci.productId}`);

        const [inserted] = await tx.insert(orderItemsTable).values({
          orderId: order.id, productId: ci.productId,
          productName: product.nameFa || product.name || "محصول",
          quantity: ci.quantity, price: ci.price,
          image: product ? ((product.images as string[])[0] || null) : null,
        }).returning();
        orderItems.push(inserted);
      }

      await tx.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
      return enrichOrder(order, orderItems);
    });

    res.status(201).json(orderWithItems);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "CART_NOT_FOUND") { res.status(400).json({ error: "Cart not found" }); return; }
    if (message === "CART_EMPTY") { res.status(400).json({ error: "Cart is empty" }); return; }
    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      res.status(409).json({ error: "یکی از محصولات درخواستی موجودی کافی ندارد" });
      return;
    }
    req.log.error({ err: error }, "order creation failed");
    res.status(500).json({ error: "ثبت سفارش انجام نشد" });
  }
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  const canView = req.user?.role === "admin" || req.user?.role === "manager" || order.userId === req.user?.id;
  if (!canView) { res.status(403).json({ error: "دسترسی غیرمجاز" }); return; }
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  res.json(enrichOrder(order, items));
});

router.patch("/orders/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!current) return null;

    if (parsed.data.status === "cancelled" && current.status !== "cancelled" && current.inventoryReserved) {
      const items = await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
      for (const item of items) {
        await tx.update(productsTable)
          .set({ stock: sql`${productsTable.stock} + ${item.quantity}`, updatedAt: new Date() })
          .where(eq(productsTable.id, item.productId));
      }
    }

    const [order] = await tx.update(ordersTable)
      .set({
        ...parsed.data,
        inventoryReserved: parsed.data.status === "cancelled" ? false : current.inventoryReserved,
        updatedAt: new Date(),
      })
      .where(eq(ordersTable.id, id))
      .returning();
    const items = await tx.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
    return enrichOrder(order, items);
  });

  if (!result) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(result);
});

export default router;
