const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

interface Body {
  type: "confirmation" | "reminder";
  to: string;
  client_name: string;
  service_name: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_hour: number;
}

const formatDateEs = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  const months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${day} de ${months[m-1]} de ${y}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) throw new Error("Email no configurado");

    const body = (await req.json()) as Body;
    if (!body?.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to)) {
      return new Response(JSON.stringify({ error: "Email inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const dateStr = formatDateEs(body.appointment_date);
    const hourStr = `${String(body.appointment_hour).padStart(2, "0")}:00`;
    const isReminder = body.type === "reminder";

    const subject = isReminder
      ? `Recordatorio: tu cita es mañana a las ${hourStr}`
      : `Confirmación de tu cita el ${dateStr}`;

    const intro = isReminder
      ? `Te recordamos que tienes una cita reservada con nosotros mañana.`
      : `Hemos recibido tu reserva correctamente. Te esperamos en la fecha indicada.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1a1a1a;">
        <h2 style="color:#0a2540; margin-bottom: 8px;">Avendaño Serrano Abogados</h2>
        <p style="font-size:16px;">Hola <strong>${body.client_name}</strong>,</p>
        <p style="font-size:15px; line-height:1.5;">${intro}</p>
        <div style="background:#f5f7fa; border-left:4px solid #c9a961; padding:16px 20px; margin:20px 0; border-radius:4px;">
          <p style="margin:4px 0;"><strong>Servicio:</strong> ${body.service_name}</p>
          <p style="margin:4px 0;"><strong>Fecha:</strong> ${dateStr}</p>
          <p style="margin:4px 0;"><strong>Hora:</strong> ${hourStr}</p>
        </div>
        <p style="font-size:14px; color:#555;">Si necesitas cancelar o modificar tu cita, contáctanos lo antes posible.</p>
        <p style="font-size:13px; color:#888; margin-top:30px;">Un saludo,<br/>Equipo Avendaño Serrano Abogados</p>
      </div>
    `;

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Avendaño Serrano Abogados <onboarding@resend.dev>",
        to: [body.to],
        subject,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Resend error [${res.status}]: ${JSON.stringify(data)}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-appointment-email error", err);
    return new Response(JSON.stringify({ success: false, error: err?.message ?? "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
