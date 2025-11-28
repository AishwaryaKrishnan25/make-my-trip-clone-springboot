// src/components/CancelBookingDialog.tsx
import React, { useState } from "react";
import { cancelBooking } from "@/api";

type Props = {
  bookingId: string;
  onSuccess?: (updatedBooking: any) => void;
  trigger?: React.ReactNode;
};

const REASONS = [
  "Change of plans",
  "Personal reasons",
  "Flight schedule clash",
  "Found cheaper option",
  "Other",
];

export default function CancelBookingDialog({ bookingId, onSuccess, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [loading, setLoading] = useState(false);

  const doCancel = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const updated = await cancelBooking(bookingId, reason);
      if (onSuccess) onSuccess(updated);
      setOpen(false);
    } catch (err: any) {
      console.error("cancel error", err);
      alert(err?.response?.data?.message || err?.message || "Cancellation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)} style={{ display: "inline-block" }}>
        {trigger ? trigger : <button className="px-3 py-2 bg-red-600 text-white rounded">Cancel</button>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Cancel Booking</h3>
            <p className="text-sm text-gray-600 mb-4">Please select a reason for cancellation (we use this for analytics):</p>

            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button onClick={() => setOpen(false)} className="px-3 py-2 border rounded">Close</button>
              <button
                onClick={doCancel}
                disabled={loading}
                className="px-3 py-2 bg-red-600 text-white rounded"
              >
                {loading ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
