import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, wishlistsTable, wishlistItemsTable, productsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router: IRouter = Router();

async function enrichProduct(p: typeof productsTable.$inferSelect) {
  const [cat] = await db.select({ nameFa: categoriesTable.nameFa }).from(categoriesTable).where(eq(categoriesTable.id, p.categoryId));
  const reviewStats = await db.select({ avgRating: sql<number>`avg(${reviewsTable.rating})`, count: sql<number>`count(*)` })
    .from(reviewsTable).where(eq(reviewsTable.productId, p.id));
  return {
    ...p, price: Number(p.price), salePrice: p.salePrice ? Number(p.salePrice) : null, weight: p.weight ? Number(p.weight) : null,
    images: (p.images as string[]) || [], tags: (p.tags as string[]) || [], categoryName: cat?.nameFa ?? null,
    avgRating: reviewStats[0]?.avgRating ? Number(reviewStats[0].avgRating) : null,
    reviewCount: Number(reviewStats[0]?.count ?? 0),
    flashSaleEndsAt: p.flashSaleEndsAt ? p.flashSaleEndsAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

async function ensureDefaultList(userId: number): Promise<number> {
  const existing = await db.select().from(wishlistsTable)
    .where(and(eq(wishlistsTable.userId, userId), eq(wishlistsTable.isDefault, true)));
  if (existing.length > 0) return existing[0]!.id;
  const [created] = await db.insert(wishlistsTable)
    .values({ userId, name: "علاقه‌مندی‌ها", isDefault: true }).returning();
  return created!.id;
}

router.get("/wishlists", requireAuth, async (req, res): Promise<void> => {
  const userId = parseInt(String(req.query["userId"] ?? "0"), 10);
  if (!userId) { res.json([]); return; }

  const lists = await db.select().from(wishlistsTable).where(eq(wishlistsTable.userId, userId));
  const enriched = await Promise.all(lists.map(async (list) => {
    const items = await db.select().from(wishlistItemsTable).where(eq(wishlistItemsTable.wishlistId, list.id));
    const products = await Promise.all(items.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      return product ? { ...item, createdAt: item.createdAt.toISOString(), product: await enrichProduct(product) } : null;
    }));
    return { ...list, createdAt: list.createdAt.toISOString(), items: products.filter(Boolean), itemCount: products.filter(Boolean).length };
  }));
  res.json(enriched);
});

router.post("/wishlists", requireAuth, async (req, res): Promise<void> => {
  const parsed = z.object({ userId: z.number().int(), name: z.string().min(1).max(50) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const existing = await db.select().from(wishlistsTable).where(eq(wishlistsTable.userId, parsed.data.userId));
  if (existing.length >= 10) { res.status(400).json({ error: "حداکثر ۱۰ لیست می‌توانید داشته باشید" }); return; }
  const isFirst = existing.length === 0;
  const [list] = await db.insert(wishlistsTable).values({ ...parsed.data, isDefault: isFirst }).returning();
  res.status(201).json({ ...list!, createdAt: list!.createdAt.toISOString(), items: [], itemCount: 0 });
});

router.patch("/wishlists/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] ?? "0", 10);
  const parsed = z.object({ name: z.string().min(1).max(50).optional(), isDefault: z.boolean().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (parsed.data.isDefault) {
    const [list] = await db.select().from(wishlistsTable).where(eq(wishlistsTable.id, id));
    if (list) await db.update(wishlistsTable).set({ isDefault: false }).where(eq(wishlistsTable.userId, list.userId));
  }
  const [updated] = await db.update(wishlistsTable).set(parsed.data).where(eq(wishlistsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "لیست یافت نشد" }); return; }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/wishlists/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] ?? "0", 10);
  const [list] = await db.select().from(wishlistsTable).where(eq(wishlistsTable.id, id));
  if (!list) { res.status(404).json({ error: "لیست یافت نشد" }); return; }
  if (list.isDefault) { res.status(400).json({ error: "نمی‌توانید لیست پیش‌فرض را حذف کنید" }); return; }
  await db.delete(wishlistsTable).where(eq(wishlistsTable.id, id));
  res.sendStatus(204);
});

router.post("/wishlists/:id/items", requireAuth, async (req, res): Promise<void> => {
  const wishlistId = parseInt(req.params["id"] ?? "0", 10);
  const parsed = z.object({ productId: z.number().int() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [item] = await db.insert(wishlistItemsTable).values({ wishlistId, productId: parsed.data.productId }).returning().catch(() => [null]);
  if (!item) { res.status(400).json({ error: "محصول قبلاً در این لیست است" }); return; }
  res.status(201).json({ ...item, createdAt: item.createdAt.toISOString() });
});

router.delete("/wishlists/:id/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const wishlistId = parseInt(req.params["id"] ?? "0", 10);
  const productId = parseInt(req.params["productId"] ?? "0", 10);
  await db.delete(wishlistItemsTable).where(and(eq(wishlistItemsTable.wishlistId, wishlistId), eq(wishlistItemsTable.productId, productId)));
  res.sendStatus(204);
});

router.post("/wishlists/items/move", requireAuth, async (req, res): Promise<void> => {
  const parsed = z.object({ fromWishlistId: z.number().int(), toWishlistId: z.number().int(), productId: z.number().int(), copy: z.boolean().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { fromWishlistId, toWishlistId, productId, copy } = parsed.data;
  await db.insert(wishlistItemsTable).values({ wishlistId: toWishlistId, productId }).onConflictDoNothing();
  if (!copy) await db.delete(wishlistItemsTable).where(and(eq(wishlistItemsTable.wishlistId, fromWishlistId), eq(wishlistItemsTable.productId, productId)));
  res.json({ ok: true });
});

router.post("/wishlists/default/items", requireAuth, async (req, res): Promise<void> => {
  const parsed = z.object({ userId: z.number().int(), productId: z.number().int() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const wishlistId = await ensureDefaultList(parsed.data.userId);
  const [item] = await db.insert(wishlistItemsTable).values({ wishlistId, productId: parsed.data.productId }).returning().catch(() => [null]);
  res.status(201).json({ wishlistId, item });
});

router.delete("/wishlists/default/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const userId = parseInt(String(req.query["userId"] ?? "0"), 10);
  const productId = parseInt(req.params["productId"] ?? "0", 10);
  const [list] = await db.select().from(wishlistsTable).where(and(eq(wishlistsTable.userId, userId), eq(wishlistsTable.isDefault, true)));
  if (!list) { res.sendStatus(204); return; }
  await db.delete(wishlistItemsTable).where(and(eq(wishlistItemsTable.wishlistId, list.id), eq(wishlistItemsTable.productId, productId)));
  res.sendStatus(204);
});

export default router;
