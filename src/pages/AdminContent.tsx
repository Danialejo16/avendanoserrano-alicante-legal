import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Plus, Trash2, Upload, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULTS,
  useSiteContent,
  saveSiteContent,
  type GeneralContent,
  type ContactContent,
  type CvContent,
} from "@/hooks/use-site-content";

const AdminContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/auth", { replace: true });
    });
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth", { replace: true }); return; }
      const { data: r } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!r);
    })();
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">Acceso denegado</h1>
          <p className="text-muted-foreground">Necesitas permisos de administrador.</p>
          <Button onClick={() => navigate("/")}>Volver</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="mb-2">
              <ArrowLeft className="h-4 w-4" /> Panel
            </Button>
            <h1 className="text-3xl font-bold">Gestor de Contenido</h1>
            <p className="text-muted-foreground text-sm mt-1">Edita el contenido público del sitio. Los cambios se reflejan al instante.</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
            <TabsTrigger value="general">General y Barra</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
            <TabsTrigger value="cv">Currículum</TabsTrigger>
          </TabsList>
          <TabsContent value="general"><GeneralEditor toast={toast} /></TabsContent>
          <TabsContent value="contact"><ContactEditor toast={toast} /></TabsContent>
          <TabsContent value="cv"><CvEditor toast={toast} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

type ToastFn = ReturnType<typeof useToast>["toast"];

const useEditor = <K extends "general" | "contact" | "cv">(section: K) => {
  const { data } = useSiteContent(section);
  const [draft, setDraft] = useState(data);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(data); }, [data]);
  return { draft, setDraft, saving, setSaving };
};

const handleSave = async (section: "general" | "contact" | "cv", draft: any, setSaving: (b: boolean) => void, toast: ToastFn) => {
  setSaving(true);
  try {
    await saveSiteContent(section, draft);
    toast({ title: "Cambios guardados correctamente" });
  } catch (e: any) {
    toast({ title: "Error al guardar", description: e.message, variant: "destructive" });
  } finally { setSaving(false); }
};

const SaveBar = ({ saving, onSave }: { saving: boolean; onSave: () => void }) => (
  <div className="flex justify-end pt-4">
    <Button onClick={onSave} disabled={saving}>
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Guardar cambios
    </Button>
  </div>
);

