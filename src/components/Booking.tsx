import { useEffect, useMemo, useState } from "react";
import { Calendar as CalIcon, Clock, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, addDays, startOfDay, isBefore } from "date-fns";
import { es, enUS, ar, ru, zhCN } from "date-fns/locale";
import { useTranslation } from "react-i18next";

const dateLocales: Record<string, any> = { es, en: enUS, ar, ru, zh: zhCN };
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Service {
  id: string;
  name: string;
  description: string | null;
}

const HOURS = Array.from({ length: 9 }, (_, i) => i + 9); // 9..17

const formatHour = (h: number) => `${String(h).padStart(2, "0")}:00`;

const Booking = () => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const dl = dateLocales[i18n.language] || es;
  const [services, setServices] = useState<Service[]>([]);
  const [date, setDate] = useState<Date | undefined>();
  const [hour, setHour] = useState<number | null>(null);
  const [serviceId, setServiceId] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [blocks, setBlocks] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase
      .from("services")
      .select("id, name, description")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => setServices((data as Service[]) || []));
    const today = new Date();
    const to = addDays(today, 90);
    supabase
      .rpc("get_busy_slots", {
        _from: format(today, "yyyy-MM-dd"),
        _to: format(to, "yyyy-MM-dd"),
      })
      .then(({ data }) => {
        const set = new Set<string>();
        (data as any[] | null)?.forEach((r) => set.add(`${r.appointment_date}_${r.appointment_hour}`));
        setBusy(set);
      });
    supabase
      .from("appointment_blocks")
      .select("start_date, end_date, start_hour, end_hour")
      .gte("end_date", format(today, "yyyy-MM-dd"))
      .then(({ data }) => setBlocks(data || []));
  }, []);

  const dateStr = date ? format(date, "yyyy-MM-dd") : "";

  const isHourBlocked = (h: number) => {
    if (!dateStr) return false;
    return blocks.some((b: any) => {
      if (dateStr < b.start_date || dateStr > b.end_date) return false;
      const sh = b.start_hour ?? 0;
      const eh = b.end_hour ?? 23;
      return h >= sh && h <= eh;
    });
  };

  const isDateFullyBlocked = (d: Date) => {
    const ds = format(d, "yyyy-MM-dd");
    return blocks.some(
      (b: any) =>
        ds >= b.start_date &&
        ds <= b.end_date &&
        (b.start_hour ?? 0) <= 9 &&
        (b.end_hour ?? 23) >= 17,
    );
  };

  const availableHours = useMemo(() => {
    if (!date) return [];
    return HOURS.filter((h) => !busy.has(`${dateStr}_${h}`) && !isHourBlocked(h));
  }, [date, busy, blocks, dateStr]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !date || hour === null) {
      toast({ title: t("booking.missingTitle"), description: t("booking.missingDesc"), variant: "destructive" });
      return;
    }
    if (!name.trim() || !phone.trim()) {
      toast({ title: t("booking.requiredTitle"), description: t("booking.requiredDesc"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("book-appointment", {
        body: {
          service_id: serviceId,
          appointment_date: dateStr,
          appointment_hour: hour,
          client_name: name.trim(),
          client_phone: phone.trim(),
          client_email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setDone(true);
      setBusy((prev) => new Set(prev).add(`${dateStr}_${hour}`));
    } catch (err: any) {
      toast({ title: t("booking.bookErrorTitle"), description: err?.message ?? "", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div id="citas" className="max-w-2xl mx-auto bg-card border border-highlight/30 rounded-lg p-12 text-center mt-12">
        <div className="w-16 h-16 rounded-full accent-gradient flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-accent-foreground" />
        </div>
        <h3 className="font-heading text-2xl font-semibold mb-2">{t("booking.doneTitle")}</h3>
        <p className="text-muted-foreground">
          {t("booking.doneText", {
            date: date ? format(date, "PPP", { locale: dl }) : "",
            time: hour !== null ? formatHour(hour) : "",
          })}
        </p>
        <Button
          onClick={() => {
            setDone(false);
            setHour(null);
            setName("");
            setPhone("");
            setEmail("");
            setNotes("");
          }}
          className="mt-6"
          variant="outline"
        >
          {t("booking.bookAnother")}
        </Button>
      </div>
    );
  }

  return (
    <div id="citas" className="mt-10 pt-10 border-t border-border">
      <Collapsible>
        <div className="text-center mb-2">
          <h3 className="font-heading text-xl md:text-2xl font-semibold text-foreground mb-2">
            {t("booking.heading")}
          </h3>
          <p className="text-muted-foreground font-body text-sm mb-4">
            {t("booking.schedule")}
          </p>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="group"
            >
              <CalIcon className="w-4 h-4 mr-2" />
              {t("booking.bookCta")}
              <ChevronDown className="w-4 h-4 ml-2 transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
          <form onSubmit={submit} className="bg-card border border-border rounded-lg p-6 md:p-8 space-y-6 mt-4">
            <div>
              <Label className="mb-2 block">{t("booking.service")}</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger><SelectValue placeholder={t("booking.servicePlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">{t("booking.date")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: dl }) : t("booking.datePlaceholder")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        setDate(d);
                        setHour(null);
                      }}
                      locale={dl}
                      disabled={(d) => {
                        const today = startOfDay(new Date());
                        if (isBefore(d, today)) return true;
                        const dow = d.getDay();
                        if (dow === 0 || dow === 6) return true;
                        if (isDateFullyBlocked(d)) return true;
                        return false;
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="mb-2 block">{t("booking.time")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {HOURS.map((h) => {
                    const taken = !date || !availableHours.includes(h);
                    return (
                      <button
                        key={h}
                        type="button"
                        disabled={taken}
                        onClick={() => setHour(h)}
                        className={cn(
                          "py-2 rounded text-sm font-medium border transition-colors",
                          hour === h
                            ? "bg-navy-deep text-primary-foreground border-navy-deep"
                            : taken
                            ? "bg-muted text-muted-foreground/50 border-border cursor-not-allowed line-through"
                            : "bg-background text-foreground border-border hover:border-highlight",
                        )}
                      >
                        <Clock className="w-3 h-3 inline mr-1" />
                        <span dir="ltr">{formatHour(h)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ap-name" className="mb-2 block">{t("booking.name")}</Label>
                <Input id="ap-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
              </div>
              <div>
                <Label htmlFor="ap-phone" className="mb-2 block">{t("booking.phone")}</Label>
                <Input id="ap-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={30} />
              </div>
            </div>

            <div>
              <Label htmlFor="ap-email" className="mb-2 block">{t("booking.email")} <span className="text-muted-foreground text-xs">{t("booking.optional")}</span></Label>
              <Input id="ap-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>

            <div>
              <Label htmlFor="ap-notes" className="mb-2 block">{t("booking.comment")} <span className="text-muted-foreground text-xs">{t("booking.optional")}</span></Label>
              <Textarea id="ap-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3} />
            </div>

            <Button type="submit" disabled={submitting} className="w-full accent-gradient text-accent-foreground py-6 text-base font-semibold">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("booking.confirm")}
            </Button>
          </form>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default Booking;
