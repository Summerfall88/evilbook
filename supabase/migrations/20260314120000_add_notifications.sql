-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
    ON public.notifications FOR DELETE 
    USING (auth.uid() = user_id);

-- Create index for faster querying
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Function to handle new comment replies
CREATE OR REPLACE FUNCTION public.handle_new_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
    parent_comment_user_id UUID;
    review_author_id UUID;
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

    -- Alternatively, we could also notify the review author if someone commented on their review, 
    -- but for now sticking to the Instagram "reply" style as requested.
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new comments
DROP TRIGGER IF EXISTS on_comment_reply ON public.comments;
CREATE TRIGGER on_comment_reply
    AFTER INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_comment_reply();
