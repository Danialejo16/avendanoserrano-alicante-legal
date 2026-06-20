
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;

CREATE POLICY "Admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
