/*
# Enable Supabase Realtime for FarmXpress tables

Adds all event-driven tables to the `supabase_realtime` publication so the
Farmer Portal's realtime subscriptions (events, notifications, batches,
orders, routes, vehicles, drivers, sensors) receive live updates.
*/

ALTER PUBLICATION supabase_realtime ADD TABLE batches;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE routes;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE sensors;
