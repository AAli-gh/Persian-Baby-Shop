import { useState } from "react";
import { useLocation } from "wouter";
import { useGetUser, useListOrders, useGetWishlist, useUpdateUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { User, Package, Heart, Edit3, LogOut, LogOutIcon } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "در انتظار تایید", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  processing: { label: "در حال پردازش", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  shipped: { label: "ارسال شده", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  delivered: { label: "تحویل داده شده", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "لغو شده", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export default function Profile() {
  const { user, logout, logoutAll, updateUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<"orders" | "wishlist" | "profile">("orders");
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");

  const { data: orders, isLoading: ordersLoading } = useListOrders({ userId: user?.id }, { query: { enabled: !!user, queryKey: ["user-orders", user?.id] } });
  const { data: wishlist, isLoading: wishlistLoading } = useGetWishlist({ userId: user?.id }, { query: { enabled: !!user, queryKey: ["wishlist", user?.id] } });
  const updateUserMutation = useUpdateUser();

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleSaveProfile = () => {
    updateUserMutation.mutate({ id: user.id, data: { name: editName, email: editEmail } }, {
      onSuccess: (updated) => { updateUser(updated); toast({ title: "پروفایل به‌روز شد" }); },
      onError: () => toast({ title: "خطا", variant: "destructive" }),
    });
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
    } catch {
      toast({ title: "خطا", description: "خروج از نشست‌ها انجام نشد", variant: "destructive" });
    }
  };

  const tabs = [
    { id: "orders", label: "سفارش‌ها", icon: Package },
    { id: "wishlist", label: "علاقه‌مندی‌ها", icon: Heart },
    { id: "profile", label: "ویرایش پروفایل", icon: Edit3 },
  ] as const;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-3xl p-6 border border-border/50 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black">{user.name || "کاربر"}</h1>
            <p className="text-muted-foreground text-sm">{user.mobile}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive rounded-full gap-2" onClick={() => { logout(); navigate("/"); }}>
              <LogOut className="w-4 h-4" /> خروج
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive rounded-full gap-2" onClick={handleLogoutAll}>
              <LogOutIcon className="w-4 h-4" /> خروج از همه دستگاه‌ها
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${tab === id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {tab === "orders" && (
          <div className="flex flex-col gap-4">
            {ordersLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />) :
              (orders?.orders || []).length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-3xl">هنوز سفارشی ثبت نکرده‌اید</div>
              ) : (orders?.orders || []).map((order) => (
                <div key={order.id} className="bg-card rounded-2xl p-5 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold">سفارش #{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("fa-IR")}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${ORDER_STATUS[order.status]?.color || "bg-muted text-foreground"}`}>
                      {ORDER_STATUS[order.status]?.label || order.status}
                    </span>
                  </div>
                  <Separator className="mb-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{order.items.length} کالا</span>
                    <span className="font-black text-primary">{order.total.toLocaleString("fa-IR")} تومان</span>
                  </div>
                  {order.trackingCode && (
                    <div className="mt-3 bg-muted/50 rounded-xl p-3 text-sm">
                      کد پیگیری: <span className="font-bold text-primary">{order.trackingCode}</span>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {tab === "wishlist" && (
          <div>
            {wishlistLoading ? <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}</div> :
              (wishlist || []).length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-3xl">علاقه‌مندی‌های شما خالی است</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(wishlist || []).map((item) => item.product && <ProductCard key={item.id} product={item.product} />)}
                </div>
              )
            }
          </div>
        )}

        {tab === "profile" && (
          <div className="bg-card rounded-2xl p-6 border border-border/50">
            <h2 className="font-bold mb-5">ویرایش اطلاعات</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">نام</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="نام و نام خانوادگی" className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">ایمیل</label>
                <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="email@example.com" className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">شماره موبایل</label>
                <input value={user.mobile} disabled className="h-10 w-full rounded-xl bg-muted/50 border-none px-4 text-sm text-muted-foreground" />
              </div>
              <Button onClick={handleSaveProfile} className="rounded-full w-fit font-bold" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
