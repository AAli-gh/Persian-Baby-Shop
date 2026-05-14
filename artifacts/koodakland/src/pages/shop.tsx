import { useState, useEffect } from "react";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { useSEO } from "@/hooks/useSEO";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useLocation } from "wouter";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function Shop() {
  useSEO({
    title: "فروشگاه محصولات کودک",
    description: "خرید آنلاین لباس، اسباب‌بازی و لوازم نوزاد با بهترین قیمت. فیلتر پیشرفته بر اساس سن، دسته‌بندی و قیمت.",
    keywords: "خرید لباس کودک، اسباب بازی ارزان، لوازم نوزاد، فروشگاه آنلاین کودک",
  });
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  
  const [selectedCategory, setSelectedCategory] = useState(params.get("category") || "");
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [inStock, setInStock] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: categoriesData } = useListCategories();
  const categories = categoriesData || [];

  const { data, isLoading } = useListProducts({
    category: selectedCategory || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 10000000 ? priceRange[1] : undefined,
    sort,
    page,
    limit: 12,
    inStock: inStock || undefined,
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const sortOptions = [
    { value: "newest", label: "جدیدترین" },
    { value: "price_asc", label: "ارزان‌ترین" },
    { value: "price_desc", label: "گران‌ترین" },
  ];

  const FilterContent = () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-bold text-base mb-3">دسته‌بندی</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { setSelectedCategory(""); setPage(1); }}
            className={`text-right px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-foreground"}`}
          >
            همه محصولات
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
              className={`text-right px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedCategory === cat.slug ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-foreground"}`}
            >
              <span>{cat.nameFa}</span>
              <span className="text-xs opacity-60">({cat.productCount})</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-base mb-3">محدوده قیمت</h3>
        <Slider
          min={0} max={10000000} step={50000}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{priceRange[0].toLocaleString("fa-IR")} تومان</span>
          <span>{priceRange[1].toLocaleString("fa-IR")} تومان</span>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-base mb-3">موجودی</h3>
        <button
          onClick={() => setInStock(!inStock)}
          className={`text-right px-3 py-2 rounded-lg text-sm w-full transition-colors ${inStock ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-foreground"}`}
        >
          فقط کالاهای موجود
        </button>
      </div>

      <Button variant="outline" size="sm" onClick={() => { setSelectedCategory(""); setPriceRange([0, 10000000]); setInStock(false); setPage(1); }} className="rounded-full">
        <X className="w-4 h-4 ml-1" /> پاک کردن فیلترها
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground">فروشگاه</h1>
            <p className="text-muted-foreground text-sm mt-1">{total.toLocaleString("fa-IR")} محصول یافت شد</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-full bg-muted border-none px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden rounded-full gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> فیلتر
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80" dir="rtl">
                <SheetHeader><SheetTitle>فیلترها</SheetTitle></SheetHeader>
                <div className="mt-6"><FilterContent /></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">
          <aside className="hidden md:block w-56 shrink-0 sticky top-24 h-fit">
            <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
              <h2 className="font-black text-lg mb-4">فیلترها</h2>
              <FilterContent />
            </div>
          </aside>

          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="aspect-square rounded-2xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <SlidersHorizontal className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-bold text-foreground">محصولی یافت نشد</p>
                <p className="text-muted-foreground text-sm text-center">فیلترها را تغییر دهید یا همه محصولات را مشاهده کنید</p>
                <Button variant="outline" onClick={() => { setSelectedCategory(""); setPriceRange([0, 10000000]); setInStock(false); }}>همه محصولات</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-full">قبلی</Button>
                    <span className="text-sm text-muted-foreground">{page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span>
                    <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-full">بعدی</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
