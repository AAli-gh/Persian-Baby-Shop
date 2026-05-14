import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, FileText, BarChart2, Phone, CheckCircle, XCircle, Clock, Plus, Edit2, ToggleLeft, ToggleRight, Users, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  otp:      { label: "OTP", color: "bg-blue-100 text-blue-700" },
  order:    { label: "سفارش", color: "bg-green-100 text-green-700" },
  shipping: { label: "ارسال", color: "bg-purple-100 text-purple-700" },
  campaign: { label: "کمپین", color: "bg-orange-100 text-orange-700" },
  cart:     { label: "سبد خرید", color: "bg-pink-100 text-pink-700" },
};
const STATUS_CONFIG = {
  delivered: { label: "تحویل داده شد", icon: CheckCircle, color: "text-green-600 bg-green-50" },
  failed:    { label: "ناموفق", icon: XCircle, color: "text-red-600 bg-red-50" },
  pending:   { label: "در انتظار", icon: Clock, color: "text-orange-600 bg-orange-50" },
};

function fetchStats() { return fetch("/api/sms/stats").then(r => r.json()); }
function fetchTemplates() { return fetch("/api/sms/templates").then(r => r.json()); }
function fetchLogs(type: string) {
  const q = type !== "all" ? `?type=${type}` : "";
  return fetch(`/api/sms/logs${q}`).then(r => r.json());
}

const TABS = [
  { id: "dashboard", label: "داشبورد", icon: BarChart2 },
  { id: "send", label: "ارسال پیام", icon: Send },
  { id: "templates", label: "قالب‌ها", icon: FileText },
  { id: "logs", label: "لاگ‌ها", icon: MessageSquare },
];

