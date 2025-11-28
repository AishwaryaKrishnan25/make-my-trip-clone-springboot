// src/pages/profile/preferences.tsx
import React, { useEffect, useState } from "react";
import { getPreferences, savePreferences } from "@/api";

type Preferences = {
  preferredSeatType?: string;
  preferredRoomType?: string;
  [key: string]: any;
};

export default function PreferencesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Preferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get userId from localStorage on the client only
  useEffect(() => {
    if (typeof window === "undefined") return; // SSR guard

    const storedId = window.localStorage.getItem("userId");
    setUserId(storedId);

    if (!storedId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const p = await getPreferences(storedId);
        setPrefs(p || {});
      } catch (err) {
        console.warn("getPreferences error", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSave() {
    if (!userId) {
      alert("No user logged in, cannot save preferences.");
      return;
    }
    try {
      setSaving(true);
      await savePreferences(userId, prefs);
      alert("Preferences saved!");
    } catch (err) {
      console.error("savePreferences error", err);
      alert("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Your Preferences</h1>
        <div className="text-gray-600 text-sm">Loading preferences…</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Your Preferences</h1>
        <div className="text-gray-700">
          You are not logged in. Please log in before managing your preferences.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Your Preferences</h1>

      {/* Seat preferences */}
      <div className="space-y-2">
        <label className="font-medium">Preferred Seat</label>
        <select
          className="border rounded p-2 w-full"
          value={prefs.preferredSeatType || ""}
          onChange={(e) =>
            setPrefs((prev) => ({ ...prev, preferredSeatType: e.target.value || undefined }))
          }
        >
          <option value="">No preference</option>
          <option value="WINDOW">Window</option>
          <option value="AISLE">Aisle</option>
          <option value="MIDDLE">Middle</option>
        </select>
      </div>

      {/* Room preferences */}
      <div className="space-y-2">
        <label className="font-medium">Preferred Room Type</label>
        <select
          className="border rounded p-2 w-full"
          value={prefs.preferredRoomType || ""}
          onChange={(e) =>
            setPrefs((prev) => ({ ...prev, preferredRoomType: e.target.value || undefined }))
          }
        >
          <option value="">No preference</option>
          <option value="SINGLE">Single</option>
          <option value="DOUBLE">Double</option>
          <option value="SUITE">Suite</option>
        </select>
      </div>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Preferences"}
      </button>
    </div>
  );
}
