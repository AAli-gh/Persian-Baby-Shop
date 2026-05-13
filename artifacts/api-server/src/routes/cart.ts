import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, cartsTable, cartItemsTable, productsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { AddToCartBody, UpdateCartItemBody, RemoveCartItemParams, UpdateCartItemParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function getCartWithItems(sessionId: string) {
  let [cart] = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId));
  if (!cart) {
    [cart] = await db.insert(cartsTable).values({ sessionId }).returning();
  }
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  const enrichedItems = await Promise.all(items.map(async (item) => {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) return null;
    const [cat] = await db.select({ nameFa: categoriesTable.nameFa }).from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
    const reviewStats = await db.select({ avgRating: sql<number>`avg(${reviewsTable.rating})`, count: sql<number>`count(*)` }).from(reviewsTable).where(eq(reviewsTable.productId, product.id));
    const enrichedProduct = {
      ...product, price: Number(product.price), salePrice: product.salePrice ? Number(product.salePrice) : null,
      weight: product.weight ? Number(product.weight) : null, images: (product.images as string[]) || [],
      tags: (product.tags as string[]) || [], categoryName: cat?.nameFa ?? null,
      avgRating: reviewStats[0]?.avgRating ? Number(reviewStats[0].avgRating) : null,
      reviewCount: Number(reviewStats[0]?.count ?? 0),
      flashSaleEndsAt: product.flashSaleEndsAt ? product.flashSaleEndsAt.toISOString() : null,
      createdAt: product.createdAt.toISOString(),
    };
    return { ...item, price: Number(item.price), product: enrichedProduct };
  }));
  const validItems = enrichedItems.filter(Boolean) as NonNullable<typeof enrichedItems[0]>[];
  const subtotal = validItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = validItems.reduce((s, i) => s + i.quantity, 0);
  return { id: cart.id, sessionId: cart.sessionId, items: validItems, subtotal, itemCount };
}

router.get("/cart", async (req, res): Promise<void> => {
  const sessionId = String(req.query.sessionId || "");
  if (!sessionId) { res.status(400).json({ error: "sessionId required" }); return; }
  res.json(await getCartWithItems(sessionId));
});

router.post("/cart", async (req, res): Promise<void> => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { productId, quantity, sessionId } = parsed.data;

  let [cart] = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId));
  if (!cart) [cart] = await db.insert(cartsTable).values({ sessionId }).returning();

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const [existing] = await db.select().from(cartItemsTable).where(and(eq(cartItemsTable.cartId, cart.id), eq(cartItemsTable.productId, productId)));
  if (existing) {
    await db.update(cartItemsTable).set({ quantity: existing.quantity + quantity }).where(eq(cartItemsTable.id, existing.id));
  } else {
    const price = product.salePrice ?? product.price;
    await db.insert(cartItemsTable).values({ cartId: cart.id, productId, quantity, price: String(price) });
  }
  res.json(await getCartWithItems(sessionId));
});

router.patch("/cart/:itemId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const itemId = parseInt(raw, 10);
  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [item] = await db.update(cartItemsTable).set({ quantity: parsed.data.quantity }).where(eq(cartItemsTable.id, itemId)).returning();
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  const [cart] = await db.select().from(cartsTable).where(eq(cartsTable.id, item.cartId));
  res.json(await getCartWithItems(cart.sessionId));
});

router.delete("/cart/:itemId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const itemId = parseInt(raw, 10);
  const [item] = await db.select().from(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  const [cart] = await db.select().from(cartsTable).where(eq(cartsTable.id, item.cartId));
  await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  res.json(await getCartWithItems(cart.sessionId));
});

export default router;
