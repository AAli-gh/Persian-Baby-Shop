import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, wishlistTable, productsTable } from "@workspace/db";
import { AddToWishlistBody } from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";
import { enrichProduct, enrichProducts } from "../lib/enrich";
import { requireId } from "../lib/http";

const router: IRouter = Router();

router.get("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const items = await db.select().from(wishlistTable).where(eq(wishlistTable.userId, userId));
  const products = items.length > 0
    ? await db.select().from(productsTable).where(inArray(productsTable.id, items.map((i) => i.productId)))
    : [];
  const byId = new Map((await enrichProducts(products)).map((p) => [p.id, p]));
  res.json(
    items.flatMap((item) => {
      const product = byId.get(item.productId);
      return product ? [{ ...item, createdAt: item.createdAt.toISOString(), product }] : [];
    }),
  );
});

router.post("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const parsed = AddToWishlistBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const userId = req.user!.id;
  const existing = await db.select().from(wishlistTable)
    .where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.productId, parsed.data.productId)));
  if (existing.length > 0) { res.status(400).json({ error: "Already in wishlist" }); return; }
  const [item] = await db.insert(wishlistTable).values({ userId, productId: parsed.data.productId }).returning();
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item!.productId));
  res.status(201).json({
    ...item!,
    createdAt: item!.createdAt.toISOString(),
    product: product ? await enrichProduct(product) : null,
  });
});

router.delete("/wishlist/:productId", requireAuth, async (req, res): Promise<void> => {
  const productId = requireId(req, res, "productId");
  if (productId === null) return;
  const userId = req.user!.id;
  await db.delete(wishlistTable).where(and(eq(wishlistTable.productId, productId), eq(wishlistTable.userId, userId)));
  res.sendStatus(204);
});

export default router;
