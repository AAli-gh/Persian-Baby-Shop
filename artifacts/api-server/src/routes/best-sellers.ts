import { Router, type IRouter } from "express";
import { db, productsTable, orderItemsTable } from "@workspace/db";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { enrichProducts } from "../lib/enrich";

const router: IRouter = Router();

const LIMIT = 8;

/**
 * Real best sellers, ranked by units actually sold. Falls back to the manual
 * `isBestSeller` flag and then to featured products for a shop with no order
 * history yet.
 */
router.get("/products/best-sellers", async (_req, res): Promise<void> => {
  const soldRows = await db
    .select({
      productId: orderItemsTable.productId,
      totalSold: sql<string>`sum(${orderItemsTable.quantity})`,
    })
    .from(orderItemsTable)
    .groupBy(orderItemsTable.productId)
    .orderBy(desc(sql`sum(${orderItemsTable.quantity})`))
    .limit(LIMIT);

  if (soldRows.length > 0) {
    const ids = soldRows.map((r) => r.productId);
    const products = await db
      .select()
      .from(productsTable)
      .where(inArray(productsTable.id, ids));
    const byId = new Map(products.map((p) => [p.id, p]));
    const ordered = ids.flatMap((id) => {
      const product = byId.get(id);
      return product ? [product] : [];
    });
    if (ordered.length > 0) {
      res.json(await enrichProducts(ordered));
      return;
    }
  }

  const flagged = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.isBestSeller, true))
    .limit(LIMIT);
  if (flagged.length > 0) {
    res.json(await enrichProducts(flagged));
    return;
  }

  const featured = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.isFeatured, true))
    .orderBy(desc(productsTable.createdAt))
    .limit(LIMIT);
  res.json(await enrichProducts(featured));
});

export default router;
