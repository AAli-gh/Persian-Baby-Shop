import { Link, useLocation } from "wouter";
import { Home, ShoppingBag, Heart, User, Search } from "lucide-react";
import { useCartSession } from "@/lib/cart";
import { useGetCart } from "@workspace/api-client-react";

export function MobileNav() {
  const [location] = useLocation();
  const { sessionId } = useCartSession();
  const { data: cart } = useGetCart({ sessionId }, { query: { queryKey: ['cart', sessionId] } });

  // Do not show on admin routes
  if (location.startsWith("/admin")) return null;

  const navItems = [
    { href: "/", icon: Home, label: "خانه" },
    { href: "/shop", icon: ShoppingBag, label: "فروشگاه" },
    { href: "/cart", icon: ShoppingBag, label: "سبد خرید", isCart: true },
    { href: "/wishlist", icon: Heart, label: "علاقه‌مندی" },
    { href: "/profile", icon: User, label: "حساب" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border pb-safe">
      <nav className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href} className="w-full h-full flex flex-col items-center justify-center gap-1">
              <div className="relative">
                <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-primary fill-primary/10' : 'text-muted-foreground'}`} />
                {item.isCart && cart && cart.itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground border border-background">
                    {cart.itemCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
