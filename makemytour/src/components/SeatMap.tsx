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
  onSeatSelected,
  onSeatPriceChange,
}: {
  flightId: string;
  userId: string;
  onSeatSelected?: (seatIds: string[]) => void;
  onSeatPriceChange?: (price: number) => void;
}) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [upsellSeat, setUpsellSeat] = useState<Seat | null>(null);
  const [prefs, setPrefs] = useState<any>(null);

  const sseCtlRef = useRef<any>(null);

  function calculateTotal(ids: string[]) {
    return ids.reduce((sum, id) => {
      const seat = seats.find((s) => s.id === id);
      return sum + (seat?.premium ? seat.premiumPrice ?? 0 : 0);
    }, 0);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getSeatMap(flightId);
        if (!cancelled) setSeats(Array.isArray(data) ? data : []);

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
          if (Array.isArray(payload)) setSeats(payload);
          else {
            setSeats((prev) =>
              prev.map((s) => (s.id === payload.id ? payload : s))
            );
          }
        },
      });

      sseCtlRef.current = ctl;
      ctl.start();
    } catch (err) {
      console.error("SSE init failed:", err);
    }

    return () => {
      cancelled = true;
      const ctl = sseCtlRef.current;
      if (ctl?.close) ctl.close();
    };
  }, [flightId, userId]);

  //--------------------------------------------------------------------
  // CLICK HANDLER
  //--------------------------------------------------------------------
  async function handleSeatClick(seat: Seat) {
    // Deselect seat
    if (selected.includes(seat.id)) {
      await releaseSeat(seat.id, userId);

      const updated = selected.filter((x) => x !== seat.id);
      setSelected(updated);

      onSeatSelected?.(updated);
      onSeatPriceChange?.(calculateTotal(updated));
      return;
    }

    // Premium seat popup
    if (seat.premium) {
      setUpsellSeat(seat);
      return;
    }

    // Normal seat reserve
    await reserveAndSave(seat);

    const updated = [...selected, seat.id];
    setSelected(updated);

    onSeatSelected?.(updated);
    onSeatPriceChange?.(calculateTotal(updated));
  }

  //--------------------------------------------------------------------
  // PREMIUM - CONFIRM BUTTON
  //--------------------------------------------------------------------
  async function confirmPremium() {
    if (!upsellSeat) return;

    await reserveAndSave(upsellSeat);

    const updated = [...selected, upsellSeat.id];
    setSelected(updated);

    onSeatSelected?.(updated);
    onSeatPriceChange?.(calculateTotal(updated));

    setUpsellSeat(null);
  }

  //--------------------------------------------------------------------
  async function reserveAndSave(seat: Seat) {
    try {
      setLoading(true);

      await reserveSeat(seat.id, userId);

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

  //--------------------------------------------------------------------
  // RENDER
  //--------------------------------------------------------------------
  const rows = Array.from(
    seats.reduce((map, seat) => {
      if (!map.has(seat.row)) map.set(seat.row, []);
      map.get(seat.row)!.push(seat);
      return map;
    }, new Map<string, Seat[]>())
  ).sort((a, b) => Number(a[0]) - Number(b[0]));

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border">
      <h3 className="font-semibold text-lg mb-4">Seat Map</h3>

      {loading && (
        <div className="text-gray-600 text-sm animate-pulse">Working...</div>
      )}

      <div className="space-y-3">
        {rows.map(([row, rowSeats]) => (
          <div key={row} className="flex items-center gap-3">
            <div className="w-10 font-medium">{row}</div>

            <div className="flex flex-wrap gap-2">
              {rowSeats
                .sort((a, b) => a.col.localeCompare(b.col))
                .map((seat) => {
                  const isSelected = selected.includes(seat.id);

                  const style = seat.reserved
                    ? "bg-red-400 text-white border-red-600"
                    : seat.premium
                    ? "bg-yellow-200 border-yellow-500"
                    : "bg-green-100 border-green-400";

                  const highlight =
                    prefs &&
                    (prefs.preferredSeatId === seat.id ||
                      (prefs.preferredSeatType === "WINDOW" && seat.window) ||
                      (prefs.preferredSeatType === "AISLE" && seat.aisle));

                  return (
                    <button
                      key={seat.id}
                      disabled={seat.reserved && seat.reservedBy !== userId}
                      onClick={() => handleSeatClick(seat)}
                      className={`w-12 h-12 rounded-lg border flex items-center justify-center
                      ${style}
                      ${isSelected ? "ring-2 ring-indigo-500 scale-105" : ""}
                      ${highlight ? "ring-2 ring-blue-400" : ""}
                      ${
                        !(seat.reserved && seat.reservedBy !== userId)
                          ? "hover:scale-105"
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
          </div>
        ))}
      </div>

      {upsellSeat && (
        <SeatUpsellPopup
          seat={upsellSeat}
          onCancel={() => setUpsellSeat(null)}
          onConfirm={confirmPremium}
        />
      )}
    </div>
  );
}
