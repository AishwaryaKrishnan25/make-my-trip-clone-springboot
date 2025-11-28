// src/pages/profile/index.tsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getUserBookings, getBooking } from "@/api";
import CancelBookingDialog from "@/components/CancelBookingDialog";

export default function ProfilePage() {
  const user = useSelector((s: any) => s.user?.user);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const data = await getUserBookings(user.id);
        setBookings(data || []);
      } catch (err) {
        console.error("fetch bookings", err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const refreshBooking = async (bookingId: string) => {
    try {
      const updated = await getBooking(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return <div className="p-6">Please log in to view your bookings.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your Bookings</h1>

      {loading && <div>Loading bookings...</div>}

      {!loading && bookings.length === 0 && (
        <div className="p-4 bg-white rounded shadow">No bookings found.</div>
      )}

      <div className="space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="bg-white p-4 rounded shadow flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold">{b.bookingType} • {b.bookingRef}</div>
              <div className="text-sm text-gray-600">Booked: {new Date(b.bookingTime).toLocaleString()}</div>
              <div className="text-sm">Status: <strong>{b.status}</strong></div>

              {b.status === "CANCELLED" && (
                <div className="text-sm text-gray-700 mt-2">
                  <div>Cancel reason: {b.cancellationReason}</div>
                  <div>Refund amount: ₹ {b.refundAmount?.toFixed(2)}</div>
                  <div>Refund status: {b.refundStatus}</div>
                </div>
              )}
            </div>

            <div className="mt-3 md:mt-0 flex gap-2 items-center">
              {b.status !== "CANCELLED" && (
                <CancelBookingDialog
                  bookingId={b.id}
                  onSuccess={(updated) => {
                    setBookings((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                  }}
                  trigger={<button className="px-3 py-2 bg-red-600 text-white rounded">Cancel booking</button>}
                />
              )}
              <button
                onClick={() => refreshBooking(b.id)}
                className="px-3 py-2 border rounded"
              >
                Refresh
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
