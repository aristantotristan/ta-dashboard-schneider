// supabase/functions/mqtt/index.ts
import { serve } from "http-server";
import { createClient } from "@supabase/supabase-js";

serve(async (req) => {
  const body = await req.json();

  const supabase = createClient(
    Deno.env.get("https://rojhcadtqfynlqzubftx.supabase.co")!,
    Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvamhjYWR0cWZ5bmxxenViZnR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjEzNjM1OSwiZXhwIjoyMDc3NzEyMzU5fQ.SGsCPxdlnqMbnEzku4wLOIGoeOhFjBFFWkuPOxbSj34")!
  );

  const now = new Date().toISOString();

  // simpan realtime_data
  await supabase.from("realtime_data").insert({
    device_id: body.device_id,
    value: body.value,
    updated_at: now,
  });

  // update device_status
  await supabase.from("device_status").upsert({
    device_id: body.device_id,
    last_update: now,
  });

  return new Response("OK", { status: 200 });
});
