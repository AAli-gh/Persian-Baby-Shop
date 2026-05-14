import { useListProducts, useGetFeaturedProducts, useGetFlashSaleProducts, useGetNewArrivals } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSEO } from "@/hooks/useSEO";

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

  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-12">
      {/* Hero Section */}
      <section className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] bg-primary/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
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

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            محصولات ویژه
          </h2>
          <Link href="/shop?featured=true">
            <Button variant="ghost" size="sm" className="text-primary font-medium group">
              مشاهده همه <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : (
            featuredProducts?.slice(0, 4).map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

// Temporary Badge component to satisfy hero section (since I didn't import it from ui)
function Badge({ className, children, ...props }: any) {
  return <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`} {...props}>{children}</div>
}
