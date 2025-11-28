// src/components/RoomGrid.tsx
import React, { useEffect, useState } from "react";
import { getRoomTypes, reserveRoom, getPreferences } from "@/api";
import Room3DPreview from "./Room3DPreview";

type Room = {
  id: string;
  hotelId?: string;
  name: string;
  description?: string;
  pricePerNight?: number;
  availableCount?: number;
  amenities?: string[];
  imageUrl?: string;
  preview3DUrl?: string;

  // NEW FIELD for preference highlighting
  isPreferred?: boolean;
};

export default function RoomGrid({ hotelId }: { hotelId: string }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [prefs, setPrefs] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Room | null>(null);

  // Load user preferences
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      getPreferences(userId)
        .then((p) => setPrefs(p))
        .catch(() => {});
    }
  }, []);

  // Load rooms
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getRoomTypes(hotelId);
        if (!cancelled) {
          const list = Array.isArray(r) ? r : [];

          // Apply preference highlighting
          if (prefs?.preferredRoomType) {
            list.forEach((room: Room) => {
              room.isPreferred =
                room.name.toLowerCase().includes(prefs.preferredRoomType.toLowerCase());
            });
          }

          setRooms(list);
        }
      } catch (err) {
        console.error("getRoomTypes", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hotelId, prefs]);

  async function onReserve(room: Room) {
    try {
      const updated = await reserveRoom(room.id, 1);
      setRooms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      alert("Reserved " + (room.name || "room"));
    } catch (err) {
      console.error("reserveRoom", err);
      alert("Failed to reserve");
    }
  }

  const filtered = rooms.filter(
    (r) =>
      !filter ||
      r.name.toLowerCase().includes(filter.toLowerCase()) ||
      (r.amenities || []).join(" ").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Rooms — {hotelId}</h3>
        <input
          className="border p-1 rounded"
          placeholder="Filter by name or amenity"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map((room) => (
          <div
            key={room.id}
            className={`border rounded p-3 ${
              room.isPreferred ? "border-blue-500 bg-blue-50" : ""
            }`}
          >
            <img
              src={room.imageUrl || "/placeholder-room.jpg"}
              alt={room.name}
              className="w-full h-40 object-cover mb-2 rounded"
            />

            <div className="font-medium">{room.name}</div>
            <div className="text-sm text-gray-600">{room.description}</div>

            <div className="mt-2">
              ₹{room.pricePerNight ?? "-"} /night • {room.availableCount ?? 0} available
            </div>

            <div className="mt-2 text-sm">
              Amenities: {(room.amenities || []).join(", ")}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setSelected(room)}
              >
                Preview 3D
              </button>

              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={() => onReserve(room)}
                disabled={(room.availableCount ?? 0) <= 0}
              >
                Select room
              </button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="mt-4">
          <h4 className="font-semibold">3D Preview — {selected.name}</h4>
          <Room3DPreview url={selected.preview3DUrl || null} />

          <div className="mt-2">
            <button
              onClick={() => setSelected(null)}
              className="px-3 py-1 border rounded"
            >
              Close preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
