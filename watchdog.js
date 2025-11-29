import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rojhcadtqfynlqzubftx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvamhjYWR0cWZ5bmxxenViZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzYzNTksImV4cCI6MjA3NzcxMjM1OX0.XZElBWD-QdS8XVKex92VKUAlifC6BXqe3kGYPmZ1Mcs'
);

async function runWatchdog() {
  // 1. Ambil data status semua device
  const { data: devices, error } = await supabase
    .from('device_status')
    .select('*');

  if (error) {
    console.error('ERROR ambil device_status:', error);
    return;
  }

  // 2. Loop semua device
  for (const dev of devices) {
    const devId = dev.device_id;
    const lastSeen = new Date(dev.updated_at);
    const now = new Date();

    const selisihDetik = (now - lastSeen) / 1000;

    // dianggap offline kalau lebih dari 10 detik tidak update
    if (selisihDetik > 10) {
      await supabase.from('watchdog_log').insert({
        status: 'offline',
        detected_at: new Date().toISOString(),
        note: `Device ${devId} tidak merespon selama ${selisihDetik.toFixed(0)} detik`
      });

      console.log(`Device ${devId} OFFLINE → dicatat watchdog`);
    }
  }
}

setInterval(runWatchdog, 5000); // cek tiap 5 detik
