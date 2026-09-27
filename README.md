<div dir="rtl">

# کودک‌لند — Koodakland

فروشگاه اینترنتی فارسی و راست‌به‌چپ برای پوشاک و لوازم نوزاد و کودک. شامل
کاتالوگ محصولات، سبد خرید و تسویه‌حساب، لیست‌های علاقه‌مندی، وبلاگ، خبرنامه،
اطلاع‌رسانی موجود شدن کالا، و یک پنل مدیریت کامل.

> این مخزن یک **pnpm workspace** است: یک API سرور، یک اپلیکیشن وب، و چند
> پکیج مشترک که قرارداد API و اسکیمای دیتابیس را نگه می‌دارند.

</div>

## Stack

<div dir="rtl">

| لایه | فناوری |
| --- | --- |
| وب | React 19، Vite 7، wouter، TanStack Query 5، Tailwind CSS 4، اجزای shadcn/ui |
| API | Node.js 24، Express 5، pino |
| دیتابیس | PostgreSQL 16 + Drizzle ORM |
| احراز هویت | Clerk (`@clerk/express` روی API، `@clerk/react` روی وب) |
| اعتبارسنجی | Zod + `drizzle-zod` |
| تولید کد | Orval (از روی OpenAPI) |
| بیلد | esbuild (API)، Vite (وب) |
| ابزار پکیج | pnpm 10.33.0، TypeScript 5.9 |

</div>

## ساختار مخزن

```
artifacts/
  api-server/        # Express 5 API — منبع تمام منطق سرور
  koodakland/        # اپلیکیشن وب (فروشگاه + پنل ادمین)
  mockup-sandbox/    # محیط آزمایش اجزای UI (جدا از محصول نهایی)
lib/
  api-spec/          # openapi.yaml — منبع حقیقت قرارداد API + تنظیمات Orval
  api-zod/           # اسکیماهای Zod تولیدشده (کامیت‌شده، دست‌نویس نیست)
  api-client-react/  # هوک‌های React Query تولیدشده (کامیت‌شده، دست‌نویس نیست)
  db/                # اسکیمای Drizzle، migrations، اتصال به Postgres
scripts/             # اسکریپت‌های کمکی workspace
```

<div dir="rtl">

### منبع حقیقت هر موضوع

| موضوع | محل |
| --- | --- |
| اسکیمای دیتابیس | `lib/db/src/schema/*.ts` (همه از `index.ts` صادر می‌شوند) |
| Migrations | `lib/db/migrations/` — راهنمای baseline در README همان پوشه |
| قرارداد API | `lib/api-spec/openapi.yaml` |
| مسیرهای API | `artifacts/api-server/src/routes/*.ts`، ثبت‌شده در `routes/index.ts` |
| احراز هویت و نقش‌ها | `artifacts/api-server/src/middleware/auth.ts` |
| کمک‌کننده‌های مشترک سرور | `artifacts/api-server/src/lib/` — `enrich`، `discount`، `validation`، `csv`، `http` |
| صفحات وب | `artifacts/koodakland/src/pages/`، مسیریابی در `src/App.tsx` |
| تم و استایل | `artifacts/koodakland/src/index.css` |

</div>

## راه‌اندازی

### پیش‌نیازها

- Node.js 24
- pnpm 10.33.0 (`corepack enable` یا `npm i -g pnpm@10.33.0`)
- یک دیتابیس PostgreSQL 16
- یک اپلیکیشن Clerk (برای ورود کاربران)

### متغیرهای محیطی

<div dir="rtl">

| متغیر | الزامی | توضیح |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | رشته اتصال Postgres. بدون آن API در همان لحظه‌ی بالا آمدن خطا می‌دهد. |
| `PORT` | ✅ | پورتی که API روی آن گوش می‌دهد. برای بیلد و dev اپ وب هم لازم است. |
| `BASE_PATH` | ✅ (وب) | مسیر پایه‌ی Vite؛ برای سرو از ریشه مقدار `/` بدهید. |
| `CLERK_PUBLISHABLE_KEY` | ✅ | کلید عمومی Clerk |
| `CLERK_SECRET_KEY` | ✅ | کلید خصوصی Clerk |
| `CORS_ALLOWED_ORIGINS` | ➖ | لیست origin های مجاز، جدا شده با کاما. خالی یعنی فقط same-origin. |
| `TRUST_PROXY_HOPS` | ➖ | تعداد پروکسی‌های جلوی API (پیش‌فرض `1`). مقدار غلط، rate limiting بر اساس IP را از کار می‌اندازد. |
| `SMS_API_KEY`، `SMS_SENDER` | ➖ | اعتبارنامه‌ی سامانه پیامک. بدون آن‌ها `POST /api/sms/send` پاسخ 503 می‌دهد. |
| `NODE_ENV` | ➖ | در حالت غیر `production`، origin های `localhost` هم برای CORS مجاز می‌شوند. |

