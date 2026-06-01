-- Remove public INSERT on contact_submissions (now goes through edge function with service role)
DROP POLICY IF EXISTS "Anyone can submit a contact form" ON public.contact_submissions;

-- Validation trigger to enforce length/format limits on any direct writes
CREATE OR REPLACE FUNCTION public.validate_contact_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.name IS NULL OR length(NEW.name) = 0 OR length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Invalid name';
  END IF;
  IF NEW.phone IS NULL OR length(NEW.phone) = 0 OR length(NEW.phone) > 30 THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;
  IF NEW.email IS NULL OR length(NEW.email) = 0 OR length(NEW.email) > 255
     OR NEW.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF NEW.message IS NULL OR length(NEW.message) = 0 OR length(NEW.message) > 5000 THEN
    RAISE EXCEPTION 'Invalid message';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_contact_submission_trg ON public.contact_submissions;
CREATE TRIGGER validate_contact_submission_trg
BEFORE INSERT OR UPDATE ON public.contact_submissions
FOR EACH ROW EXECUTE FUNCTION public.validate_contact_submission();

-- Create cron_secret in Vault (idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_secret text;
  v_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'cron_secret') INTO v_exists;
  IF NOT v_exists THEN
    v_secret := encode(gen_random_bytes(32), 'hex');
    PERFORM vault.create_secret(v_secret, 'cron_secret', 'Shared secret for authenticating cron-triggered edge functions');
  END IF;
END $$;

-- Reschedule reminder cron job with Authorization header from Vault
DO $$
DECLARE
  job_id bigint;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'send-appointment-reminders-daily';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'send-appointment-reminders-daily',
  '0 9 * * *',
  $cron$
  SELECT net.http_post(
    url:='https://exovqusuhxjrowhnunsl.supabase.co/functions/v1/send-appointment-reminders',
    headers:=jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='cron_secret' LIMIT 1)
    ),
    body:='{}'::jsonb
  );
  $cron$
);