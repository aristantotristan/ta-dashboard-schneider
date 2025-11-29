// supabase/functions/mqtt/index.ts
import { serve } from "http-server";
import { createClient } from "@supabase/supabase-js";

serve(async (req) => {
  const body = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
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