export default function AdminSMS() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState("dashboard");
  const [logFilter, setLogFilter] = useState("all");
  const [sendForm, setSendForm] = useState({ phones: "", templateId: "", variables: "" });
  const [tmplDialog, setTmplDialog] = useState(false);
  const [tmplForm, setTmplForm] = useState({ name: "", type: "order", text: "" });

  const { data: stats } = useQuery({ queryKey: ["sms-stats"], queryFn: fetchStats });
  const { data: templates } = useQuery({ queryKey: ["sms-templates"], queryFn: fetchTemplates });
  const { data: logs } = useQuery({ queryKey: ["sms-logs", logFilter], queryFn: () => fetchLogs(logFilter) });

  const sendSMS = useMutation({
    mutationFn: (body: object) => fetch("/api/sms/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: (d) => { toast({ title: `${d.sent} پیام ارسال شد` }); qc.invalidateQueries({ queryKey: ["sms-logs"] }); qc.invalidateQueries({ queryKey: ["sms-stats"] }); setSendForm({ phones: "", templateId: "", variables: "" }); },
    onError: () => toast({ title: "خطا در ارسال", variant: "destructive" }),
  });
  const createTemplate = useMutation({
    mutationFn: (body: object) => fetch("/api/sms/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { toast({ title: "قالب ذخیره شد" }); qc.invalidateQueries({ queryKey: ["sms-templates"] }); setTmplDialog(false); setTmplForm({ name: "", type: "order", text: "" }); },
  });

  const handleSend = () => {
    if (!sendForm.phones || !sendForm.templateId) { toast({ title: "شماره و قالب را وارد کنید", variant: "destructive" }); return; }
    const phones = sendForm.phones.split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
    let variables: Record<string, string> = {};
    try { if (sendForm.variables) variables = JSON.parse(sendForm.variables); } catch { /* ignore */ }
    sendSMS.mutate({ phones, templateId: Number(sendForm.templateId), variables });
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            پنل پیامک
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">مدیریت پیامک‌های سیستمی و کمپین‌های پیامکی</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-green-50 border border-green-100">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-700">سرویس فعال</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Dashboard tab */}
      {tab === "dashboard" && stats && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "کل ارسال‌شده", value: stats.totalSent, icon: Send, color: "bg-blue-100 text-blue-600" },
              { label: "تحویل موفق", value: stats.delivered, icon: CheckCircle, color: "bg-green-100 text-green-600" },
              { label: "نرخ تحویل", value: `${stats.deliveryRate}٪`, icon: BarChart2, color: "bg-purple-100 text-purple-600" },
              { label: "اعتبار باقی‌مانده", value: `${stats.credit?.toLocaleString("fa-IR")} پیامک`, icon: Zap, color: "bg-orange-100 text-orange-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card rounded-2xl p-5 border border-border/50 flex flex-col gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* SMS type breakdown */}
          <div className="bg-card rounded-2xl p-6 border border-border/50">
            <h3 className="font-bold mb-4">توزیع پیامک‌ها بر اساس نوع</h3>
            <div className="flex flex-col gap-3">
              {Object.entries(TYPE_LABELS).map(([type, cfg]) => {
                const count = (logs?.logs || []).filter((l: { type: string }) => l.type === type).length || 0;
                const pct = logs?.total ? Math.round((count / logs.total) * 100) : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-left">{pct}٪</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-800 text-sm">اتصال به ارائه‌دهنده پیامک</p>
              <p className="text-xs text-orange-600 mt-1">
                برای فعال‌سازی ارسال واقعی، اطلاعات API ارائه‌دهنده ایرانی (مثل ملی‌پیام، کاوه‌نگار، یا SMS.ir) را در تنظیمات سرور وارد کنید.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Send tab */}
      {tab === "send" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl p-6 border border-border/50 flex flex-col gap-4">
            <h3 className="font-bold">ارسال پیامک</h3>

            <div>
              <label className="text-sm font-medium mb-1.5 block">شماره‌های موبایل</label>
              <textarea
                value={sendForm.phones}
                onChange={e => setSendForm(f => ({ ...f, phones: e.target.value }))}
                rows={5}
                placeholder={"09121234567\n09351234568\n09181234569"}
                className="w-full p-3 rounded-xl bg-muted border-none text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {sendForm.phones.split(/[\n,]+/).filter(Boolean).length} شماره
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">قالب پیامک</label>
              <select
                value={sendForm.templateId}
                onChange={e => setSendForm(f => ({ ...f, templateId: e.target.value }))}
                className="w-full h-10 rounded-xl bg-muted border-none px-4 text-sm focus:outline-none"
              >
                <option value="">یک قالب انتخاب کنید</option>
                {(templates || []).map((t: { id: number; name: string; type: string }) => (
                  <option key={t.id} value={t.id}>{t.name} ({TYPE_LABELS[t.type]?.label})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                متغیرها <span className="text-xs text-muted-foreground font-normal">(JSON اختیاری)</span>
              </label>
              <input
                value={sendForm.variables}
                onChange={e => setSendForm(f => ({ ...f, variables: e.target.value }))}
                placeholder='{"code": "1234", "name": "مریم"}'
                className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none font-mono"
                dir="ltr"
              />
            </div>

            <Button onClick={handleSend} disabled={sendSMS.isPending} className="font-bold gap-2">
              <Send className="w-4 h-4" />
              {sendSMS.isPending ? "در حال ارسال..." : "ارسال پیامک"}
            </Button>
          </div>

          {/* Preview panel */}
          <div className="bg-card rounded-2xl p-6 border border-border/50">
            <h3 className="font-bold mb-4">پیش‌نمایش</h3>
            {sendForm.templateId && templates ? (
              <div>
                <div className="relative mx-auto w-56">
                  <div className="bg-slate-800 rounded-3xl p-3 shadow-xl">
                    <div className="bg-slate-700 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-white text-xs font-bold">کودک‌لند</p>
                          <p className="text-slate-400 text-[10px]">الان</p>
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-white text-xs leading-relaxed" dir="rtl">
                          {(templates as Array<{id: number; text: string}>).find((t) => t.id === Number(sendForm.templateId))?.text || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{sendForm.phones.split(/[\n,]+/).filter(Boolean).length} گیرنده</span>
                  <span>·</span>
                  <span>~{sendForm.phones.split(/[\n,]+/).filter(Boolean).length * 25} اعتبار</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                <MessageSquare className="w-10 h-10 opacity-20" />
                <p className="text-sm">یک قالب انتخاب کنید</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates tab */}
      {tab === "templates" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{(templates || []).length} قالب</p>
            <Button size="sm" onClick={() => setTmplDialog(true)} className="gap-2 rounded-xl font-bold">
              <Plus className="w-4 h-4" /> قالب جدید
            </Button>
          </div>
          <div className="grid gap-3">
            {(templates || []).map((t: { id: number; name: string; type: string; text: string; isActive: boolean }) => (
              <div key={t.id} className="bg-card rounded-2xl p-5 border border-border/50 flex items-start gap-4">
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${TYPE_LABELS[t.type]?.color || "bg-muted text-muted-foreground"}`}>
                  {TYPE_LABELS[t.type]?.label || t.type}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.text}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.isActive
                    ? <ToggleRight className="w-6 h-6 text-green-500 cursor-pointer" />
                    : <ToggleLeft className="w-6 h-6 text-muted-foreground cursor-pointer" />
                  }
                  <button className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              </div>
            ))}
          </div>

          <Dialog open={tmplDialog} onOpenChange={setTmplDialog}>
            <DialogContent dir="rtl" className="max-w-md">
              <DialogHeader><DialogTitle>قالب جدید</DialogTitle></DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">نام قالب</label>
                  <input value={tmplForm.name} onChange={e => setTmplForm(f => ({ ...f, name: e.target.value }))} placeholder="مثلاً: اعلام تخفیف ویژه" className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">نوع</label>
                  <select value={tmplForm.type} onChange={e => setTmplForm(f => ({ ...f, type: e.target.value }))} className="h-10 w-full rounded-xl bg-muted border-none px-4 text-sm focus:outline-none">
                    {Object.entries(TYPE_LABELS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">متن پیام</label>
                  <textarea value={tmplForm.text} onChange={e => setTmplForm(f => ({ ...f, text: e.target.value }))} rows={4} placeholder="از {name}، {code} برای متغیرها استفاده کنید" className="w-full p-3 rounded-xl bg-muted border-none text-sm resize-none focus:outline-none" />
                  <p className="text-xs text-muted-foreground mt-1">متغیرها: {"{name}"} {"{code}"} {"{orderNumber}"} {"{amount}"}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTmplDialog(false)}>انصراف</Button>
                <Button onClick={() => createTemplate.mutate(tmplForm)} disabled={createTemplate.isPending} className="font-bold">ذخیره</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Logs tab */}
      {tab === "logs" && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap">
            {[["all", "همه"], ...Object.entries(TYPE_LABELS).map(([v, { label }]) => [v, label])].map(([v, label]) => (
              <button key={v} onClick={() => setLogFilter(v)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${logFilter === v ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/50 bg-muted/30">
                  <tr>
                    {["شماره", "نوع", "متن", "وضعیت", "زمان"].map(h => (
                      <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(logs?.logs || []).map((l: { id: number; phone: string; type: string; text: string; status: "delivered" | "failed" | "pending"; sentAt: string }) => {
                    const sc = STATUS_CONFIG[l.status];
                    const Icon = sc.icon;
                    return (
                      <tr key={l.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs" dir="ltr">{l.phone}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${TYPE_LABELS[l.type]?.color || "bg-muted"}`}>
                            {TYPE_LABELS[l.type]?.label || l.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{l.text}</td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${sc.color}`}>
                            <Icon className="w-3 h-3" />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap" dir="ltr">
                          {new Date(l.sentAt).toLocaleString("fa-IR")}
                        </td>
                      </tr>
                    );
                  })}
                  {(logs?.logs || []).length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">لاگی وجود ندارد</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
