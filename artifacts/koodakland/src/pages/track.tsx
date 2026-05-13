import { useState } from "react";
import { useTrackShipment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Truck, Package, CheckCircle2, MapPin, Clock } from "lucide-react";

const STATUS_ICONS: Record<string, React.FC<{ className?: string }>> = {
  ordered: Package,
  processing: Clock,
  shipped: Truck,
  in_transit: Truck,
  delivered: CheckCircle2,
};

export default function Track() {
  const [code, setCode] = useState("");
  const [searchCode, setSearchCode] = useState("");

  const { data: tracking, isLoading, error } = useTrackShipment(searchCode, { query: { enabled: !!searchCode, queryKey: ["tracking", searchCode] } });

  const handleTrack = () => {
    if (code.trim()) setSearchCode(code.trim());
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black mb-2">پیگیری سفارش</h1>
          <p className="text-muted-foreground text-sm">کد پیگیری مرسوله خود را وارد کنید</p>
        </div>

        <div className="flex gap-3 mb-8">
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="کد پیگیری..." onKeyDown={e => e.key === "Enter" && handleTrack()}
            className="flex-1 h-12 rounded-xl bg-card border border-border/50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <Button onClick={handleTrack} className="rounded-xl px-6 h-12 font-bold" disabled={isLoading}>{isLoading ? "جستجو..." : "پیگیری"}</Button>
        </div>

        {searchCode && !isLoading && !tracking && (
          <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-3xl">کد پیگیری یافت نشد</div>
        )}

        {tracking && (
          <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground">کد پیگیری</p>
                <p className="font-bold">{tracking.trackingCode}</p>
              </div>
              <span className="bg-primary/10 text-primary text-sm font-bold px-4 py-2 rounded-full">{tracking.statusFa}</span>
            </div>

            {tracking.carrier && <p className="text-sm text-muted-foreground mb-4">حامل: <span className="font-medium text-foreground">{tracking.carrier}</span></p>}
            {tracking.estimatedDelivery && (
              <p className="text-sm text-muted-foreground mb-6">تخمین تحویل: <span className="font-medium text-foreground">{new Date(tracking.estimatedDelivery).toLocaleDateString("fa-IR")}</span></p>
            )}

            <div className="flex flex-col gap-0">
              {tracking.events.map((event, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {(() => { const Icon = STATUS_ICONS[event.status] || Package; return <Icon className="w-4 h-4" />; })()}
                    </div>
                    {i < tracking.events.length - 1 && <div className="w-0.5 h-10 bg-border/50 mt-1" />}
                  </div>
                  <div className={`pb-6 ${i < tracking.events.length - 1 ? "" : ""}`}>
                    <p className={`font-bold text-sm ${i === 0 ? "text-primary" : "text-foreground"}`}>{event.statusFa}</p>
                    {event.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{event.location}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(event.timestamp).toLocaleString("fa-IR")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
