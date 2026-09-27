import { Router, type IRouter, type Request, type Response } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, cartsTable, cartItemsTable, productsTable } from "@workspace/db";
import { optionalAuth } from "../middleware/auth";
import { enrichProducts } from "../lib/enrich";
import { requireId } from "../lib/http";
import {
  AddToCartInput,
  CartSessionQuery,
  MAX_CART_QUANTITY,
  RemoveCartItemInput,
  UpdateCartItemInput,
} from "../lib/validation";

const router: IRouter = Router();

type CartRow = typeof cartsTable.$inferSelect;

async function serializeCart(cart: CartRow) {
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));

  const products =
    items.length > 0
      ? await db
          .select()
          .from(productsTable)
          .where(inArray(productsTable.id, [...new Set(items.map((i) => i.productId))]))
      : [];
  const enriched = await enrichProducts(products);
  const byId = new Map(enriched.map((p) => [p.id, p]));

  const validItems = items.flatMap((item) => {
    const product = byId.get(item.productId);
    return product ? [{ ...item, price: Number(item.price), product }] : [];
  });

  return {
    id: cart.id,
    sessionId: cart.sessionId,
    items: validItems,
    subtotal: validItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    itemCount: validItems.reduce((sum, i) => sum + i.quantity, 0),
  };
}

/**
 * Resolves the cart a request is allowed to touch.
 *
 * A cart is addressed by an opaque `sessionId` the client keeps, which is all a
 * guest has. Once a signed-in customer touches a cart it is claimed for their
 * account, and from then on only that account may use it — so a leaked session
 * id cannot be replayed against someone's cart. `create` is false for reads of
 * a cart that may not exist yet.
 */
async function resolveCart(
  req: Request,
  res: Response,
  sessionId: string,
  { create }: { create: boolean },
): Promise<CartRow | null> {
  let [cart] = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId));

  if (!cart) {
    if (!create) return null;
    [cart] = await db
      .insert(cartsTable)
      .values({ sessionId, userId: req.user?.id ?? null })
      .returning();
    return cart!;
  }

  if (cart.userId !== null && cart.userId !== req.user?.id) {
    res.status(403).json({ error: "دسترسی به این سبد خرید مجاز نیست" });
    return null;
  }

  if (cart.userId === null && req.user) {
    [cart] = await db
      .update(cartsTable)
      .set({ userId: req.user.id, updatedAt: new Date() })
      .where(eq(cartsTable.id, cart.id))
      .returning();
  }

  return cart!;
}

/** Looks up a cart item, but only within the caller's own cart. */
async function resolveOwnItem(
  req: Request,
  res: Response,
  sessionId: string,
  itemId: number,
): Promise<{ cart: CartRow; item: typeof cartItemsTable.$inferSelect } | null> {
  const cart = await resolveCart(req, res, sessionId, { create: false });
  if (!cart) {
    if (!res.headersSent) res.status(404).json({ error: "سبد خرید یافت نشد" });
    return null;
  }

  const [item] = await db.select().from(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  // Same answer whether the item is absent or belongs to another cart, so the
  // endpoint cannot be used to probe for existing item ids.
  if (!item || item.cartId !== cart.id) {
    res.status(404).json({ error: "این کالا در سبد خرید شما نیست" });
    return null;
  }

  return { cart, item };
}

router.get("/cart", optionalAuth, async (req, res): Promise<void> => {
  const parsed = CartSessionQuery.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "sessionId نامعتبر است" }); return; }

  const cart = await resolveCart(req, res, parsed.data.sessionId, { create: true });
  if (!cart) return;
  res.json(await serializeCart(cart));
});

router.post("/cart", optionalAuth, async (req, res): Promise<void> => {
  const parsed = AddToCartInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { productId, quantity, sessionId } = parsed.data;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) { res.status(404).json({ error: "محصول یافت نشد" }); return; }

  const cart = await resolveCart(req, res, sessionId, { create: true });
  if (!cart) return;

  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  const existingItem = items.find((i) => i.productId === productId);
  const desired = (existingItem?.quantity ?? 0) + quantity;

  if (desired > MAX_CART_QUANTITY) {
    res.status(400).json({ error: `حداکثر ${MAX_CART_QUANTITY} عدد از هر کالا قابل سفارش است` });
    return;
  }
  if (desired > product.stock) {
    res.status(409).json({ error: "موجودی این محصول کافی نیست" });
    return;
  }

  // The unit price is refreshed on every change, and recomputed again at
  // checkout, so a stale cart can never lock in an expired sale price.
  const unitPrice = String(product.salePrice ?? product.price);

  if (existingItem) {
    await db
      .update(cartItemsTable)
      .set({ quantity: desired, price: unitPrice })
      .where(eq(cartItemsTable.id, existingItem.id));
  } else {
    await db
      .insert(cartItemsTable)
      .values({ cartId: cart.id, productId, quantity, price: unitPrice });
  }

  res.json(await serializeCart(cart));
});

router.patch("/cart/:itemId", optionalAuth, async (req, res): Promise<void> => {
  const itemId = requireId(req, res, "itemId");
  if (itemId === null) return;

  const parsed = UpdateCartItemInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const owned = await resolveOwnItem(req, res, parsed.data.sessionId, itemId);
  if (!owned) return;

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, owned.item.productId));
  if (!product) { res.status(404).json({ error: "محصول یافت نشد" }); return; }
  if (parsed.data.quantity > product.stock) {
    res.status(409).json({ error: "موجودی این محصول کافی نیست" });
    return;
  }

  await db
    .update(cartItemsTable)
    .set({ quantity: parsed.data.quantity, price: String(product.salePrice ?? product.price) })
    .where(eq(cartItemsTable.id, owned.item.id));

  res.json(await serializeCart(owned.cart));
});

router.delete("/cart/:itemId", optionalAuth, async (req, res): Promise<void> => {
  const itemId = requireId(req, res, "itemId");
  if (itemId === null) return;

  const parsed = RemoveCartItemInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "sessionId نامعتبر است" }); return; }

  const owned = await resolveOwnItem(req, res, parsed.data.sessionId, itemId);
  if (!owned) return;

  await db.delete(cartItemsTable).where(eq(cartItemsTable.id, owned.item.id));
  res.json(await serializeCart(owned.cart));
});

export default router;
