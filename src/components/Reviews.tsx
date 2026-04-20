import { useEffect, useState } from "react";
import { Star, Loader2, Quote } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  client_name: string;
  service: string;
  rating: number;
  comment: string;
  created_at: string;
}

const reviewSchema = z.object({
  client_name: z.string().trim().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
  service: z.string().trim().min(1, "Indica el servicio").max(100, "Máximo 100 caracteres"),
  rating: z.number().int().min(1, "Selecciona una valoración").max(5),
  comment: z.string().trim().min(1, "El comentario es obligatorio").max(500, "Máximo 500 caracteres"),
});

const StarRating = ({
  value,
  onChange,
  readOnly = false,
  size = 24,
}: {
  value: number;
  onChange?: (n: number) => void;
  readOnly?: boolean;
  size?: number;
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role={readOnly ? "img" : "radiogroup"} aria-label={`Valoración ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            className={`transition-transform ${readOnly ? "cursor-default" : "hover:scale-110 cursor-pointer"}`}
            aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
          >
            <Star
              size={size}
              className={filled ? "fill-primary text-primary" : "text-muted-foreground"}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
};

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const { toast } = useToast();

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setReviews(data as Review[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const payload = {
      client_name: (form.elements.namedItem("client_name") as HTMLInputElement).value,
      service: (form.elements.namedItem("service") as HTMLInputElement).value,
      comment: (form.elements.namedItem("comment") as HTMLTextAreaElement).value,
      rating,
    };

    const parsed = reviewSchema.safeParse(payload);
    if (!parsed.success) {
      toast({
        title: "Revisa el formulario",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert(parsed.data as Required<typeof parsed.data>);
    setSubmitting(false);

    if (error) {
      toast({
        title: "No se pudo enviar la reseña",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "¡Gracias por tu reseña!", description: "Tu opinión es muy importante para nosotros." });
    form.reset();
    setRating(0);
    fetchReviews();
  };

  const average =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <section id="reseñas" className="py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Reseñas de Clientes</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            La confianza de quienes han depositado sus asuntos legales en nuestras manos.
          </p>
          {reviews.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <StarRating value={Math.round(average)} readOnly size={20} />
              <span className="font-semibold">{average.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"})
              </span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Formulario */}
          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Deja tu reseña</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="client_name">Tu nombre</Label>
                  <Input id="client_name" name="client_name" maxLength={100} required />
                </div>
                <div>
                  <Label htmlFor="service">Servicio recibido</Label>
                  <Input
                    id="service"
                    name="service"
                    placeholder="Ej. Asesoría en derecho civil"
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <Label>Tu valoración</Label>
                  <div className="mt-2">
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="comment">Comentario</Label>
                  <Textarea
                    id="comment"
                    name="comment"
                    rows={4}
                    maxLength={500}
                    placeholder="Cuéntanos tu experiencia..."
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="animate-spin" /> : "Publicar reseña"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Listado */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Sé el primero en dejar una reseña.
                </CardContent>
              </Card>
            ) : (
              reviews.map((r) => (
                <Card key={r.id} className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div>
                        <p className="font-semibold">{r.client_name}</p>
                        <p className="text-xs text-muted-foreground">{r.service}</p>
                      </div>
                      <StarRating value={r.rating} readOnly size={16} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Quote className="h-4 w-4 text-primary shrink-0 mt-1" />
                      <p className="text-sm text-foreground/80 leading-relaxed">{r.comment}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(r.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
