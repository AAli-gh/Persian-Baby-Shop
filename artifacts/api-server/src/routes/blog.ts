import { Router, type IRouter } from "express";
import { eq, sql, desc, and } from "drizzle-orm";
import { db, blogPostsTable, blogCategoriesTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { CreateBlogPostBody, UpdateBlogPostBody, ListBlogPostsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function enrichPost(post: typeof blogPostsTable.$inferSelect, catName?: string | null) {
  return {
    ...post, tags: (post.tags as string[]) || [],
    categoryName: catName ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

router.get("/blog/posts", async (req, res): Promise<void> => {
  const params = ListBlogPostsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { category, page = 1, limit = 9, published } = params.data;
  const conditions = [];
  if (published !== undefined) conditions.push(eq(blogPostsTable.isPublished, published));
  else conditions.push(eq(blogPostsTable.isPublished, true));
  if (category) {
    const [cat] = await db.select().from(blogCategoriesTable).where(eq(blogCategoriesTable.slug, category));
    if (cat) conditions.push(eq(blogPostsTable.categoryId, cat.id));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(blogPostsTable).where(where);
  const posts = await db.select().from(blogPostsTable).where(where).orderBy(desc(blogPostsTable.createdAt)).limit(Number(limit)).offset((Number(page) - 1) * Number(limit));
  const enriched = await Promise.all(posts.map(async (p) => {
    const catName = p.categoryId ? (await db.select().from(blogCategoriesTable).where(eq(blogCategoriesTable.id, p.categoryId)))[0]?.nameFa : null;
    return enrichPost(p, catName);
  }));
  res.json({ posts: enriched, total: Number(count), page: Number(page), totalPages: Math.ceil(Number(count) / Number(limit)) });
});

router.post("/blog/posts", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateBlogPostBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [post] = await db.insert(blogPostsTable).values(parsed.data).returning();
  res.status(201).json(enrichPost(post));
});

router.get("/blog/posts/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [post] = await db.select().from(blogPostsTable).where(eq(blogPostsTable.slug, slug));
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  await db.update(blogPostsTable).set({ viewCount: post.viewCount + 1 }).where(eq(blogPostsTable.id, post.id));
  const catName = post.categoryId ? (await db.select().from(blogCategoriesTable).where(eq(blogCategoriesTable.id, post.categoryId)))[0]?.nameFa : null;
  res.json(enrichPost({ ...post, viewCount: post.viewCount + 1 }, catName));
});

router.patch("/blog/posts/:slug", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const parsed = UpdateBlogPostBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [post] = await db.update(blogPostsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(blogPostsTable.slug, slug)).returning();
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  res.json(enrichPost(post));
});

router.delete("/blog/posts/:slug", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  await db.delete(blogPostsTable).where(eq(blogPostsTable.slug, slug));
  res.sendStatus(204);
});

router.get("/blog/categories", async (_req, res): Promise<void> => {
  const cats = await db.select().from(blogCategoriesTable);
  const enriched = await Promise.all(cats.map(async (c) => {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(blogPostsTable).where(eq(blogPostsTable.categoryId, c.id));
    return { ...c, postCount: Number(count) };
  }));
  res.json(enriched);
});

export default router;
