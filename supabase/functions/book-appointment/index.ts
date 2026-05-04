import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

interface BookBody {
  service_id: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_hour: number;
  client_name: string;
  client_phone: string;
  client_email?: string;
  notes?: string;
}

const validate = (b: any): { ok: true; data: BookBody } | { ok: false; error: string } => {
  if (!b || typeof b !== "object") return { ok: false, error: "Body inválido" };
  const { service_id, appointment_date, appointment_hour, client_name, client_phone, client_email, notes } = b;
  if (typeof service_id !== "string" || service_id.length < 10) return { ok: false, error: "Servicio inválido" };
  if (typeof appointment_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) return { ok: false, error: "Fecha inválida" };
  if (typeof appointment_hour !== "number" || appointment_hour < 9 || appointment_hour > 17) return { ok: false, error: "Hora inválida" };
  if (typeof client_name !== "string" || client_name.trim().length === 0 || client_name.length > 100) return { ok: false, error: "Nombre inválido" };
  if (typeof client_phone !== "string" || client_phone.trim().length === 0 || client_phone.length > 30) return { ok: false, error: "Teléfono inválido" };
  if (client_email != null && (typeof client_email !== "string" || client_email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email))) return { ok: false, error: "Email inválido" };
  if (notes != null && (typeof notes !== "string" || notes.length > 500)) return { ok: false, error: "Notas demasiado largas" };
  return { ok: true, data: { service_id, appointment_date, appointment_hour, client_name: client_name.trim(), client_phone: client_phone.trim(), client_email: client_email?.trim() || undefined, notes: notes?.trim() || undefined } };
};

const createCalendarEvent = async (params: {
  summary: string;
  description: string;
  date: string;
  hour: number;
}): Promise<string | null> => {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GCAL_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
  if (!LOVABLE_API_KEY || !GCAL_API_KEY) {
    console.warn("Calendar credentials missing, skipping calendar event");
    return null;
  }
  try {
    const start = `${params.date}T${String(params.hour).padStart(2, "0")}:00:00`;
    const end = `${params.date}T${String(params.hour + 1).padStart(2, "0")}:00:00`;
    const res = await fetch(`${GATEWAY_URL}/calendars/primary/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GCAL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: params.summary,
        description: params.description,
        start: { dateTime: start, timeZone: "Europe/Madrid" },
        end: { dateTime: end, timeZone: "Europe/Madrid" },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Google Calendar error", res.status, data);
      return null;
    }
    return data.id ?? null;
  } catch (err) {
    console.error("Calendar create failed", err);
    return null;
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const v = validate(body);
    if (!v.ok) {
      return new Response(JSON.stringify({ error: v.error }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = v.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate service exists & active
    const { data: svc, error: svcErr } = await supabase.from("services").select("id, name, active").eq("id", data.service_id).maybeSingle();
    if (svcErr || !svc || !svc.active) {
      return new Response(JSON.stringify({ error: "Servicio no disponible" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check date is not in the past
    const today = new Date().toISOString().slice(0, 10);
    if (data.appointment_date < today) {
      return new Response(JSON.stringify({ error: "Fecha en el pasado" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check blocks
    const { data: blocks } = await supabase
      .from("appointment_blocks")
      .select("start_date, end_date, start_hour, end_hour")
      .lte("start_date", data.appointment_date)
      .gte("end_date", data.appointment_date);
    if (blocks && blocks.length > 0) {
      const isBlocked = blocks.some((b: any) => {
        const sh = b.start_hour ?? 0;
        const eh = b.end_hour ?? 23;
        return data.appointment_hour >= sh && data.appointment_hour <= eh;
      });
      if (isBlocked) {
        return new Response(JSON.stringify({ error: "Horario no disponible" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Insert appointment (unique index prevents collisions)
    const { data: inserted, error: insErr } = await supabase
      .from("appointments")
      .insert({
        service_id: svc.id,
        service_name: svc.name,
        client_name: data.client_name,
        client_phone: data.client_phone,
        client_email: data.client_email ?? null,
        appointment_date: data.appointment_date,
        appointment_hour: data.appointment_hour,
        notes: data.notes ?? null,
      })
      .select()
      .single();

    if (insErr) {
      console.error("Insert error", insErr);
      const msg = insErr.code === "23505" ? "Ese horario ya está reservado" : "No se pudo crear la cita";
      return new Response(JSON.stringify({ error: msg }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create Google Calendar event (best effort)
    const eventId = await createCalendarEvent({
      summary: `${svc.name} — ${data.client_name}`,
      description: `Servicio: ${svc.name}\nCliente: ${data.client_name}\nTeléfono: ${data.client_phone}${data.client_email ? `\nEmail: ${data.client_email}` : ""}${data.notes ? `\nNotas: ${data.notes}` : ""}`,
      date: data.appointment_date,
      hour: data.appointment_hour,
    });

    if (eventId) {
      await supabase.from("appointments").update({ google_event_id: eventId }).eq("id", inserted.id);
    }

    return new Response(JSON.stringify({ success: true, appointment: inserted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("book-appointment error", err);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
