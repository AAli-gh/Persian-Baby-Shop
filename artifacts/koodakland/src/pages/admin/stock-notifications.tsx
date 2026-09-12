import { useState } from "react";
import { Bell, Trash2, Download, Package, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

interface Notification {
  id: number;
  productId: number;
  productName: string;
  productStock: number;
  email: string;
  isNotified: boolean;
  notifiedAt: string | null;
  createdAt: string;
}

interface ByProduct {
  productId: number;
  productName: string;
  stock: number;
  subscriberCount: number;
}

interface NotifData {
  notifications: Notification[];
  byProduct: ByProduct[];
  total: number;
  pending: number;
}

function useNotifications() {
  const [data, setData] = useState<NotifData | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stock-notifications", { credentials: "include" });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, refetch };
}

export default function AdminStockNotifications() {
  const { data, loading, refetch } = useNotifications();
  const [initialized, setInitialized] = useState(false);

  if (!initialized) {
    setInitialized(true);
    setTimeout(() => refetch(), 0);
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/stock-notifications/${id}`, { method: "DELETE", credentials: "include" });
    await refetch();
  };

  const handleExport = () => {
    const a = document.createElement("a");
    a.href = "/api/admin/stock-notifications/export";
    a.click();
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            اطلاع‌رسانی موجود شدن
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">مدیریت درخواست‌های اطلاع‌رسانی موجودی</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2 rounded-xl">
            <RefreshCw className="w-4 h-4" />
            بروزرسانی
          </Button>
          <Button size="sm" onClick={handleExport} className="gap-2 rounded-xl">
            <Download className="w-4 h-4" />
            خروجی CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "کل درخواست‌ها", value: data?.total ?? 0, color: "bg-blue-50 text-blue-700" },
          { label: "در انتظار", value: data?.pending ?? 0, color: "bg-amber-50 text-amber-700" },
          { label: "محصولات ناموجود", value: data?.byProduct.length ?? 0, color: "bg-red-50 text-red-700" },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl p-4 ${card.color} border border-current/10`}>
            <div className="text-2xl font-black">{card.value.toLocaleString("fa-IR")}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{card.label}</div>
          </div>
        ))}
      </div>

      {data?.byProduct && data.byProduct.length > 0 && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b bg-muted/30">
            <h2 className="font-bold flex items-center gap-2"><Package className="w-4 h-4" />خلاصه بر اساس محصول</h2>
          </div>
          <div className="divide-y">
            {data.byProduct.map(p => (
              <div key={p.productId} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{p.productName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    موجودی: {p.stock === 0 ? <span className="text-destructive">ناموجود</span> : p.stock}
                  </div>
                </div>
                <Badge variant="secondary" className="font-bold">
                  {p.subscriberCount.toLocaleString("fa-IR")} مشترک
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/30">
          <h2 className="font-bold flex items-center gap-2"><Mail className="w-4 h-4" />لیست کامل مشترکین</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">در حال بارگذاری...</div>
        ) : data?.notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>هیچ درخواستی ثبت نشده است</p>
          </div>
        ) : (
          <div className="divide-y">
            {data?.notifications.map(n => (
              <div key={n.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{n.productName}</div>
                  <div className="text-xs text-muted-foreground">{n.email}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString("fa-IR")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={n.isNotified ? "default" : "secondary"} className="text-xs">
                    {n.isNotified ? "اطلاع داده شد" : "در انتظار"}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(n.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
