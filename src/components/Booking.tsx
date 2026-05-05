import { useEffect, useMemo, useState } from "react";
import { Calendar as CalIcon, Clock, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, addDays, startOfDay, isBefore } from "date-fns";
import { es } from "date-fns/locale";
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
      toast({ title: "Faltan datos", description: "Elige servicio, fecha y hora.", variant: "destructive" });
      return;
    }
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Datos obligatorios", description: "Nombre y teléfono son requeridos.", variant: "destructive" });
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
      toast({ title: "No se pudo reservar", description: err?.message ?? "", variant: "destructive" });
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
        <h3 className="font-heading text-2xl font-semibold mb-2">¡Cita reservada!</h3>
        <p className="text-muted-foreground">
          Te esperamos el {date && format(date, "d 'de' MMMM", { locale: es })} a las{" "}
          {hour !== null && formatHour(hour)}h.
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
          Reservar otra cita
        </Button>
      </div>
    );
  }

  return (
    <section id="citas" className="section-padding bg-secondary/10">
      <div className="max-w-4xl mx-auto">
        <Collapsible>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-highlight" />
              <span className="text-highlight text-sm tracking-[0.3em] uppercase font-body">Agenda</span>
              <div className="w-8 h-[2px] bg-highlight" />
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Solicita tu cita
            </h2>
            <p className="text-muted-foreground font-body text-lg max-w-xl mx-auto mb-6">
              Horario de atención: lunes a viernes de 9:00 a 18:00 h.
            </p>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                className="accent-gradient text-accent-foreground px-8 py-6 text-base font-semibold group"
              >
                <CalIcon className="w-4 h-4 mr-2" />
                Reservar cita
                <ChevronDown className="w-4 h-4 ml-2 transition-transform group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
            <form onSubmit={submit} className="bg-card border border-border rounded-lg p-6 md:p-8 space-y-6 mt-4">
              <div>
                <Label className="mb-2 block">Servicio</Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger><SelectValue placeholder="Elige un servicio" /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                      >
                        <CalIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}
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
                        locale={es}
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
                  <Label className="mb-2 block">Hora</Label>
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
                          {formatHour(h)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ap-name" className="mb-2 block">Nombre *</Label>
                  <Input id="ap-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="ap-phone" className="mb-2 block">Teléfono *</Label>
                  <Input id="ap-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={30} />
                </div>
              </div>

              <div>
                <Label htmlFor="ap-email" className="mb-2 block">Email <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Input id="ap-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
              </div>

              <div>
                <Label htmlFor="ap-notes" className="mb-2 block">Comentario <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Textarea id="ap-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3} />
              </div>

              <Button type="submit" disabled={submitting} className="w-full accent-gradient text-accent-foreground py-6 text-base font-semibold">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar reserva"}
              </Button>
            </form>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </section>);
};

export default Booking;
