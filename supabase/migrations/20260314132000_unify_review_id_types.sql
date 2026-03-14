-- Clean up existing problematic relationships if they exist
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_review_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_review_id_fkey;

-- 1. Unify review_id to UUID in comments table
ALTER TABLE public.comments 
    ALTER COLUMN review_id TYPE UUID 
    USING (review_id::uuid);

-- 2. Add foreign key back for comments
ALTER TABLE public.comments 
    ADD CONSTRAINT comments_review_id_fkey 
    FOREIGN KEY (review_id) 
    REFERENCES public.reviews(id) 
    ON DELETE CASCADE;

-- 3. Unify review_id to UUID in notifications table
ALTER TABLE public.notifications 
    ALTER COLUMN review_id TYPE UUID 
    USING (review_id::uuid);

-- 4. Add foreign key back for notifications
ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_review_id_fkey 
    FOREIGN KEY (review_id) 
    REFERENCES public.reviews(id) 
    ON DELETE CASCADE;

-- 5. Restore relationships in trigger function if needed (already using NEW.review_id, so it should be fine)
-- But let's re-verify the function just in case
CREATE OR REPLACE FUNCTION public.handle_new_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
    parent_comment_user_id UUID;
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        SELECT user_id INTO parent_comment_user_id FROM public.comments WHERE id = NEW.parent_id;
        
        IF parent_comment_user_id IS NOT NULL AND parent_comment_user_id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, actor_id, review_id, comment_id)
            VALUES (parent_comment_user_id, NEW.user_id, NEW.review_id, NEW.id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
