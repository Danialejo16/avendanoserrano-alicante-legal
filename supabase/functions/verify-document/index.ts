// Public document verification endpoint.
// Accepts a verification code, looks up the document with the service role,
// increments the view counter and returns metadata plus a short-lived signed URL.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let code = url.searchParams.get("code") ?? "";
    if (!code && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      code = String(body?.code ?? "");
    }
    code = code.trim();

    if (code.length < 6 || code.length > 40 || !/^[A-Za-z0-9-]+$/.test(code)) {
      return json({ ok: false, error: "invalid_code" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: rows, error } = await admin.rpc("verify_document", { _code: code });
    if (error) return json({ ok: false, error: "lookup_failed" }, 500);

    const doc = Array.isArray(rows) ? rows[0] : rows;
    if (!doc) return json({ ok: false, error: "not_found" }, 404);

    const { data: signed, error: signErr } = await admin.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60 * 10); // 10 minutes

    if (signErr || !signed?.signedUrl) {
      return json({ ok: false, error: "file_unavailable" }, 500);
    }

    // Best-effort increment
    await admin.rpc("increment_document_view", { _code: code });

    return json({
      ok: true,
      document: {
        id: doc.id,
        title: doc.title,
        description: doc.description,
        created_at: doc.created_at,
        signed_url: signed.signedUrl,
      },
    });
  } catch (_e) {
    return json({ ok: false, error: "server_error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
