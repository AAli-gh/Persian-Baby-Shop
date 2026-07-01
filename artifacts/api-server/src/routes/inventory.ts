import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable, stockNotificationsTable } from "@workspace/db";
import { eq, lte, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();
router.use(requireAuth, requireAdmin);

router.get("/inventory", async (req, res) => {
  const search = String(req.query["search"] ?? "");
  const lowOnly = req.query["lowStock"] === "true";
  const threshold = parseInt(String(req.query["threshold"] ?? "10"), 10);

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

router.patch("/inventory/:id/stock", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] ?? "0", 10);
  const { stock } = req.body as { stock: number; note?: string };
  if (typeof stock !== "number" || stock < 0) { res.status(400).json({ error: "Invalid stock value" }); return; }

  const [before] = await db.select({ stock: productsTable.stock }).from(productsTable).where(eq(productsTable.id, id));
  const [updated] = await db.update(productsTable).set({ stock }).where(eq(productsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Product not found" }); return; }

  if (before && before.stock === 0 && stock > 0) {
    await db.update(stockNotificationsTable)
      .set({ isNotified: true, notifiedAt: new Date() })
      .where(eq(stockNotificationsTable.productId, id));
  }

  res.json(updated);
});

router.post("/inventory/bulk-restock", async (req, res) => {
  const { items } = req.body as { items: Array<{ id: number; stock: number }> };
  const results = await Promise.all(
    items.map(async ({ id, stock }) => {
      const [before] = await db.select({ stock: productsTable.stock }).from(productsTable).where(eq(productsTable.id, id));
      const result = await db.update(productsTable).set({ stock }).where(eq(productsTable.id, id)).returning();
      if (before && before.stock === 0 && stock > 0) {
        await db.update(stockNotificationsTable)
          .set({ isNotified: true, notifiedAt: new Date() })
          .where(eq(stockNotificationsTable.productId, id));
      }
      return result;
    })
  );
  res.json({ updated: results.flat().length });
});

export default router;
