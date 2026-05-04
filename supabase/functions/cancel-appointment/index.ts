import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

const deleteCalendarEvent = async (eventId: string) => {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GCAL_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
  if (!LOVABLE_API_KEY || !GCAL_API_KEY) return;
  try {
    const res = await fetch(`${GATEWAY_URL}/calendars/primary/events/${encodeURIComponent(eventId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GCAL_API_KEY },
    });
    if (!res.ok && res.status !== 404 && res.status !== 410) {
      console.error("Calendar delete failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("Calendar delete error", err);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roles) return new Response(JSON.stringify({ error: "Permisos insuficientes" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { id, action } = await req.json();
    if (typeof id !== "string" || !["cancel", "delete"].includes(action)) {
      return new Response(JSON.stringify({ error: "Parámetros inválidos" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: appt } = await admin.from("appointments").select("google_event_id").eq("id", id).maybeSingle();
    if (appt?.google_event_id) await deleteCalendarEvent(appt.google_event_id);

    if (action === "cancel") {
      await admin.from("appointments").update({ status: "cancelled", google_event_id: null }).eq("id", id);
    } else {
      await admin.from("appointments").delete().eq("id", id);
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("cancel-appointment error", err);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
