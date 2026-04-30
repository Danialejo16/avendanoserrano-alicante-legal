
-- Subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  language TEXT NOT NULL DEFAULT 'es',
  status TEXT NOT NULL DEFAULT 'active',
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  source TEXT
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert) — duplicates handled via unique + edge function
CREATE POLICY "Anyone can subscribe"
ON public.newsletter_subscribers
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can view subscribers
CREATE POLICY "Admins can view subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscribers"
ON public.newsletter_subscribers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subscribers"
ON public.newsletter_subscribers
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_newsletter_subscribers_status ON public.newsletter_subscribers(status);

-- Campaigns
CREATE TABLE public.newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_html TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'announcement',
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  cover_image_url TEXT,
  cta_label TEXT,
  cta_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view campaigns"
ON public.newsletter_campaigns
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert campaigns"
ON public.newsletter_campaigns
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins can update campaigns"
ON public.newsletter_campaigns
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete campaigns"
ON public.newsletter_campaigns
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Trigger to track sent blog posts (avoid duplicates)
CREATE TABLE public.newsletter_blog_sent (
  blog_post_id UUID PRIMARY KEY REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  campaign_id UUID REFERENCES public.newsletter_campaigns(id) ON DELETE SET NULL
);

ALTER TABLE public.newsletter_blog_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view blog sent"
ON public.newsletter_blog_sent
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));