</div>

### نصب و آماده‌سازی دیتابیس

```bash
pnpm install

# روی یک دیتابیس خالی:
pnpm --filter @workspace/db run migrate

# یا در حالت توسعه، اعمال مستقیم اسکیما بدون تاریخچه:
pnpm --filter @workspace/db run push
```

<div dir="rtl">

⚠️ اگر دیتابیس شما قبلاً با `push` ساخته شده است، `migrate` روی اولین
`CREATE TABLE` شکست می‌خورد. مراحل baseline کردن در
[`lib/db/migrations/README.md`](lib/db/migrations/README.md) آمده است.

</div>

### اجرا

```bash
# API
PORT=5000 pnpm --filter @workspace/api-server run dev

# اپ وب (در یک ترمینال دیگر)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/koodakland run dev
```

<div dir="rtl">

کلاینت تولیدشده همه‌ی درخواست‌ها را به مسیر **نسبی** `/api/...` می‌فرستد، یعنی
اپ وب و API باید از یک origin سرو شوند. روی Replit این کار را
`router = "application"` انجام می‌دهد.

⚠️ در حالت توسعه‌ی محلی، `vite.config.ts` هیچ proxy ای برای `/api` ندارد، پس
درخواست‌ها به سرور Vite می‌خورند و ۴۰۴ می‌گیرند. یکی از این دو راه را انتخاب
کنید:

</div>

```ts
// گزینه ۱ (پیشنهادی) — یک proxy به vite.config.ts اضافه کنید:
server: {
  port,
  proxy: { "/api": "http://localhost:5000" },
  // ...
}
```

```ts
// گزینه ۲ — در نقطه‌ی شروع اپ، آدرس پایه را ست کنید:
import { setBaseUrl } from "@workspace/api-client-react";
if (import.meta.env.DEV) setBaseUrl("http://localhost:5000");
// در این حالت CORS_ALLOWED_ORIGINS را هم روی origin اپ وب تنظیم کنید.
```

## دستورهای پرکاربرد

<div dir="rtl">

| دستور | کار |
| --- | --- |
| `pnpm run typecheck` | تایپ‌چک کل workspace |
| `pnpm run typecheck:libs` | فقط پکیج‌های `lib/` — **پس از هر تغییر اسکیما لازم است** |
| `pnpm run test` | تست‌های واحد همه‌ی پکیج‌ها |
| `pnpm run build` | تایپ‌چک + بیلد همه (نیازمند `PORT` و `BASE_PATH`) |
| `pnpm --filter @workspace/api-spec run codegen` | بازتولید کلاینت‌ها از `openapi.yaml` |
| `pnpm --filter @workspace/db run generate` | ساخت migration پس از تغییر اسکیما |
| `pnpm --filter @workspace/db run test:inventory` | تست همزمانی رزرو موجودی (نیازمند دیتابیس) |

</div>

## قرارداد API

<div dir="rtl">

همه‌ی مسیرها زیر `/api` قرار دارند. `lib/api-spec/openapi.yaml` منبع حقیقت است؛
هر تغییر در endpoint یعنی ویرایش آن فایل و سپس اجرای codegen. خروجی داخل
`lib/api-zod/src/generated` و `lib/api-client-react/src/generated` کامیت می‌شود و
**هرگز دستی ویرایش نمی‌شود** — CI هم اختلاف آن با اسپک را چک می‌کند.

سطح دسترسی هر گروه:

| گروه | دسترسی |
| --- | --- |
| `products`، `categories`، `banners`، `blog`، `search`، `reviews` (خواندن)، `shipping`، `sitemap.xml`، `robots.txt`، `healthz` | عمومی |
| `cart`، `orders` (ایجاد) | مهمان یا کاربر؛ سبد با اولین دسترسی کاربر لاگین‌شده به حساب او گره می‌خورد |
| `reviews` (ثبت)، `wishlist`، `wishlists`، `users`، `orders` (خواندن) | نیازمند ورود |
| `admin/*`، `inventory/*`، `sms/*`، `discounts` (مدیریت)، `newsletter` (مدیریت)، `upload`، نوشتن روی محصولات/دسته‌ها/بنرها/وبلاگ | نقش `admin` یا `manager` |

