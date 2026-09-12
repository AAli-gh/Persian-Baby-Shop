import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ServerError from "@/pages/server-error";
import { RootLayout } from "@/components/layout/RootLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { ThemeProvider } from "next-themes";
import { useLocation } from "wouter";
import { AdminGuard } from "@/components/auth/AdminGuard";
import Unauthorized from "@/pages/unauthorized";
import Home from "@/pages/home";
import Shop from "@/pages/shop";
import ProductPage from "@/pages/product";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Wishlist from "@/pages/wishlist";
import Track from "@/pages/track";
import Login from "@/pages/login";
import Profile from "@/pages/profile";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import OrderSuccess from "@/pages/order-success";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsAndConditions from "@/pages/terms-and-conditions";
import ShippingPolicy from "@/pages/shipping-policy";
import ReturnPolicy from "@/pages/return-policy";
import BabyChecklists from "@/pages/baby-checklists";

import AdminDashboard from "@/pages/admin/index";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminCategories from "@/pages/admin/categories";
import AdminBlog from "@/pages/admin/blog";
import AdminBanners from "@/pages/admin/banners";
import AdminDiscounts from "@/pages/admin/discounts";
import AdminShipping from "@/pages/admin/shipping";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminInventory from "@/pages/admin/inventory";
import AdminSMS from "@/pages/admin/sms";
import AdminNewsletter from "@/pages/admin/newsletter";
import AdminReports from "@/pages/admin/reports";
import AdminStockNotifications from "@/pages/admin/stock-notifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl =
  import.meta.env.VITE_CLERK_PROXY_URL ||
  (import.meta.env.PROD ? `${basePath}/api/__clerk` : undefined);

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#e85d8c",
    colorForeground: "#3b2631",
    colorMutedForeground: "#8a6f7b",
    colorBackground: "#fffafd",
    colorInput: "#fff4f8",
    colorInputForeground: "#3b2631",
    colorNeutral: "#f1dce6",
    colorDanger: "#dc2626",
    fontFamily: "Vazirmatn, sans-serif",
    borderRadius: "0.85rem",
  },
  elements: {
    cardBox: "bg-white rounded-3xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent",
    footer: "!shadow-none !border-0 !bg-transparent",
    formButtonPrimary: "bg-primary hover:bg-primary/90",
    formFieldInput: "rounded-xl border-pink-100 bg-pink-50/40",
    socialButtonsBlockButton: "rounded-xl border-pink-100",
  },
};

function AdminRouter() {
  return (
    <AdminGuard>
      <AdminLayout>
        <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/inventory" component={AdminInventory} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/blog" component={AdminBlog} />
        <Route path="/admin/banners" component={AdminBanners} />
        <Route path="/admin/discounts" component={AdminDiscounts} />
        <Route path="/admin/shipping" component={AdminShipping} />
        <Route path="/admin/sms" component={AdminSMS} />
        <Route path="/admin/newsletter" component={AdminNewsletter} />
        <Route path="/admin/reports" component={AdminReports} />
        <Route path="/admin/stock-notifications" component={AdminStockNotifications} />
        <Route component={NotFound} />
        </Switch>
      </AdminLayout>
    </AdminGuard>
  );
}

function AppRouter() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  if (isAdmin) {
    return <AdminRouter />;
  }

  return (
    <RootLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shop" component={Shop} />
        <Route path="/product/:slug" component={ProductPage} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/wishlist" component={Wishlist} />
        <Route path="/track" component={Track} />
        <Route path="/login" component={Login} />
        <Route path="/profile" component={Profile} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/order-success" component={OrderSuccess} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-and-conditions" component={TermsAndConditions} />
        <Route path="/shipping-policy" component={ShippingPolicy} />
        <Route path="/return-policy" component={ReturnPolicy} />
        <Route path="/baby-checklists" component={BabyChecklists} />
        <Route path="/unauthorized" component={Unauthorized} />
        <Route path="/server-error" component={ServerError} />
        <Route component={NotFound} />
      </Switch>
    </RootLayout>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4" dir="rtl">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4" dir="rtl">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkApp() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
      localization={{
        signIn: { start: { title: "ورود به کودک‌لند", subtitle: "برای ادامه وارد حساب خود شوید" } },
        signUp: { start: { title: "ساخت حساب کودک‌لند", subtitle: "حساب خود را در چند مرحله بسازید" } },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Switch>
                  <Route path="/sign-in/*?" component={SignInPage} />
                  <Route path="/sign-up/*?" component={SignUpPage} />
                  <Route component={AppRouter} />
                </Switch>
                <Toaster />
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkApp />
    </WouterRouter>
  );
}

export default App;
