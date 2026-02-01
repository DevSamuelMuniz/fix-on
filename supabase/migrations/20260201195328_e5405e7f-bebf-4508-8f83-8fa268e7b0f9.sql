-- Drop the old permissive DELETE policy that still exists
DROP POLICY IF EXISTS "Qualquer um pode remover seu upvote" ON public.forum_upvotes;

-- Also remove the direct INSERT policy since we now use toggle_upvote function
DROP POLICY IF EXISTS "Qualquer um pode dar upvote" ON public.forum_upvotes;

-- The toggle_upvote function handles both insert and delete with ownership validation
-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.toggle_upvote(uuid, varchar) TO anon, authenticated;