
CREATE TABLE public.site_content (
  section text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_content public read"
  ON public.site_content FOR SELECT
  USING (true);

CREATE POLICY "site_content admin insert"
  ON public.site_content FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "site_content admin update"
  ON public.site_content FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "site_content admin delete"
  ON public.site_content FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.site_content_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER site_content_touch_trg
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.site_content_touch();

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;

INSERT INTO public.site_content (section, data) VALUES
('general', jsonb_build_object(
  'phone', '+34 645 04 16 64',
  'phoneHref', 'tel:+34645041664',
  'email', 'info@avendanoserrano.es',
  'socials', jsonb_build_array(
    jsonb_build_object('icon','facebook','url','https://www.facebook.com/danialejoserrano','label','Facebook'),
    jsonb_build_object('icon','instagram','url','https://instagram.com/_danialejo_','label','Instagram'),
    jsonb_build_object('icon','linkedin','url','https://linkedin.com','label','LinkedIn')
  )
)),
('contact', jsonb_build_object(
  'address', 'Calle Ejemplo 123, Alicante',
  'mapsUrl', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.0!2d-0.4831!3d38.3452!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1',
  'hours', jsonb_build_array(
    jsonb_build_object('days','Lunes a Viernes','hours','09:00 - 18:00'),
    jsonb_build_object('days','Sábado','hours','Cerrado'),
    jsonb_build_object('days','Domingo','hours','Cerrado')
  ),
  'extraPhones', jsonb_build_array(),
  'extraEmails', jsonb_build_array()
)),
('cv', jsonb_build_object(
  'photoUrl', '',
  'name', 'Daniel Alejo Avendaño Serrano',
  'role', 'Abogado — Fundador',
  'linkedin', 'https://linkedin.com',
  'phone', '+34 645 04 16 64',
  'email', 'info@avendanoserrano.es',
  'about', 'Abogado con experiencia en derecho civil, laboral, extranjería, penal y mercantil.',
  'education', jsonb_build_array(
    jsonb_build_object('title','Grado en Derecho','institution','Universidad de Alicante','startYear','2016','endYear','2020','description','Formación integral en derecho español y europeo.'),
    jsonb_build_object('title','Máster en Abogacía','institution','Universidad de Alicante','startYear','2020','endYear','2021','description','Habilitación profesional para el ejercicio de la abogacía.')
  )
));
