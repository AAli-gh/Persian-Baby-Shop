import { useState } from "react";
import { useLocation } from "wouter";
import { useSendOtp, useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Phone, KeyRound, ArrowLeft } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const sendOtp = useSendOtp();
  const loginUser = useLoginUser();

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) { toast({ title: "شماره نامعتبر", variant: "destructive" }); return; }
    sendOtp.mutate({ data: { mobile: phone } }, {
      onSuccess: (data) => {
        setStep("otp");
        if (data.otp) setDevOtp(data.otp);
        toast({ title: "کد ارسال شد", description: "کد تایید به شماره موبایل شما ارسال شد" });
      },
      onError: () => toast({ title: "خطا", variant: "destructive" }),
    });
  };

  const handleLogin = () => {
    if (!otp || otp.length !== 6) { toast({ title: "کد نامعتبر", variant: "destructive" }); return; }
    loginUser.mutate({ data: { mobile: phone, otp } }, {
      onSuccess: (data) => {
        login(data.token, data.user);
        toast({ title: "خوش آمدید", description: `سلام ${data.user.name || "کاربر عزیز"}!` });
        navigate("/profile");
      },
      onError: () => toast({ title: "کد اشتباه است", variant: "destructive" }),
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-primary mb-2">کودک‌لند</h1>
          <p className="text-muted-foreground">ورود یا ثبت‌نام</p>
        </div>

        <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-sm">
          {step === "phone" ? (
            <div className="flex flex-col gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="font-black text-xl text-center mb-1">شماره موبایل</h2>
                <p className="text-muted-foreground text-sm text-center">کد تایید به این شماره ارسال می‌شود</p>
              </div>
              <input
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹" type="tel" maxLength={11}
                className="h-12 rounded-xl bg-muted border-none px-4 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
                onKeyDown={e => e.key === "Enter" && handleSendOtp()}
              />
              <Button onClick={handleSendOtp} className="rounded-full h-12 font-bold" disabled={sendOtp.isPending}>
                {sendOtp.isPending ? "در حال ارسال..." : "ارسال کد تایید"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="font-black text-xl text-center mb-1">کد تایید</h2>
                <p className="text-muted-foreground text-sm text-center">کد ارسال شده به {phone} را وارد کنید</p>
                {devOtp && <p className="text-xs text-primary text-center mt-1">(کد آزمایشی: {devOtp})</p>}
              </div>
              <input
                value={otp} onChange={e => setOtp(e.target.value)}
                placeholder="۱۲۳۴۵۶" type="text" maxLength={6}
                className="h-12 rounded-xl bg-muted border-none px-4 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
              <Button onClick={handleLogin} className="rounded-full h-12 font-bold" disabled={loginUser.isPending}>
                {loginUser.isPending ? "در حال ورود..." : "ورود"}
              </Button>
              <button onClick={() => { setStep("phone"); setOtp(""); }} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" /> تغییر شماره
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
