// pages/index.js

import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamic Import: Memuat komponen hanya di sisi client (ssr: false)
// Ini adalah FIX untuk masalah blank page di Vercel
const RealtimeDashboardComponent = dynamic(
  () => import('../components/RealtimeDashboard'),
  { ssr: false } 
);

export default function RealtimePage() {
  return (
    <>
      <Head>
        <title>⚡ Realtime Monitoring (MQTT)</title>
      </Head>
      <RealtimeDashboardComponent />
    </>
  );
}
