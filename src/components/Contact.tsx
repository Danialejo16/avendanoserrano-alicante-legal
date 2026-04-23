import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement).value.trim(),
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value.trim(),
    };

    try {
      const id = crypto.randomUUID();
      await supabase.from("contact_submissions").insert({ ...formData, id });
      await supabase.functions.invoke("send-contact-email", { body: formData });
      setSubmitted(true);
    } catch (error) {
      toast({
        title: t("contact.errorTitle"),
        description: t("contact.errorText"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const items = [
    { icon: MapPin, label: t("contact.address"), value: t("contact.addressValue") },
    { icon: Phone, label: t("contact.phone"), value: "+34 645 04 16 64" },
    { icon: Mail, label: t("contact.email"), value: "info@avendanoserrano.es" },
    { icon: Clock, label: t("contact.hours"), value: t("contact.hoursValue") },
  ];

  return (
    <section id="contacto" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-highlight" />
            <span className="text-highlight text-sm tracking-[0.3em] uppercase font-body">{t("contact.tagline")}</span>
            <div className="w-8 h-[2px] bg-highlight" />
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("contact.title")}
          </h2>
          <p className="text-muted-foreground font-body text-lg max-w-xl mx-auto">
            {t("contact.subtitle")}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {items.map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-navy-deep flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-highlight-light" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-body">{item.label}</p>
                  <p className="font-body font-medium text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            {submitted ? (
              <div className="bg-card border border-highlight/30 rounded-lg p-12 text-center">
                <div className="w-16 h-16 rounded-full accent-gradient flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-accent-foreground" />
                </div>
                <h3 className="font-heading text-2xl font-semibold text-foreground mb-2">{t("contact.successTitle")}</h3>
                <p className="text-muted-foreground font-body">{t("contact.successText")}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-body text-muted-foreground mb-1.5 block">{t("contact.name")}</label>
                    <input name="name" type="text" required className="w-full border border-border bg-background rounded px-4 py-3 font-body text-foreground focus:outline-none focus:border-highlight transition-colors" />
                  </div>
                  <div>
                    <label className="text-sm font-body text-muted-foreground mb-1.5 block">{t("contact.phoneField")}</label>
                    <input name="phone" type="tel" required className="w-full border border-border bg-background rounded px-4 py-3 font-body text-foreground focus:outline-none focus:border-highlight transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1.5 block">{t("contact.emailField")}</label>
                  <input name="email" type="email" required className="w-full border border-border bg-background rounded px-4 py-3 font-body text-foreground focus:outline-none focus:border-highlight transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1.5 block">{t("contact.help")}</label>
                  <textarea name="message" rows={5} required className="w-full border border-border bg-background rounded px-4 py-3 font-body text-foreground focus:outline-none focus:border-highlight transition-colors resize-none" />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full accent-gradient text-accent-foreground py-3.5 rounded font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? t("contact.submitting") : t("contact.submit")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
