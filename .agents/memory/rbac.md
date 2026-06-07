---
name: RBAC implementation
description: How auth and admin protection is implemented across Koodakland
---

## Token format
Buffer.from(`${userId}:${timestamp}`).toString("base64") — decode to get userId, verify in DB.

## Backend middleware
artifacts/api-server/src/middleware/auth.ts exports requireAuth, requireAdmin, adminOnly.
- Admin-only routers (admin.ts, inventory.ts, sms.ts): router.use(requireAuth, requireAdmin) after const router.
- Mixed routers (banners, categories, products, blog, discounts): per-route middleware on write ops only.
- newsletter.ts: POST /subscribe is public; GET/DELETE /subscribers and GET /export are protected.
- upload.ts: POST /upload is protected.

## Frontend guard
artifacts/koodakland/src/components/auth/AdminGuard.tsx — redirects:
- no token → /login
- role not admin/manager → /unauthorized

AdminRouter in App.tsx is wrapped with <AdminGuard>.

## Auth token injection
setAuthTokenGetter(() => localStorage.getItem("auth_token")) called after all imports in App.tsx.
Auto-injects Bearer token into every API call via custom-fetch.ts in @workspace/api-client-react.

**Why:** The custom-fetch has a built-in setter; this is the correct wiring point for web apps with localStorage tokens. Do NOT use this for cookie-based auth.

## Admin UI visibility
Header shows LayoutDashboard icon and "پنل مدیریت" link only when user.role === "admin" || "manager".

## 403 page
artifacts/koodakland/src/pages/unauthorized.tsx — pastel RTL design, "خطا ۴۰۳", two CTA buttons.
