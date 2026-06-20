import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Photo = {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  category: string;
};

const Gallery = () => {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [active, setActive] = useState<Photo | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("gallery_photos")
      .select("id,image_url,title,description,category")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (data) setPhotos(data as Photo[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`gallery_photos_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "gallery_photos" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  if (photos.length === 0) return null;

  return (
    <section id="galeria" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-highlight" />
            <span className="text-highlight text-sm tracking-[0.3em] uppercase font-body">
              {t("gallery.tagline", "Galería")}
            </span>
            <div className="w-8 h-[2px] bg-highlight" />
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-4">
            {t("gallery.title", "Nuestro despacho en imágenes")}
          </h2>
          <p className="font-body text-base text-foreground/70 max-w-2xl mx-auto">
            {t("gallery.subtitle", "Conoce a nuestro equipo, nuestras instalaciones y los momentos que compartimos con nuestros clientes.")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p)}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-highlight"
            >
              <img
                src={p.image_url}
                alt={p.title || "Foto"}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {(p.title || p.description) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  {p.title && (
                    <p className="font-heading text-sm font-semibold text-primary-foreground text-left line-clamp-1">
                      {p.title}
                    </p>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {active && (
            <div>
              <img src={active.image_url} alt={active.title || "Foto"} className="w-full max-h-[70vh] object-contain bg-black" />
              {(active.title || active.description) && (
                <div className="p-5 space-y-1">
                  {active.title && <h3 className="font-heading text-lg font-semibold text-primary">{active.title}</h3>}
                  {active.description && <p className="font-body text-sm text-foreground/70">{active.description}</p>}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Gallery;
