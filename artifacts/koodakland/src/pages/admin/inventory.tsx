import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, AlertTriangle, CheckCircle, XCircle, RefreshCw, Search, Edit2, TrendingDown, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: number;
  nameFa: string;
  sku: string | null;
  stock: number;
  price: number;
  salePrice: number | null;
  images: string[];
  isActive: boolean;
  categoryName: string | null;
}
interface InventorySummary {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

function fetchInventory(search: string, lowOnly: boolean) {
  const q = new URLSearchParams();
  if (search) q.set("search", search);
  if (lowOnly) q.set("lowStock", "true");
  q.set("threshold", "10");
  return fetch(`/api/inventory?${q}`).then(r => r.json());
}

function stockStatus(stock: number) {
  if (stock === 0) return { label: "ناموجود", icon: XCircle, color: "text-red-600 bg-red-50 border-red-100" };
  if (stock <= 5) return { label: "بحرانی", icon: AlertTriangle, color: "text-red-500 bg-red-50 border-red-100" };
  if (stock <= 10) return { label: "کم", icon: TrendingDown, color: "text-orange-600 bg-orange-50 border-orange-100" };
  return { label: "موجود", icon: CheckCircle, color: "text-green-600 bg-green-50 border-green-100" };
}

export default function AdminInventory() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [newStock, setNewStock] = useState("");
  const [note, setNote] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkItems, setBulkItems] = useState<Record<number, number>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["inventory", search, lowOnly],
    queryFn: () => fetchInventory(search, lowOnly),
  });

  const items: InventoryItem[] = data?.items || [];
  const summary: InventorySummary = data?.summary || { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 };

  const updateStock = useMutation({
    mutationFn: ({ id, stock, note }: { id: number; stock: number; note: string }) =>
      fetch(`/api/inventory/${id}/stock`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock, note }) }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "موجودی به‌روز شد" });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setEditItem(null);
      setNewStock("");
      setNote("");
    },
    onError: () => toast({ title: "خطا", variant: "destructive" }),
  });

  const bulkRestock = useMutation({
    mutationFn: () =>
      fetch("/api/inventory/bulk-restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: Object.entries(bulkItems).map(([id, stock]) => ({ id: Number(id), stock })) }),
      }).then(r => r.json()),
    onSuccess: (d) => {
      toast({ title: `${d.updated} محصول به‌روز شد` });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setBulkMode(false);
      setBulkItems({});
    },
  });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-primary" />
            مدیریت موجودی
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">کنترل انبار و هشدارهای موجودی</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => setBulkMode(!bulkMode)} className={`rounded-xl font-bold gap-2 ${bulkMode ? "bg-primary" : ""}`}>
            {bulkMode ? "لغو بولک" : "ویرایش بولک"}
          </Button>
          {bulkMode && Object.keys(bulkItems).length > 0 && (
            <Button size="sm" onClick={() => bulkRestock.mutate()} disabled={bulkRestock.isPending} className="gap-2 rounded-xl font-bold bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4" />
              ذخیره {Object.keys(bulkItems).length} مورد
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "کل محصولات", value: summary.total, icon: Package, color: "bg-blue-100 text-blue-600" },
          { label: "موجود", value: summary.inStock, icon: CheckCircle, color: "bg-green-100 text-green-600" },
          { label: "موجودی کم", value: summary.lowStock, icon: AlertTriangle, color: "bg-orange-100 text-orange-600" },
          { label: "ناموجود", value: summary.outOfStock, icon: XCircle, color: "bg-red-100 text-red-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-2xl p-5 border border-border/50 flex gap-3 items-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی محصول..." className="w-full h-10 rounded-xl bg-muted border-none pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <button onClick={() => setLowOnly(!lowOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${lowOnly ? "bg-orange-50 border-orange-200 text-orange-700" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
          <AlertTriangle className="w-4 h-4" />
          فقط موجودی کم
        </button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <span className="text-muted-foreground">در حال بارگذاری...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/50 bg-muted/30">
                <tr>
                  {["محصول", "دسته‌بندی", "SKU", "وضعیت", "موجودی", "اقدام"].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const st = stockStatus(item.stock);
                  const StIcon = st.icon;
                  return (
                    <tr key={item.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/40">
                            {item.images?.[0]
                              ? <img src={item.images[0]} alt={item.nameFa} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-muted-foreground" /></div>
                            }
                          </div>
                          <span className="font-medium text-foreground">{item.nameFa}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{item.categoryName || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground" dir="ltr">{item.sku || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border w-fit ${st.color}`}>
                          <StIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {bulkMode ? (
                          <input
                            type="number"
                            defaultValue={item.stock}
                            onChange={e => setBulkItems(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                            className="w-20 h-8 rounded-lg bg-muted border border-primary/30 px-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                            min={0}
                          />
                        ) : (
                          <span className={`text-sm font-bold ${item.stock === 0 ? "text-red-600" : item.stock <= 5 ? "text-red-500" : item.stock <= 10 ? "text-orange-600" : "text-green-600"}`}>
                            {item.stock.toLocaleString("fa-IR")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!bulkMode && (
                          <button onClick={() => { setEditItem(item); setNewStock(String(item.stock)); setNote(""); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
                            <Edit2 className="w-3 h-3" />
                            ویرایش
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">موردی یافت نشد</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تغییر موجودی: {editItem?.nameFa}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {editItem.images?.[0]
                    ? <img src={editItem.images[0]} alt={editItem.nameFa} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground" /></div>
                  }
                </div>
                <div>
                  <p className="font-bold">{editItem.nameFa}</p>
                  <p className="text-sm text-muted-foreground">موجودی فعلی: <strong className={editItem.stock <= 5 ? "text-red-600" : "text-green-600"}>{editItem.stock}</strong></p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">موجودی جدید</label>
                <input type="number" value={newStock} onChange={e => setNewStock(e.target.value)} min={0} className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">یادداشت (اختیاری)</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="مثلاً: رسید انبار بهار ۱۴۰۴" className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>انصراف</Button>
            <Button onClick={() => editItem && updateStock.mutate({ id: editItem.id, stock: Number(newStock), note })} disabled={updateStock.isPending || !newStock} className="font-bold gap-2">
              <CheckCircle className="w-4 h-4" />
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
