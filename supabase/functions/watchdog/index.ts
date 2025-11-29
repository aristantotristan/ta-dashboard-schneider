// supabase/functions/watchdog/index.ts
import { serve } from "http-server";
import { createClient } from "@supabase/supabase-js";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ambil semua device status
  const { data: statuses } = await supabase
    .from("device_status")
    .select("*");

  const now = new Date().toISOString();

  for (const row of statuses) {
    const offlineLimit = 60 * 1000; // 1 menit tanpa update

    const lastUpdate = new Date(row.last_update).getTime();
    const diff = Date.now() - lastUpdate;

    if (diff > offlineLimit) {
      await supabase.from("watchdog_log").insert({
        status: "OFFLINE",
        detected_at: now,
        note: `Device ${row.device_id} tidak merespon ${Math.floor(diff / 1000)} detik`
      });

      // update device_last_state
      await supabase.from("device_last_state").upsert({
        device_id: row.device_id,
        last_state: "OFFLINE",
        updated_at: now,
      });
    }
  }

  return new Response("Watchdog OK", { status: 200 });
});
