import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, reviewsTable, productsTable, ordersTable, orderItemsTable } from "@workspace/db";
import { ListReviewsQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";
import { publicWriteLimiter } from "../middleware/rateLimit";
import { CreateReviewInput } from "../lib/validation";

const router: IRouter = Router();

router.get("/reviews", async (req, res): Promise<void> => {
  const params = ListReviewsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.productId, params.data.productId));
  res.json(reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

/**
 * Posting a review requires a signed-in account. The author identity comes from
 * the session, never from the request body, and one account leaves at most one
 * review per product. `isVerified` is set when the account actually bought the
 * product in a non-cancelled order.
 */
router.post("/reviews", publicWriteLimiter, requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateReviewInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = req.user!;

  const [product] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.productId));
  if (!product) { res.status(404).json({ error: "محصول یافت نشد" }); return; }

  const [duplicate] = await db
    .select({ id: reviewsTable.id })
    .from(reviewsTable)
    .where(
      and(eq(reviewsTable.productId, parsed.data.productId), eq(reviewsTable.userId, user.id)),
    );
  if (duplicate) {
    res.status(409).json({ error: "شما قبلاً برای این محصول نظر ثبت کرده‌اید" });
    return;
  }

  const [purchase] = await db
    .select({ id: orderItemsTable.id })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(ordersTable.id, orderItemsTable.orderId))
    .where(
      and(
        eq(orderItemsTable.productId, parsed.data.productId),
        eq(ordersTable.userId, user.id),
      ),
    );

  const [review] = await db
    .insert(reviewsTable)
    .values({
      productId: parsed.data.productId,
      userId: user.id,
      authorName: user.name?.trim() || "کاربر کودک‌لند",
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
      isVerified: Boolean(purchase),
    })
    .returning();

  res.status(201).json({ ...review!, createdAt: review!.createdAt.toISOString() });
});

export default router;
