import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface PostRow {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  published_at: string | null;
  updated_at: string;
}

const AdminBlog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);

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
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      const admin = !!roleRow;
      setIsAdmin(admin);
      if (admin) await fetchPosts();
      setLoading(false);
    })();
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("id,title,slug,status,published_at,updated_at")
      .order("updated_at", { ascending: false });
    setPosts((data ?? []) as PostRow[]);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Entrada eliminada" });
  };

  const togglePublish = async (post: PostRow) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("blog_posts")
      .update({ status: newStatus })
      .eq("id", post.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: newStatus === "published" ? "Publicada" : "Convertida en borrador" });
    fetchPosts();
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
            <p className="text-muted-foreground mb-4">No tienes permisos de administrador.</p>
            <Button onClick={() => navigate("/")}>Volver</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="mb-2">
              <ArrowLeft className="h-4 w-4" /> Panel admin
            </Button>
            <h1 className="text-3xl font-bold">Blog</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {posts.length} {posts.length === 1 ? "entrada" : "entradas"} en total
            </p>
          </div>
          <Button onClick={() => navigate("/admin/blog/new")}>
            <Plus className="h-4 w-4" /> Nueva entrada
          </Button>
        </div>

        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Aún no hay entradas. Crea la primera con el botón "Nueva entrada".
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      <Badge variant={p.status === "published" ? "default" : "secondary"}>
                        {p.status === "published" ? "Publicada" : "Borrador"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      /{p.slug} · Actualizada{" "}
                      {new Date(p.updated_at).toLocaleString("es-ES")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.status === "published" && (
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/blog/${p.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4" /> Ver
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => togglePublish(p)}>
                      {p.status === "published" ? (
                        <><EyeOff className="h-4 w-4" /> Despublicar</>
                      ) : (
                        <><Eye className="h-4 w-4" /> Publicar</>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/blog/${p.id}`)}>
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar esta entrada?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. La entrada{" "}
                            <strong>{p.title}</strong> se eliminará permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(p.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

export default AdminBlog;
