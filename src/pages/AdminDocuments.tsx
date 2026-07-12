import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Download, Loader2, LogOut, Trash2, Upload, Eye } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";

interface DocRow {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  verification_code: string;
  view_count: number;
  created_at: string;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode() {
  const rand = (n: number) =>
    Array.from(crypto.getRandomValues(new Uint8Array(n)))
      .map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length])
      .join("");
  return `LAW-${rand(4)}-${rand(3)}`;
}

const AdminDocuments = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [qrOpen, setQrOpen] = useState<DocRow | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const verifyBase = useMemo(
    () => `${window.location.origin}/verificar`,
    []
  );

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) return navigate("/auth", { replace: true });
      setUserId(session.user.id);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return navigate("/auth", { replace: true });
      setUserId(session.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!role);
      if (role) await refresh();
      setLoading(false);
    })();
  }, [userId]);

  const refresh = async () => {
    const { data, error } = await supabase
      .from("documents" as never)
      .select("id,title,description,file_path,verification_code,view_count,created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Error al cargar documentos");
      return;
    }
    setDocs((data ?? []) as unknown as DocRow[]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      toast.error("Título y archivo son obligatorios");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("El archivo supera los 20MB");
      return;
    }
    setUploading(true);
    try {
      const code = generateCode();
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${code}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const qrUrl = `${verifyBase}?code=${encodeURIComponent(code)}`;
      const { error: insErr } = await supabase.from("documents" as never).insert({
        title: title.trim(),
        description: description.trim() || null,
        file_path: path,
        verification_code: code,
        qr_code_url: qrUrl,
        created_by: userId,
      } as never);
      if (insErr) {
        await supabase.storage.from("documents").remove([path]);
        throw insErr;
      }

      toast.success(`Documento subido. Código: ${code}`);
      setTitle("");
      setDescription("");
      setFile(null);
      (document.getElementById("doc-file") as HTMLInputElement | null)?.form?.reset();
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al subir";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const copyLink = async (code: string) => {
    await navigator.clipboard.writeText(`${verifyBase}?code=${encodeURIComponent(code)}`);
    toast.success("Enlace copiado");
  };

  const downloadQR = (doc: DocRow) => {
    const canvas = document.getElementById(`qr-${doc.id}`) as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${doc.verification_code}.png`;
    a.click();
  };

  const removeDoc = async (doc: DocRow) => {
    await supabase.storage.from("documents").remove([doc.file_path]);
    const { error } = await supabase.from("documents" as never).delete().eq("id", doc.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDocs((p) => p.filter((d) => d.id !== doc.id));
    toast.success("Documento eliminado");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <h1 className="text-2xl font-bold">Acceso denegado</h1>
            <Button onClick={() => navigate("/")}>Volver</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="mb-2">
              <ArrowLeft className="h-4 w-4" /> Panel
            </Button>
            <h1 className="text-3xl font-bold">Verificación de documentos</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {docs.length} {docs.length === 1 ? "documento" : "documentos"} registrados
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </Button>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Subir nuevo documento</h2>
            <form onSubmit={handleUpload} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doc-title">Título *</Label>
                <Input
                  id="doc-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-file">Archivo (PDF, máx 20MB) *</Label>
                <Input
                  id="doc-file"
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="doc-desc">Descripción</Label>
                <Textarea
                  id="doc-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Subir y generar código
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-center">Consultas</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        No hay documentos todavía.
                      </TableCell>
                    </TableRow>
                  ) : (
                    docs.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.title}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {d.verification_code}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Eye className="h-3 w-3" /> {d.view_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(d.created_at).toLocaleDateString("es-ES")}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => copyLink(d.verification_code)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setQrOpen(d)}>
                            QR
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará <strong>{d.title}</strong> y su archivo. Esta acción no
                                  se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeDoc(d)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!qrOpen} onOpenChange={(o) => !o && setQrOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Código QR</DialogTitle>
          </DialogHeader>
          {qrOpen && (
            <div className="flex flex-col items-center gap-4" ref={qrRef}>
              <div className="bg-white p-4 rounded-md">
                <QRCodeCanvas
                  id={`qr-${qrOpen.id}`}
                  value={`${verifyBase}?code=${encodeURIComponent(qrOpen.verification_code)}`}
                  size={220}
                  level="H"
                  includeMargin
                />
              </div>
              <p className="text-xs text-muted-foreground break-all text-center">
                {`${verifyBase}?code=${qrOpen.verification_code}`}
              </p>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => copyLink(qrOpen.verification_code)}
                >
                  <Copy className="h-4 w-4" /> Copiar
                </Button>
                <Button className="flex-1" onClick={() => downloadQR(qrOpen)}>
                  <Download className="h-4 w-4" /> PNG
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDocuments;
