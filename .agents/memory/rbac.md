---
name: RBAC implementation
description: How auth and admin protection is implemented across Koodakland
---

## Auth source
Clerk is the browser/API authentication source. The API reads the signed Clerk session with `getAuth`; it does not accept the former localStorage JWT.

## Backend middleware
artifacts/api-server/src/middleware/auth.ts exports requireAuth, requireAdmin, adminOnly.
- `requireAuth` resolves the Clerk user to the local `users` row through `users.clerk_id`, creating a customer row when needed.
- Existing local accounts with a matching email are linked to Clerk so their local admin/manager role is retained.
- Admin-only routers (admin.ts, inventory.ts, sms.ts): router.use(requireAuth, requireAdmin) after const router.
- Mixed routers (banners, categories, products, blog, discounts): per-route middleware on write ops only.
- newsletter.ts: POST /subscribe is public; GET/DELETE /subscribers and GET /export are protected.
- upload.ts: POST /upload is protected.

## Frontend guard
artifacts/koodakland/src/components/auth/AdminGuard.tsx — redirects:
- no loaded account → /login
- role not admin/manager → /unauthorized

AdminRouter in App.tsx is wrapped with <AdminGuard>.

## Frontend auth
`ClerkProvider` owns the session and `/sign-in`/`/sign-up` render Clerk's branded pages. `AuthProvider` only bridges Clerk's signed-in state to the local user record at `/api/auth/me`.

**Why:** Cookie-based Clerk sessions provide managed expiry and sign-out-all-sessions without exposing bearer tokens to browser storage.

## Admin UI visibility
Header shows LayoutDashboard icon and "پنل مدیریت" link only when user.role === "admin" || "manager".

## 403 page
artifacts/koodakland/src/pages/unauthorized.tsx — pastel RTL design, "خطا ۴۰۳", two CTA buttons.
