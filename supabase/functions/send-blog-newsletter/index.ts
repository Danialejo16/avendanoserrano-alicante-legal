// Sends a blog post as a newsletter campaign — only if not already sent.
// Auth: admin only.
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

    const { blogPostId } = await req.json();
    if (!blogPostId) return new Response(JSON.stringify({ error: "blogPostId requerido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Already sent?
    const { data: alreadySent } = await admin.from("newsletter_blog_sent").select("blog_post_id").eq("blog_post_id", blogPostId).maybeSingle();
    if (alreadySent) return new Response(JSON.stringify({ ok: true, skipped: true, reason: "already_sent" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: post } = await admin.from("blog_posts").select("id,title,slug,excerpt,cover_image_url,status").eq("id", blogPostId).single();
    if (!post || post.status !== "published") return new Response(JSON.stringify({ error: "Entrada no publicada" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const origin = req.headers.get("origin") || "https://avendanoserrano.com";
    const postUrl = `${origin}/blog/${post.slug}`;

    // Create campaign
    const bodyHtml = `<p>${(post.excerpt || "").replace(/</g, "&lt;") || "Hemos publicado una nueva entrada en nuestro blog. Léela completa en nuestra web."}</p>`;
    const { data: campaign, error: campErr } = await admin.from("newsletter_campaigns").insert({
      title: post.title,
      subject: `Nueva entrada: ${post.title}`,
      content_html: bodyHtml,
      campaign_type: "blog",
      blog_post_id: post.id,
      cover_image_url: post.cover_image_url,
      cta_label: "Leer entrada completa",
      cta_url: postUrl,
      status: "sending",
      created_by: user.id,
    }).select().single();
    if (campErr) throw campErr;

    const { data: subs } = await admin.from("newsletter_subscribers").select("email, unsubscribe_token").eq("status", "active");
    const subscribers = subs || [];
    let sent = 0;

    for (const sub of subscribers) {
      const unsubUrl = `${origin}/newsletter-unsubscribe?token=${sub.unsubscribe_token}`;
      const cover = post.cover_image_url ? `<img src="${post.cover_image_url}" alt="" style="width:100%;height:auto;display:block;border-radius:8px;margin-bottom:24px;" />` : "";
      const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5;">
<div style="font-family:Georgia,'Times New Roman',serif;max-width:640px;margin:0 auto;background:#ffffff;">
  <div style="background:#0a1929;padding:24px 30px;text-align:center;">
    <h1 style="color:#ffffff;font-size:20px;margin:0;letter-spacing:1px;">AVENDAÑO SERRANO ABOGADOS</h1>
  </div>
  <div style="padding:40px 30px;color:#1a2332;">
    <p style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Nueva entrada en el blog</p>
    ${cover}
    <h2 style="font-size:26px;color:#0a1929;margin:0 0 16px;line-height:1.3;">${post.title}</h2>
    ${bodyHtml}
    <div style="text-align:center;margin:32px 0;"><a href="${postUrl}" style="background:#0a1929;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;">Leer entrada completa</a></div>
  </div>
  <div style="background:#f8f9fa;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="font-size:12px;color:#6b7280;margin:0 0 8px;">Avendaño Serrano Abogados · +34 645 04 16 64</p>
    <p style="font-size:11px;color:#9ca3af;margin:0;">Recibes este email porque te suscribiste a nuestra newsletter. <a href="${unsubUrl}" style="color:#6b7280;">Darse de baja</a></p>
  </div>
</div></body></html>`;
      try {
        const r = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": RESEND_API_KEY },
          body: JSON.stringify({ from: FROM, to: [sub.email], subject: `Nueva entrada: ${post.title}`, html }),
        });
        if (r.ok) sent++;
      } catch (e) { console.error(e); }
      await new Promise((r) => setTimeout(r, 120));
    }

    await admin.from("newsletter_campaigns").update({ status: "sent", sent_at: new Date().toISOString(), recipient_count: sent }).eq("id", campaign.id);
    await admin.from("newsletter_blog_sent").upsert({ blog_post_id: post.id, campaign_id: campaign.id });

    return new Response(JSON.stringify({ ok: true, sent, total: subscribers.length }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
