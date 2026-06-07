import { Router, type IRouter } from "express";
import { desc, gte, sql, eq, lte } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, usersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();
router.use(requireAuth, requireAdmin);

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
  const enriched = await Promise.all(orders.map(async (o) => {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, o.id));
    return { ...o, subtotal: Number(o.subtotal), shippingCost: Number(o.shippingCost), discount: Number(o.discount), total: Number(o.total), createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(), items: items.map((i) => ({ ...i, price: Number(i.price) })) };
  }));
  res.json(enriched);
});

router.get("/admin/low-stock", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).where(lte(productsTable.stock, 5)).limit(20);
  res.json(products.map((p) => ({
    ...p, price: Number(p.price), salePrice: p.salePrice ? Number(p.salePrice) : null, weight: p.weight ? Number(p.weight) : null,
    images: (p.images as string[]) || [], tags: (p.tags as string[]) || [],
    categoryName: null, avgRating: null, reviewCount: 0,
    flashSaleEndsAt: p.flashSaleEndsAt ? p.flashSaleEndsAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.get("/admin/sales-chart", async (_req, res): Promise<void> => {
  const days = 30;
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const [row] = await db.select({ revenue: sql<number>`coalesce(sum(total::numeric), 0)`, orders: sql<number>`count(*)` }).from(ordersTable).where(sql`${ordersTable.createdAt} >= ${start} AND ${ordersTable.createdAt} < ${end}`);
    result.push({ date: start.toISOString().split("T")[0], revenue: Number(row.revenue), orders: Number(row.orders) });
  }
  res.json(result);
});

export default router;
