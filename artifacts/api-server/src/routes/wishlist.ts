import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, wishlistTable, productsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { AddToWishlistBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichProduct(p: typeof productsTable.$inferSelect) {
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
}

router.get("/wishlist", async (req, res): Promise<void> => {
  const userId = parseInt(String(req.query.userId || "0"), 10);
  if (!userId) { res.json([]); return; }
  const items = await db.select().from(wishlistTable).where(eq(wishlistTable.userId, userId));
  const enriched = await Promise.all(items.map(async (item) => {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    return { ...item, createdAt: item.createdAt.toISOString(), product: product ? await enrichProduct(product) : null };
  }));
  res.json(enriched.filter((i) => i.product));
});

router.post("/wishlist", async (req, res): Promise<void> => {
  const parsed = AddToWishlistBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const existing = await db.select().from(wishlistTable)
    .where(and(eq(wishlistTable.userId, parsed.data.userId), eq(wishlistTable.productId, parsed.data.productId)));
  if (existing.length > 0) { res.status(400).json({ error: "Already in wishlist" }); return; }
  const [item] = await db.insert(wishlistTable).values(parsed.data).returning();
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
  res.status(201).json({ ...item, createdAt: item.createdAt.toISOString(), product: product ? await enrichProduct(product) : null });
});

router.delete("/wishlist/:productId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const productId = parseInt(raw, 10);
  const userId = parseInt(String(req.query.userId || "0"), 10);
  await db.delete(wishlistTable).where(and(eq(wishlistTable.productId, productId), eq(wishlistTable.userId, userId)));
  res.sendStatus(204);
});

export default router;
