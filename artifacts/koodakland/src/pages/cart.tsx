import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetCart, useUpdateCartItem, useRemoveCartItem, useValidateDiscount } from "@workspace/api-client-react";
import { useCartSession } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Minus, Plus, ShoppingBag, Tag } from "lucide-react";

export default function Cart() {
  const { sessionId } = useCartSession();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);

  const { data: cart, isLoading } = useGetCart({ sessionId }, { query: { queryKey: ["cart", sessionId] } });
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const validateDiscount = useValidateDiscount();

  const handleApplyDiscount = () => {
    if (!discountCode || !cart) return;
    validateDiscount.mutate({ data: { code: discountCode, cartTotal: cart.subtotal } }, {
      onSuccess: (data) => {
        if (data.valid) {
          setAppliedDiscount({ code: discountCode, amount: data.discountAmount });
          toast({ title: "کد تخفیف اعمال شد", description: `${data.discountAmount.toLocaleString("fa-IR")} تومان تخفیف دریافت کردید` });
        } else {
          toast({ title: "خطا", description: data.message || "کد نامعتبر است", variant: "destructive" });
        }
      },
    });
  };

  if (isLoading) return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
      {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl mb-4" />)}
    </div>
  );

  const subtotal = cart?.subtotal || 0;
  const discountAmount = appliedDiscount?.amount || 0;
  const shipping = subtotal > 1500000 ? 0 : 30000;
  const total = subtotal - discountAmount + shipping;

  if (!cart || cart.items.length === 0) return (
    <div className="container mx-auto px-4 py-24 text-center max-w-md" dir="rtl">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <ShoppingBag className="w-12 h-12 text-primary" />
      </div>
      <h2 className="text-xl font-black mb-2">سبد خرید خالی است</h2>
      <p className="text-muted-foreground mb-6">محصولات مورد نظر خود را به سبد اضافه کنید</p>
      <Link href="/shop"><Button className="rounded-full font-bold px-8">رفتن به فروشگاه</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-black mb-6">سبد خرید ({cart.itemCount.toLocaleString("fa-IR")} کالا)</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-4">
            {cart.items.map((item) => (
              <div key={item.id} className="bg-card rounded-2xl p-4 border border-border/50 flex gap-4">
                <Link href={`/product/${item.product.slug}`} className="shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted">
                    {item.product.images[0] && <img src={item.product.images[0]} alt={item.product.nameFa} className="w-full h-full object-cover" />}
                  </div>
                </Link>
                <div className="flex-1 flex flex-col gap-2">
                  <Link href={`/product/${item.product.slug}`}>
                    <h3 className="font-bold text-sm hover:text-primary transition-colors line-clamp-2">{item.product.nameFa}</h3>
                  </Link>
                  <span className="text-sm font-black text-primary">{item.price.toLocaleString("fa-IR")} تومان</span>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 bg-muted rounded-full px-2 py-1">
                      <button onClick={() => updateItem.mutate({ itemId: item.id, data: { quantity: Math.max(1, item.quantity - 1), sessionId } })} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-background">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity.toLocaleString("fa-IR")}</span>
                      <button onClick={() => updateItem.mutate({ itemId: item.id, data: { quantity: item.quantity + 1, sessionId } })} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-background">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem.mutate({ itemId: item.id, data: { sessionId } })} className="text-destructive hover:text-destructive/80 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:w-80 flex flex-col gap-4">
            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /> کد تخفیف</h3>
              <div className="flex gap-2">
                <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="کد تخفیف" className="flex-1 h-10 rounded-xl bg-muted border-none px-4 text-sm focus:outline-none" />
                <Button size="sm" variant="outline" className="rounded-xl shrink-0" onClick={handleApplyDiscount} disabled={validateDiscount.isPending}>اعمال</Button>
              </div>
              {appliedDiscount && <p className="text-green-600 text-xs mt-2 font-semibold">کد تخفیف {appliedDiscount.code} اعمال شد</p>}
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border/50 flex flex-col gap-3">
              <h3 className="font-bold">خلاصه سفارش</h3>
              <Separator />
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">جمع کالاها</span><span className="font-medium">{subtotal.toLocaleString("fa-IR")} تومان</span></div>
              {discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">تخفیف</span><span className="font-medium text-green-600">-{discountAmount.toLocaleString("fa-IR")} تومان</span></div>}
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">هزینه ارسال</span><span className="font-medium">{shipping === 0 ? "رایگان" : `${shipping.toLocaleString("fa-IR")} تومان`}</span></div>
              {subtotal < 1500000 && <p className="text-xs text-muted-foreground">خرید بالای ۱٫۵ میلیون تومان ارسال رایگان</p>}
              <Separator />
              <div className="flex justify-between font-black text-base"><span>مبلغ قابل پرداخت</span><span className="text-primary">{total.toLocaleString("fa-IR")} تومان</span></div>
              <Button className="rounded-full font-bold mt-2 w-full" onClick={() => navigate("/checkout")}>تکمیل خرید</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
