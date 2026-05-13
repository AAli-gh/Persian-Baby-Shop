import { Link } from "wouter";
import { useGetWishlist } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export default function Wishlist() {
  const { user } = useAuth();
  const { data: wishlist, isLoading } = useGetWishlist({ userId: user?.id }, { query: { enabled: !!user, queryKey: ["wishlist", user?.id] } });

  if (!user) return (
    <div className="container mx-auto px-4 py-24 text-center max-w-md" dir="rtl">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Heart className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-xl font-black mb-2">ورود به حساب</h2>
      <p className="text-muted-foreground mb-6">برای مشاهده علاقه‌مندی‌ها وارد شوید</p>
      <Link href="/login"><Button className="rounded-full font-bold px-8">ورود</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-black mb-6">علاقه‌مندی‌ها</h1>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
          </div>
        ) : (wishlist || []).length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <p className="text-lg font-bold mb-2">علاقه‌مندی‌های شما خالی است</p>
            <p className="text-muted-foreground mb-6">محصولات مورد علاقه خود را اینجا ذخیره کنید</p>
            <Link href="/shop"><Button className="rounded-full font-bold">رفتن به فروشگاه</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(wishlist || []).map((item) => item.product && <ProductCard key={item.id} product={item.product} />)}
          </div>
        )}
      </div>
    </div>
  );
}
