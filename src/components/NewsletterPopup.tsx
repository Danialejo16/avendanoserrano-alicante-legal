import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getConsent, onConsentChange } from "@/lib/cookies";

const STORAGE_KEY = "newsletter-popup-state"; // values: "subscribed" | "dismissed"
const DELAY_MS = 12000; // 12s after first visit

const NewsletterPopup = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const evaluate = () => {
      const state = localStorage.getItem(STORAGE_KEY);
      if (state) return; // already subscribed or dismissed
      const consent = getConsent();
      if (!consent || !consent.marketing) return; // requires marketing consent
      const timer = setTimeout(() => setVisible(true), DELAY_MS);
      return () => clearTimeout(timer);
    };
    const cleanup = evaluate();
    const off = onConsentChange(() => {
      // re-evaluate on consent change
      setVisible(false);
      evaluate();
    });
    return () => {
      if (typeof cleanup === "function") cleanup();
      off();
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setVisible(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || trimmed.length > 255) {
      toast({ title: t("newsletter.invalidEmail"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email: trimmed, language: i18n.language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      localStorage.setItem(STORAGE_KEY, "subscribed");
      toast({ title: t("newsletter.successTitle"), description: t("newsletter.successDesc") });
      setVisible(false);
    } catch (err: any) {
      toast({ title: t("newsletter.errorTitle"), description: err?.message ?? "", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[90] w-[calc(100vw-3rem)] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-background border border-border rounded-xl shadow-2xl p-5 relative">
        <button
          onClick={dismiss}
          aria-label={t("newsletter.close")}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground leading-tight">
              {t("newsletter.title")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{t("newsletter.subtitle")}</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("newsletter.placeholder")}
            required
            maxLength={255}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting ? "..." : t("newsletter.subscribe")}
            </Button>
            <Button type="button" variant="ghost" onClick={dismiss} className="text-xs">
              {t("newsletter.noThanks")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewsletterPopup;
