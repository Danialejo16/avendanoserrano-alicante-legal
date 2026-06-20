import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Upload, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Photo = {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  category: string;
  sort_order: number;
};

const CATEGORIES = ["equipo", "instalaciones", "clientes", "eventos", "general"];

const AdminGallery = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("general");

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
    const { data } = await supabase
      .from("gallery_photos")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (data) setPhotos(data as Photo[]);
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const path = `gallery/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const up = await supabase.storage.from("blog-media").upload(path, file, { upsert: false });
        if (up.error) throw up.error;
        const { data: pub } = supabase.storage.from("blog-media").getPublicUrl(path);
        const ins = await supabase.from("gallery_photos").insert({
          image_url: pub.publicUrl,
          title: newTitle || null,
          description: newDescription || null,
          category: newCategory,
          sort_order: photos.length,
        });
        if (ins.error) throw ins.error;
      }
      setNewTitle(""); setNewDescription("");
      await load();
      toast({ title: `${files.length} foto(s) subida(s)` });
    } catch (err: any) {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const updatePhoto = (id: string, patch: Partial<Photo>) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const savePhoto = async (p: Photo) => {
    setSavingId(p.id);
    try {
      const { error } = await supabase.from("gallery_photos").update({
        title: p.title, description: p.description, category: p.category, sort_order: p.sort_order,
      }).eq("id", p.id);
      if (error) throw error;
      toast({ title: "Cambios guardados" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSavingId(null); }
  };

  const deletePhoto = async (p: Photo) => {
    if (!confirm("¿Eliminar esta foto?")) return;
    const { error } = await supabase.from("gallery_photos").delete().eq("id", p.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setPhotos((prev) => prev.filter((x) => x.id !== p.id));
    toast({ title: "Foto eliminada" });
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
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="mb-2">
            <ArrowLeft className="h-4 w-4" /> Panel
          </Button>
          <h1 className="text-3xl font-bold">Galería corporativa</h1>
          <p className="text-muted-foreground text-sm mt-1">Sube fotos de tu equipo, clientes, instalaciones y eventos. Se publican al instante.</p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold">Subir nuevas fotos</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Título (opcional)</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ej: Nuestro equipo" />
              </div>
              <div>
                <Label>Categoría</Label>
                <select className="w-full h-10 border border-input bg-background rounded px-2 text-sm"
                  value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea rows={2} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </div>
            <label className="inline-flex">
              <input type="file" accept="image/*" multiple className="hidden" onChange={onUpload} disabled={uploading} />
              <Button asChild disabled={uploading}>
                <span>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? " Subiendo..." : " Subir fotos"}
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground">Puedes seleccionar varias fotos a la vez. Los datos arriba se aplicarán a todas.</p>
          </CardContent>
        </Card>

        {photos.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">No hay fotos todavía.</CardContent></Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {photos.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="aspect-video rounded overflow-hidden bg-secondary border">
                    <img src={p.image_url} alt={p.title || ""} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <Label className="text-xs">Título</Label>
                    <Input value={p.title || ""} onChange={(e) => updatePhoto(p.id, { title: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Descripción</Label>
                    <Textarea rows={2} value={p.description || ""} onChange={(e) => updatePhoto(p.id, { description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Categoría</Label>
                      <select className="w-full h-10 border border-input bg-background rounded px-2 text-sm"
                        value={p.category} onChange={(e) => updatePhoto(p.id, { category: e.target.value })}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Orden</Label>
                      <Input type="number" value={p.sort_order}
                        onChange={(e) => updatePhoto(p.id, { sort_order: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="flex justify-between gap-2 pt-2">
                    <Button variant="destructive" size="sm" onClick={() => deletePhoto(p)}>
                      <Trash2 className="h-4 w-4" /> Eliminar
                    </Button>
                    <Button size="sm" onClick={() => savePhoto(p)} disabled={savingId === p.id}>
                      {savingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Guardar
                    </Button>
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

export default AdminGallery;
