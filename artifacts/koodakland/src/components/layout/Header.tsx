import { Link, useLocation } from "wouter";
import { Search, ShoppingBag, Heart, User, Menu } from "lucide-react";
import { useCartSession } from "@/lib/cart";
import { useGetCart, useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

export function Header() {
  const [location] = useLocation();
  const { sessionId } = useCartSession();
  const { data: cart } = useGetCart({ sessionId }, { query: { queryKey: ['cart', sessionId] } });
  const { data: categoriesResponse } = useListCategories();
  const { user } = useAuth();
  
  const categories = categoriesResponse || [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-md dark:bg-background/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] sm:w-[380px] p-0" dir="rtl">
              <div className="flex flex-col h-full bg-background">
                <div className="p-4 border-b">
                  <h2 className="font-bold text-lg text-primary">کودک‌لند</h2>
                </div>
                <div className="overflow-y-auto p-4 flex-1">
                  <nav className="flex flex-col gap-2">
                    <Link href="/" className="px-4 py-3 rounded-lg hover:bg-muted font-medium text-foreground">خانه</Link>
                    <Link href="/shop" className="px-4 py-3 rounded-lg hover:bg-muted font-medium text-foreground">فروشگاه</Link>
                    {categories.map(cat => (
                      <Link key={cat.id} href={`/shop?category=${cat.slug}`} className="px-4 py-3 rounded-lg hover:bg-muted font-medium text-muted-foreground flex items-center gap-2">
                        {cat.nameFa}
                      </Link>
                    ))}
                    <Link href="/blog" className="px-4 py-3 rounded-lg hover:bg-muted font-medium text-foreground">وبلاگ</Link>
                  </nav>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <span className="font-extrabold text-2xl text-primary tracking-tight">کودک‌لند</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 mr-8">
            <Link href="/" className={`text-sm font-medium hover:text-primary transition-colors ${location === '/' ? 'text-primary' : 'text-foreground'}`}>خانه</Link>
            <Link href="/shop" className={`text-sm font-medium hover:text-primary transition-colors ${location.startsWith('/shop') ? 'text-primary' : 'text-foreground'}`}>فروشگاه</Link>
            <Link href="/blog" className={`text-sm font-medium hover:text-primary transition-colors ${location.startsWith('/blog') ? 'text-primary' : 'text-foreground'}`}>وبلاگ</Link>
          </nav>
        </div>

        <div className="flex-1 max-w-md hidden lg:block">
          {/* Search would go here */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="جستجو در کودک‌لند..." 
              className="w-full h-10 bg-muted/50 border-none rounded-full pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link href={user ? "/profile" : "/login"}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </Button>
          </Link>
          <Link href="/wishlist" className="hidden sm:inline-flex">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Heart className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <ShoppingBag className="w-5 h-5 text-muted-foreground hover:text-primary" />
              {cart && cart.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background">
                  {cart.itemCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
