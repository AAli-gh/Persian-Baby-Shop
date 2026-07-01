import { useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StockNotifyFormProps {
  productId: number;
}

export function StockNotifyForm({ productId }: StockNotifyFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/products/${productId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(json.message ?? "وقتی موجود شد به شما اطلاع می‌دهیم");
      } else {
        setStatus("error");
        setMessage(json.error ?? "خطایی رخ داد");
      }
    } catch {
      setStatus("error");
      setMessage("خطا در اتصال به سرور");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-100">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
        <div>
          <p className="font-bold text-green-700 text-sm">ثبت شد!</p>
          <p className="text-xs text-green-600 mt-0.5">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">موجود شد به من اطلاع بده</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        این محصول در حال حاضر ناموجود است. ایمیل خود را وارد کنید تا هنگام موجود شدن اطلاع‌رسانی کنیم.
      </p>
      {status === "error" && (
        <p className="text-xs text-destructive mb-2">{message}</p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="ایمیل شما"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="rounded-xl text-sm flex-1"
          required
          dir="ltr"
        />
        <Button type="submit" size="sm" className="rounded-xl gap-1.5 font-bold shrink-0" disabled={status === "loading"}>
          <Bell className="w-3.5 h-3.5" />
          {status === "loading" ? "..." : "ثبت"}
        </Button>
      </form>
    </div>
  );
}
