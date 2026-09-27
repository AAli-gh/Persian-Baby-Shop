# کودک‌لند (Koodakland)

فروشگاه اینترنتی فارسی/RTL پوشاک و لوازم نوزاد و کودک: کاتالوگ محصولات، سبد
خرید و تسویه‌حساب، لیست علاقه‌مندی، وبلاگ و یک پنل مدیریت کامل (محصولات،
سفارش‌ها، موجودی، تخفیف‌ها، خبرنامه، گزارش‌ها و پیامک).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/koodakland run dev` — run the storefront
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run generate` — write a migration after a schema change
- `pnpm --filter @workspace/db run migrate` — apply pending migrations
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only, no history)
- `pnpm --filter @workspace/db run test:inventory` — concurrency test for stock reservation

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `PORT` | yes | Port the API listens on |
| `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | yes | Clerk authentication |
| `CORS_ALLOWED_ORIGINS` | no | Comma-separated extra origins allowed to call the API with credentials. Empty means same-origin only. |
| `TRUST_PROXY_HOPS` | no | Number of proxies in front of the API (default `1`); wrong values break per-IP rate limiting |
| `SMS_API_KEY`, `SMS_SENDER` | no | SMS gateway credentials; without them `POST /api/sms/send` answers 503 |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: React 19 + Vite + wouter + TanStack Query + Tailwind 4 (shadcn/ui components)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (`@clerk/express` on the API, `@clerk/react` on the web)
- Validation: Zod (`zod/v4` in the DB package), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

| Concern | Source of truth |
| --- | --- |
| DB schema | `lib/db/src/schema/*.ts` (`index.ts` re-exports everything) |
| Migrations | `lib/db/migrations/` (see its README for baselining) |
| API contract | `lib/api-spec/openapi.yaml` — everything under `lib/api-zod/src/generated` and `lib/api-client-react/src/generated` is generated from it, never edited by hand |
| API routes | `artifacts/api-server/src/routes/*.ts`, registered in `routes/index.ts` |
| Auth & roles | `artifacts/api-server/src/middleware/auth.ts` (`requireAuth`, `requireAdmin`, `adminOnly`) |
| Shared route helpers | `artifacts/api-server/src/lib/` (`enrich`, `discount`, `validation`, `csv`, `http`) |
| Storefront pages | `artifacts/koodakland/src/pages/`, routed in `src/App.tsx` |
| Theme | `artifacts/koodakland/src/index.css` |

## Architecture decisions

- **The OpenAPI spec drives both clients.** Changing an endpoint means editing
  `openapi.yaml` and re-running codegen; the server then validates request
  bodies with the generated Zod schemas.
- **Generated Zod is not the last word on validation.** OpenAPI `integer`
  becomes a plain `number`, so quantities, ids and money are re-checked as whole
  numbers in `api-server/src/lib/validation.ts`.
- **Carts are addressed by an opaque `sessionId`, then claimed by an account.**
  Once a signed-in customer touches a cart, only that account may use it, so a
  leaked session id cannot be replayed. Guests keep the id in `localStorage`.
- **Money is computed server-side at checkout.** Order lines are priced from the
  product rows inside the checkout transaction, never from the cart snapshot,
  and discounts go through the single `evaluateDiscount` helper that
  `/discounts/validate` also uses.
- **Stock is reserved with a conditional update.** `UPDATE … WHERE stock >= n`
  inside the order transaction is what makes concurrent checkouts safe.
- **The API is same-origin by default.** CORS reflects only origins named in
  `CORS_ALLOWED_ORIGINS`; rate limiting is in-process (per instance).

## Product

- Storefront: home, shop with filters, product page with reviews, cart,
  checkout, order tracking, wishlists, blog, newsletter, trust/policy pages.
- Accounts: Clerk sign-in, profile, addresses, order history.
- Admin (`admin`/`manager` roles): products, categories, orders, inventory and
  bulk restock, discounts, banners, blog, newsletter, back-in-stock alerts,
  reports, analytics and the SMS panel.

## Gotchas

- **Route order matters.** `routes/index.ts` mounts `bestSellersRouter` before
  `productsRouter`, because `/products/:id` would otherwise shadow
  `/products/best-sellers`.
- **Guard middleware must be path-scoped.** Inside a router mounted without a
  prefix, `router.use(requireAuth)` also runs for every router registered after
  it; use `router.use("/admin", …)`.
- **Run `pnpm run typecheck:libs` after a schema change** before typechecking an
  artifact, otherwise the app still sees the old `@workspace/db` types.
- **Uploads are user content.** They are served with a locked-down CSP and the
  stored extension comes from the accepted MIME type, not the filename.
- **No SMS provider is wired up.** `lib/sms-provider.ts` is the integration
  point; until it returns a provider, sending answers 503 rather than faking a
  delivery. The shipment tracking in `routes/shipping.ts` is still mock data.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
