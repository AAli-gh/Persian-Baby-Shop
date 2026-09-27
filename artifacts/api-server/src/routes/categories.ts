import { Router, type IRouter } from "express";
import { eq, inArray, sql } from "drizzle-orm";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { requireId } from "../lib/http";
import { CreateCategoryBody, UpdateCategoryBody, UpdateCategoryParams, DeleteCategoryParams } from "@workspace/api-zod";

const router: IRouter = Router();

type CategoryRow = typeof categoriesTable.$inferSelect;

async function enrichCategory(cat: CategoryRow) {
  const [{ count }] = await db.select({ count: sql<string>`count(*)` }).from(productsTable).where(eq(productsTable.categoryId, cat.id));
  return { ...cat, productCount: Number(count) };
}

/** Product counts for a whole list of categories in one grouped query. */
async function enrichCategories(cats: CategoryRow[]) {
  if (cats.length === 0) return [];
  const counts = await db
    .select({ categoryId: productsTable.categoryId, count: sql<string>`count(*)` })
    .from(productsTable)
    .where(inArray(productsTable.categoryId, cats.map((c) => c.id)))
    .groupBy(productsTable.categoryId);
  const byCategory = new Map(counts.map((row) => [row.categoryId, Number(row.count)]));
  return cats.map((cat) => ({ ...cat, productCount: byCategory.get(cat.id) ?? 0 }));
}

router.get("/categories", async (_req, res): Promise<void> => {
  res.json(await enrichCategories(await db.select().from(categoriesTable)));
});

router.post("/categories", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [cat] = await db.insert(categoriesTable).values(parsed.data).returning();
  res.status(201).json(await enrichCategory(cat!));
});

router.patch("/categories/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = requireId(req, res);
  if (id === null) return;
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [cat] = await db.update(categoriesTable).set(parsed.data).where(eq(categoriesTable.id, id)).returning();
  if (!cat) { res.status(404).json({ error: "Category not found" }); return; }
  res.json(await enrichCategory(cat!));
});

router.delete("/categories/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = requireId(req, res);
  if (id === null) return;
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.sendStatus(204);
});

export default router;
