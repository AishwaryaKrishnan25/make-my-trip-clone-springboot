import React, { useEffect, useRef, useState } from "react";
import {
  getFlightStatus,
  createEventSourceWithReconnect,
  setDelayMock,
} from "@/api"; // adjust path if your alias differs

type Props = {
  flightId: string;
  enableNotifications?: boolean;
  enablePolling?: boolean;
  pollIntervalMs?: number;
};

type FlightStatus = {
  flightId: string;
  flightName: string;
  status: string;
  delayMinutes: number;
  delayReason?: string | null;
  estimatedArrival?: string | null;
  lastUpdated?: string | null;
};

export default function LiveFlightStatus({
  flightId,
  enableNotifications = true,
  enablePolling = false,
  pollIntervalMs = 60000,
}: Props) {
	
	const RANDOM_REASONS = [
	  "Weather issue",
	  "Technical inspection",
	  "Air traffic congestion",
	  "Crew shortage",
	  "Runway maintenance",
	  "Security check delays",
	  "Passenger connection delay",
	  "Fueling operations",
	  "Baggage loading issue",
	  "ATC slot restriction"
	];

	function generateRandomStatus() {
	  const statuses = ["ON_TIME", "DELAYED", "CANCELLED", "ARRIVED"];
	  const pick = statuses[Math.floor(Math.random() * statuses.length)];
	  return pick;
	}
	
	function generateRandomEstimatedArrival(randomStatus: string, delayMinutes: number) {
	  const now = new Date();

	  if (randomStatus === "CANCELLED") {
	    return null;
	  }

	  if (randomStatus === "ARRIVED") {
	    return new Date().toISOString();
	  }

	  if (randomStatus === "DELAYED") {
	    const delayed = new Date(now.getTime() + (delayMinutes + Math.floor(Math.random() * 20)) * 60000);
	    return delayed.toISOString();
	  }

	  // ON_TIME
	  const earlyArrival = new Date(now.getTime() + (30 + Math.floor(Math.random() * 90)) * 60000);
	  return earlyArrival.toISOString();
	}


	const [actionMessage, setActionMessage] = useState<string>("");
	const [status, setStatus] = useState<FlightStatus | null>(null);
	const [connected, setConnected] = useState(false);
	const latestStatusRef = useRef<FlightStatus | null>(null);
	const esControllerRef = useRef<{ start: () => void; close: () => void; isRunning?: boolean } | null>(null);
	const fallbackEsRef = useRef<EventSource | null>(null);
	const pollTimerRef = useRef<number | null>(null);


  const handleUnsubscribe = () => {
    if (esControllerRef.current) {
      esControllerRef.current.close();
      esControllerRef.current = null;
    }
    setConnected(false);
  };

  function showAction(msg: string) {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(""), 2000); // disappears after 2s
  }


  useEffect(() => {
    if (enableNotifications && typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [enableNotifications]);

  useEffect(() => {
    latestStatusRef.current = status;
  }, [status]);

  function sendNotification(title: string, body?: string) {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      try {
        const n = new Notification(title, { body: body || "", tag: flightId });
        setTimeout(() => n.close(), 8000);
      } catch (e) {}
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") {
          try {
            const n = new Notification(title, { body: body || "", tag: flightId });
            setTimeout(() => n.close(), 8000);
          } catch (e) {}
        }
      }).catch(() => {});
    }
  }

  function handleIncomingUpdateWithNotifications(payload: FlightStatus) {
    const prev = latestStatusRef.current;
    let shouldNotify = false;
    let title = "";
    let body = "";

    if (!prev) {
      if (payload.status === "DELAYED") {
        shouldNotify = true;
        title = `Flight ${payload.flightName} delayed`;
        body = payload.delayReason || `Delayed by ${payload.delayMinutes || 0} minutes`;
      } else if (payload.status === "CANCELLED") {
        shouldNotify = true;
        title = `Flight ${payload.flightName} cancelled`;
        body = payload.delayReason || "";
      }
    } else {
      if ((payload.status === "DELAYED" && prev.status !== "DELAYED") ||
          (payload.status === "CANCELLED" && prev.status !== "CANCELLED")) {
        shouldNotify = true;
        title = `Flight ${payload.flightName} ${payload.status}`;
        body = payload.delayReason || (payload.delayMinutes ? `Delayed by ${payload.delayMinutes}m` : "");
      } else if ((payload.delayMinutes || 0) > (prev.delayMinutes || 0) + 10) {
        shouldNotify = true;
        title = `Delay increased: ${payload.flightName}`;
        body = `Now delayed by ${payload.delayMinutes} minutes — ${payload.delayReason || ""}`;
      } else if (payload.status === "ARRIVED" && prev.status !== "ARRIVED") {
        shouldNotify = true;
        title = `Flight arrived: ${payload.flightName}`;
        body = `Arrived at ${payload.estimatedArrival ?? "N/A"}`;
      }
    }

    if (shouldNotify && enableNotifications) sendNotification(title, body);
  }

  useEffect(() => {
    if (!flightId) return;
    let cancelled = false;

    (async () => {
      try {
        const initial = await getFlightStatus(flightId);
        if (cancelled) return;
        setStatus({
          ...initial,
          estimatedArrival: initial.estimatedArrival ?? null,
          lastUpdated: initial.lastUpdated ?? null,
        });
      } catch (err) {
        console.error("getFlightStatus error", err);
      }
    })();

    // Try using the reconnecting helper
    try {
      const esCtl = createEventSourceWithReconnect(flightId, {
        onopen: () => setConnected(true),
        oninit: (data: FlightStatus) => setStatus(data),
		onupdate: (data: FlightStatus) => { 
		    handleIncomingUpdateWithNotifications(data); 
		    setStatus(data); 
		},
        onmessage: (data: FlightStatus) => setStatus(data),
        onerror: (err: any) => { console.warn("SSE error (reconnect helper):", err); setConnected(false); },
      });
      esControllerRef.current = esCtl;
      esCtl.start();
    } catch (e) {
      // fallback to plain EventSource if helper is not available
      const base = (process.env.NEXT_PUBLIC_API_BASE || "https://make-my-trip-clone-springboot-gb7g.onrender.com").replace(/\/$/, "");
      const url = `${base}/api/flight-status/stream/${encodeURIComponent(flightId)}`;
      try {
        const es = new EventSource(url);
        fallbackEsRef.current = es;

        es.onopen = () => setConnected(true);
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data) as FlightStatus;
            setStatus(data);
          } catch (err) {}
        };
        es.addEventListener("init", (ev: MessageEvent) => {
          try {
            const payload = JSON.parse((ev as any).data) as FlightStatus;
            setStatus(payload);
          } catch (err) {}
        });
        es.addEventListener("update", (ev: MessageEvent) => {
          try {
            const payload = JSON.parse((ev as any).data) as FlightStatus;
            handleIncomingUpdateWithNotifications(payload);
            setStatus(payload);
          } catch (err) {}
        });
        es.addEventListener("broadcast", (ev: MessageEvent) => {
          try {
            const payload = JSON.parse((ev as any).data) as FlightStatus;
            handleIncomingUpdateWithNotifications(payload);
            setStatus(payload);
          } catch (err) {}
        });
        es.onerror = (err) => {
          console.warn("SSE fallback error:", err);
          setConnected(false);
        };
      } catch (err) {
        console.warn("EventSource fallback failed:", err);
      }
    }

    // optional polling
    if (enablePolling) {
      const doPoll = async () => {
        try {
          const fresh = await getFlightStatus(flightId);
          if (cancelled) return;
          handleIncomingUpdateWithNotifications(fresh);
          setStatus(fresh);
        } catch (e) {
          console.error("Polling error", e);
        }
      };
      doPoll();
      const id = window.setInterval(doPoll, pollIntervalMs);
      pollTimerRef.current = id;
    }

    return () => {
      cancelled = true;
      // stop reconnecting controller if used
      if (esControllerRef.current) {
        try { esControllerRef.current.close(); } catch (e) {}
        esControllerRef.current = null;
      }
      // close fallback EventSource if used
      if (fallbackEsRef.current) {
        try { fallbackEsRef.current.close(); } catch (e) {}
        fallbackEsRef.current = null;
      }
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightId, enablePolling, pollIntervalMs]);

  if (!status) return <div className="p-4 bg-white rounded shadow">Loading flight status…</div>;

  const etaText = status.estimatedArrival ? new Date(status.estimatedArrival).toLocaleString() : "N/A";

  return (
    <div className="p-4 bg-white rounded shadow space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{status.flightName}</div>
          <div className="text-sm text-gray-600">Flight ID: {status.flightId}</div>
        </div>
        <div>
          <span
            className={
              "px-3 py-1 rounded-full text-sm font-medium " +
              (status.status === "ON_TIME"
                ? "bg-green-100 text-green-800"
                : status.status === "DELAYED"
                ? "bg-yellow-100 text-yellow-800"
                : status.status === "CANCELLED"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700")
            }
          >
            {status.status} {status.delayMinutes ? `• ${status.delayMinutes}m` : ""}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-xs text-gray-500">Estimated Arrival</div>
          <div className="font-medium">{etaText}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Delay Reason</div>
          <div className="font-medium">{status.delayReason || "—"}</div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Last updated: {status.lastUpdated ? new Date(status.lastUpdated).toLocaleString() : "-"}
      </div>

      <div className="flex gap-2">
	  <button
	    onClick={async () => {
	      try {
	        const fresh = await getFlightStatus(status.flightId);
	        setStatus(fresh);
	        showAction("✔ Refreshed");
	      } catch (e) {
	        console.error(e);
	        showAction("❌ Refresh failed");
	      }
	    }}
	    className="px-3 py-1 border rounded"
	  >
	    Refresh
	  </button>


	  <button
	    onClick={() => {
	      const ctl = esControllerRef.current;
	      const fb = fallbackEsRef.current;

	      // If reconnect-controller exists → unsubscribe
	      if (ctl) {
	        try {
	          ctl.close();
	        } catch {}
	        esControllerRef.current = null;
	        setConnected(false);
	        return;
	      }

	      // If fallback EventSource exists → unsubscribe
	      if (fb) {
	        try {
	          fb.close();
	        } catch {}
	        fallbackEsRef.current = null;
	        setConnected(false);
	        return;
	      }

	      // No SSE exists → reconnect by reloading (simple + safe)
	      window.location.reload();
	    }}
	    className="px-3 py-1 border rounded"
	  >
	    {connected ? "Unsubscribe" : "Reconnect"}
	  </button>


	  <button
	    onClick={async () => {
	      try {
	        const randomMinutes = Math.floor(Math.random() * 60) + 1;
	        const randomReason = RANDOM_REASONS[Math.floor(Math.random() * RANDOM_REASONS.length)];
	        const randomStatus = generateRandomStatus();
	        const randomEta = generateRandomEstimatedArrival(randomStatus, randomMinutes);

	        await setDelayMock(
	          status.flightId,
	          randomMinutes,
	          `${randomStatus}: ${randomReason}`
	        );

	        setStatus((prev) =>
	          prev ? { ...prev, estimatedArrival: randomEta } : prev
	        );

	        showAction("⏱ Mock Delay Triggered");

	      } catch (e) {
	        console.error("setDelayMock failed", e);
	        showAction("❌ Mock Delay Failed");
	      }
	    }}
	    className="px-3 py-1 border rounded"
	  >
	    Trigger mock delay
	  </button>


      </div>
    </div>
  );
}