// ---------- General ----------
const GeneralEditor = ({ toast }: { toast: ToastFn }) => {
  const { draft, setDraft, saving, setSaving } = useEditor("general");
  const d = draft as GeneralContent;
  const update = (patch: Partial<GeneralContent>) => setDraft({ ...d, ...patch });
  const updateSocial = (i: number, patch: Partial<{ icon: string; url: string; label: string }>) => {
    const socials = d.socials.map((s, idx) => idx === i ? { ...s, ...patch } : s);
    update({ socials });
  };
  return (
    <Card className="mt-4"><CardContent className="p-6 space-y-5">
      <div><Label>Teléfono</Label><Input value={d.phone} onChange={(e) => update({ phone: e.target.value })} /></div>
      <div><Label>Enlace de teléfono (tel:)</Label><Input value={d.phoneHref} onChange={(e) => update({ phoneHref: e.target.value })} placeholder="tel:+34..." /></div>
      <div><Label>Email</Label><Input type="email" value={d.email} onChange={(e) => update({ email: e.target.value })} /></div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><Label>Redes sociales</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => update({ socials: [...d.socials, { icon: "facebook", url: "", label: "" }] })}>
            <Plus className="h-4 w-4" /> Añadir
          </Button>
        </div>
        {d.socials.map((s, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[140px_140px_1fr_auto] gap-2 items-end p-3 border rounded">
            <div><Label className="text-xs">Icono</Label>
              <select className="w-full h-10 border border-input bg-background rounded px-2 text-sm" value={s.icon} onChange={(e) => updateSocial(i, { icon: e.target.value })}>
                {["facebook", "instagram", "linkedin", "twitter", "youtube", "tiktok"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div><Label className="text-xs">Etiqueta</Label><Input value={s.label} onChange={(e) => updateSocial(i, { label: e.target.value })} /></div>
            <div><Label className="text-xs">URL</Label><Input value={s.url} onChange={(e) => updateSocial(i, { url: e.target.value })} /></div>
            <Button type="button" size="icon" variant="ghost" onClick={() => update({ socials: d.socials.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <SaveBar saving={saving} onSave={() => handleSave("general", d, setSaving, toast)} />
    </CardContent></Card>
  );
};

// ---------- Contact ----------
const ContactEditor = ({ toast }: { toast: ToastFn }) => {
  const { draft, setDraft, saving, setSaving } = useEditor("contact");
  const d = draft as ContactContent;
  const update = (patch: Partial<ContactContent>) => setDraft({ ...d, ...patch });
  return (
    <Card className="mt-4"><CardContent className="p-6 space-y-5">
      <div><Label>Dirección</Label><Textarea value={d.address} onChange={(e) => update({ address: e.target.value })} rows={2} /></div>
      <div><Label>URL del iframe de Google Maps</Label><Input value={d.mapsUrl} onChange={(e) => update({ mapsUrl: e.target.value })} placeholder="https://www.google.com/maps/embed?..." /></div>
      {d.mapsUrl && <div className="aspect-video w-full rounded overflow-hidden border"><iframe src={d.mapsUrl} className="w-full h-full" loading="lazy" /></div>}

      <ListEditor
        label="Horarios"
        items={d.hours}
        onChange={(hours) => update({ hours })}
        empty={{ days: "", hours: "" }}
        render={(it, set) => (
          <>
            <Input placeholder="Días" value={it.days} onChange={(e) => set({ days: e.target.value })} />
            <Input placeholder="Horario" value={it.hours} onChange={(e) => set({ hours: e.target.value })} />
          </>
        )}
      />

      <ListEditor
        label="Teléfonos secundarios"
        items={d.extraPhones}
        onChange={(extraPhones) => update({ extraPhones })}
        empty={{ label: "", value: "" }}
        render={(it, set) => (
          <>
            <Input placeholder="Etiqueta" value={it.label} onChange={(e) => set({ label: e.target.value })} />
            <Input placeholder="Teléfono" value={it.value} onChange={(e) => set({ value: e.target.value })} />
          </>
        )}
      />

      <ListEditor
        label="Emails secundarios"
        items={d.extraEmails}
        onChange={(extraEmails) => update({ extraEmails })}
        empty={{ label: "", value: "" }}
        render={(it, set) => (
          <>
            <Input placeholder="Etiqueta" value={it.label} onChange={(e) => set({ label: e.target.value })} />
            <Input type="email" placeholder="Email" value={it.value} onChange={(e) => set({ value: e.target.value })} />
          </>
        )}
      />

      <SaveBar saving={saving} onSave={() => handleSave("contact", d, setSaving, toast)} />
    </CardContent></Card>
  );
};

// ---------- CV ----------
const CvEditor = ({ toast }: { toast: ToastFn }) => {
  const { draft, setDraft, saving, setSaving } = useEditor("cv");
  const d = draft as CvContent;
  const [uploading, setUploading] = useState(false);
  const update = (patch: Partial<CvContent>) => setDraft({ ...d, ...patch });

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `cv/photo-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { error } = await supabase.storage.from("blog-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("blog-media").getPublicUrl(path);
      update({ photoUrl: data.publicUrl });
      toast({ title: "Foto subida" });
    } catch (err: any) {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  return (
    <Card className="mt-4"><CardContent className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-28 h-28 rounded-full bg-secondary border overflow-hidden flex items-center justify-center">
          {d.photoUrl ? <img src={d.photoUrl} alt="Foto" className="w-full h-full object-cover" /> : <span className="text-xs text-muted-foreground">Sin foto</span>}
        </div>
        <label className="inline-flex">
          <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          <Button asChild variant="outline" disabled={uploading}>
            <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Subir foto</span>
          </Button>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div><Label>Nombre</Label><Input value={d.name} onChange={(e) => update({ name: e.target.value })} /></div>
        <div><Label>Título profesional</Label><Input value={d.role} onChange={(e) => update({ role: e.target.value })} /></div>
        <div><Label>LinkedIn / enlace pro.</Label><Input value={d.linkedin} onChange={(e) => update({ linkedin: e.target.value })} /></div>
        <div><Label>Teléfono</Label><Input value={d.phone} onChange={(e) => update({ phone: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Email</Label><Input type="email" value={d.email} onChange={(e) => update({ email: e.target.value })} /></div>
      </div>

      <div><Label>Sobre mí</Label><Textarea rows={4} value={d.about} onChange={(e) => update({ about: e.target.value })} /></div>

      <div className="space-y-3">
        <div className="flex items-center justify-between"><Label>Formación académica</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => update({ education: [...d.education, { title: "", institution: "", startYear: "", endYear: "", description: "" }] })}>
            <Plus className="h-4 w-4" /> Añadir
          </Button>
        </div>
        {d.education.map((ed, i) => {
          const set = (patch: Partial<typeof ed>) => update({ education: d.education.map((x, idx) => idx === i ? { ...x, ...patch } : x) });
          return (
            <div key={i} className="p-3 border rounded space-y-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <Input placeholder="Título" value={ed.title} onChange={(e) => set({ title: e.target.value })} />
                <Input placeholder="Institución" value={ed.institution} onChange={(e) => set({ institution: e.target.value })} />
                <Input placeholder="Año inicio" value={ed.startYear} onChange={(e) => set({ startYear: e.target.value })} />
                <Input placeholder="Año fin" value={ed.endYear} onChange={(e) => set({ endYear: e.target.value })} />
              </div>
              <Textarea placeholder="Descripción" rows={2} value={ed.description} onChange={(e) => set({ description: e.target.value })} />
              <div className="flex justify-end">
                <Button type="button" size="sm" variant="ghost" onClick={() => update({ education: d.education.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4" /> Eliminar</Button>
              </div>
            </div>
          );
        })}
      </div>

      <SaveBar saving={saving} onSave={() => handleSave("cv", d, setSaving, toast)} />
    </CardContent></Card>
  );
};

// ---------- Generic list editor ----------
function ListEditor<T>({ label, items, onChange, empty, render }: {
  label: string;
  items: T[];
  onChange: (next: T[]) => void;
  empty: T;
  render: (item: T, set: (patch: Partial<T>) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, empty])}>
          <Plus className="h-4 w-4" /> Añadir
        </Button>
      </div>
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center p-3 border rounded">
          {render(it, (patch) => onChange(items.map((x, idx) => idx === i ? { ...x, ...patch } : x)))}
          <Button type="button" size="icon" variant="ghost" onClick={() => onChange(items.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
    </div>
  );
}

export default AdminContent;
