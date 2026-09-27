import { Router, type IRouter } from "express";
import { desc, gte, sql, eq, lte, inArray } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, usersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { enrichProducts } from "../lib/enrich";

const router: IRouter = Router();
// Scoped to this router's own prefix: an unscoped `router.use` guard would
// also run for every router mounted after this one.
router.use("/admin", requireAuth, requireAdmin);

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [totalOrders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable);
  const [totalProducts] = await db.select({ count: sql<number>`count(*)` }).from(productsTable);
  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const [totalRevenue] = await db.select({ sum: sql<number>`coalesce(sum(total::numeric), 0)` }).from(ordersTable).where(eq(ordersTable.status, "delivered"));

  const [thisMonthRevenue] = await db.select({ sum: sql<number>`coalesce(sum(total::numeric), 0)` }).from(ordersTable).where(gte(ordersTable.createdAt, thisMonth));
  const [lastMonthRevenue] = await db.select({ sum: sql<number>`coalesce(sum(total::numeric), 0)` }).from(ordersTable).where(sql`${ordersTable.createdAt} >= ${lastMonth} AND ${ordersTable.createdAt} < ${thisMonth}`);

  const [thisMonthOrders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(gte(ordersTable.createdAt, thisMonth));
  const [lastMonthOrders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(sql`${ordersTable.createdAt} >= ${lastMonth} AND ${ordersTable.createdAt} < ${thisMonth}`);

  const revenueGrowth = Number(lastMonthRevenue.sum) > 0 ? ((Number(thisMonthRevenue.sum) - Number(lastMonthRevenue.sum)) / Number(lastMonthRevenue.sum)) * 100 : 0;
  const ordersGrowth = Number(lastMonthOrders.count) > 0 ? ((Number(thisMonthOrders.count) - Number(lastMonthOrders.count)) / Number(lastMonthOrders.count)) * 100 : 0;

  const statusCounts = await db.select({ status: ordersTable.status, count: sql<number>`count(*)` }).from(ordersTable).groupBy(ordersTable.status);
  const getCount = (status: string) => Number(statusCounts.find((s) => s.status === status)?.count ?? 0);

  res.json({
    totalRevenue: Number(totalRevenue.sum),
    totalOrders: Number(totalOrders.count),
    totalProducts: Number(totalProducts.count),
    totalUsers: Number(totalUsers.count),
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    ordersGrowth: Math.round(ordersGrowth * 10) / 10,
    pendingOrders: getCount("pending"),
    processingOrders: getCount("processing"),
    shippedOrders: getCount("shipped"),
    deliveredOrders: getCount("delivered"),
  });
});

router.get("/admin/recent-orders", async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10);
  const items = orders.length > 0
    ? await db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, orders.map((o) => o.id)))
    : [];

  res.json(orders.map((o) => ({
    ...o,
    subtotal: Number(o.subtotal), shippingCost: Number(o.shippingCost),
    discount: Number(o.discount), total: Number(o.total),
    createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
    items: items.filter((i) => i.orderId === o.id).map((i) => ({ ...i, price: Number(i.price) })),
  })));
});

router.get("/admin/low-stock", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).where(lte(productsTable.stock, 5)).limit(20);
  res.json(await enrichProducts(products));
});

router.get("/admin/sales-chart", async (_req, res): Promise<void> => {
  const days = 30;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  // One grouped query for the whole window instead of one per day.
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${ordersTable.createdAt}), 'YYYY-MM-DD')`,
      revenue: sql<string>`coalesce(sum(${ordersTable.total}), 0)`,
      orders: sql<string>`count(*)`,
    })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, start))
    .groupBy(sql`date_trunc('day', ${ordersTable.createdAt})`);

  const byDay = new Map(rows.map((row) => [row.day, row]));
  const result = Array.from({ length: days }, (_, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const row = byDay.get(key);
    return { date: key, revenue: Number(row?.revenue ?? 0), orders: Number(row?.orders ?? 0) };
  });

  res.json(result);
});

export default router;
