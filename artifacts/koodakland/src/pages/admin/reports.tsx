import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, ShoppingBag, Users, DollarSign, Download, Filter, ArrowUpRight, ArrowDownRight, Package, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const COLORS = ["#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

interface ReportData {
  period: { start: string; end: string };
  summary: {
    revenue: number; orders: number; avgOrderValue: number; newCustomers: number;
    revenueGrowth: number; ordersGrowth: number; estimatedProfit: number; profitMargin: number;
    outOfStock: number; lowStock: number;
  };
  topProducts: Array<{ productId: number; name: string; totalSold: number; revenue: number }>;
  dailySales: Array<{ date: string; revenue: number; orders: number }>;
  categoryRevenue: Array<{ categoryId: number; name: string; revenue: number; orders: number }>;
  statusCounts: Array<{ status: string; count: number }>;
}

const PERIOD_LABELS: Record<string, string> = { today: "امروز", week: "هفته جاری", month: "این ماه", year: "امسال" };
const STATUS_FA: Record<string, string> = { pending: "در انتظار", processing: "پردازش", shipped: "ارسال", delivered: "تحویل", cancelled: "لغو" };

export default function AdminReports() {
  const { token } = useAuth();
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?period=${period}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [token, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["گزارش فروش", data.period.start.slice(0, 10), "تا", data.period.end.slice(0, 10)],
      [],
      ["درآمد کل", data.summary.revenue],
      ["تعداد سفارشات", data.summary.orders],
      ["میانگین سفارش", Math.round(data.summary.avgOrderValue)],
      ["مشتریان جدید", data.summary.newCustomers],
      ["سود تخمینی", data.summary.estimatedProfit],
      [],
      ["محصول", "تعداد فروش", "درآمد"],
      ...data.topProducts.map(p => [p.name, p.totalSold, p.revenue]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `report-${period}.csv`;
    a.click();
  };

  const s = data?.summary;
  const statCards = s ? [
    { label: "درآمد کل", value: `${(s.revenue / 1_000_000).toFixed(1)} م.ت`, icon: DollarSign, growth: s.revenueGrowth, color: "text-emerald-600 bg-emerald-50" },
    { label: "تعداد سفارشات", value: s.orders.toLocaleString("fa-IR"), icon: ShoppingBag, growth: s.ordersGrowth, color: "text-blue-600 bg-blue-50" },
    { label: "میانگین سفارش", value: `${Math.round(s.avgOrderValue / 1000).toLocaleString("fa-IR")} ه.ت`, icon: Target, growth: null, color: "text-purple-600 bg-purple-50" },
    { label: "مشتریان جدید", value: s.newCustomers.toLocaleString("fa-IR"), icon: Users, growth: null, color: "text-rose-600 bg-rose-50" },
    { label: "سود تخمینی", value: `${(s.estimatedProfit / 1_000_000).toFixed(1)} م.ت`, icon: TrendingUp, growth: null, color: "text-amber-600 bg-amber-50" },
    { label: "حاشیه سود", value: `${s.profitMargin}٪`, icon: Package, growth: null, color: "text-cyan-600 bg-cyan-50" },
  ] : [];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            گزارش‌های پیشرفته
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">تحلیل عمیق فروش، مشتریان و محصولات</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!data} className="gap-2 rounded-xl">
            <Download className="w-4 h-4" />
            خروجی Excel
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {Object.entries(PERIOD_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => setPeriod(key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${period === key ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted hover:bg-muted/70"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="py-8 text-center text-muted-foreground">در حال بارگذاری گزارش...</div>}

      {!loading && s && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statCards.map(card => (
              <div key={card.label} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  {card.growth !== null && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${card.growth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {card.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(card.growth).toFixed(1)}٪
                    </div>
                  )}
                </div>
                <div className="text-xl font-black">{card.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
              </div>
            ))}
          </div>

          {data.dailySales.length > 0 && (
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="font-bold mb-4">روند فروش روزانه</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [`${(v / 1000).toFixed(0)} ه.ت`, "درآمد"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.topProducts.length > 0 && (
              <div className="rounded-2xl border bg-card p-5">
                <h2 className="font-bold mb-4">پرفروش‌ترین محصولات</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.topProducts.slice(0, 6)} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="totalSold" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.categoryRevenue.length > 0 && (
              <div className="rounded-2xl border bg-card p-5">
                <h2 className="font-bold mb-4">درآمد بر اساس دسته‌بندی</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.categoryRevenue} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}٪`}>
                      {data.categoryRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${(v / 1_000_000).toFixed(1)} م.ت`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/30 font-bold">خلاصه موجودی</div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-red-50 p-3 text-center">
                  <div className="text-2xl font-black text-red-600">{s.outOfStock.toLocaleString("fa-IR")}</div>
                  <div className="text-xs text-red-600 mt-1">ناموجود</div>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-center">
                  <div className="text-2xl font-black text-amber-600">{s.lowStock.toLocaleString("fa-IR")}</div>
                  <div className="text-xs text-amber-600 mt-1">موجودی کم</div>
                </div>
              </div>
            </div>

            {data.statusCounts.length > 0 && (
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b bg-muted/30 font-bold">وضعیت سفارشات</div>
                <div className="divide-y">
                  {data.statusCounts.map(s => (
                    <div key={s.status} className="px-5 py-2 flex items-center justify-between text-sm">
                      <span>{STATUS_FA[s.status] ?? s.status}</span>
                      <span className="font-bold">{Number(s.count).toLocaleString("fa-IR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
