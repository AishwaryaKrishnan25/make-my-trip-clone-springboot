// src/components/ReviewForm.tsx
import React, { useState } from "react";
import { postReview, uploadReviewPhoto } from "@/api";

type Props = {
  entityType: "HOTEL" | "FLIGHT";
  entityId: string;
  userId: string | null;
  onPosted: (review: any) => void;
};

type PostReviewPayload = {
  entityType: "HOTEL" | "FLIGHT";
  entityId: string;
  userId: string;
  rating: number;
  text: string;
  photos: string[]; // ensure TS knows this is a string[]
};

export default function ReviewForm({ entityType, entityId, userId, onPosted }: Props) {
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);

  const clearFiles = () => setFiles([] as File[]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList: FileList | null = e.target.files;
    if (fileList && fileList.length > 0) {
      const arr = Array.from(fileList) as File[];
      setFiles(arr);
    }
  };

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!userId) {
      alert("Please login to submit a review");
      return;
    }

    setUploading(true);
    try {
      const photoUrls: string[] = [];

      for (const file of files) {
        const uploaded = await uploadReviewPhoto(file);
        if (uploaded && typeof uploaded.url === "string") {
          photoUrls.push(uploaded.url);
        }
      }

      const payload: PostReviewPayload = {
        entityType,
        entityId,
        userId,
        rating,
        text,
        photos: photoUrls,
      };

      // postReview is a JS function (no types) — cast to any to avoid TS incompatibilities
      const res = await postReview(payload as any);

      // reset form
      setText("");
      clearFiles();
      setRating(5);

      onPosted(res);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || "Failed to post review");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white p-4 rounded shadow">
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Your rating</label>
        <div className="flex gap-1">
          {[5, 4, 3, 2, 1].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`px-3 py-1 rounded ${rating === n ? "bg-yellow-400" : "bg-gray-200"}`}
            >
              {n}★
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Your review</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border rounded p-2"
          rows={4}
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Photos (optional)</label>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} />
        <div className="flex gap-2 mt-2">
          {files.map((f, i) => (
            <div key={f.name + "-" + i} className="text-sm text-gray-600">
              {f.name}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setText("");
            clearFiles();
            setRating(5);
          }}
          className="px-3 py-2 border rounded"
        >
          Reset
        </button>

        <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded" disabled={uploading}>
          {uploading ? "Posting..." : "Post review"}
        </button>
      </div>
    </form>
  );
}
