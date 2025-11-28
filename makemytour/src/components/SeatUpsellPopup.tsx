import React from "react";

type SeatUpsellPopupProps = {
  seat: {
    id: string;
    row?: string;
    col?: string;
    seatId?: string;
    premiumPrice?: number;
  };
  onConfirm: () => void;
  onCancel: () => void;
};

export default function SeatUpsellPopup({
  seat,
  onConfirm,
  onCancel,
}: SeatUpsellPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 shadow-2xl w-96 animate-fadeIn scale-100 border border-gray-200 transition">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Premium Seat Upgrade
        </h2>

        <p className="text-gray-600">
          You selected seat{" "}
          <b className="text-gray-900 text-lg">
            {seat.seatId ?? `${seat.row ?? ""}${seat.col ?? ""}`}
          </b>
        </p>

        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-gray-700">
            Additional Cost:{" "}
            <b className="text-blue-700 text-lg">
              ₹{seat.premiumPrice ?? 0}
            </b>
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-400 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
          >
            Upgrade
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
        `}
      </style>
    </div>
  );
}
