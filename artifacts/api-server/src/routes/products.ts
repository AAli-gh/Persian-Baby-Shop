import { Router, type IRouter } from "express";
import { eq, ilike, and, gte, lte, sql, desc, asc } from "drizzle-orm";
import { db, productsTable, reviewsTable, categoriesTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  CreateProductBody,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
  GetRelatedProductsParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

async function enrichProduct(product: typeof productsTable.$inferSelect) {
  const [cat] = await db.select({ nameFa: categoriesTable.nameFa }).from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
  const reviewStats = await db
    .select({ avgRating: sql<number>`avg(${reviewsTable.rating})`, count: sql<number>`count(*)` })
    .from(reviewsTable)
    .where(eq(reviewsTable.productId, product.id));
  return {
    ...product,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    weight: product.weight ? Number(product.weight) : null,
    images: (product.images as string[]) || [],
    tags: (product.tags as string[]) || [],
    categoryName: cat?.nameFa ?? null,
    avgRating: reviewStats[0]?.avgRating ? Number(reviewStats[0].avgRating) : null,
    reviewCount: Number(reviewStats[0]?.count ?? 0),
    flashSaleEndsAt: product.flashSaleEndsAt ? product.flashSaleEndsAt.toISOString() : null,
    createdAt: product.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { category, minPrice, maxPrice, sort, page = 1, limit = 12, inStock, featured, flashSale, ageGroup } = params.data;

  const conditions = [];
  if (category) {
    const [cat] = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, category));
    if (cat) conditions.push(eq(productsTable.categoryId, cat.id));
  }
  if (minPrice !== undefined) conditions.push(gte(productsTable.price, String(minPrice)));
  if (maxPrice !== undefined) conditions.push(lte(productsTable.price, String(maxPrice)));
  if (inStock) conditions.push(gte(productsTable.stock, 1));
  if (featured) conditions.push(eq(productsTable.isFeatured, true));
  if (flashSale) conditions.push(eq(productsTable.isFlashSale, true));
  if (ageGroup) conditions.push(eq(productsTable.ageGroup, ageGroup));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let orderBy;
  if (sort === "price_asc") orderBy = asc(productsTable.price);
  else if (sort === "price_desc") orderBy = desc(productsTable.price);
  else if (sort === "newest") orderBy = desc(productsTable.createdAt);
  else orderBy = desc(productsTable.createdAt);

  const offset = (Number(page) - 1) * Number(limit);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(whereClause);
  const products = await db.select().from(productsTable).where(whereClause).orderBy(orderBy).limit(Number(limit)).offset(offset);
  const enriched = await Promise.all(products.map(enrichProduct));

  res.json({ products: enriched, total: Number(count), page: Number(page), totalPages: Math.ceil(Number(count) / Number(limit)) });
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).where(eq(productsTable.isFeatured, true)).limit(8);
  const enriched = await Promise.all(products.map(enrichProduct));
  res.json(enriched);
});

router.get("/products/flash-sale", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).where(eq(productsTable.isFlashSale, true)).limit(8);
  const enriched = await Promise.all(products.map(enrichProduct));
  res.json(enriched);
});

router.get("/products/new-arrivals", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt)).limit(8);
  const enriched = await Promise.all(products.map(enrichProduct));
  res.json(enriched);
});

router.get("/products/best-sellers", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.stock)).limit(8);
  const enriched = await Promise.all(products.map(enrichProduct));
  res.json(enriched);
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(await enrichProduct(product));
});

router.patch("/products/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.images) updateData.images = parsed.data.images;
  if (parsed.data.flashSaleEndsAt) updateData.flashSaleEndsAt = new Date(parsed.data.flashSaleEndsAt);
  const [product] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(await enrichProduct(product));
});

router.delete("/products/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.sendStatus(204);
});

router.get("/products/:id/related", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.json([]); return; }
  const related = await db.select().from(productsTable)
    .where(and(eq(productsTable.categoryId, product.categoryId), sql`${productsTable.id} != ${id}`))
    .limit(4);
  res.json(await Promise.all(related.map(enrichProduct)));
});

router.post("/products", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: Record<string, unknown> = {
    ...parsed.data,
    price: String(parsed.data.price),
    salePrice: parsed.data.salePrice != null ? String(parsed.data.salePrice) : null,
    flashSaleEndsAt: parsed.data.flashSaleEndsAt ? new Date(parsed.data.flashSaleEndsAt) : null,
  };
  const [product] = await db.insert(productsTable).values(data as typeof productsTable.$inferInsert).returning();
  res.status(201).json(await enrichProduct(product));
});

export default router;
