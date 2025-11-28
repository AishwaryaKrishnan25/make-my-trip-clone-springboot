import React, { useEffect, useState, useCallback } from "react";
import {
  getRecommendations,
  recordInteraction,
  sendRecommendationFeedback,
  recomputeRecommendations,
} from "@/api";

type RecItem = {
  type: string;           // flight | hotel
  id: string;
  title: string;
  destination?: string;   // flights
  location?: string;      // hotels
  price?: number;
  why?: string;
  score?: number;
};

type Props = {
  userId: string;
  limit?: number;
};

export default function Recommendations({ userId, limit = 6 }: Props) {
  const [items, setItems] = useState<RecItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  /** Load recommendations */
  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const recs = await getRecommendations(userId, limit);
      setItems(Array.isArray(recs) ? recs : []);
      setError(null);
    } catch (e: any) {
      console.error("Recommendation load failed:", e);
      setError(e?.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  /** Load on user change */
  useEffect(() => {
    load();
  }, [load]);

  /** VIEW event */
  async function onView(rec: RecItem) {
    try {
      await recordInteraction({
        userId,
        entityType: rec.type,
        entityId: rec.id,
        action: "view",
      });
    } catch (e) {
      console.error("recordInteraction failed:", e);
    }
  }

  /** LIKE / DISLIKE */
  async function onFeedback(rec: RecItem, liked: boolean) {
    setFeedbackLoading((s) => ({ ...s, [rec.id]: true }));

    try {
      await sendRecommendationFeedback(userId, {
        recommendedEntityType: rec.type,
        recommendedEntityId: rec.id,
        liked,
      });

      // LOCAL UI UPDATE
      setItems((prev) => {
        if (!liked) {
          return prev.filter((i) => i.id !== rec.id); // immediately remove disliked
        }
        return prev
          .map((i) =>
            i.id === rec.id ? { ...i, score: (i.score ?? 0) + 3 } : i
          )
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      });

      // Record interaction
      await recordInteraction({
        userId,
        entityType: rec.type,
        entityId: rec.id,
        action: liked ? "like" : "ignore",
      });
    } catch (e) {
      console.error("feedback failed:", e);
    } finally {
      setFeedbackLoading((s) => ({ ...s, [rec.id]: false }));
    }
  }

  /** Recompute (admin/test button) */
  async function onRecompute() {
    if (!userId) return;
    setLoading(true);

    try {
      await recomputeRecommendations(userId, limit);
      await load();
      alert("Recommendations refreshed");
    } catch (e: any) {
      console.error("Recompute failed:", e);
      alert("Recompute failed: " + e?.message);
    } finally {
      setLoading(false);
    }
  }

  if (!userId) {
    return <div>Please log in to see recommendations.</div>;
  }

  return (
    <div className="p-3 border rounded bg-white">

      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Recommended for you</h3>

        {process.env.NEXT_PUBLIC_SHOW_RECOMPUTE === "true" && (
          <button
            onClick={onRecompute}
            className="text-sm px-2 py-1 border rounded hover:bg-gray-100"
          >
            Recompute
          </button>
        )}
      </div>

      {/* Loading / Errors */}
      {loading ? (
        <div>Loading recommendations...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : items.length === 0 ? (
        <div>No recommendations yet — explore flights or hotels.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">

          {items.map((r) => (
            <div
              key={r.id}
              className="p-3 border rounded bg-gray-50 flex justify-between items-center"
            >
              {/* LEFT SIDE */}
              <div>
                <div className="font-medium">{r.title}</div>

                {/* Only show whichever exists */}
                {r.destination && (
                  <div className="text-sm text-gray-600">{r.destination}</div>
                )}
                {r.location && (
                  <div className="text-sm text-gray-600">{r.location}</div>
                )}

                {r.why && (
                  <div className="text-xs text-gray-500 mt-1">
                    Why: {r.why}
                  </div>
                )}

                <div className="text-sm mt-2">
                  Price:{" "}
                  <strong>₹ {r.price ?? "N/A"}</strong>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="flex flex-col gap-2 items-end">

                <button
                  onClick={() => onView(r)}
                  className="px-3 py-1 text-xs border rounded hover:bg-gray-100"
                >
                  View
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => onFeedback(r, true)}
                    disabled={!!feedbackLoading[r.id]}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    {feedbackLoading[r.id] ? "..." : "Like"}
                  </button>

                  <button
                    onClick={() => onFeedback(r, false)}
                    disabled={!!feedbackLoading[r.id]}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    {feedbackLoading[r.id] ? "..." : "Not interested"}
                  </button>
                </div>

              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}
