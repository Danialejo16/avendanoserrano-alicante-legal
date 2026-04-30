import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const NewsletterUnsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { t } = useTranslation();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [email, setEmail] = useState<string | null>(null);

  const confirm = async () => {
    if (!token) return;
    setState("loading");
    try {
      const { data, error } = await supabase.functions.invoke("unsubscribe-newsletter", { body: { token } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setEmail(data?.email ?? null);
      setState("success");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    document.title = t("newsletter.unsubTitle") + " · Avendaño Serrano Abogados";
  }, [t]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-secondary/10">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          {!token ? (
            <>
              <XCircle className="w-12 h-12 mx-auto text-destructive" />
              <h1 className="text-2xl font-bold">{t("newsletter.invalidLink")}</h1>
              <Button asChild variant="outline">
                <Link to="/">{t("newsletter.goHome")}</Link>
              </Button>
            </>
          ) : state === "success" ? (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
              <h1 className="text-2xl font-bold">{t("newsletter.unsubDone")}</h1>
              <p className="text-muted-foreground text-sm">
                {email ? t("newsletter.unsubDoneFor", { email }) : t("newsletter.unsubDoneGeneric")}
              </p>
              <Button asChild>
                <Link to="/">{t("newsletter.goHome")}</Link>
              </Button>
            </>
          ) : state === "error" ? (
            <>
              <XCircle className="w-12 h-12 mx-auto text-destructive" />
              <h1 className="text-2xl font-bold">{t("newsletter.unsubError")}</h1>
              <Button onClick={confirm} variant="outline">{t("newsletter.tryAgain")}</Button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{t("newsletter.unsubConfirmTitle")}</h1>
              <p className="text-muted-foreground text-sm">{t("newsletter.unsubConfirmText")}</p>
              <div className="flex gap-2 justify-center">
                <Button asChild variant="outline">
                  <Link to="/">{t("newsletter.cancel")}</Link>
                </Button>
                <Button onClick={confirm} disabled={state === "loading"} variant="destructive">
                  {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : t("newsletter.confirmUnsub")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsletterUnsubscribe;
