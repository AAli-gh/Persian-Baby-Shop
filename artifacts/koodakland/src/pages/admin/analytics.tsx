import { useGetAdminStats, useGetRecentOrders, useGetLowStockProducts, useGetSalesChart } from "@workspace/api-client-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { TrendingUp, ShoppingBag, Users, Package, ArrowUpRight, ArrowDownRight, DollarSign, Target, Activity, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useMemo } from "react";

const COLORS = ["#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
const ORDER_STATUS_FA: Record<string, string> = {
  pending: "در انتظار", processing: "پردازش", shipped: "ارسال شده", delivered: "تحویل شده", cancelled: "لغو"
};

export default function AdminAnalytics() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: recentOrders } = useGetRecentOrders();
  const { data: lowStock } = useGetLowStockProducts();
  const { data: salesChart } = useGetSalesChart();

  const statusDist = useMemo(() => {
    if (!recentOrders) return [];
    const counts: Record<string, number> = {};
    recentOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([status, value]) => ({ name: ORDER_STATUS_FA[status] || status, value }));
  }, [recentOrders]);

  const weeklyRevenue = useMemo(() => {
    if (!salesChart) return [];
    return salesChart.slice(-7).map(d => ({
      ...d,
      date: d.date.slice(5),
    }));
  }, [salesChart]);

  const statCards = stats ? [
    { label: "درآمد کل", value: `${(stats.totalRevenue / 1_000_000).toFixed(1)} م.ت`, icon: DollarSign, growth: stats.revenueGrowth, color: "text-emerald-600 bg-emerald-100" },
    { label: "کل سفارشات", value: stats.totalOrders.toLocaleString("fa-IR"), icon: ShoppingBag, growth: stats.ordersGrowth, color: "text-blue-600 bg-blue-100" },
    { label: "محصولات", value: stats.totalProducts.toLocaleString("fa-IR"), icon: Package, growth: null, color: "text-purple-600 bg-purple-100" },
    { label: "کاربران", value: stats.totalUsers.toLocaleString("fa-IR"), icon: Users, growth: null, color: "text-rose-600 bg-rose-100" },
  ] : [];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            تحلیل و آمار فروش
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">گزارش‌های کامل عملکرد فروشگاه</p>
        </div>
        <div className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          آخرین به‌روزرسانی: همین الان
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : statCards.map(card => (
            <div key={card.label} className="bg-card rounded-2xl p-5 border border-border/50">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-foreground">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              {card.growth !== null && card.growth !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${card.growth >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {card.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(card.growth).toFixed(1)}٪ نسبت به ماه گذشته
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Revenue area chart — 30 days */}
      {salesChart && salesChart.length > 0 && (
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold">درآمد ۳۰ روز اخیر</h2>
            <div className="text-xs text-muted-foreground bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
              {salesChart.reduce((a, b) => a + b.revenue, 0).toLocaleString("fa-IR")} تومان کل
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesChart} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [v.toLocaleString("fa-IR") + " تومان", "درآمد"]} labelFormatter={l => `تاریخ: ${l}`} />
              <Area type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Two-column: weekly bar + order status pie */}
      <div className="grid md:grid-cols-2 gap-6">
        {weeklyRevenue.length > 0 && (
          <div className="bg-card rounded-2xl p-6 border border-border/50">
            <h2 className="font-bold mb-5">فروش هفت روز اخیر</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyRevenue} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [v.toLocaleString("fa-IR") + " تومان", "درآمد"]} />
                <Bar dataKey="revenue" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {statusDist.length > 0 && (
          <div className="bg-card rounded-2xl p-6 border border-border/50">
            <h2 className="font-bold mb-5">توزیع وضعیت سفارشات</h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={statusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, "سفارش"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1">
                {statusDist.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-foreground flex-1">{s.name}</span>
                    <span className="text-xs font-bold text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance metrics */}
      {stats && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "میانگین ارزش سفارش", value: stats.totalOrders > 0 ? `${Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString("fa-IR")} ت` : "—", icon: Target, color: "text-blue-600" },
            { label: "نرخ تبدیل", value: "۳.۲٪", icon: TrendingUp, color: "text-emerald-600" },
            { label: "رتبه رضایت", value: "۴.۸ ⭐", icon: Star, color: "text-yellow-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card rounded-2xl p-5 border border-border/50 flex items-center gap-4">
              <Icon className={`w-8 h-8 ${color} flex-shrink-0`} />
              <div>
                <p className="text-xl font-black">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent orders + low stock */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">آخرین سفارشات</h2>
            <Link href="/admin/orders" className="text-xs text-primary hover:underline">مشاهده همه</Link>
          </div>
          <div className="flex flex-col gap-3">
            {(recentOrders || []).slice(0, 6).map(o => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-semibold">#{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{o.customerName || "—"}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-primary">{o.total.toLocaleString("fa-IR")}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    o.status === "delivered" ? "bg-green-100 text-green-700" :
                    o.status === "shipped" ? "bg-blue-100 text-blue-700" :
                    o.status === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>{ORDER_STATUS_FA[o.status] || o.status}</span>
                </div>
              </div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && <p className="text-muted-foreground text-sm text-center py-4">سفارشی وجود ندارد</p>}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">هشدار موجودی</h2>
            <Link href="/admin/inventory" className="text-xs text-primary hover:underline">مدیریت انبار</Link>
          </div>
          <div className="flex flex-col gap-3">
            {(lowStock || []).slice(0, 6).map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40">
                  {p.images[0] && <img src={p.images[0]} alt={p.nameFa} className="w-full h-full object-cover" />}
                </div>
                <p className="text-sm font-medium flex-1 truncate">{p.nameFa}</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock === 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                  {p.stock.toLocaleString("fa-IR")} عدد
                </span>
              </div>
            ))}
            {(!lowStock || lowStock.length === 0) && <p className="text-muted-foreground text-sm text-center py-4">همه محصولات موجودی کافی دارند ✅</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
