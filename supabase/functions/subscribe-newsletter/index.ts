import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM = "Avendaño Serrano Abogados <onboarding@resend.dev>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, language = "es" } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      return new Response(JSON.stringify({ error: "Email inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const normalized = email.trim().toLowerCase();
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Upsert (re-activate if previously unsubscribed)
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, status, unsubscribe_token")
      .eq("email", normalized)
      .maybeSingle();

    let token: string;
    if (existing) {
      if (existing.status === "active") {
        return new Response(JSON.stringify({ ok: true, already: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: upd } = await supabase
        .from("newsletter_subscribers")
        .update({ status: "active", unsubscribed_at: null, language })
        .eq("id", existing.id)
        .select("unsubscribe_token")
        .single();
      token = upd!.unsubscribe_token;
    } else {
      const { data: ins, error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: normalized, language, source: "popup" })
        .select("unsubscribe_token")
        .single();
      if (error) throw error;
      token = ins.unsubscribe_token;
    }

    // Welcome email
    const origin = req.headers.get("origin") || "https://avendanoserrano.com";
    const unsubUrl = `${origin}/newsletter-unsubscribe?token=${token}`;
    const html = `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#ffffff;color:#1a2332;padding:40px 30px;">
        <h1 style="font-size:24px;color:#0a1929;margin:0 0 16px;">¡Bienvenido/a!</h1>
        <p style="font-size:15px;line-height:1.6;color:#374151;">Gracias por suscribirte a la newsletter de <strong>Avendaño Serrano Abogados</strong>. Recibirás nuestras nuevas publicaciones del blog, novedades y comunicaciones importantes.</p>
        <p style="font-size:13px;color:#6b7280;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;">¿No deseas recibir más emails? <a href="${unsubUrl}" style="color:#0a1929;">Darse de baja</a></p>
      </div>`;

    if (RESEND_API_KEY) {
      await fetch("https://connector-gateway.lovable.dev/resend/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({ from: FROM, to: [normalized], subject: "Bienvenido/a a la newsletter", html }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
