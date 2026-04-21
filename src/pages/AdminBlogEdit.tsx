import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, Loader2, Save, Eye, ImagePlus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import BlogEditor from "@/components/BlogEditor";
import { slugify } from "@/lib/blog";
import "@/styles/blog-content.css";

const postSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "El slug es obligatorio")
    .max(200)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones"),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().min(1, "El contenido no puede estar vacío"),
  cover_image_url: z.string().url().optional().or(z.literal("")),
});

const AdminBlogEdit = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/auth", { replace: true });
    });
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      setUserId(session.user.id);
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      const admin = !!roleRow;
      setIsAdmin(admin);

      if (admin && !isNew && id) {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (error || !data) {
          toast({ title: "Entrada no encontrada", variant: "destructive" });
          navigate("/admin/blog", { replace: true });
        } else {
          setTitle(data.title);
          setSlug(data.slug);
          setSlugTouched(true);
          setExcerpt(data.excerpt ?? "");
          setContent(data.content ?? "");
          setCoverImageUrl(data.cover_image_url ?? "");
          setPublished(data.status === "published");
        }
      }
      setLoading(false);
    })();
    return () => sub.subscription.unsubscribe();
  }, [id, isNew, navigate, toast]);

  // Auto-slug from title until user edits slug manually
  useEffect(() => {
    if (!slugTouched && isNew) setSlug(slugify(title));
  }, [title, slugTouched, isNew]);

  const uploadCover = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: "Máx 10 MB.", variant: "destructive" });
      return;
    }
    setUploadingCover(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `covers/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("blog-media").upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
    });
    setUploadingCover(false);
    if (error) {
      toast({ title: "Error al subir", description: error.message, variant: "destructive" });
      return;
    }
    const { data } = supabase.storage.from("blog-media").getPublicUrl(path);
    setCoverImageUrl(data.publicUrl);
  };

  const handleCoverPick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) uploadCover(f);
    };
    input.click();
  };

  const handleSave = async () => {
    if (!userId) return;
    const parsed = postSchema.safeParse({
      title,
      slug,
      excerpt,
      content,
      cover_image_url: coverImageUrl,
    });
    if (!parsed.success) {
      toast({
        title: "Revisa el formulario",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const payload = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt || null,
      content: parsed.data.content,
      cover_image_url: parsed.data.cover_image_url || null,
      status: published ? "published" : "draft",
    };

    if (isNew) {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert({ ...payload, author_id: userId })
        .select("id")
        .single();
      setSaving(false);
      if (error) {
        toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Entrada creada" });
      navigate(`/admin/blog/${data.id}`, { replace: true });
    } else {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", id!);
      setSaving(false);
      if (error) {
        toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Entrada guardada" });
    }
  };

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Acceso denegado</h1>
            <Button onClick={() => navigate("/")}>Volver</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/blog")}>
            <ArrowLeft className="h-4 w-4" /> Volver al listado
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Switch id="published" checked={published} onCheckedChange={setPublished} />
              <Label htmlFor="published" className="text-sm cursor-pointer">
                {published ? "Publicada" : "Borrador"}
              </Label>
            </div>
            {!isNew && published && slug && (
              <Button asChild variant="outline" size="sm">
                <a href={`/blog/${slug}`} target="_blank" rel="noreferrer">
                  <Eye className="h-4 w-4" /> Ver
                </a>
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </Button>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-6">
          {isNew ? "Nueva entrada" : "Editar entrada"}
        </h1>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Título de la entrada"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                maxLength={200}
                placeholder="mi-entrada-de-blog"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL final: <span className="font-mono">/blog/{slug || "..."}</span>
              </p>
            </div>

            <div>
              <Label htmlFor="excerpt">Extracto (opcional)</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Breve resumen mostrado en el listado"
              />
            </div>

            <div>
              <Label>Imagen de portada</Label>
              {coverImageUrl ? (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-border">
                  <img src={coverImageUrl} alt="Portada" className="w-full max-h-64 object-cover" />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => setCoverImageUrl("")}
                  >
                    <Trash2 className="h-4 w-4" /> Quitar
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={handleCoverPick}
                  disabled={uploadingCover}
                >
                  {uploadingCover ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  Subir portada
                </Button>
              )}
            </div>

            <div>
              <Label>Contenido</Label>
              <div className="mt-2">
                <BlogEditor value={content} onChange={setContent} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBlogEdit;
