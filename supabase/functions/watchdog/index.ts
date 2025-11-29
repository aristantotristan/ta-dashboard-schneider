import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("https://rojhcadtqfynlqzubftx.supabase.co")!,
    Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvamhjYWR0cWZ5bmxxenViZnR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjEzNjM1OSwiZXhwIjoyMDc3NzEyMzU5fQ.SGsCPxdlnqMbnEzku4wLOIGoeOhFjBFFWkuPOxbSj34")!
  );

  const now = new Date().toISOString();

  const { data: devices, error } = await supabase
    .from("device_status")
    .select("*");

  if (error) {
    return new Response("Error reading device_status", { status: 500 });
  }

  for (const d of devices) {
    const last = new Date(d.last_update).getTime();
    const diff = Date.now() - last;

    if (diff > 60000) { // 1 menit
      await supabase.from("watchdog_log").insert({
        status: "OFFLINE",
        detected_at: now,
        note: `Device ${d.device_id} offline ${Math.floor(diff / 1000)} detik`
      });

      await supabase.from("device_last_state").upsert({
        device_id: d.device_id,
        last_state: "OFFLINE",
        updated_at: now
      });
    }
  }

  return new Response("Watchdog OK", { status: 200 });
});
