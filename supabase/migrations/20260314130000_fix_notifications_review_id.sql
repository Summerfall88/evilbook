-- Drop foreign key first
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_review_id_fkey;

-- Change review_id type to TEXT to match comments table
ALTER TABLE public.notifications ALTER COLUMN review_id TYPE TEXT;

-- Update the handle_new_comment_reply function to ensure compatibility
CREATE OR REPLACE FUNCTION public.handle_new_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
    parent_comment_user_id UUID;
BEGIN
    -- If it's a reply to an existing comment (parent_id is not null)
    IF NEW.parent_id IS NOT NULL THEN
        -- Get the user_id of the parent comment's author
        SELECT user_id INTO parent_comment_user_id FROM public.comments WHERE id = NEW.parent_id;
        
        -- Create a notification for the parent comment author, ONLY if they are not the ones replying to themselves
        IF parent_comment_user_id IS NOT NULL AND parent_comment_user_id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, actor_id, review_id, comment_id)
            VALUES (parent_comment_user_id, NEW.user_id, NEW.review_id, NEW.id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
