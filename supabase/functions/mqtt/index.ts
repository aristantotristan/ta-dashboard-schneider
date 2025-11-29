import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const body = await req.json();

  const supabase = createClient(
    Deno.env.get("https://rojhcadtqfynlqzubftx.supabase.co")!,
    Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvamhjYWR0cWZ5bmxxenViZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzYzNTksImV4cCI6MjA3NzcxMjM1OX0.XZElBWD-QdS8XVKex92VKUAlifC6BXqe3kGYPmZ1Mcs")!
  );

  const now = new Date().toISOString();

  await supabase.from("realtime_data").insert({
    device_id: body.device_id,
    value: body.value,
    updated_at: now
  });

  await supabase.from("device_status").upsert({
    device_id: body.device_id,
    last_update: now
  });

  return new Response("OK", { status: 200 });
});
