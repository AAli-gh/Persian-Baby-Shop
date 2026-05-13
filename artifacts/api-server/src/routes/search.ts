import { Router, type IRouter } from "express";
import { ilike, or, sql, eq } from "drizzle-orm";
import { db, productsTable, categoriesTable, reviewsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const q = String(req.query.q || "").trim();
  const limit = parseInt(String(req.query.limit || "6"), 10);
  if (!q) { res.json({ products: [], categories: [], total: 0 }); return; }

  const products = await db.select().from(productsTable)
    .where(or(ilike(productsTable.nameFa, `%${q}%`), ilike(productsTable.name, `%${q}%`), ilike(productsTable.brand, `%${q}%`)))
    .limit(limit);

  const cats = await db.select().from(categoriesTable)
    .where(or(ilike(categoriesTable.nameFa, `%${q}%`), ilike(categoriesTable.name, `%${q}%`)))
    .limit(3);

  const enrichedProducts = await Promise.all(products.map(async (p) => {
    const [cat] = await db.select({ nameFa: categoriesTable.nameFa }).from(categoriesTable).where(eq(categoriesTable.id, p.categoryId));
    const reviewStats = await db.select({ avgRating: sql<number>`avg(${reviewsTable.rating})`, count: sql<number>`count(*)` }).from(reviewsTable).where(eq(reviewsTable.productId, p.id));
    return {
      ...p, price: Number(p.price), salePrice: p.salePrice ? Number(p.salePrice) : null, weight: p.weight ? Number(p.weight) : null,
      images: (p.images as string[]) || [], tags: (p.tags as string[]) || [], categoryName: cat?.nameFa ?? null,
      avgRating: reviewStats[0]?.avgRating ? Number(reviewStats[0].avgRating) : null,
      reviewCount: Number(reviewStats[0]?.count ?? 0),
      flashSaleEndsAt: p.flashSaleEndsAt ? p.flashSaleEndsAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
    };
  }));

  const enrichedCats = await Promise.all(cats.map(async (c) => {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(eq(productsTable.categoryId, c.id));
    return { ...c, productCount: Number(count) };
  }));

  res.json({ products: enrichedProducts, categories: enrichedCats, total: enrichedProducts.length + enrichedCats.length });
});

export default router;
