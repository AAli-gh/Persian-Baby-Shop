import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useGetRelatedProducts, useListReviews, useAddToCart, useCreateReview, Product } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCartSession } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Star, Minus, Plus, Package, Shield, Truck } from "lucide-react";

async function fetchProductBySlug(slug: string): Promise<Product> {
  const res = await fetch(`/api/products?limit=100&page=1`);
  const data = await res.json();
  const product = data.products?.find((p: Product) => p.slug === slug);
  if (!product) throw new Error("Product not found");
  return product;
}

export default function ProductPage() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug || "";

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const { sessionId } = useCartSession();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product-by-slug", slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
  });

  const { data: related } = useGetRelatedProducts(product?.id ?? 0, {
    query: { enabled: !!product?.id, queryKey: ["related", product?.id] }
  });
  const { data: reviews, refetch: refetchReviews } = useListReviews({ productId: product?.id ?? 0 }, {
    query: { enabled: !!product?.id, queryKey: ["reviews", product?.id] }
  });

  const addToCart = useAddToCart();
  const createReview = useCreateReview();

  const handleAddToCart = () => {
    if (!product) return;
    addToCart.mutate({ data: { productId: product.id, quantity, sessionId } }, {
      onSuccess: () => toast({ title: "به سبد اضافه شد", description: `${product.nameFa} به سبد خرید اضافه شد.` }),
      onError: () => toast({ title: "خطا", variant: "destructive" }),
    });
  };

  const handleReview = () => {
    if (!product || !reviewName) return;
    createReview.mutate({ data: { productId: product.id, authorName: reviewName, rating: reviewRating, comment: reviewComment } }, {
      onSuccess: () => {
        toast({ title: "نظر ثبت شد", description: "نظر شما با موفقیت ثبت شد." });
        setReviewName(""); setReviewComment(""); setReviewRating(5);
        refetchReviews();
      },
    });
  };

  if (isLoading) return (
    <div className="container mx-auto px-4 py-8 max-w-6xl" dir="rtl">
      <div className="grid md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square rounded-3xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="container mx-auto px-4 py-24 text-center" dir="rtl">
      <p className="text-lg font-bold">محصول یافت نشد</p>
    </div>
  );

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.salePrice! / product.price) * 100) : 0;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-muted/30">
              {product.images && product.images.length > 0 ? (
                <img src={product.images[activeImage]} alt={product.nameFa} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-16 h-16 text-muted-foreground/30" /></div>
              )}
              {hasDiscount && (
                <Badge variant="destructive" className="absolute top-4 right-4 text-sm font-bold rounded-full px-3">
                  {discountPercent}٪ تخفیف
                </Badge>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${i === activeImage ? "border-primary" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            {product.categoryName && <span className="text-sm text-muted-foreground font-medium">{product.categoryName}</span>}
            <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight">{product.nameFa}</h1>

            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(product.avgRating || 0) ? "fill-current" : "text-slate-200"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({(product.reviewCount || 0).toLocaleString("fa-IR")} نظر)</span>
            </div>

            <div className="flex flex-col">
              {hasDiscount ? (
                <>
                  <span className="text-muted-foreground line-through text-sm">{product.price.toLocaleString("fa-IR")} تومان</span>
                  <span className="text-3xl font-black text-primary">{product.salePrice!.toLocaleString("fa-IR")} تومان</span>
                </>
              ) : (
                <span className="text-3xl font-black text-foreground">{product.price.toLocaleString("fa-IR")} تومان</span>
              )}
            </div>

            {product.brand && <div className="text-sm text-muted-foreground">برند: <span className="font-semibold text-foreground">{product.brand}</span></div>}
            {product.ageGroup && <div className="text-sm text-muted-foreground">گروه سنی: <span className="font-semibold text-foreground">{product.ageGroup}</span></div>}

            <div className={`inline-flex items-center gap-2 text-sm font-semibold ${(product.stock ?? 0) > 0 ? "text-green-600" : "text-destructive"}`}>
              <Package className="w-4 h-4" />
              {(product.stock ?? 0) > 0 ? `${(product.stock ?? 0).toLocaleString("fa-IR")} عدد در انبار` : "ناموجود"}
            </div>

            <Separator />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-muted rounded-full px-2 py-1">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-background transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold">{quantity.toLocaleString("fa-IR")}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock ?? 99, q + 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-background transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button size="lg" className="flex-1 rounded-full font-bold shadow-md shadow-primary/20 gap-2" onClick={handleAddToCart} disabled={(product.stock ?? 0) === 0 || addToCart.isPending}>
                <ShoppingBag className="w-5 h-5" />
                {addToCart.isPending ? "در حال افزودن..." : "افزودن به سبد خرید"}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-2">
              {[{ icon: Truck, text: "ارسال سریع" }, { icon: Shield, text: "ضمانت اصالت" }, { icon: Package, text: "بسته‌بندی ایمن" }].map((item) => (
                <div key={item.text} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/50 text-center">
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">{item.text}</span>
                </div>
              ))}
            </div>

            {product.descriptionFa && (
              <div className="mt-2">
                <h3 className="font-bold mb-2">توضیحات محصول</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{product.descriptionFa}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <section className="mb-16">
          <h2 className="text-xl font-black mb-6">نظرات کاربران ({((reviews as any[])?.length || 0).toLocaleString("fa-IR")})</h2>
          {reviews && (reviews as any[]).length > 0 ? (
            <div className="flex flex-col gap-4 mb-8">
              {(reviews as any[]).map((review: any) => (
                <div key={review.id} className="bg-card rounded-2xl p-5 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">{review.authorName[0]}</div>
                      <div>
                        <p className="font-bold text-sm">{review.authorName}</p>
                        {review.isVerified && <Badge variant="secondary" className="text-xs rounded-full">خرید تایید شده</Badge>}
                      </div>
                    </div>
                    <div className="flex text-amber-400">{[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-slate-200"}`} />)}</div>
                  </div>
                  {review.comment && <p className="text-muted-foreground text-sm mt-2">{review.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-2xl mb-8">هنوز نظری ثبت نشده</div>
          )}

          <div className="bg-card rounded-2xl p-6 border border-border/50">
            <h3 className="font-bold mb-4">ثبت نظر</h3>
            <div className="flex flex-col gap-4">
              <input value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="نام شما" className="h-10 rounded-xl bg-muted border-none px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full" />
              <div className="flex gap-2">
                {[1,2,3,4,5].map((r) => (
                  <button key={r} onClick={() => setReviewRating(r)}>
                    <Star className={`w-6 h-6 ${r <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                  </button>
                ))}
              </div>
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="نظر شما..." rows={3} className="rounded-xl bg-muted border-none px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none w-full" />
              <Button onClick={handleReview} className="rounded-full w-fit font-bold" disabled={createReview.isPending}>
                {createReview.isPending ? "در حال ثبت..." : "ثبت نظر"}
              </Button>
            </div>
          </div>
        </section>

        {related && (related as any[]).length > 0 && (
          <section>
            <h2 className="text-xl font-black mb-6">محصولات مرتبط</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(related as any[]).map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
