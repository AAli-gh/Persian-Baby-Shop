import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingBag, Tag, BookOpen, Image, Percent, Truck, ArrowRight, MessageSquare, Warehouse, BarChart2, Mail, TrendingUp, Bell } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "تحلیل فروش", icon: BarChart2 },
  { href: "/admin/reports", label: "گزارش‌های پیشرفته", icon: TrendingUp },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/inventory", label: "مدیریت انبار", icon: Warehouse },
  { href: "/admin/stock-notifications", label: "اطلاع‌رسانی موجودی", icon: Bell },
  { href: "/admin/orders", label: "سفارشات", icon: ShoppingBag },
  { href: "/admin/discounts", label: "کوپن و تخفیف", icon: Percent },
  { href: "/admin/sms", label: "پنل پیامک", icon: MessageSquare },
  { href: "/admin/newsletter", label: "خبرنامه", icon: Mail },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: Tag },
  { href: "/admin/blog", label: "وبلاگ", icon: BookOpen },
  { href: "/admin/banners", label: "بنرها", icon: Image },
  { href: "/admin/shipping", label: "ارسال", icon: Truck },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] w-full flex bg-muted/30" dir="rtl">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-card border-l border-border/50 sticky top-0 h-screen">
        <div className="p-5 border-b border-border/50">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-extrabold text-xl text-primary">کودک‌لند</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1 mr-6">پنل مدیریت</p>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? location === href : location.startsWith(href) && href !== "/admin" || location === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border/50 px-4 h-14 flex items-center justify-between">
        <span className="font-extrabold text-primary">پنل مدیریت</span>
        <Link href="/" className="text-sm text-muted-foreground hover:text-primary">بازگشت به سایت</Link>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/50 flex">
        {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? location === href : location.startsWith(href) && href !== "/admin" || location === href;
          return (
            <Link key={href} href={href} className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 pt-16 md:pt-8 pb-20 md:pb-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
