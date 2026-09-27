import { Router, type IRouter } from "express";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db, wishlistsTable, wishlistItemsTable, productsTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";
import { enrichProducts } from "../lib/enrich";
import { requireId } from "../lib/http";
import { z } from "zod";

const router: IRouter = Router();

async function ensureDefaultList(userId: number): Promise<number> {
  const existing = await db.select().from(wishlistsTable)
    .where(and(eq(wishlistsTable.userId, userId), eq(wishlistsTable.isDefault, true)));
  if (existing.length > 0) return existing[0]!.id;
  const [created] = await db.insert(wishlistsTable)
    .values({ userId, name: "علاقه‌مندی‌ها", isDefault: true }).returning();
  return created!.id;
}

router.get("/wishlists", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;

  const lists = await db.select().from(wishlistsTable).where(eq(wishlistsTable.userId, userId));
  if (lists.length === 0) { res.json([]); return; }

  const items = await db
    .select()
    .from(wishlistItemsTable)
    .where(inArray(wishlistItemsTable.wishlistId, lists.map((l) => l.id)));
  const products = items.length > 0
    ? await db.select().from(productsTable).where(inArray(productsTable.id, [...new Set(items.map((i) => i.productId))]))
    : [];
  const byId = new Map((await enrichProducts(products)).map((p) => [p.id, p]));

  res.json(
    lists.map((list) => {
      const listItems = items.flatMap((item) => {
        if (item.wishlistId !== list.id) return [];
        const product = byId.get(item.productId);
        return product ? [{ ...item, createdAt: item.createdAt.toISOString(), product }] : [];
      });
      return {
        ...list,
        createdAt: list.createdAt.toISOString(),
        items: listItems,
        itemCount: listItems.length,
      };
    }),
  );
});

router.post("/wishlists", requireAuth, async (req, res): Promise<void> => {
  const parsed = z.object({ name: z.string().trim().min(1).max(50) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const userId = req.user!.id;
  const existing = await db.select().from(wishlistsTable).where(eq(wishlistsTable.userId, userId));
  if (existing.length >= 10) { res.status(400).json({ error: "حداکثر ۱۰ لیست می‌توانید داشته باشید" }); return; }
  const isFirst = existing.length === 0;
  const [list] = await db.insert(wishlistsTable).values({ userId, name: parsed.data.name, isDefault: isFirst }).returning();
  res.status(201).json({ ...list!, createdAt: list!.createdAt.toISOString(), items: [], itemCount: 0 });
});

router.patch("/wishlists/:id", requireAuth, async (req, res): Promise<void> => {
  const id = requireId(req, res);
  if (id === null) return;
  const parsed = z.object({ name: z.string().min(1).max(50).optional(), isDefault: z.boolean().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [owned] = await db.select().from(wishlistsTable)
    .where(and(eq(wishlistsTable.id, id), eq(wishlistsTable.userId, req.user!.id)));
  if (!owned) { res.status(404).json({ error: "لیست یافت نشد" }); return; }
  if (parsed.data.isDefault) {
    await db.update(wishlistsTable).set({ isDefault: false }).where(eq(wishlistsTable.userId, req.user!.id));
  }
  const [updated] = await db.update(wishlistsTable).set(parsed.data).where(eq(wishlistsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "لیست یافت نشد" }); return; }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/wishlists/:id", requireAuth, async (req, res): Promise<void> => {
  const id = requireId(req, res);
  if (id === null) return;
  const [list] = await db.select().from(wishlistsTable)
    .where(and(eq(wishlistsTable.id, id), eq(wishlistsTable.userId, req.user!.id)));
  if (!list) { res.status(404).json({ error: "لیست یافت نشد" }); return; }
  if (list.isDefault) { res.status(400).json({ error: "نمی‌توانید لیست پیش‌فرض را حذف کنید" }); return; }
  await db.delete(wishlistsTable).where(eq(wishlistsTable.id, id));
  res.sendStatus(204);
});

router.post("/wishlists/:id/items", requireAuth, async (req, res): Promise<void> => {
  const wishlistId = requireId(req, res);
  if (wishlistId === null) return;
  const parsed = z.object({ productId: z.number().int().positive() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [owned] = await db.select({ id: wishlistsTable.id }).from(wishlistsTable)
    .where(and(eq(wishlistsTable.id, wishlistId), eq(wishlistsTable.userId, req.user!.id)));
  if (!owned) { res.status(404).json({ error: "لیست یافت نشد" }); return; }
  const [item] = await db.insert(wishlistItemsTable).values({ wishlistId, productId: parsed.data.productId }).returning().catch(() => [null]);
  if (!item) { res.status(400).json({ error: "محصول قبلاً در این لیست است" }); return; }
  res.status(201).json({ ...item, createdAt: item.createdAt.toISOString() });
});

router.delete("/wishlists/:id/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const wishlistId = requireId(req, res);
  if (wishlistId === null) return;
  const productId = requireId(req, res, "productId");
  if (productId === null) return;
  const [owned] = await db.select({ id: wishlistsTable.id }).from(wishlistsTable)
    .where(and(eq(wishlistsTable.id, wishlistId), eq(wishlistsTable.userId, req.user!.id)));
  if (!owned) { res.status(404).json({ error: "لیست یافت نشد" }); return; }
  await db.delete(wishlistItemsTable).where(and(eq(wishlistItemsTable.wishlistId, wishlistId), eq(wishlistItemsTable.productId, productId)));
  res.sendStatus(204);
});

router.post("/wishlists/items/move", requireAuth, async (req, res): Promise<void> => {
  const parsed = z.object({ fromWishlistId: z.number().int(), toWishlistId: z.number().int(), productId: z.number().int(), copy: z.boolean().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { fromWishlistId, toWishlistId, productId, copy } = parsed.data;
  const ownedLists = await db.select({ id: wishlistsTable.id }).from(wishlistsTable)
    .where(and(eq(wishlistsTable.userId, req.user!.id), sql`${wishlistsTable.id} in (${fromWishlistId}, ${toWishlistId})`));
  if (ownedLists.length !== 2) { res.status(404).json({ error: "لیست یافت نشد" }); return; }
  await db.insert(wishlistItemsTable).values({ wishlistId: toWishlistId, productId }).onConflictDoNothing();
  if (!copy) await db.delete(wishlistItemsTable).where(and(eq(wishlistItemsTable.wishlistId, fromWishlistId), eq(wishlistItemsTable.productId, productId)));
  res.json({ ok: true });
});

router.post("/wishlists/default/items", requireAuth, async (req, res): Promise<void> => {
  const parsed = z.object({ productId: z.number().int().positive() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const wishlistId = await ensureDefaultList(req.user!.id);
  const [item] = await db.insert(wishlistItemsTable).values({ wishlistId, productId: parsed.data.productId }).returning().catch(() => [null]);
  res.status(201).json({ wishlistId, item });
});

router.delete("/wishlists/default/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const productId = requireId(req, res, "productId");
  if (productId === null) return;
  const [list] = await db.select().from(wishlistsTable).where(and(eq(wishlistsTable.userId, userId), eq(wishlistsTable.isDefault, true)));
  if (!list) { res.sendStatus(204); return; }
  await db.delete(wishlistItemsTable).where(and(eq(wishlistItemsTable.wishlistId, list.id), eq(wishlistItemsTable.productId, productId)));
  res.sendStatus(204);
});

export default router;
