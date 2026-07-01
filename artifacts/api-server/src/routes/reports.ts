import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, productsTable, usersTable, categoriesTable } from "@workspace/db";
import { gte, lte, sql, eq, and, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

function getDateRange(period: string, from?: string, to?: string): { start: Date; end: Date } {
  const now = new Date();
  const end = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  if (from) return { start: new Date(from), end };

  switch (period) {
    case "today":
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end };
    case "week": {
      const s = new Date(now);
      s.setDate(s.getDate() - 7);
      return { start: s, end };
    }
    case "month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1), end };
    default:
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
  }
}

router.get("/admin/reports", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const period = String(req.query["period"] ?? "month");
  const from = req.query["from"] ? String(req.query["from"]) : undefined;
  const to = req.query["to"] ? String(req.query["to"]) : undefined;
  const { start, end } = getDateRange(period, from, to);

  const [revenue] = await db.select({ sum: sql<number>`coalesce(sum(total::numeric), 0)` })
    .from(ordersTable).where(and(gte(ordersTable.createdAt, start), lte(ordersTable.createdAt, end)));
  const [orderCount] = await db.select({ count: sql<number>`count(*)` })
    .from(ordersTable).where(and(gte(ordersTable.createdAt, start), lte(ordersTable.createdAt, end)));
  const [avgOrder] = await db.select({ avg: sql<number>`coalesce(avg(total::numeric), 0)` })
    .from(ordersTable).where(and(gte(ordersTable.createdAt, start), lte(ordersTable.createdAt, end)));
  const [newCustomers] = await db.select({ count: sql<number>`count(*)` })
    .from(usersTable).where(and(gte(usersTable.createdAt, start), lte(usersTable.createdAt, end)));

  const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
  const [prevRevenue] = await db.select({ sum: sql<number>`coalesce(sum(total::numeric), 0)` })
    .from(ordersTable).where(and(gte(ordersTable.createdAt, prevStart), lte(ordersTable.createdAt, start)));
  const [prevOrders] = await db.select({ count: sql<number>`count(*)` })
    .from(ordersTable).where(and(gte(ordersTable.createdAt, prevStart), lte(ordersTable.createdAt, start)));

  const revenueGrowth = Number(prevRevenue.sum) > 0 ? ((Number(revenue.sum) - Number(prevRevenue.sum)) / Number(prevRevenue.sum)) * 100 : 0;
  const ordersGrowth = Number(prevOrders.count) > 0 ? ((Number(orderCount.count) - Number(prevOrders.count)) / Number(prevOrders.count)) * 100 : 0;

  const topProducts = await db.select({
    productId: orderItemsTable.productId,
    totalSold: sql<number>`sum(${orderItemsTable.quantity})`,
    revenue: sql<number>`sum(${orderItemsTable.quantity}::numeric * ${orderItemsTable.price}::numeric)`,
  }).from(orderItemsTable)
    .innerJoin(ordersTable, eq(ordersTable.id, orderItemsTable.orderId))
    .where(and(gte(ordersTable.createdAt, start), lte(ordersTable.createdAt, end)))
    .groupBy(orderItemsTable.productId)
    .orderBy(desc(sql`sum(${orderItemsTable.quantity})`))
    .limit(10);

  const products = await db.select({ id: productsTable.id, nameFa: productsTable.nameFa, stock: productsTable.stock })
    .from(productsTable);
  const productMap = new Map(products.map(p => [p.id, p]));

  const topProductsEnriched = topProducts.map(p => ({
    ...p, totalSold: Number(p.totalSold), revenue: Number(p.revenue),
    name: productMap.get(p.productId)?.nameFa ?? "ناشناخته",
  }));

  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;

  const dailySales = await db.select({
    date: sql<string>`date_trunc('day', ${ordersTable.createdAt})::date::text`,
    revenue: sql<number>`sum(total::numeric)`,
    orders: sql<number>`count(*)`,
  }).from(ordersTable)
    .where(and(gte(ordersTable.createdAt, start), lte(ordersTable.createdAt, end)))
    .groupBy(sql`date_trunc('day', ${ordersTable.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${ordersTable.createdAt})::date`);

  const categoryRevenue = await db.select({
    categoryId: productsTable.categoryId,
    revenue: sql<number>`sum(${orderItemsTable.quantity}::numeric * ${orderItemsTable.price}::numeric)`,
    orders: sql<number>`count(distinct ${ordersTable.id})`,
  }).from(orderItemsTable)
    .innerJoin(ordersTable, eq(ordersTable.id, orderItemsTable.orderId))
    .innerJoin(productsTable, eq(productsTable.id, orderItemsTable.productId))
    .where(and(gte(ordersTable.createdAt, start), lte(ordersTable.createdAt, end)))
    .groupBy(productsTable.categoryId)
    .orderBy(desc(sql`sum(${orderItemsTable.quantity}::numeric * ${orderItemsTable.price}::numeric)`))
    .limit(6);

  const categories = await db.select({ id: categoriesTable.id, nameFa: categoriesTable.nameFa }).from(categoriesTable);
  const catMap = new Map(categories.map(c => [c.id, c.nameFa]));
  const categoryRevenueEnriched = categoryRevenue.map(c => ({
    ...c, revenue: Number(c.revenue), orders: Number(c.orders), name: catMap.get(c.categoryId) ?? "ناشناخته",
  }));

  const statusCounts = await db.select({
    status: ordersTable.status, count: sql<number>`count(*)`,
  }).from(ordersTable).where(and(gte(ordersTable.createdAt, start), lte(ordersTable.createdAt, end)))
    .groupBy(ordersTable.status);

  res.json({
    period: { start: start.toISOString(), end: end.toISOString() },
    summary: {
      revenue: Number(revenue.sum),
      orders: Number(orderCount.count),
      avgOrderValue: Number(avgOrder.avg),
      newCustomers: Number(newCustomers.count),
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      ordersGrowth: Math.round(ordersGrowth * 10) / 10,
      estimatedProfit: Math.round(Number(revenue.sum) * 0.25),
      profitMargin: 25,
      outOfStock,
      lowStock,
    },
    topProducts: topProductsEnriched,
    dailySales: dailySales.map(d => ({ ...d, revenue: Number(d.revenue), orders: Number(d.orders) })),
    categoryRevenue: categoryRevenueEnriched,
    statusCounts: statusCounts.map(s => ({ ...s, count: Number(s.count) })),
  });
});

export default router;
