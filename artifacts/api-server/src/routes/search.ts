import { Router, type IRouter } from "express";
import { ilike, or, sql, inArray } from "drizzle-orm";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { enrichProducts } from "../lib/enrich";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const q = String(req.query.q || "").trim();
  const parsedLimit = Number.parseInt(String(req.query.limit || "6"), 10);
  const limit = Number.isNaN(parsedLimit) ? 6 : Math.min(24, Math.max(1, parsedLimit));
  if (!q) { res.json({ products: [], categories: [], total: 0 }); return; }

  const products = await db.select().from(productsTable)
    .where(or(ilike(productsTable.nameFa, `%${q}%`), ilike(productsTable.name, `%${q}%`), ilike(productsTable.brand, `%${q}%`)))
    .limit(limit);

  const cats = await db.select().from(categoriesTable)
    .where(or(ilike(categoriesTable.nameFa, `%${q}%`), ilike(categoriesTable.name, `%${q}%`)))
    .limit(3);

  const enrichedProducts = await enrichProducts(products);

  const categoryCounts = cats.length > 0
    ? await db
        .select({ categoryId: productsTable.categoryId, count: sql<string>`count(*)` })
        .from(productsTable)
        .where(inArray(productsTable.categoryId, cats.map((c) => c.id)))
        .groupBy(productsTable.categoryId)
    : [];
  const countByCategory = new Map(categoryCounts.map((row) => [row.categoryId, Number(row.count)]));
  const enrichedCats = cats.map((c) => ({ ...c, productCount: countByCategory.get(c.id) ?? 0 }));

  res.json({ products: enrichedProducts, categories: enrichedCats, total: enrichedProducts.length + enrichedCats.length });
});

export default router;
