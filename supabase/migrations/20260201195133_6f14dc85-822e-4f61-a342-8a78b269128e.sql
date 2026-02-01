-- Fix views to use security_invoker instead of security_definer

-- Recreate forum_questions_public view with security_invoker
DROP VIEW IF EXISTS public.forum_questions_public;
CREATE VIEW public.forum_questions_public
WITH (security_invoker=on) AS
SELECT 
  id,
  title,
  description,
  author_name,
  CASE 
    WHEN author_email IS NOT NULL THEN 
      LEFT(author_email, 3) || '***@' || SPLIT_PART(author_email, '@', 2)
    ELSE NULL
  END as author_email_masked,
  niche,
  status,
  answer_count,
  resolved_at,
  converted_problem_id,
  created_at,
  updated_at
FROM public.forum_questions;

-- Recreate profiles_public view with security_invoker
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  bio,
  created_at
FROM public.profiles;