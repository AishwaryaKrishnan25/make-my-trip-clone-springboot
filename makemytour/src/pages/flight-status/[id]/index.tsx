// pages/flight-status/[id].tsx
import { useRouter } from "next/router";
import React from "react";
import dynamic from "next/dynamic";
import PriceHistory from "@/components/PriceHistory";

// load component dynamically to avoid SSR issues with Notification and EventSource
const LiveFlightStatus = dynamic(() => import("../../../components/LiveFlightStatus"), { ssr: false });

export default function FlightStatusPage() {
  const router = useRouter();
  const { id } = router.query;
  const flightId = Array.isArray(id) ? id[0] : id;

  if (!flightId) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Live status — {flightId}</h1>

      <LiveFlightStatus flightId={flightId} enableNotifications={true} enablePolling={false} />

      {/* Price history and freeze UI */}
      <PriceHistory flightId={flightId} />
    </div>
  );
}
