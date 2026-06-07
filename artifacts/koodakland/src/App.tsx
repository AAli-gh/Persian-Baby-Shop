import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { RootLayout } from "@/components/layout/RootLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { ThemeProvider } from "next-themes";
import { useLocation } from "wouter";
import { setAuthTokenGetter } from "@workspace/api-client-react";
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

setAuthTokenGetter(() => localStorage.getItem("auth_token"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});

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
        <Route component={NotFound} />
      </Switch>
    </RootLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <AppRouter />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
