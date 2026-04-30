import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Send, Trash2, Users, Mail, Plus, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscribed_at: string;
  language: string;
}
interface Campaign {
  id: string;
  title: string;
  subject: string;
  status: string;
  campaign_type: string;
  sent_at: string | null;
  recipient_count: number;
  created_at: string;
}

const AdminNewsletter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // form
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!roleRow);
      if (roleRow) await refresh();
      setLoading(false);
    })();
  }, [navigate]);

  const refresh = async () => {
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false }),
      supabase.from("newsletter_campaigns").select("*").order("created_at", { ascending: false }),
    ]);
    setSubs((s ?? []) as Subscriber[]);
    setCampaigns((c ?? []) as Campaign[]);
  };

  const uploadCover = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagen demasiado grande (máx 5MB)", variant: "destructive" });
      return;
    }
    setUploadingCover(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `newsletter/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("blog-media").upload(path, file, { contentType: file.type });
    setUploadingCover(false);
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    const { data } = supabase.storage.from("blog-media").getPublicUrl(path);
    setCoverUrl(data.publicUrl);
  };

  const pickCover = () => {
    const i = document.createElement("input");
    i.type = "file"; i.accept = "image/*";
    i.onchange = () => { const f = i.files?.[0]; if (f) uploadCover(f); };
    i.click();
  };

  const saveCampaign = async (sendNow: boolean) => {
    if (!title.trim() || !subject.trim() || !content.trim()) {
      toast({ title: "Completa título, asunto y contenido", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.from("newsletter_campaigns").insert({
      title: title.trim(),
      subject: subject.trim(),
      content_html: content,
      campaign_type: "announcement",
      cover_image_url: coverUrl || null,
      cta_label: ctaLabel.trim() || null,
      cta_url: ctaUrl.trim() || null,
      status: "draft",
      created_by: session!.user.id,
    }).select().single();
    setSaving(false);
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    setTitle(""); setSubject(""); setContent(""); setCoverUrl(""); setCtaLabel(""); setCtaUrl("");
    toast({ title: "Campaña guardada" });
    await refresh();
    if (sendNow) await sendCampaign(data.id);
  };

  const sendCampaign = async (id: string) => {
    setSendingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("send-newsletter", { body: { campaignId: id } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: `Enviada a ${data.sent} suscriptor${data.sent === 1 ? "" : "es"}`, description: data.failed ? `${data.failed} fallidos` : undefined });
      await refresh();
    } catch (e: any) {
      toast({ title: "Error al enviar", description: e?.message, variant: "destructive" });
    } finally {
      setSendingId(null);
    }
  };

  const deleteCampaign = async (id: string) => {
    await supabase.from("newsletter_campaigns").delete().eq("id", id);
    await refresh();
  };

  const deleteSubscriber = async (id: string) => {
    await supabase.from("newsletter_subscribers").delete().eq("id", id);
    await refresh();
  };

  if (loading || isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }
  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center"><Card><CardContent className="p-8"><h1 className="font-bold">Acceso denegado</h1></CardContent></Card></div>;
  }

  const activeSubs = subs.filter((s) => s.status === "active");

  return (
    <div className="min-h-screen bg-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="mb-2">
              <ArrowLeft className="h-4 w-4" /> Panel admin
            </Button>
            <h1 className="text-3xl font-bold">Newsletter</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Users className="h-4 w-4" /> {activeSubs.length} suscriptor{activeSubs.length === 1 ? "" : "es"} activo{activeSubs.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <Tabs defaultValue="compose" className="space-y-4">
          <TabsList>
            <TabsTrigger value="compose"><Plus className="h-4 w-4" /> Nueva campaña</TabsTrigger>
            <TabsTrigger value="campaigns"><Mail className="h-4 w-4" /> Campañas ({campaigns.length})</TabsTrigger>
            <TabsTrigger value="subscribers"><Users className="h-4 w-4" /> Suscriptores ({subs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="compose">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="t">Título (encabezado del email)</Label>
                  <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Cambio de horario en agosto" />
                </div>
                <div>
                  <Label htmlFor="s">Asunto del email</Label>
                  <Input id="s" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="📅 Nuevo horario de verano" />
                </div>
                <div>
                  <Label>Imagen destacada (opcional)</Label>
                  {coverUrl ? (
                    <div className="mt-2 relative rounded-lg overflow-hidden border">
                      <img src={coverUrl} alt="" className="w-full max-h-48 object-cover" />
                      <Button size="sm" variant="destructive" onClick={() => setCoverUrl("")} className="absolute top-2 right-2">
                        <Trash2 className="h-4 w-4" /> Quitar
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={pickCover} disabled={uploadingCover} className="mt-2">
                      {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Subir imagen
                    </Button>
                  )}
                </div>
                <div>
                  <Label htmlFor="c">Mensaje (HTML básico permitido)</Label>
                  <Textarea
                    id="c"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    placeholder={"<p>Estimado/a cliente,</p>\n<p>Le informamos que durante agosto nuestro horario será...</p>"}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Tip: usa &lt;p&gt;, &lt;strong&gt;, &lt;a href=""&gt;...&lt;/a&gt; para dar formato.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="cl">Texto del botón (opcional)</Label>
                    <Input id="cl" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} maxLength={50} placeholder="Más información" />
                  </div>
                  <div>
                    <Label htmlFor="cu">URL del botón (opcional)</Label>
                    <Input id="cu" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} maxLength={500} placeholder="https://..." />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap pt-2">
                  <Button onClick={() => saveCampaign(false)} disabled={saving} variant="outline">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar como borrador
                  </Button>
                  <Button onClick={() => saveCampaign(true)} disabled={saving || activeSubs.length === 0}>
                    <Send className="h-4 w-4" /> Guardar y enviar a {activeSubs.length} suscriptores
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            {campaigns.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No hay campañas todavía.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{c.title}</h3>
                          <Badge variant={c.status === "sent" ? "default" : "secondary"}>{c.status}</Badge>
                          {c.campaign_type === "blog" && <Badge variant="outline">blog</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.sent_at ? `Enviada ${new Date(c.sent_at).toLocaleString("es-ES")} · ${c.recipient_count} destinatarios` : `Creada ${new Date(c.created_at).toLocaleString("es-ES")}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {c.status !== "sent" && (
                          <Button size="sm" onClick={() => sendCampaign(c.id)} disabled={sendingId === c.id || activeSubs.length === 0}>
                            {sendingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar campaña?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCampaign(c.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscribers">
            {subs.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No hay suscriptores aún.</CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {subs.map((s) => (
                      <div key={s.id} className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.email}</p>
                          <p className="text-xs text-muted-foreground">{s.language?.toUpperCase()} · {new Date(s.subscribed_at).toLocaleDateString("es-ES")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => deleteSubscriber(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminNewsletter;
