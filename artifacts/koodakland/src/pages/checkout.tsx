import { useState } from "react";
import { useLocation } from "wouter";
import { useGetCart, useCreateOrder, useListShippingMethods, useValidateDiscount } from "@workspace/api-client-react";
import { useCartSession } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Truck, Shield, CheckCircle2 } from "lucide-react";

export default function Checkout() {
  const { sessionId } = useCartSession();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState({ name: user?.name || "", phone: "", province: "", city: "", street: "", postalCode: "" });
  const [selectedShipping, setSelectedShipping] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState(1);

  const { data: cart, isLoading: cartLoading } = useGetCart({ sessionId }, { query: { queryKey: ["cart", sessionId] } });
  const { data: shippingMethods } = useListShippingMethods();
  const createOrder = useCreateOrder();
  const validateDiscount = useValidateDiscount();

  const activeShipping = shippingMethods?.find(m => m.id.toString() === selectedShipping);
  const shippingCost = activeShipping ? Number(activeShipping.price) : 30000;
  const subtotal = cart?.subtotal || 0;
  const total = subtotal - discountAmount + shippingCost;

  const handleApplyDiscount = () => {
    validateDiscount.mutate({ data: { code: discountCode, cartTotal: subtotal } }, {
      onSuccess: (data) => {
        if (data.valid) { setDiscountAmount(data.discountAmount); toast({ title: "کد تخفیف اعمال شد" }); }
        else toast({ title: "کد نامعتبر", variant: "destructive", description: data.message || "" });
      },
    });
  };

  const handlePlaceOrder = () => {
    if (!form.name || !form.phone || !form.province || !form.city || !form.street || !form.postalCode) {
      toast({ title: "اطلاعات ناقص", description: "لطفا همه فیلدها را پر کنید", variant: "destructive" });
      return;
    }
    const addressSnapshot = JSON.stringify({ province: form.province, city: form.city, street: form.street, postalCode: form.postalCode });
    createOrder.mutate({
      data: { sessionId, userId: user?.id ?? null, addressSnapshot, shippingMethod: activeShipping?.name || "standard", discountCode: discountCode || null, notes: notes || null, customerName: form.name, customerPhone: form.phone },
    }, {
      onSuccess: (order) => { navigate(`/order-success?order=${order.orderNumber}`); },
      onError: () => toast({ title: "خطا", description: "مشکلی در ثبت سفارش پیش آمد", variant: "destructive" }),
    });
  };

  if (cartLoading) return <div className="container mx-auto px-4 py-8 max-w-4xl" dir="rtl"><Skeleton className="h-96 rounded-3xl" /></div>;

  if (!cart || cart.items.length === 0) return (
    <div className="container mx-auto px-4 py-24 text-center" dir="rtl">
      <p className="font-bold text-lg mb-4">سبد خرید خالی است</p>
      <Button onClick={() => navigate("/shop")} className="rounded-full">رفتن به فروشگاه</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-black mb-8">تکمیل خرید</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-6">
            {/* Address */}
            <div className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="font-bold text-lg mb-5 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> اطلاعات تحویل</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "name", label: "نام و نام خانوادگی", placeholder: "نام کامل" },
                  { key: "phone", label: "شماره موبایل", placeholder: "۰۹۱۲۳۴۵۶۷۸۹" },
                  { key: "province", label: "استان", placeholder: "تهران" },
                  { key: "city", label: "شهر", placeholder: "تهران" },
                  { key: "postalCode", label: "کد پستی", placeholder: "۱۲۳۴۵۶۷۸۹۰" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className={key === "postalCode" ? "" : ""}>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{label}</label>
                    <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                      className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">آدرس کامل</label>
                  <textarea value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} placeholder="خیابان، کوچه، پلاک..." rows={2}
                    className="w-full rounded-xl bg-muted border-none px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="font-bold text-lg mb-5 flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> روش ارسال</h2>
              <div className="flex flex-col gap-3">
                {shippingMethods?.map((method) => (
                  <label key={method.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedShipping === method.id.toString() ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}>
                    <input type="radio" name="shipping" value={method.id.toString()} checked={selectedShipping === method.id.toString()} onChange={e => setSelectedShipping(e.target.value)} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedShipping === method.id.toString() ? "border-primary" : "border-muted-foreground"}`}>
                      {selectedShipping === method.id.toString() && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{method.nameFa}</p>
                      <p className="text-xs text-muted-foreground">{method.estimatedDays} تا {method.estimatedDays + 2} روز کاری</p>
                    </div>
                    <span className="font-bold text-sm">{Number(method.price) === 0 ? "رایگان" : `${Number(method.price).toLocaleString("fa-IR")} تومان`}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-card rounded-2xl p-6 border border-border/50">
              <h2 className="font-bold text-base mb-3">توضیحات سفارش (اختیاری)</h2>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="توضیحات یا درخواست خاص..." rows={2} className="w-full rounded-xl bg-muted border-none px-4 py-3 text-sm focus:outline-none resize-none" />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-80 flex flex-col gap-4">
            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <h3 className="font-bold mb-4">کالاهای سفارش</h3>
              <div className="flex flex-col gap-3">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      {item.product.images[0] && <img src={item.product.images[0]} alt={item.product.nameFa} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.product.nameFa}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity.toLocaleString("fa-IR")} عدد × {item.price.toLocaleString("fa-IR")}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex gap-2 mb-3">
                <input value={discountCode} onChange={e => setDiscountCode(e.target.value)} placeholder="کد تخفیف" className="flex-1 h-9 rounded-xl bg-muted border-none px-3 text-sm focus:outline-none" />
                <Button size="sm" variant="outline" className="rounded-xl shrink-0" onClick={handleApplyDiscount}>اعمال</Button>
              </div>
              <Separator className="my-3" />
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">جمع کالاها</span><span>{subtotal.toLocaleString("fa-IR")} تومان</span></div>
                {discountAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">تخفیف</span><span className="text-green-600">-{discountAmount.toLocaleString("fa-IR")} تومان</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">هزینه ارسال</span><span>{shippingCost === 0 ? "رایگان" : `${shippingCost.toLocaleString("fa-IR")} تومان`}</span></div>
                <Separator />
                <div className="flex justify-between font-black text-base"><span>مبلغ نهایی</span><span className="text-primary">{total.toLocaleString("fa-IR")} تومان</span></div>
              </div>
              <Button className="rounded-full font-bold mt-4 w-full gap-2" onClick={handlePlaceOrder} disabled={createOrder.isPending || !selectedShipping}>
                <CheckCircle2 className="w-4 h-4" />
                {createOrder.isPending ? "در حال ثبت..." : "ثبت سفارش"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
