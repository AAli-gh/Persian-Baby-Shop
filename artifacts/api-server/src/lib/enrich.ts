import { db, productsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { inArray, sql } from "drizzle-orm";

type ProductRow = typeof productsTable.$inferSelect;

export type EnrichedProduct = Omit<
  ProductRow,
  "price" | "salePrice" | "weight" | "images" | "tags" | "flashSaleEndsAt" | "createdAt" | "updatedAt"
> & {
  price: number;
  salePrice: number | null;
  weight: number | null;
  images: string[];
  tags: string[];
  categoryName: string | null;
  avgRating: number | null;
  reviewCount: number;
  flashSaleEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Decorates products with their category name and review aggregate.
 *
 * Takes two queries for the whole batch instead of two per product, which is
 * what every product list in the API needs.
 */
export async function enrichProducts(products: ProductRow[]): Promise<EnrichedProduct[]> {
  if (products.length === 0) return [];

  const categoryIds = [...new Set(products.map((p) => p.categoryId))];
  const productIds = products.map((p) => p.id);

  const [categories, reviewStats] = await Promise.all([
    db
      .select({ id: categoriesTable.id, nameFa: categoriesTable.nameFa })
      .from(categoriesTable)
      .where(inArray(categoriesTable.id, categoryIds)),
    db
      .select({
        productId: reviewsTable.productId,
        avgRating: sql<string | null>`avg(${reviewsTable.rating})`,
        count: sql<string>`count(*)`,
      })
      .from(reviewsTable)
      .where(inArray(reviewsTable.productId, productIds))
      .groupBy(reviewsTable.productId),
  ]);

  const categoryNames = new Map(categories.map((c) => [c.id, c.nameFa]));
  const stats = new Map(reviewStats.map((r) => [r.productId, r]));

  return products.map((product) => {
    const stat = stats.get(product.id);
    return {
      ...product,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      weight: product.weight ? Number(product.weight) : null,
      images: (product.images as string[]) || [],
      tags: (product.tags as string[]) || [],
      categoryName: categoryNames.get(product.categoryId) ?? null,
      avgRating: stat?.avgRating ? Number(stat.avgRating) : null,
      reviewCount: Number(stat?.count ?? 0),
      flashSaleEndsAt: product.flashSaleEndsAt ? product.flashSaleEndsAt.toISOString() : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  });
}

export async function enrichProduct(product: ProductRow): Promise<EnrichedProduct> {
  const [enriched] = await enrichProducts([product]);
  return enriched!;
}
