import { useState } from "react";
import { useListOrders, useUpdateOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Truck, Search } from "lucide-react";

export default function AdminShipping() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [trackingInputs, setTrackingInputs] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");

  const { data, isLoading } = useListOrders({ status: "processing", limit: 50 });
  const updateOrder = useUpdateOrder();

  const orders = (data?.orders || []).filter(o => !o.trackingCode && (o.customerName?.includes(search) || o.orderNumber?.includes(search) || !search));

  const handleAssign = (orderId: number) => {
    const code = trackingInputs[orderId];
    if (!code) { toast({ title: "کد پیگیری را وارد کنید", variant: "destructive" }); return; }
    updateOrder.mutate({ id: orderId, data: { trackingCode: code, status: "shipped" } }, {
      onSuccess: () => { toast({ title: "کد پیگیری ثبت شد", description: "وضعیت سفارش به 'ارسال شده' تغییر یافت" }); qc.invalidateQueries(); setTrackingInputs(t => ({ ...t, [orderId]: "" })); },
      onError: () => toast({ title: "خطا", variant: "destructive" }),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Truck className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-black">مدیریت ارسال</h1>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو سفارش..." className="h-10 w-full max-w-sm rounded-xl bg-card border border-border/50 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-3xl">
          <Truck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p>سفارشی برای ارسال وجود ندارد</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-card rounded-2xl p-5 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold">#{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{order.customerName} · {order.customerPhone}</p>
                </div>
                <div className="text-left">
                  <p className="font-black text-primary">{order.total.toLocaleString("fa-IR")} تومان</p>
                  <p className="text-xs text-muted-foreground">{order.shippingMethod}</p>
                </div>
              </div>
              {order.addressSnapshot && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-4">
                  {(() => { try { const a = JSON.parse(order.addressSnapshot); return `${a.province}، ${a.city}، ${a.street}`; } catch { return order.addressSnapshot; } })()}
                </p>
              )}
              <div className="flex gap-3">
                <input
                  value={trackingInputs[order.id] || ""}
                  onChange={e => setTrackingInputs(t => ({ ...t, [order.id]: e.target.value }))}
                  placeholder="کد پیگیری پستی..."
                  className="flex-1 h-10 rounded-xl bg-muted border-none px-4 text-sm focus:outline-none"
                />
                <Button onClick={() => handleAssign(order.id)} className="rounded-xl font-bold shrink-0" disabled={updateOrder.isPending}>
                  ثبت ارسال
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
