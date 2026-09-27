import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable, stockNotificationsTable } from "@workspace/db";
import { eq, lte, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { BulkRestockInput, UpdateStockInput } from "../lib/validation";
import { requireId } from "../lib/http";

const router: IRouter = Router();
// Scoped to this router's own prefix: an unscoped `router.use` guard would
// also run for every router mounted after this one.
router.use("/inventory", requireAuth, requireAdmin);

router.get("/inventory", async (req, res) => {
  const search = String(req.query["search"] ?? "");
  const lowOnly = req.query["lowStock"] === "true";
  const parsedThreshold = Number.parseInt(String(req.query["threshold"] ?? "10"), 10);
  const threshold = Number.isNaN(parsedThreshold) ? 10 : Math.min(100_000, Math.max(0, parsedThreshold));

  const products = await db.select().from(productsTable).orderBy(productsTable.stock);
  const categories = await db.select({ id: categoriesTable.id, nameFa: categoriesTable.nameFa }).from(categoriesTable);
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.nameFa]));

  let items = products.map(p => ({
    id: p.id, nameFa: p.nameFa, sku: p.sku, stock: p.stock,
    price: p.price, salePrice: p.salePrice, images: p.images as string[],
    categoryName: catMap[p.categoryId] ?? null,
  }));

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(r => r.nameFa.toLowerCase().includes(q) || (r.sku ?? "").toLowerCase().includes(q));
  }
  if (lowOnly) items = items.filter(r => r.stock <= threshold);

  const all = products;
  const summary = {
    total: all.length,
    inStock: all.filter(r => r.stock > threshold).length,
    lowStock: all.filter(r => r.stock > 0 && r.stock <= threshold).length,
    outOfStock: all.filter(r => r.stock === 0).length,
  };
  res.json({ items, summary });
});

/**
 * Sets a product's stock and, when it comes back from zero, marks the waiting
 * back-in-stock subscribers as notified.
 */
async function restock(id: number, stock: number) {
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select({ stock: productsTable.stock })
      .from(productsTable)
      .where(eq(productsTable.id, id));
    if (!before) return null;

    const [updated] = await tx
      .update(productsTable)
      .set({ stock, updatedAt: new Date() })
      .where(eq(productsTable.id, id))
      .returning();
    if (!updated) return null;

    if (before.stock === 0 && stock > 0) {
      await tx
        .update(stockNotificationsTable)
        .set({ isNotified: true, notifiedAt: new Date() })
        .where(eq(stockNotificationsTable.productId, id));
    }

    return updated;
  });
}

router.patch("/inventory/:id/stock", async (req, res): Promise<void> => {
  const id = requireId(req, res);
  if (id === null) return;
  const parsed = UpdateStockInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { stock } = parsed.data;

  const restocked = await restock(id, stock);
  if (!restocked) { res.status(404).json({ error: "محصول یافت نشد" }); return; }

  res.json(restocked);
});

router.post("/inventory/bulk-restock", async (req, res): Promise<void> => {
  const parsed = BulkRestockInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const results = await Promise.all(
    parsed.data.items.map(({ id, stock }) => restock(id, stock)),
  );
  res.json({ updated: results.filter(Boolean).length });
});

export default router;
