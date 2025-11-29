// supabase/functions/realtime/index.ts
import { serve } from "http-server";
import { createClient } from "@supabase/supabase-js";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("https://rojhcadtqfynlqzubftx.supabase.co")!,
    Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvamhjYWR0cWZ5bmxxenViZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzYzNTksImV4cCI6MjA3NzcxMjM1OX0.XZElBWD-QdS8XVKex92VKUAlifC6BXqe3kGYPmZ1Mcs")!
  );

  const { data } = await supabase
    .from("realtime_data")
    .select("*")
    .order("updated_at", { ascending: false });

  return new Response(JSON.stringify(data), { status: 200 });
});