محدودیت نرخ درخواست روی این موارد فعال است: کل `/api` (۳۰۰ در دقیقه)،
`discounts/validate` (۱۵)، ثبت سفارش (۲۰)، و نوشتن‌های عمومی مثل نظرات،
خبرنامه و اطلاع موجودی (۱۰).

</div>

<details>
<summary><b>فهرست کامل ۸۵ endpoint</b> (استخراج‌شده از <code>src/routes/</code>)</summary>

| متد | مسیر | دسترسی | فایل |
| --- | --- | --- | --- |
| `GET` | `/api/healthz` | عمومی | `health.ts` |
| `GET` | `/api/products/best-sellers` | عمومی | `best-sellers.ts` |
| `GET` | `/api/products` | عمومی | `products.ts` |
| `GET` | `/api/products/featured` | عمومی | `products.ts` |
| `GET` | `/api/products/flash-sale` | عمومی | `products.ts` |
| `GET` | `/api/products/new-arrivals` | عمومی | `products.ts` |
| `GET` | `/api/products/:id` | عمومی | `products.ts` |
| `PATCH` | `/api/products/:id` | ادمین | `products.ts` |
| `DELETE` | `/api/products/:id` | ادمین | `products.ts` |
| `GET` | `/api/products/:id/related` | عمومی | `products.ts` |
| `POST` | `/api/products` | ادمین | `products.ts` |
| `GET` | `/api/categories` | عمومی | `categories.ts` |
| `POST` | `/api/categories` | ادمین | `categories.ts` |
| `PATCH` | `/api/categories/:id` | ادمین | `categories.ts` |
| `DELETE` | `/api/categories/:id` | ادمین | `categories.ts` |
| `GET` | `/api/search` | عمومی | `search.ts` |
| `GET` | `/api/cart` | مهمان/کاربر | `cart.ts` |
| `POST` | `/api/cart` | مهمان/کاربر | `cart.ts` |
| `PATCH` | `/api/cart/:itemId` | مهمان/کاربر | `cart.ts` |
| `DELETE` | `/api/cart/:itemId` | مهمان/کاربر | `cart.ts` |
| `GET` | `/api/orders` | ورود | `orders.ts` |
| `POST` | `/api/orders` | مهمان/کاربر، محدودیت نرخ | `orders.ts` |
| `GET` | `/api/orders/:id` | ورود | `orders.ts` |
| `PATCH` | `/api/orders/:id` | ادمین | `orders.ts` |
| `GET` | `/api/reviews` | عمومی | `reviews.ts` |
| `POST` | `/api/reviews` | ورود، محدودیت نرخ | `reviews.ts` |
| `GET` | `/api/wishlist` | ورود | `wishlist.ts` |
| `POST` | `/api/wishlist` | ورود | `wishlist.ts` |
| `DELETE` | `/api/wishlist/:productId` | ورود | `wishlist.ts` |
| `GET` | `/api/wishlists` | ورود | `wishlists.ts` |
| `POST` | `/api/wishlists` | ورود | `wishlists.ts` |
| `PATCH` | `/api/wishlists/:id` | ورود | `wishlists.ts` |
| `DELETE` | `/api/wishlists/:id` | ورود | `wishlists.ts` |
| `POST` | `/api/wishlists/:id/items` | ورود | `wishlists.ts` |
| `DELETE` | `/api/wishlists/:id/items/:productId` | ورود | `wishlists.ts` |
| `POST` | `/api/wishlists/items/move` | ورود | `wishlists.ts` |
| `POST` | `/api/wishlists/default/items` | ورود | `wishlists.ts` |
| `DELETE` | `/api/wishlists/default/items/:productId` | ورود | `wishlists.ts` |
| `GET` | `/api/auth/me` | ورود | `users.ts` |
| `POST` | `/api/auth/sign-out-all` | ورود | `users.ts` |
| `GET` | `/api/users/:id` | ورود | `users.ts` |
| `PATCH` | `/api/users/:id` | ورود | `users.ts` |
| `GET` | `/api/users/:id/addresses` | ورود | `users.ts` |
| `POST` | `/api/users/:id/addresses` | ورود | `users.ts` |
| `GET` | `/api/blog/posts` | عمومی | `blog.ts` |
| `POST` | `/api/blog/posts` | ادمین | `blog.ts` |
| `GET` | `/api/blog/posts/:slug` | عمومی | `blog.ts` |
| `PATCH` | `/api/blog/posts/:slug` | ادمین | `blog.ts` |
| `DELETE` | `/api/blog/posts/:slug` | ادمین | `blog.ts` |
| `GET` | `/api/blog/categories` | عمومی | `blog.ts` |
| `GET` | `/api/banners` | عمومی | `banners.ts` |
| `POST` | `/api/banners` | ادمین | `banners.ts` |
| `PATCH` | `/api/banners/:id` | ادمین | `banners.ts` |
| `DELETE` | `/api/banners/:id` | ادمین | `banners.ts` |
| `POST` | `/api/discounts/validate` | عمومی، محدودیت نرخ | `discounts.ts` |
| `GET` | `/api/discounts` | ادمین | `discounts.ts` |
| `POST` | `/api/discounts` | ادمین | `discounts.ts` |
| `DELETE` | `/api/discounts/:id` | ادمین | `discounts.ts` |
| `GET` | `/api/shipping/methods` | عمومی | `shipping.ts` |
| `GET` | `/api/shipping/track/:trackingCode` | عمومی | `shipping.ts` |
| `POST` | `/api/newsletter/subscribe` | عمومی، محدودیت نرخ | `newsletter.ts` |
| `GET` | `/api/newsletter/subscribers` | ادمین | `newsletter.ts` |
| `DELETE` | `/api/newsletter/subscribers/:id` | ادمین | `newsletter.ts` |
| `GET` | `/api/newsletter/export` | ادمین | `newsletter.ts` |
| `POST` | `/api/products/:id/notify` | عمومی، محدودیت نرخ | `stock-notifications.ts` |
| `GET` | `/api/admin/stock-notifications` | ادمین | `stock-notifications.ts` |
| `DELETE` | `/api/admin/stock-notifications/:id` | ادمین | `stock-notifications.ts` |
| `GET` | `/api/admin/stock-notifications/export` | ادمین | `stock-notifications.ts` |
| `GET` | `/api/sitemap.xml` | عمومی | `sitemap.ts` |
| `GET` | `/api/robots.txt` | عمومی | `sitemap.ts` |
| `POST` | `/api/upload` | ادمین | `upload.ts` |
| `GET` | `/api/inventory` | ادمین | `inventory.ts` |
| `PATCH` | `/api/inventory/:id/stock` | ادمین | `inventory.ts` |
| `POST` | `/api/inventory/bulk-restock` | ادمین | `inventory.ts` |
| `GET` | `/api/sms/stats` | ادمین | `sms.ts` |
| `GET` | `/api/sms/templates` | ادمین | `sms.ts` |
| `POST` | `/api/sms/templates` | ادمین | `sms.ts` |
| `PATCH` | `/api/sms/templates/:id` | ادمین | `sms.ts` |
| `GET` | `/api/sms/logs` | ادمین | `sms.ts` |
| `POST` | `/api/sms/send` | ادمین | `sms.ts` |
| `GET` | `/api/admin/stats` | ادمین | `admin.ts` |
| `GET` | `/api/admin/recent-orders` | ادمین | `admin.ts` |
| `GET` | `/api/admin/low-stock` | ادمین | `admin.ts` |
| `GET` | `/api/admin/sales-chart` | ادمین | `admin.ts` |
| `GET` | `/api/admin/reports` | ادمین | `reports.ts` |

