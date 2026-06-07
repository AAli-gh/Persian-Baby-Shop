import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Download, Trash2, Users, CheckCircle, XCircle, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Subscriber { id: number; email: string; name: string | null; source: string; isActive: boolean; createdAt: string; }

function fetchSubs() { return fetch("/api/newsletter/subscribers").then(r => r.json()); }

export default function AdminNewsletter() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useQuery({ queryKey: ["newsletter-subs"], queryFn: fetchSubs });

  const subs: Subscriber[] = data?.subscribers || [];
  const filtered = subs.filter(s =>
    !search || s.email.toLowerCase().includes(search.toLowerCase()) || (s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const deactivate = useMutation({
    mutationFn: (id: number) => fetch(`/api/newsletter/subscribers/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { toast({ title: "لغو اشتراک شد" }); qc.invalidateQueries({ queryKey: ["newsletter-subs"] }); },
  });

  const handleExport = () => { window.open("/api/newsletter/export", "_blank"); };

  const SOURCE_LABELS: Record<string, string> = { footer: "فوتر", home: "صفحه اصلی", popup: "پاپ‌آپ" };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><Mail className="w-6 h-6 text-primary" />مدیریت خبرنامه</h1>
          <p className="text-sm text-muted-foreground mt-0.5">مشترکین ایمیل و خبرنامه</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 rounded-xl"><RefreshCw className="w-4 h-4" /></Button>
          <Button size="sm" onClick={handleExport} className="gap-2 rounded-xl font-bold"><Download className="w-4 h-4" />خروجی CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "کل مشترکین", value: data?.total || 0, icon: Users, color: "bg-blue-100 text-blue-600" },
          { label: "فعال", value: data?.active || 0, icon: CheckCircle, color: "bg-green-100 text-green-600" },
          { label: "غیرفعال", value: (data?.total || 0) - (data?.active || 0), icon: XCircle, color: "bg-red-100 text-red-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-2xl p-5 border border-border/50 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon className="w-5 h-5" /></div>
            <div><p className="text-2xl font-black">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو در ایمیل یا نام..." className="w-full h-10 rounded-xl bg-muted border-none pr-10 pl-4 text-sm focus:outline-none" />
      </div>

      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground"><RefreshCw className="w-4 h-4 animate-spin" />در حال بارگذاری...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/50 bg-muted/30">
                <tr>
                  {["ایمیل", "نام", "منبع", "وضعیت", "تاریخ عضویت", "اقدام"].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">{s.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.name || "—"}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-muted">{SOURCE_LABELS[s.source] || s.source}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${s.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {s.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" dir="ltr">{new Date(s.createdAt).toLocaleDateString("fa-IR")}</td>
                    <td className="px-4 py-3">
                      {s.isActive && (
                        <Button size="icon" variant="ghost" className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500"
                          onClick={() => { if (confirm("لغو اشتراک شود؟")) deactivate.mutate(s.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">مشترکی یافت نشد</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
