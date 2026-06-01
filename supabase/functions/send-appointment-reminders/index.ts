import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Runs via cron. Sends reminder emails for appointments happening tomorrow.
// Protected by a shared cron secret stored in Supabase Vault.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authenticate the caller: must present the cron secret from Vault.
    const auth = req.headers.get("Authorization") ?? "";
    const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const { data: secretRow } = await supabase
      .schema("vault" as any)
      .from("decrypted_secrets")
      .select("decrypted_secret")
      .eq("name", "cron_secret")
      .maybeSingle();
    const expected = (secretRow as any)?.decrypted_secret ?? "";
    if (!expected || provided !== expected) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tomorrow in Europe/Madrid (approx; date-only is fine)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dateStr = tomorrow.toISOString().slice(0, 10);

    const { data: appts, error } = await supabase
      .from("appointments")
      .select("id, client_name, client_email, service_name, appointment_date, appointment_hour, status, reminder_sent_at")
      .eq("appointment_date", dateStr)
      .eq("status", "confirmed")
      .not("client_email", "is", null)
      .is("reminder_sent_at", null);

    if (error) throw error;

    let sent = 0;
    for (const a of appts ?? []) {
      try {
        const res = await supabase.functions.invoke("send-appointment-email", {
          body: {
            type: "reminder",
            to: a.client_email,
            client_name: a.client_name,
            service_name: a.service_name,
            appointment_date: a.appointment_date,
            appointment_hour: a.appointment_hour,
          },
        });
        if (!res.error) {
          await supabase.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", a.id);
          sent++;
        }
      } catch (e) {
        console.error("reminder send failed", a.id, e);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: appts?.length ?? 0, sent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-appointment-reminders error", err);
    return new Response(JSON.stringify({ success: false, error: "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