</details>

## تصمیم‌های معماری

<div dir="rtl">

- **اسپک OpenAPI هر دو کلاینت را می‌سازد.** سرور بدنه‌ی درخواست‌ها را با همان
  اسکیماهای Zod تولیدشده اعتبارسنجی می‌کند.
- **Zod تولیدشده حرف آخر نیست.** `integer` در OpenAPI به `zod.number()` ساده
  تبدیل می‌شود، پس تعداد، شناسه و مبلغ دوباره به‌صورت عدد صحیح در
  `api-server/src/lib/validation.ts` بررسی می‌شوند.
- **سبد خرید با یک `sessionId` مبهم آدرس‌دهی و بعد به حساب کاربر گره می‌خورد.**
  پس از اولین دسترسی کاربر لاگین‌شده، فقط همان حساب می‌تواند از آن سبد استفاده
  کند؛ لو رفتن `sessionId` قابل بازپخش نیست. مهمان‌ها آن را در `localStorage`
  نگه می‌دارند.
- **مبالغ در سمت سرور و لحظه‌ی تسویه محاسبه می‌شوند.** قیمت اقلام سفارش از
  جدول محصولات و داخل تراکنش خوانده می‌شود، نه از snapshot سبد؛ و تخفیف‌ها از
  تابع مشترک `evaluateDiscount` عبور می‌کنند که `/discounts/validate` هم از آن
  استفاده می‌کند.
