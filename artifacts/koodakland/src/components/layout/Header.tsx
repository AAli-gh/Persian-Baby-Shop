import { Link, useLocation } from "wouter";
import { ShoppingBag, Heart, User, Menu, Search } from "lucide-react";
import { useCartSession } from "@/lib/cart";
import { useGetCart, useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { DesktopSearch, MobileSearchModal } from "./LiveSearch";

export function Header() {
  const [location] = useLocation();
  const { sessionId } = useCartSession();
  const { data: cart } = useGetCart({ sessionId }, { query: { queryKey: ["cart", sessionId] } });
  const { data: categoriesResponse } = useListCategories();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = categoriesResponse || [];

  const navLink = (href: string, label: string) => {
    const active = href === "/" ? location === "/" : location.startsWith(href);
    return (
      <Link
        href={href}
        className={`relative text-sm font-medium transition-colors duration-200 after:absolute after:bottom-[-4px] after:right-0 after:left-0 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:duration-200 ${
          active
            ? "text-primary after:scale-x-100"
            : "text-foreground/70 hover:text-foreground after:scale-x-0 hover:after:scale-x-100"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-pink-100/60"
      style={{
        background: "rgba(255,252,254,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center gap-3">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
            <span className="text-primary-foreground text-xs font-black">ک</span>
          </div>
          <span className="font-extrabold text-xl text-primary tracking-tight hidden sm:block">
            کودک‌لند
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden md:flex items-center gap-6 mr-2">
          {navLink("/", "خانه")}
          {navLink("/shop", "فروشگاه")}
          {navLink("/blog", "وبلاگ")}
          {navLink("/about", "درباره ما")}
          {navLink("/contact", "تماس با ما")}
        </nav>

        {/* ── Desktop search — centered, takes available space ── */}
        <div className="hidden lg:flex flex-1 justify-center px-4">
          <div className="w-full max-w-xl">
            <DesktopSearch />
          </div>
        </div>

        {/* ── Spacer on tablet so icons stay right ── */}
        <div className="flex-1 lg:hidden" />

        {/* ── Right-side icon cluster ── */}
        <div className="flex items-center gap-1">

          {/* Search icon visible on tablet / hidden on desktop */}
          <div className="lg:hidden">
            <MobileSearchModal />
          </div>

          {/* Wishlist */}
          <Link href="/wishlist" className="hidden sm:inline-flex">
            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 hover:bg-pink-50 hover:text-pink-500">
              <Heart className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            </Button>
          </Link>

          {/* Profile */}
          <Link href={user ? "/profile" : "/login"}>
            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 hover:bg-pink-50 hover:text-pink-500">
              <User style={{ width: 18, height: 18 }} />
            </Button>
          </Link>

          {/* Cart */}
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 hover:bg-pink-50 hover:text-pink-500 relative">
              <ShoppingBag style={{ width: 18, height: 18 }} />
              {cart && cart.itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-sm">
                  {cart.itemCount > 9 ? "۹+" : cart.itemCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 hover:bg-pink-50">
                  <Menu style={{ width: 18, height: 18 }} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[340px] p-0 border-r-0 shadow-2xl" dir="rtl">
                <div className="flex flex-col h-full" style={{ background: "rgba(255,248,252,0.98)" }}>
                  {/* Mobile menu header */}
                  <div className="flex items-center gap-3 p-5 border-b border-pink-100">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                      <span className="text-primary-foreground text-sm font-black">ک</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-primary">کودک‌لند</h2>
                      <p className="text-xs text-muted-foreground">فروشگاه کودک</p>
                    </div>
                  </div>

                  {/* Mobile search inside sheet */}
                  <div className="px-4 py-3 border-b border-pink-50">
                    <div
                      className="flex items-center gap-2 px-4 h-10 rounded-xl ring-1 ring-pink-100"
                      style={{ background: "rgba(255,255,255,0.8)" }}
                    >
                      <Search className="w-4 h-4 text-pink-300 flex-shrink-0" />
                      <Link
                        href="/shop"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex-1 text-sm text-pink-300"
                      >
                        جستجو در کودک‌لند...
                      </Link>
                    </div>
                  </div>

                  {/* Nav links */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">منو اصلی</p>
                    <nav className="flex flex-col gap-1 mb-6">
                      {[
                        { href: "/", label: "خانه" },
                        { href: "/shop", label: "فروشگاه" },
                        { href: "/blog", label: "وبلاگ" },
                        { href: "/about", label: "درباره ما" },
                        { href: "/contact", label: "تماس با ما" },
                        { href: "/wishlist", label: "علاقه‌مندی‌ها" },
                        { href: user ? "/profile" : "/login", label: user ? "پروفایل" : "ورود / ثبت‌نام" },
                      ].map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                            location === href
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-pink-50"
                          }`}
                        >
                          {label}
                        </Link>
                      ))}
                    </nav>

                    {categories.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">دسته‌بندی‌ها</p>
                        <nav className="flex flex-col gap-1">
                          {categories.map((cat) => (
                            <Link
                              key={cat.id}
                              href={`/shop?category=${cat.slug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="px-4 py-2.5 rounded-xl text-sm text-foreground/80 hover:bg-pink-50 hover:text-foreground transition-colors flex items-center gap-2"
                            >
                              <span className="text-base">{cat.icon}</span>
                              {cat.nameFa}
                            </Link>
                          ))}
                        </nav>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
