-- Add reminder tracking column
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule reminder job: every day at 09:00 UTC
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
  $$
  SELECT net.http_post(
    url:='https://exovqusuhxjrowhnunsl.supabase.co/functions/v1/send-appointment-reminders',
    headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4b3ZxdXN1aHhqcm93aG51bnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTAwNzIsImV4cCI6MjA5MTQyNjA3Mn0.Z1KH5YYCQCmMSYyhirvwduAE08skp1R9k0UcQozeWRo"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);