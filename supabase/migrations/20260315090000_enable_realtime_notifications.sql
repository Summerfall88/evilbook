-- Enable Realtime for notifications table
begin;
  -- Add the notifications table to the supabase_realtime publication
  alter publication supabase_realtime add table public.notifications;
  
  -- Set replica identity to FULL to ensure the filter works correctly for all events
  alter table public.notifications replica identity full;
commit;
