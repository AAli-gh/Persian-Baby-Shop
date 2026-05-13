import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, reviewsTable } from "@workspace/db";
import { CreateReviewBody, ListReviewsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reviews", async (req, res): Promise<void> => {
  const params = ListReviewsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, params.data.productId));
  res.json(reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [review] = await db.insert(reviewsTable).values({ ...parsed.data, isVerified: false }).returning();
  res.status(201).json({ ...review, createdAt: review.createdAt.toISOString() });
});

export default router;
