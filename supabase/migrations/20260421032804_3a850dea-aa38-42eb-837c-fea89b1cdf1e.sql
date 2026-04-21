-- Tabla blog_posts
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  author_id UUID NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_status_published ON public.blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver entradas publicadas
CREATE POLICY "Anyone can view published posts"
ON public.blog_posts FOR SELECT
USING (status = 'published');

-- Admins pueden ver todas (incluidos borradores)
CREATE POLICY "Admins can view all posts"
ON public.blog_posts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins pueden crear
CREATE POLICY "Admins can insert posts"
ON public.blog_posts FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND author_id = auth.uid());

-- Admins pueden actualizar
CREATE POLICY "Admins can update posts"
ON public.blog_posts FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins pueden eliminar
CREATE POLICY "Admins can delete posts"
ON public.blog_posts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Validación
CREATE OR REPLACE FUNCTION public.validate_blog_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF length(trim(NEW.title)) = 0 OR length(NEW.title) > 200 THEN
    RAISE EXCEPTION 'Título inválido (1-200 caracteres)';
  END IF;
  IF length(trim(NEW.slug)) = 0 OR length(NEW.slug) > 200 THEN
    RAISE EXCEPTION 'Slug inválido (1-200 caracteres)';
  END IF;
  IF NEW.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Slug solo puede contener minúsculas, números y guiones';
  END IF;
  IF NEW.status NOT IN ('draft','published') THEN
    RAISE EXCEPTION 'Estado inválido';
  END IF;
  IF NEW.excerpt IS NOT NULL AND length(NEW.excerpt) > 500 THEN
    RAISE EXCEPTION 'Extracto demasiado largo (máx 500)';
  END IF;
  IF length(NEW.content) > 200000 THEN
    RAISE EXCEPTION 'Contenido demasiado largo';
  END IF;
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER blog_posts_validate
BEFORE INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.validate_blog_post();

-- Bucket público para multimedia
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-media', 'blog-media', true);

-- Cualquiera puede leer
CREATE POLICY "Public can read blog media"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-media');

-- Solo admins pueden subir
CREATE POLICY "Admins can upload blog media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'));

-- Solo admins pueden actualizar
CREATE POLICY "Admins can update blog media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'));

-- Solo admins pueden borrar
CREATE POLICY "Admins can delete blog media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'));