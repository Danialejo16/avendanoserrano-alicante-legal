import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Trash2, Save, Plus, Upload, Crown, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Social = { icon: string; url: string; label?: string };
type Member = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  socials: Social[];
  is_founder: boolean;
  sort_order: number;
};

const SOCIAL_ICONS = ["linkedin", "facebook", "instagram", "twitter", "web"];

const AdminTeam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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
      if (r) await load();
    })();
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const load = async () => {
    const { data } = await (supabase as any)
      .from("team_members")
      .select("*")
      .order("is_founder", { ascending: false })
      .order("sort_order", { ascending: true });
    if (data) {
      setMembers(
        data.map((m: any) => ({ ...m, socials: Array.isArray(m.socials) ? m.socials : [] })),
      );
    }
  };

  const addMember = async () => {
    const { data, error } = await (supabase as any)
      .from("team_members")
      .insert({
        name: "Nuevo miembro",
        role: "",
        bio: "",
        sort_order: members.length,
      })
      .select()
      .single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setMembers((prev) => [...prev, { ...data, socials: [] }]);
  };

  const update = (id: string, patch: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const save = async (m: Member) => {
    setSavingId(m.id);
    try {
      const { error } = await (supabase as any).from("team_members").update({
        name: m.name,
        role: m.role,
        bio: m.bio,
        photo_url: m.photo_url,
        email: m.email,
        phone: m.phone,
        linkedin_url: m.linkedin_url,
        socials: m.socials,
        is_founder: m.is_founder,
        sort_order: m.sort_order,
      }).eq("id", m.id);
      if (error) throw error;
      toast({ title: "Guardado" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSavingId(null); }
  };

  const remove = async (m: Member) => {
    if (!confirm(`¿Eliminar a ${m.name}?`)) return;
    const { error } = await (supabase as any).from("team_members").delete().eq("id", m.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setMembers((prev) => prev.filter((x) => x.id !== m.id));
  };

  const uploadPhoto = async (m: Member, file: File) => {
    setUploadingId(m.id);
    try {
      const path = `team/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const up = await supabase.storage.from("blog-media").upload(path, file, { upsert: false });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("blog-media").getPublicUrl(path);
      update(m.id, { photo_url: pub.publicUrl });
      toast({ title: "Foto subida — recuerda guardar" });
    } catch (err: any) {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
    } finally { setUploadingId(null); }
  };

  const addSocial = (m: Member) => {
    update(m.id, { socials: [...m.socials, { icon: "linkedin", url: "", label: "" }] });
  };
  const updateSocial = (m: Member, i: number, patch: Partial<Social>) => {
    const next = m.socials.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    update(m.id, { socials: next });
  };
  const removeSocial = (m: Member, i: number) => {
    update(m.id, { socials: m.socials.filter((_, idx) => idx !== i) });
  };

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">Acceso denegado</h1>
          <Button onClick={() => navigate("/")}>Volver</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="mb-2">
              <ArrowLeft className="h-4 w-4" /> Panel
            </Button>
            <h1 className="text-3xl font-bold">Nuestro equipo</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestiona al fundador y al resto de profesionales. Los cambios se publican al instante.</p>
          </div>
          <Button onClick={addMember}><Plus className="h-4 w-4" /> Añadir miembro</Button>
        </div>

        {members.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">No hay miembros todavía. Añade el primero.</CardContent></Card>
        ) : (
          <div className="space-y-6">
            {members.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-[200px_1fr] gap-5">
                    <div>
                      <div className="aspect-square rounded-lg overflow-hidden bg-secondary border mb-2">
                        {m.photo_url ? (
                          <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Sin foto</div>
                        )}
                      </div>
                      <label className="inline-flex w-full">
                        <input
                          type="file" accept="image/*" className="hidden"
                          onChange={(e) => e.target.files?.[0] && uploadPhoto(m, e.target.files[0])}
                          disabled={uploadingId === m.id}
                        />
                        <Button asChild variant="outline" size="sm" className="w-full" disabled={uploadingId === m.id}>
                          <span>
                            {uploadingId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Subir foto
                          </span>
                        </Button>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={m.is_founder}
                          onChange={(e) => update(m.id, { is_founder: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <Crown className="h-4 w-4 text-highlight" />
                        <span className="text-sm font-medium">Marcar como fundador (destacado en la parte superior)</span>
                      </label>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Nombre y apellidos</Label>
                          <Input value={m.name} onChange={(e) => update(m.id, { name: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Cargo / Especialidad</Label>
                          <Input value={m.role} onChange={(e) => update(m.id, { role: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Teléfono</Label>
                          <Input value={m.phone || ""} onChange={(e) => update(m.id, { phone: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Email</Label>
                          <Input type="email" value={m.email || ""} onChange={(e) => update(m.id, { email: e.target.value })} />
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-xs">LinkedIn (URL)</Label>
                          <Input value={m.linkedin_url || ""} onChange={(e) => update(m.id, { linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." />
                        </div>
                        <div>
                          <Label className="text-xs">Orden</Label>
                          <Input type="number" value={m.sort_order}
                            onChange={(e) => update(m.id, { sort_order: parseInt(e.target.value) || 0 })} />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Trayectoria / Biografía breve</Label>
                        <Textarea rows={4} value={m.bio} onChange={(e) => update(m.id, { bio: e.target.value })} />
                      </div>

                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs">Redes sociales adicionales</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => addSocial(m)}>
                            <Plus className="h-3 w-3" /> Añadir
                          </Button>
                        </div>
                        {m.socials.length === 0 && (
                          <p className="text-xs text-muted-foreground">Ninguna. LinkedIn ya se gestiona arriba.</p>
                        )}
                        <div className="space-y-2">
                          {m.socials.map((s, i) => (
                            <div key={i} className="grid grid-cols-[120px_1fr_auto] gap-2 items-center">
                              <select
                                className="h-9 border border-input bg-background rounded px-2 text-sm"
                                value={s.icon}
                                onChange={(e) => updateSocial(m, i, { icon: e.target.value })}
                              >
                                {SOCIAL_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                              </select>
                              <Input value={s.url} placeholder="https://..." onChange={(e) => updateSocial(m, i, { url: e.target.value })} />
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeSocial(m, i)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between gap-2 pt-2 border-t">
                        <Button variant="destructive" size="sm" onClick={() => remove(m)}>
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </Button>
                        <Button size="sm" onClick={() => save(m)} disabled={savingId === m.id}>
                          {savingId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTeam;