- **رزرو موجودی با یک update شرطی انجام می‌شود.** عبارت
  `UPDATE … WHERE stock >= n` داخل تراکنش سفارش، چیزی است که تسویه‌های همزمان
  را ایمن می‌کند.
- **API به‌طور پیش‌فرض same-origin است.** CORS فقط origin های نام‌برده‌شده در
  `CORS_ALLOWED_ORIGINS` را بازتاب می‌دهد. rate limiting درون‌پردازه‌ای است، پس
  با چند instance، سهمیه به‌ازای هر instance محاسبه می‌شود.

</div>

## صفحات

<div dir="rtl">

**فروشگاه:** خانه، فروشگاه با فیلتر، صفحه محصول همراه نظرات، سبد خرید، تسویه،
پیگیری سفارش، علاقه‌مندی‌ها، وبلاگ، چک‌لیست‌های نوزاد، پروفایل، و صفحات
اعتماد (حریم خصوصی، شرایط، ارسال، بازگشت کالا).

**پنل ادمین** (نقش `admin` یا `manager`): داشبورد، تحلیل‌ها، محصولات، موجودی و
شارژ گروهی، سفارش‌ها، دسته‌بندی‌ها، وبلاگ، بنرها، کدهای تخفیف، روش‌های ارسال،
پنل پیامک، خبرنامه، گزارش‌ها و درخواست‌های اطلاع از موجودی.

پنل ادمین سمت کلاینت با `AdminGuard` محافظت می‌شود، ولی این فقط برای تجربه‌ی
کاربری است — تصمیم نهایی همیشه سمت سرور در `requireAdmin` گرفته می‌شود.

</div>

## دیتابیس

<div dir="rtl">

۲۱ جدول: `users`، `addresses`، `products`، `categories`، `carts`، `cart_items`،
`orders`، `order_items`، `reviews`، `wishlist`، `wishlists`، `wishlist_items`،
`discounts`، `banners`، `blog_posts`، `blog_categories`، `shipping_methods`،
`newsletters`، `stock_notifications`، `sms_templates`، `sms_logs`.

مبالغ به‌صورت `numeric` با دقت صفر (تومان) ذخیره می‌شوند و در لایه‌ی API به
`number` تبدیل می‌شوند.

</div>

## CI

<div dir="rtl">

`.github/workflows/ci.yml` روی هر push به `main` و هر pull request اجرا می‌شود و
این‌ها را چک می‌کند: نصب با `--frozen-lockfile`، تایپ‌چک، تست‌های واحد، بیلد کامل،
و اینکه خروجی codegen با `openapi.yaml` هم‌خوان است.

</div>

## نکات مهم

<div dir="rtl">

- **ترتیب ثبت مسیرها مهم است.** در `routes/index.ts`، `bestSellersRouter` پیش از
  `productsRouter` ثبت می‌شود، وگرنه `/products/:id` مسیر
  `/products/best-sellers` را می‌بلعد.
- **میدل‌ور گارد باید path-scoped باشد.** در روتری که بدون prefix مانت شده،
  `router.use(requireAuth)` برای همه‌ی روترهای بعدی هم اجرا می‌شود؛ از
  `router.use("/admin", …)` استفاده کنید.
- **پس از تغییر اسکیما اول `pnpm run typecheck:libs` را اجرا کنید**، وگرنه
  اپلیکیشن‌ها هنوز تایپ‌های قدیمی `@workspace/db` را می‌بینند.
- **فایل‌های آپلودی محتوای کاربر هستند.** با CSP محدود سرو می‌شوند و پسوند
  ذخیره‌شده از نوع محتوای پذیرفته‌شده ساخته می‌شود، نه از نام فایل.
- **هیچ سامانه پیامکی وصل نیست.** `api-server/src/lib/sms-provider.ts` نقطه‌ی
  اتصال است؛ تا وقتی provider برنگرداند، ارسال پیامک ۵۰۳ می‌دهد و تحویل جعلی
  ساخته نمی‌شود. پیگیری مرسوله در `routes/shipping.ts` هم فعلاً داده‌ی نمونه است.
- **پروژه seed script ندارد**، پس روی یک دیتابیس تازه همه‌ی صفحات خالی‌اند تا
  وقتی از پنل ادمین دسته‌بندی و محصول اضافه کنید.

</div>

## License

<div dir="rtl">

فیلد `license` در `package.json` روی MIT تنظیم شده، اما فایل `LICENSE` در مخزن
وجود ندارد. اگر قصد انتشار عمومی دارید، آن فایل را اضافه کنید.

</div>
