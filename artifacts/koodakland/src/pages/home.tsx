import { useListProducts, useGetFeaturedProducts, useGetFlashSaleProducts, useGetNewArrivals } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, ChevronLeft, Star, Sparkles, Baby } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSEO } from "@/hooks/useSEO";

function Badge({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`} {...props}>{children}</div>;
}

function SectionHeader({ title, href, emoji }: { title: string; href: string; emoji?: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
        {emoji && <span>{emoji}</span>}{title}
      </h2>
      <Link href={href}>
        <Button variant="ghost" size="sm" className="text-primary font-medium group">
          مشاهده همه <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
        </Button>
      </Link>
    </div>
  );
}

function ProductSkeletons({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-square rounded-2xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </>
  );
}

const AGE_GROUPS = [
  { label: "۰ تا ۶ ماه", value: "0-6m", emoji: "🍼", color: "from-pink-100 to-rose-100", border: "border-pink-200", textColor: "text-rose-600" },
  { label: "۶ تا ۱۲ ماه", value: "6-12m", emoji: "🐣", color: "from-purple-100 to-violet-100", border: "border-purple-200", textColor: "text-violet-600" },
  { label: "۱ تا ۳ سال", value: "1-3y", emoji: "🧸", color: "from-blue-100 to-sky-100", border: "border-blue-200", textColor: "text-blue-600" },
  { label: "۳ تا ۵ سال", value: "3-5y", emoji: "🎠", color: "from-green-100 to-emerald-100", border: "border-green-200", textColor: "text-green-600" },
];

const GENDER_GROUPS = [
  { label: "دختر", value: "girl", emoji: "🎀", color: "from-pink-50 to-rose-100", border: "border-pink-200", accent: "bg-pink-400" },
  { label: "پسر", value: "boy", emoji: "🚂", color: "from-blue-50 to-sky-100", border: "border-blue-200", accent: "bg-blue-400" },
  { label: "هر دو", value: "unisex", emoji: "⭐", color: "from-yellow-50 to-amber-100", border: "border-yellow-200", accent: "bg-yellow-400" },
];

function fetchBestSellers() {
  return fetch("/api/products/best-sellers").then(r => r.json());
}

export default function Home() {
  useSEO({
    title: "کودک‌لند — بهترین فروشگاه محصولات کودک در ایران",
    description: "جدیدترین لباس‌ها، اسباب‌بازی‌ها و لوازم نوزاد با کیفیت تضمین‌شده. ارسال سریع و بازگشت آسان.",
    keywords: "فروشگاه کودک، لباس کودک، اسباب بازی، لوازم نوزاد، خرید آنلاین کودک",
    type: "website",
  });

  const { data: featuredProducts, isLoading: featuredLoading } = useGetFeaturedProducts();
  const { data: flashSaleProducts, isLoading: flashSaleLoading } = useGetFlashSaleProducts();
  const { data: newArrivals, isLoading: newLoading } = useGetNewArrivals();
  const { data: bestSellers, isLoading: bestSellersLoading } = useQuery({ queryKey: ["best-sellers"], queryFn: fetchBestSellers });
  const { data: recommendedData, isLoading: recommendedLoading } = useListProducts({ featured: true, limit: 4 });

  const flashItems = (flashSaleProducts as unknown[] | undefined) || [];
  const bestSellerItems = (bestSellers as unknown[] | undefined) || [];
  const recommendedItems = (recommendedData?.products || []).slice(0, 4);

  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-12">
      {/* ── Hero ── */}
      <section className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] bg-primary/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(251,182,206,0.3),transparent)]" />
        <div className="container mx-auto px-4 h-full flex flex-col justify-center max-w-2xl text-right relative z-10">
          <Badge className="w-fit mb-4 bg-primary/20 text-primary hover:bg-primary/30 border-none">کالکشن بهار ۱۴۰۴</Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-4 leading-tight">
            دنیای شیرین <br className="hidden sm:block" />
            <span className="text-primary">کودکی</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-md">
            جدیدترین لباس‌ها و اسباب‌بازی‌های باکیفیت برای دلبند شما. با خیال راحت خرید کنید.
          </p>
          <Link href="/shop">
            <Button size="lg" className="w-fit rounded-full font-bold shadow-md shadow-primary/20">
              مشاهده محصولات <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="container mx-auto px-4">
        <SectionHeader title="محصولات ویژه" href="/shop?featured=true" emoji="✨" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredLoading ? <ProductSkeletons count={4} /> : featuredProducts?.slice(0, 4).map((product: any) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {/* ── Best Selling Products ── */}
      <section className="container mx-auto px-4">
        <SectionHeader title="پرفروش‌ترین محصولات" href="/shop" emoji="🏆" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {bestSellersLoading ? <ProductSkeletons count={4} /> : bestSellerItems.slice(0, 4).map((product: any) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {/* ── Shop by Baby Age ── */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <Baby className="w-6 h-6 text-primary" />
            خرید بر اساس سن کودک
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {AGE_GROUPS.map(({ label, value, emoji, color, border, textColor }) => (
            <Link key={value} href={`/shop?ageGroup=${value}`}>
              <div className={`bg-gradient-to-br ${color} border ${border} rounded-3xl p-6 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group`}>
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">{emoji}</div>
                <p className={`font-black text-sm ${textColor}`}>{label}</p>
                <p className="text-xs text-muted-foreground mt-1">مشاهده محصولات</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Flash Sale ── */}
      {flashItems.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="bg-gradient-to-l from-orange-50 to-red-50 border border-orange-100 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white font-black text-xs">٪</div>
                <div>
                  <h2 className="text-xl font-black text-foreground">فروش ویژه</h2>
                  <p className="text-xs text-muted-foreground">تا اتمام موجودی</p>
                </div>
              </div>
              <Link href="/shop?flashSale=true">
                <Button variant="outline" size="sm" className="rounded-xl border-orange-200 hover:bg-orange-50 font-medium text-xs">
                  همه تخفیف‌ها <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {flashSaleLoading ? <ProductSkeletons count={4} /> : flashItems.slice(0, 4).map((product: any) => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Shop by Gender ── */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            خرید بر اساس جنسیت
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {GENDER_GROUPS.map(({ label, value, emoji, color, border, accent }) => (
            <Link key={value} href={`/shop?gender=${value}`}>
              <div className={`bg-gradient-to-br ${color} border ${border} rounded-3xl p-5 sm:p-8 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-20 h-20 ${accent} opacity-10 rounded-full -translate-y-8 translate-x-8`} />
                <div className="text-4xl sm:text-5xl mb-3 group-hover:scale-110 transition-transform duration-200 relative z-10">{emoji}</div>
                <p className="font-black text-foreground text-sm sm:text-base relative z-10">{label}</p>
                <p className="text-xs text-muted-foreground mt-1 relative z-10">مشاهده محصولات</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── New Arrivals ── */}
      <section className="container mx-auto px-4">
        <SectionHeader title="تازه‌های فروشگاه" href="/shop?sort=newest" emoji="🆕" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {newLoading ? <ProductSkeletons count={4} /> : ((newArrivals as unknown[] | undefined) || []).slice(0, 4).map((product: any) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {/* ── Recommended Products ── */}
      <section className="container mx-auto px-4">
        <SectionHeader title="پیشنهاد ما برای شما" href="/shop?featured=true" emoji="💝" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {recommendedLoading ? <ProductSkeletons count={4} /> : recommendedItems.map((product: any) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {/* ── Baby Checklist CTA ── */}
      <section className="container mx-auto px-4">
        <div className="bg-gradient-to-l from-primary/10 to-rose-50 border border-pink-100 rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 text-right">
          <div className="text-6xl flex-shrink-0">🧸</div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-foreground mb-2">آماده ورود کوچولو هستید؟</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              با چک‌لیست جامع کودک‌لند، مطمئن شوید که هیچ ضروری‌ای از قلم نیفتاده. از نوزاد تا تغذیه و خواب.
            </p>
            <Link href="/baby-checklists">
              <Button className="mt-4 rounded-full font-bold shadow-md shadow-primary/20">
                مشاهده چک‌لیست‌ها <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
