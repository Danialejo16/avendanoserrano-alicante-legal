import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Loader2, Trash2, Plus, X, CalendarPlus, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  service_name: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  appointment_date: string;
  appointment_hour: number;
  status: string;
  notes: string | null;
  google_event_id: string | null;
  created_at: string;
}
interface Service { id: string; name: string; description: string | null; active: boolean; sort_order: number; }
interface Block { id: string; start_date: string; end_date: string; start_hour: number | null; end_hour: number | null; reason: string | null; }

const HOURS = Array.from({ length: 9 }, (_, i) => i + 9);

const AdminAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Manual add appt
  const [newAppt, setNewAppt] = useState({ service_id: "", date: "", hour: 9, name: "", phone: "", email: "", notes: "" });
  // New service
  const [newService, setNewService] = useState({ name: "", description: "" });
  // New block
  const [newBlock, setNewBlock] = useState({ start_date: "", end_date: "", start_hour: "", end_hour: "", reason: "" });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/auth", { replace: true }); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
      await refreshAll();
      setLoading(false);
    });
  }, [navigate]);

  const refreshAll = async () => {
    const [a, s, b] = await Promise.all([
      supabase.from("appointments").select("*").order("appointment_date", { ascending: true }).order("appointment_hour", { ascending: true }),
      supabase.from("services").select("*").order("sort_order"),
      supabase.from("appointment_blocks").select("*").order("start_date"),
    ]);
    setAppointments((a.data as Appointment[]) || []);
    setServices((s.data as Service[]) || []);
    setBlocks((b.data as Block[]) || []);
  };

  const cancelAppt = async (id: string, action: "cancel" | "delete") => {
    const { error } = await supabase.functions.invoke("cancel-appointment", { body: { id, action } });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: action === "cancel" ? "Cita anulada" : "Cita eliminada" });
    refreshAll();
  };

  const addAppt = async () => {
    if (!newAppt.service_id || !newAppt.date || !newAppt.name.trim() || !newAppt.phone.trim()) {
      toast({ title: "Faltan datos", variant: "destructive" }); return;
    }
    const svc = services.find((s) => s.id === newAppt.service_id);
    const { error } = await supabase.from("appointments").insert({
      service_id: newAppt.service_id,
      service_name: svc?.name || "",
      client_name: newAppt.name.trim(),
      client_phone: newAppt.phone.trim(),
      client_email: newAppt.email.trim() || null,
      appointment_date: newAppt.date,
      appointment_hour: newAppt.hour,
      notes: newAppt.notes.trim() || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cita añadida" });
    setNewAppt({ service_id: "", date: "", hour: 9, name: "", phone: "", email: "", notes: "" });
    refreshAll();
  };

  const addService = async () => {
    if (!newService.name.trim()) return;
    const max = Math.max(0, ...services.map((s) => s.sort_order));
    const { error } = await supabase.from("services").insert({ name: newService.name.trim(), description: newService.description.trim() || null, sort_order: max + 1 });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewService({ name: "", description: "" });
    refreshAll();
  };

  const toggleService = async (s: Service) => {
    await supabase.from("services").update({ active: !s.active }).eq("id", s.id);
    refreshAll();
  };

  const deleteService = async (id: string) => {
    await supabase.from("services").delete().eq("id", id);
    refreshAll();
  };

  const addBlock = async () => {
    if (!newBlock.start_date || !newBlock.end_date) { toast({ title: "Faltan fechas", variant: "destructive" }); return; }
    const { error } = await supabase.from("appointment_blocks").insert({
      start_date: newBlock.start_date,
      end_date: newBlock.end_date,
      start_hour: newBlock.start_hour ? Number(newBlock.start_hour) : null,
      end_hour: newBlock.end_hour ? Number(newBlock.end_hour) : null,
      reason: newBlock.reason.trim() || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewBlock({ start_date: "", end_date: "", start_hour: "", end_hour: "", reason: "" });
    refreshAll();
  };

  const deleteBlock = async (id: string) => {
    await supabase.from("appointment_blocks").delete().eq("id", id);
    refreshAll();
  };

  if (loading || isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }
  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Acceso denegado</div>;
  }

  return (
    <div className="min-h-screen bg-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="mb-2">
              <ArrowLeft className="h-4 w-4" /> Panel
            </Button>
            <h1 className="text-3xl font-bold">Citas</h1>
          </div>
        </div>

        <Tabs defaultValue="appointments">
          <TabsList>
            <TabsTrigger value="appointments">Citas ({appointments.filter(a => a.status !== "cancelled").length})</TabsTrigger>
            <TabsTrigger value="add">Añadir cita</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="blocks">Bloqueos</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-3 mt-4">
            {appointments.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No hay citas todavía.</CardContent></Card>}
            {appointments.map((a) => (
              <Card key={a.id} className={a.status === "cancelled" ? "opacity-60" : ""}>
                <CardContent className="p-5 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold">{format(new Date(a.appointment_date + "T00:00:00"), "EEEE d MMM yyyy", { locale: es })}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="font-semibold text-highlight">{String(a.appointment_hour).padStart(2, "0")}:00</span>
                      {a.status === "cancelled" && <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded">Anulada</span>}
                      {a.google_event_id && <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">📅 Google</span>}
                    </div>
                    <p className="text-sm"><strong>{a.client_name}</strong> · {a.service_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.client_phone}{a.client_email ? ` · ${a.client_email}` : ""}</p>
                    {a.notes && <p className="text-xs text-muted-foreground mt-1 italic">{a.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    {a.status !== "cancelled" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="sm" variant="outline"><Ban className="h-4 w-4" /> Anular</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>¿Anular esta cita?</AlertDialogTitle><AlertDialogDescription>Se eliminará del calendario de Google.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => cancelAppt(a.id, "cancel")}>Anular</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Eliminar definitivamente?</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => cancelAppt(a.id, "delete")}>Eliminar</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="add" className="mt-4">
            <Card><CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><CalendarPlus className="h-4 w-4" /> Añadir cita manualmente</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Servicio</Label>
                  <Select value={newAppt.service_id} onValueChange={(v) => setNewAppt({ ...newAppt, service_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Elige servicio" /></SelectTrigger>
                    <SelectContent>{services.filter(s => s.active).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha</Label>
                  <Input type="date" value={newAppt.date} onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })} />
                </div>
                <div>
                  <Label>Hora</Label>
                  <Select value={String(newAppt.hour)} onValueChange={(v) => setNewAppt({ ...newAppt, hour: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{HOURS.map(h => <SelectItem key={h} value={String(h)}>{String(h).padStart(2,"0")}:00</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Nombre</Label><Input value={newAppt.name} onChange={(e) => setNewAppt({ ...newAppt, name: e.target.value })} /></div>
                <div><Label>Teléfono</Label><Input value={newAppt.phone} onChange={(e) => setNewAppt({ ...newAppt, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={newAppt.email} onChange={(e) => setNewAppt({ ...newAppt, email: e.target.value })} /></div>
              </div>
              <div><Label>Notas</Label><Textarea value={newAppt.notes} onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })} rows={2} /></div>
              <Button onClick={addAppt} className="w-full"><Plus className="h-4 w-4" /> Añadir cita</Button>
              <p className="text-xs text-muted-foreground">Las citas añadidas manualmente no se sincronizan con Google Calendar.</p>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-3 mt-4">
            <Card><CardContent className="p-6 space-y-3">
              <h3 className="font-semibold">Nuevo servicio</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Input placeholder="Nombre" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
                <Input placeholder="Descripción (opcional)" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
              </div>
              <Button onClick={addService}><Plus className="h-4 w-4" /> Añadir</Button>
            </CardContent></Card>
            {services.map(s => (
              <Card key={s.id}><CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1"><p className="font-semibold">{s.name}</p>{s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}</div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2"><span className="text-xs">Activo</span><Switch checked={s.active} onCheckedChange={() => toggleService(s)} /></div>
                  <Button size="icon" variant="ghost" onClick={() => deleteService(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent></Card>
            ))}
          </TabsContent>

          <TabsContent value="blocks" className="space-y-3 mt-4">
            <Card><CardContent className="p-6 space-y-3">
              <h3 className="font-semibold">Bloquear franja</h3>
              <p className="text-xs text-muted-foreground">Vacaciones, festivos o pausas. Si dejas las horas vacías se bloquea el día entero.</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>Desde</Label><Input type="date" value={newBlock.start_date} onChange={(e) => setNewBlock({ ...newBlock, start_date: e.target.value })} /></div>
                <div><Label>Hasta</Label><Input type="date" value={newBlock.end_date} onChange={(e) => setNewBlock({ ...newBlock, end_date: e.target.value })} /></div>
                <div><Label>Hora inicio (opcional)</Label><Input type="number" min={9} max={17} value={newBlock.start_hour} onChange={(e) => setNewBlock({ ...newBlock, start_hour: e.target.value })} /></div>
                <div><Label>Hora fin (opcional)</Label><Input type="number" min={9} max={17} value={newBlock.end_hour} onChange={(e) => setNewBlock({ ...newBlock, end_hour: e.target.value })} /></div>
              </div>
              <Input placeholder="Motivo (opcional)" value={newBlock.reason} onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })} />
              <Button onClick={addBlock}><Plus className="h-4 w-4" /> Añadir bloqueo</Button>
            </CardContent></Card>
            {blocks.map(b => (
              <Card key={b.id}><CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm">{b.start_date} → {b.end_date}{b.start_hour != null && ` · ${b.start_hour}:00-${b.end_hour ?? b.start_hour}:00`}</p>
                  {b.reason && <p className="text-xs text-muted-foreground">{b.reason}</p>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteBlock(b.id)}><X className="h-4 w-4" /></Button>
              </CardContent></Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminAppointments;
