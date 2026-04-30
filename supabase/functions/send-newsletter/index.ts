// Sends a newsletter campaign to all active subscribers.
// Auth: requires the caller to be an admin (verified via user JWT).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM = "Avendaño Serrano Abogados <onboarding@resend.dev>";

function buildEmailHtml(opts: {
  title: string;
  bodyHtml: string;
  coverImageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  unsubUrl: string;
}) {
  const cover = opts.coverImageUrl
    ? `<img src="${opts.coverImageUrl}" alt="" style="width:100%;height:auto;display:block;border-radius:8px;margin-bottom:24px;" />`
    : "";
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `<div style="text-align:center;margin:32px 0;"><a href="${opts.ctaUrl}" style="background:#0a1929;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:15px;">${opts.ctaLabel}</a></div>`
      : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5;">
  <div style="font-family:Georgia,'Times New Roman',serif;max-width:640px;margin:0 auto;background:#ffffff;">
    <div style="background:#0a1929;padding:24px 30px;text-align:center;">
      <h1 style="color:#ffffff;font-size:20px;margin:0;letter-spacing:1px;font-family:Georgia,serif;">AVENDAÑO SERRANO ABOGADOS</h1>
    </div>
    <div style="padding:40px 30px;color:#1a2332;">
      ${cover}
      <h2 style="font-size:26px;color:#0a1929;margin:0 0 20px;line-height:1.3;">${opts.title}</h2>
      <div style="font-size:16px;line-height:1.7;color:#374151;">${opts.bodyHtml}</div>
      ${cta}
    </div>
    <div style="background:#f8f9fa;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="font-size:12px;color:#6b7280;margin:0 0 8px;">Avendaño Serrano Abogados · +34 645 04 16 64</p>
      <p style="font-size:11px;color:#9ca3af;margin:0;">Recibes este email porque te suscribiste a nuestra newsletter. <a href="${opts.unsubUrl}" style="color:#6b7280;">Darse de baja</a></p>
    </div>
  </div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "No user" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { campaignId } = await req.json();
    if (!campaignId) return new Response(JSON.stringify({ error: "campaignId requerido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: campaign, error: cErr } = await admin.from("newsletter_campaigns").select("*").eq("id", campaignId).single();
    if (cErr || !campaign) return new Response(JSON.stringify({ error: "Campaña no encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (campaign.status === "sent") return new Response(JSON.stringify({ error: "Ya enviada" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: subs } = await admin.from("newsletter_subscribers").select("email, unsubscribe_token").eq("status", "active");
    const subscribers = subs || [];

    const origin = req.headers.get("origin") || "https://avendanoserrano.com";
    let sent = 0, failed = 0;

    // Send sequentially with small delay to respect rate limits
    for (const sub of subscribers) {
      const unsubUrl = `${origin}/newsletter-unsubscribe?token=${sub.unsubscribe_token}`;
      const html = buildEmailHtml({
        title: campaign.title,
        bodyHtml: campaign.content_html,
        coverImageUrl: campaign.cover_image_url,
        ctaLabel: campaign.cta_label,
        ctaUrl: campaign.cta_url,
        unsubUrl,
      });
      try {
        const r = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          },
          body: JSON.stringify({ from: FROM, to: [sub.email], subject: campaign.subject, html }),
        });
        if (r.ok) sent++; else { failed++; console.error("send fail", await r.text()); }
      } catch (e) {
        failed++;
        console.error(e);
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    await admin.from("newsletter_campaigns").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      recipient_count: sent,
    }).eq("id", campaignId);

    if (campaign.blog_post_id) {
      await admin.from("newsletter_blog_sent").upsert({ blog_post_id: campaign.blog_post_id, campaign_id: campaignId });
    }

    return new Response(JSON.stringify({ ok: true, sent, failed, total: subscribers.length }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
