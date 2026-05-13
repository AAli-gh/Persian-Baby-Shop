import { useState } from "react";
import { useListOrders, useUpdateOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const STATUSES = [
  { value: "", label: "همه" },
  { value: "pending", label: "در انتظار" },
  { value: "processing", label: "پردازش" },
  { value: "shipped", label: "ارسال شده" },
  { value: "delivered", label: "تحویل شده" },
  { value: "cancelled", label: "لغو شده" },
];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700", processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700", delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrders() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  const { data, isLoading } = useListOrders({ status: statusFilter || undefined, page, limit: 15 });
  const updateOrder = useUpdateOrder();

  const orders = data?.orders || [];

  const handleUpdate = () => {
    if (!selectedOrder) return;
    updateOrder.mutate({ id: selectedOrder.id, data: { status: newStatus || undefined, trackingCode: trackingCode || undefined } }, {
      onSuccess: () => { toast({ title: "سفارش به‌روز شد" }); setSelectedOrder(null); qc.invalidateQueries(); },
      onError: () => toast({ title: "خطا", variant: "destructive" }),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black">مدیریت سفارشات</h1>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map(({ value, label }) => (
          <button key={value} onClick={() => { setStatusFilter(value); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">شماره</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">مشتری</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">مبلغ</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">وضعیت</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">تاریخ</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td></tr>
              )) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">#{order.orderNumber}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{order.customerName || "—"}</td>
                  <td className="px-4 py-3 font-bold text-primary">{order.total.toLocaleString("fa-IR")}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLE[order.status] || "bg-muted text-foreground"}`}>{STATUSES.find(s => s.value === order.status)?.label || order.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{new Date(order.createdAt).toLocaleDateString("fa-IR")}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => { setSelectedOrder(order); setNewStatus(order.status); setTrackingCode(order.trackingCode || ""); }}>ویرایش</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <Button variant="outline" className="rounded-full" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>قبلی</Button>
        <span className="text-sm text-muted-foreground flex items-center">{page.toLocaleString("fa-IR")} از {(data?.totalPages || 1).toLocaleString("fa-IR")}</span>
        <Button variant="outline" className="rounded-full" onClick={() => setPage(p => p + 1)} disabled={(data?.totalPages || 1) <= page}>بعدی</Button>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>ویرایش سفارش #{selectedOrder?.orderNumber}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">وضعیت</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none">
                {STATUSES.filter(s => s.value).map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">کد پیگیری</label>
              <input value={trackingCode} onChange={e => setTrackingCode(e.target.value)} placeholder="کد پیگیری پستی" className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>انصراف</Button>
            <Button onClick={handleUpdate} className="font-bold" disabled={updateOrder.isPending}>ذخیره</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
