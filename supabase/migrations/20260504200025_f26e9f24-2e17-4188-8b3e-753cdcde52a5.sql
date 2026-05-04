
-- Services
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (active = true);
CREATE POLICY "Admins can view all services" ON public.services FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update services" ON public.services FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete services" ON public.services FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- Appointments
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_email text,
  appointment_date date NOT NULL,
  appointment_hour smallint NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  notes text,
  google_event_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX appointments_unique_slot ON public.appointments(appointment_date, appointment_hour) WHERE status <> 'cancelled';
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view appointments" ON public.appointments FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can insert appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.validate_appointment()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.appointment_hour < 9 OR NEW.appointment_hour > 17 THEN
    RAISE EXCEPTION 'La hora debe estar entre 9 y 17';
  END IF;
  IF length(trim(NEW.client_name)) = 0 OR length(NEW.client_name) > 100 THEN
    RAISE EXCEPTION 'Nombre inválido';
  END IF;
  IF length(trim(NEW.client_phone)) = 0 OR length(NEW.client_phone) > 30 THEN
    RAISE EXCEPTION 'Teléfono inválido';
  END IF;
  IF NEW.client_email IS NOT NULL AND length(NEW.client_email) > 255 THEN
    RAISE EXCEPTION 'Email demasiado largo';
  END IF;
  IF NEW.status NOT IN ('confirmed','cancelled','completed') THEN
    RAISE EXCEPTION 'Estado inválido';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER appointments_validate BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_appointment();

-- Public function to read busy slots without exposing client data
CREATE OR REPLACE FUNCTION public.get_busy_slots(_from date, _to date)
RETURNS TABLE(appointment_date date, appointment_hour smallint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT appointment_date, appointment_hour FROM public.appointments
  WHERE status <> 'cancelled' AND appointment_date BETWEEN _from AND _to;
$$;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(date, date) TO anon, authenticated;

-- Blocks (vacaciones, comida, festivos, franjas)
CREATE TABLE public.appointment_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_hour smallint,
  end_hour smallint,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointment_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view blocks" ON public.appointment_blocks FOR SELECT USING (true);
CREATE POLICY "Admins can insert blocks" ON public.appointment_blocks FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update blocks" ON public.appointment_blocks FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete blocks" ON public.appointment_blocks FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- Seed initial services
INSERT INTO public.services (name, sort_order) VALUES
  ('Consulta general', 1),
  ('Asesoramiento legal', 2),
  ('Revisión de documentos', 3);
