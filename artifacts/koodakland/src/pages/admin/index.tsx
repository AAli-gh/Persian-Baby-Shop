import { useGetAdminStats, useGetRecentOrders, useGetLowStockProducts, useGetSalesChart } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, ShoppingBag, Users, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "wouter";

const ORDER_STATUS: Record<string, string> = {
  pending: "در انتظار", processing: "پردازش", shipped: "ارسال شده", delivered: "تحویل شده", cancelled: "لغو شده"
};

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: recentOrders } = useGetRecentOrders();
  const { data: lowStock } = useGetLowStockProducts();
  const { data: salesChart } = useGetSalesChart();

  const statCards = stats ? [
    { label: "درآمد کل", value: `${(stats.totalRevenue / 1000000).toFixed(1)} م.ت`, icon: TrendingUp, growth: stats.revenueGrowth, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
    { label: "کل سفارشات", value: stats.totalOrders.toLocaleString("fa-IR"), icon: ShoppingBag, growth: stats.ordersGrowth, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
    { label: "محصولات", value: stats.totalProducts.toLocaleString("fa-IR"), icon: Package, growth: null, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30" },
    { label: "کاربران", value: stats.totalUsers.toLocaleString("fa-IR"), icon: Users, growth: null, color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30" },
  ] : [];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-black">داشبورد</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />) :
          statCards.map((card) => (
            <div key={card.label} className="bg-card rounded-2xl p-5 border border-border/50 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
              {card.growth !== null && card.growth !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium ${card.growth >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {card.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(card.growth).toFixed(1)}٪ نسبت به ماه گذشته
                </div>
              )}
            </div>
          ))}
      </div>

      {salesChart && salesChart.length > 0 && (
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <h2 className="font-bold mb-4">نمودار فروش ۳۰ روز اخیر</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={salesChart} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`${v.toLocaleString("fa-IR")} تومان`, "درآمد"]} />
              <Area type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">سفارشات اخیر</h2>
            <Link href="/admin/orders" className="text-xs text-primary hover:underline">مشاهده همه</Link>
          </div>
          <div className="flex flex-col gap-3">
            {(recentOrders || []).slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium">#{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{order.customerName || "—"}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-primary">{order.total.toLocaleString("fa-IR")}</p>
                  <p className="text-xs text-muted-foreground">{ORDER_STATUS[order.status] || order.status}</p>
                </div>
              </div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && <p className="text-muted-foreground text-sm text-center py-4">سفارشی وجود ندارد</p>}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">موجودی کم</h2>
            <Link href="/admin/products" className="text-xs text-primary hover:underline">مدیریت</Link>
          </div>
          <div className="flex flex-col gap-3">
            {(lowStock || []).slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted shrink-0">
                  {p.images[0] && <img src={p.images[0]} alt={p.nameFa} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.nameFa}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock === 0 ? "bg-red-100 text-red-600 dark:bg-red-900/30" : "bg-orange-100 text-orange-600 dark:bg-orange-900/30"}`}>
                  {p.stock.toLocaleString("fa-IR")} عدد
                </span>
              </div>
            ))}
            {(!lowStock || lowStock.length === 0) && <p className="text-muted-foreground text-sm text-center py-4">موجودی کم ندارید</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
