import React, { useEffect, useRef, useState } from "react";
import {
  getSeatMap,
  reserveSeat,
  releaseSeat,
  createSeatSSE,
  getPreferences,
  savePreferences,
} from "@/api";
import SeatUpsellPopup from "./SeatUpsellPopup";

type Seat = {
  id: string;
  flightId: string;
  row: string;
  col: string;
  category?: string;
  reserved?: boolean;
  reservedBy?: string | null;

  premium?: boolean;
  premiumPrice?: number;

  window?: boolean;
  aisle?: boolean;
};

export default function SeatMap({
  flightId,
  userId,
}: {
  flightId: string;
  userId: string;
}) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [upsellSeat, setUpsellSeat] = useState<Seat | null>(null);
  const [prefs, setPrefs] = useState<any>(null);

  const sseCtlRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getSeatMap(flightId);
        if (cancelled) return;
        setSeats(Array.isArray(data) ? data : []);

        const p = await getPreferences(userId).catch(() => null);
        if (!cancelled) setPrefs(p);
      } catch (err) {
        console.error("Seat map load error:", err);
      }
    })();

    try {
      const ctl = createSeatSSE(flightId, {
        oninit: (payload: any) => Array.isArray(payload) && setSeats(payload),
        onupdate: (payload: any) => {
          if (Array.isArray(payload)) {
            setSeats(payload);
          } else {
            setSeats((prev) =>
              prev.map((s) => (s.id === payload.id ? payload : s))
            );
          }
        },
        onerror: (err: any) => console.warn("SSE error", err),
      });
      sseCtlRef.current = ctl;
      (ctl as any)?.start?.();
    } catch (e) {
      console.warn("SSE init failed:", e);
    }

    return () => {
      cancelled = true;
      const ctl = sseCtlRef.current;
      if (ctl?.close) ctl.close();
      sseCtlRef.current = null;
    };
  }, [flightId, userId]);

  async function onClickSeat(seat: Seat) {
    if (seat.reserved && seat.reservedBy === userId) {
      try {
        setLoading(true);
        await releaseSeat(seat.id, userId);
        setSelected(null);
      } catch (err: any) {
        alert("Failed to release seat: " + err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (seat.premium) {
      setUpsellSeat(seat);
      return;
    }

    await reserveAndSave(seat);
  }

  async function reserveAndSave(seat: Seat) {
    try {
      setLoading(true);
      const updated = await reserveSeat(seat.id, userId);
      setSelected(updated.id);

      await savePreferences(userId, {
        preferredSeatType: seat.window
          ? "WINDOW"
          : seat.aisle
          ? "AISLE"
          : "MIDDLE",
        preferredSeatId: seat.id,
      });
    } catch (err: any) {
      alert("Failed to reserve: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const rowMap = new Map<string, Seat[]>();
  seats.forEach((s) => {
    if (!rowMap.has(s.row)) rowMap.set(s.row, []);
    rowMap.get(s.row)!.push(s);
  });
  const rows = Array.from(rowMap.entries()).sort(
    (a, b) => Number(a[0]) - Number(b[0])
  );

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h3 className="font-semibold mb-4 text-lg text-gray-800">
        Seat Map — {flightId}
      </h3>

      {loading && (
        <div className="text-sm text-gray-600 mb-2 animate-pulse">Working…</div>
      )}

      <div className="space-y-3">
        {rows.map(([row, rowSeats]) => (
          <div key={row} className="flex items-center gap-3 transition-all">
            <div className="w-10 text-sm font-medium text-gray-700">{row}</div>

            <div className="flex flex-wrap gap-2">
              {rowSeats
                .sort((a, b) => a.col.localeCompare(b.col))
                .map((seat) => {
                  const isSelected = selected === seat.id;

                  const cls = seat.reserved
                    ? "bg-red-400 text-white border-red-600"
                    : seat.premium
                    ? "bg-yellow-200 border-yellow-500"
                    : "bg-green-100 border-green-400";

                  const highlightPref =
                    prefs &&
                    ((prefs.preferredSeatType === "WINDOW" && seat.window) ||
                      (prefs.preferredSeatType === "AISLE" && seat.aisle) ||
                      prefs.preferredSeatId === seat.id);

                  return (
                    <button
                      key={seat.id}
                      title={`${seat.row}${seat.col}`}
                      disabled={seat.reserved && seat.reservedBy !== userId}
                      onClick={() => onClickSeat(seat)}
                      className={`w-12 h-12 rounded-lg border text-sm font-medium flex items-center justify-center transition 
                        ${cls}
                        ${
                          isSelected
                            ? "ring-2 ring-indigo-500 scale-105 shadow-lg"
                            : ""
                        }
                        ${highlightPref ? "ring-2 ring-blue-400" : ""}
                        ${
                          !(seat.reserved && seat.reservedBy !== userId)
                            ? "hover:scale-105 hover:shadow-md"
                            : "opacity-60 cursor-not-allowed"
                        }
                      `}
                    >
                      {seat.row}
                      {seat.col}
                    </button>
                  );
                })}
            </div>

            <div className="w-10 text-sm font-medium text-gray-700">{row}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 text-sm grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 bg-green-200 border border-green-500 rounded" />
          Available
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 bg-yellow-200 border border-yellow-500 rounded" />
          Premium
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 bg-red-300 border border-red-500 rounded" />
          Reserved
        </div>
      </div>

      {upsellSeat && (
        <SeatUpsellPopup
          seat={upsellSeat}
          onCancel={() => setUpsellSeat(null)}
          onConfirm={async () => {
            await reserveAndSave(upsellSeat);
            setUpsellSeat(null);
          }}
        />
      )}
    </div>
  );
}
