import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, cartItemsTable, cartsTable, productsTable, discountsTable } from "@workspace/db";
import { CreateOrderBody, UpdateOrderBody, UpdateOrderParams, GetOrderParams, ListOrdersQueryParams } from "@workspace/api-zod";

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

router.get("/orders", async (req, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { userId, status, page = 1, limit = 10 } = params.data;
  const conditions = [];
  if (userId) conditions.push(eq(ordersTable.userId, userId));
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

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [cart] = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, parsed.data.sessionId));
  if (!cart) { res.status(400).json({ error: "Cart not found" }); return; }

  const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  if (cartItems.length === 0) { res.status(400).json({ error: "Cart is empty" }); return; }

  const subtotal = cartItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const shippingCost = parsed.data.shippingMethod === "express" ? 80000 : parsed.data.shippingMethod === "standard" ? 30000 : 0;
  let discount = 0;
  if (parsed.data.discountCode) {
    const [disc] = await db.select().from(discountsTable).where(eq(discountsTable.code, parsed.data.discountCode));
    if (disc && disc.isActive) {
      discount = disc.type === "percent" ? subtotal * Number(disc.value) / 100 : Number(disc.value);
      await db.update(discountsTable).set({ usedCount: disc.usedCount + 1 }).where(eq(discountsTable.id, disc.id));
    }
  }
  const total = subtotal + shippingCost - discount;
  const orderNumber = `KL${Date.now()}`;

  const [order] = await db.insert(ordersTable).values({
    userId: parsed.data.userId ?? null, orderNumber, status: "pending",
    subtotal: String(subtotal), shippingCost: String(shippingCost), discount: String(discount), total: String(total),
    addressSnapshot: parsed.data.addressSnapshot, shippingMethod: parsed.data.shippingMethod,
    notes: parsed.data.notes ?? null, customerName: parsed.data.customerName, customerPhone: parsed.data.customerPhone,
  }).returning();

  const orderItems = await Promise.all(cartItems.map(async (ci) => {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, ci.productId));
    const [inserted] = await db.insert(orderItemsTable).values({
      orderId: order.id, productId: ci.productId,
      productName: product?.nameFa || product?.name || "محصول", quantity: ci.quantity, price: ci.price,
      image: product ? ((product.images as string[])[0] || null) : null,
    }).returning();
    return inserted;
  }));

  await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  res.status(201).json(enrichOrder(order, orderItems));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  res.json(enrichOrder(order, items));
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [order] = await db.update(ordersTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  res.json(enrichOrder(order, items));
});

export default router;
