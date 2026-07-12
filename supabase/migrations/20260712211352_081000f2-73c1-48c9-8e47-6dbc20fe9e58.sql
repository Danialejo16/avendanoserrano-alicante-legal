
-- 1) Table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  verification_code TEXT NOT NULL UNIQUE,
  qr_code_url TEXT,
  client_id UUID,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX documents_verification_code_idx ON public.documents(verification_code);

-- 2) Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

-- 3) RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can view all documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update documents"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete documents"
  ON public.documents FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) Validation trigger
CREATE OR REPLACE FUNCTION public.validate_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF length(trim(NEW.title)) = 0 OR length(NEW.title) > 200 THEN
    RAISE EXCEPTION 'Título inválido (1-200 caracteres)';
  END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) > 2000 THEN
    RAISE EXCEPTION 'Descripción demasiado larga (máx 2000)';
  END IF;
  IF length(NEW.verification_code) < 6 OR length(NEW.verification_code) > 32 THEN
    RAISE EXCEPTION 'Código de verificación inválido';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER documents_validate
BEFORE INSERT OR UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.validate_document();

-- 5) Public verification RPC (security definer) — returns metadata only
CREATE OR REPLACE FUNCTION public.verify_document(_code TEXT)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  file_path TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _code IS NULL OR length(trim(_code)) < 6 OR length(_code) > 40 THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT d.id, d.title, d.description, d.file_path, d.created_at
    FROM public.documents d
    WHERE d.verification_code = trim(_code)
    LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_document(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_document(TEXT) TO anon, authenticated;

-- 6) Increment view counter (security definer)
CREATE OR REPLACE FUNCTION public.increment_document_view(_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.documents
     SET view_count = view_count + 1
   WHERE verification_code = trim(_code);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_document_view(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_document_view(TEXT) TO anon, authenticated;

-- 7) Storage policies for private 'documents' bucket
CREATE POLICY "Admins can read document files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload document files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update document files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete document files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
