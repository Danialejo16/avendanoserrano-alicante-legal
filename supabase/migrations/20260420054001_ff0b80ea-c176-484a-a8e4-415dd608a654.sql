-- Enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Tabla de roles de usuario (separada por seguridad)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función SECURITY DEFINER para evitar recursión en RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Políticas user_roles: solo admins ven/gestionan
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Tabla de reseñas
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  service TEXT NOT NULL,
  rating SMALLINT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validación de rating mediante trigger (no CHECK por flexibilidad)
CREATE OR REPLACE FUNCTION public.validate_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'La valoración debe estar entre 1 y 5';
  END IF;
  IF length(trim(NEW.client_name)) = 0 OR length(NEW.client_name) > 100 THEN
    RAISE EXCEPTION 'Nombre inválido';
  END IF;
  IF length(trim(NEW.service)) = 0 OR length(NEW.service) > 100 THEN
    RAISE EXCEPTION 'Servicio inválido';
  END IF;
  IF length(trim(NEW.comment)) = 0 OR length(NEW.comment) > 500 THEN
    RAISE EXCEPTION 'Comentario inválido (máx 500 caracteres)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_review_trigger
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review();

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer reseñas (públicas)
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

-- Cualquiera puede dejar una reseña
CREATE POLICY "Anyone can submit a review"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

-- Solo admins pueden eliminar reseñas
CREATE POLICY "Admins can delete reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Solo admins pueden actualizar reseñas
CREATE POLICY "Admins can update reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Índice por fecha para listado
CREATE INDEX idx_reviews_created_at ON public.reviews (created_at DESC);