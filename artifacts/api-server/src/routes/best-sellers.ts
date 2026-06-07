import { Router, type IRouter } from "express";
import { db, productsTable, orderItemsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

async function enrichProduct(product: typeof productsTable.$inferSelect) {
  const [cat] = await db.select({ nameFa: categoriesTable.nameFa }).from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
  const reviewStats = await db.select({ avgRating: sql<number>`avg(${reviewsTable.rating})`, count: sql<number>`count(*)` }).from(reviewsTable).where(eq(reviewsTable.productId, product.id));
  return {
    ...product,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    weight: product.weight ? Number(product.weight) : null,
    images: (product.images as string[]) || [],
    tags: (product.tags as string[]) || [],
    categoryName: cat?.nameFa ?? null,
    avgRating: reviewStats[0]?.avgRating ? Number(reviewStats[0].avgRating) : null,
    reviewCount: Number(reviewStats[0]?.count ?? 0),
    flashSaleEndsAt: product.flashSaleEndsAt ? product.flashSaleEndsAt.toISOString() : null,
    createdAt: product.createdAt.toISOString(),
  };
}

router.get("/products/best-sellers", async (_req, res) => {
  const soldRows = await db
    .select({ productId: orderItemsTable.productId, totalSold: sql<number>`sum(${orderItemsTable.quantity})` })
    .from(orderItemsTable)
    .groupBy(orderItemsTable.productId)
    .orderBy(desc(sql`sum(${orderItemsTable.quantity})`))
    .limit(20);

  if (soldRows.length > 0) {
    const ids = soldRows.map(r => r.productId);
    const products = await db.select().from(productsTable).where(sql`${productsTable.id} = ANY(${ids})`);
    const sorted = ids.map(id => products.find(p => p.id === id)).filter(Boolean) as typeof products;
    const enriched = await Promise.all(sorted.slice(0, 8).map(enrichProduct));
    res.json(enriched);
    return;
  }

  const flagged = await db.select().from(productsTable).where(eq(productsTable.isBestSeller, true)).limit(8);
  if (flagged.length > 0) {
    const enriched = await Promise.all(flagged.map(enrichProduct));
    res.json(enriched);
    return;
  }

  const featured = await db.select().from(productsTable).where(eq(productsTable.isFeatured, true)).orderBy(desc(productsTable.createdAt)).limit(8);
  const enriched = await Promise.all(featured.map(enrichProduct));
  res.json(enriched);
});

export default router;
