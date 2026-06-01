const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'

const BodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(30),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(5000),
})

// Simple in-memory IP rate limit: max 3 submissions per 10 minutes per IP.
// Per-instance only; acceptable as best-effort abuse mitigation.
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 3
const ipHits = new Map<string, number[]>()

const checkRate = (ip: string): boolean => {
  const now = Date.now()
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  if (hits.length >= RATE_MAX) return false
  hits.push(now)
  ipHits.set(ip, hits)
  // Opportunistic cleanup
  if (ipHits.size > 5000) {
    for (const [k, v] of ipHits) {
      const fresh = v.filter((t) => now - t < RATE_WINDOW_MS)
      if (fresh.length === 0) ipHits.delete(k)
      else ipHits.set(k, fresh)
    }
  }
  return true
}

const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('cf-connecting-ip') ||
      'unknown'

    if (!checkRate(ip)) {
      return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured')

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured')

    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { name, phone, email, message } = parsed.data

    // Persist submission server-side (replaces the client-side direct insert).
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      await supabase.from('contact_submissions').insert({ name, phone, email, message })
    } catch (e) {
      console.error('contact_submissions insert failed', e)
    }

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Avendaño Serrano Abogados <onboarding@resend.dev>',
        to: ['alejodle3@gmail.com'],
        subject: `Nueva consulta de ${name}`.slice(0, 200),
        html: `
          <h2>Nueva consulta desde la web</h2>
          <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
          <p><strong>Teléfono:</strong> ${escapeHtml(phone)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        `,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(`Resend API failed [${response.status}]: ${JSON.stringify(data)}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Error sending email:', error)
    return new Response(JSON.stringify({ success: false, error: 'Error interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
