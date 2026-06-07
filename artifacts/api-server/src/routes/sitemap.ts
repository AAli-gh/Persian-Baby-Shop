import { Router, type IRouter } from "express";
import { db, productsTable, blogPostsTable, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const STATIC_PAGES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/shop", changefreq: "daily", priority: "0.9" },
  { loc: "/blog", changefreq: "weekly", priority: "0.8" },
  { loc: "/about", changefreq: "monthly", priority: "0.5" },
  { loc: "/contact", changefreq: "monthly", priority: "0.5" },
  { loc: "/baby-checklists", changefreq: "monthly", priority: "0.6" },
  { loc: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { loc: "/terms-and-conditions", changefreq: "yearly", priority: "0.3" },
  { loc: "/shipping-policy", changefreq: "yearly", priority: "0.3" },
  { loc: "/return-policy", changefreq: "yearly", priority: "0.3" },
];

router.get("/sitemap.xml", async (req, res) => {
  const baseUrl = `https://${req.headers.host?.replace(/:\d+$/, "") || "koodakland.ir"}`;
  const now = new Date().toISOString().slice(0, 10);

  const [products, posts, categories] = await Promise.all([
    db.select({ slug: productsTable.slug, updatedAt: productsTable.updatedAt }).from(productsTable),
    db.select({ slug: blogPostsTable.slug, updatedAt: blogPostsTable.createdAt }).from(blogPostsTable).where(eq(blogPostsTable.isPublished, true)),
    db.select({ slug: categoriesTable.slug }).from(categoriesTable),
  ]);

  const urls: string[] = [
    ...STATIC_PAGES.map(p => `
  <url>
    <loc>${baseUrl}${p.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...products.map(p => `
  <url>
    <loc>${baseUrl}/product/${p.slug}</loc>
    <lastmod>${p.updatedAt.toISOString().slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`),
    ...posts.map(p => `
  <url>
    <loc>${baseUrl}/blog/${p.slug}</loc>
    <lastmod>${p.updatedAt.toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`),
    ...categories.map(c => `
  <url>
    <loc>${baseUrl}/shop?category=${c.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.send(xml);
});

router.get("/robots.txt", (req, res) => {
  const baseUrl = `https://${req.headers.host?.replace(/:\d+$/, "") || "koodakland.ir"}`;
  res.setHeader("Content-Type", "text/plain");
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${baseUrl}/api/sitemap.xml`);
});

export default router;
