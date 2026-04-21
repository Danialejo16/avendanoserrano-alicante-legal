import { useMemo, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Loader2, ImagePlus, VideoIcon, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { videoUrlToEmbedHtml } from "@/lib/blog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const BlogEditor = ({ value, onChange }: Props) => {
  const quillRef = useRef<ReactQuill>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const uploadFile = async (file: File, kind: "image" | "video"): Promise<string | null> => {
    const maxBytes = kind === "image" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast({
        title: "Archivo demasiado grande",
        description: `Máx ${kind === "image" ? "10 MB" : "100 MB"}.`,
        variant: "destructive",
      });
      return null;
    }
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${kind}s/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("blog-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) {
      toast({ title: "Error al subir", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("blog-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const insertHtml = (html: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true);
    editor.clipboard.dangerouslyPasteHTML(range.index, html, "user");
    editor.setSelection(range.index + 1, 0);
  };

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      const url = await uploadFile(file, "image");
      setUploading(false);
      if (url) insertHtml(`<p><img src="${url}" alt="" /></p>`);
    };
    input.click();
  };

  const handleVideoUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      const url = await uploadFile(file, "video");
      setUploading(false);
      if (url)
        insertHtml(
          `<p><video src="${url}" controls playsinline style="width:100%;border-radius:8px;"></video></p>`
        );
    };
    input.click();
  };

  const handleVideoUrlInsert = () => {
    if (!videoUrl.trim()) return;
    const html = videoUrlToEmbedHtml(videoUrl.trim());
    if (!html) {
      toast({
        title: "URL no válida",
        description: "Pega un enlace válido de YouTube o Vimeo.",
        variant: "destructive",
      });
      return;
    }
    insertHtml(html);
    setVideoUrl("");
    setVideoDialogOpen(false);
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          ["link"],
          [{ align: [] }],
          ["clean"],
        ],
      },
    }),
    []
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleImageUpload}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Subir imagen
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleVideoUpload}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <VideoIcon className="h-4 w-4" />}
          Subir vídeo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setVideoDialogOpen(true)}
        >
          <Link2 className="h-4 w-4" />
          Insertar vídeo de YouTube/Vimeo
        </Button>
      </div>

      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder="Escribe el contenido de la entrada..."
      />

      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insertar vídeo</DialogTitle>
            <DialogDescription>Pega la URL de un vídeo de YouTube o Vimeo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="video-url">URL del vídeo</Label>
            <Input
              id="video-url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleVideoUrlInsert}>Insertar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogEditor;
