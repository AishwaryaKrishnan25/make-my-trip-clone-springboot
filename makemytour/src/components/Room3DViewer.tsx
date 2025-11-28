import React, { useState } from "react";

type Props = {
  images?: string[]; // images may be undefined or empty
};

export default function Room3DViewer({ images = [] }: Props) {
  const [index, setIndex] = useState(0);

  // If no images → show fallback
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
        <div className="text-sm text-gray-600">No room preview available</div>
      </div>
    );
  }

  // Ensure index is not out of bounds
  const safeIndex = Math.min(index, images.length - 1);

  return (
    <div className="space-y-4">
      <img
        src={images[safeIndex]}
        alt="Room preview"
        className="rounded-lg shadow w-full cursor-pointer"
      />

      <div className="flex gap-2 overflow-x-auto">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            onClick={() => setIndex(i)}
            className={`w-20 h-20 object-cover rounded border ${
              i === safeIndex ? "border-blue-500" : "border-gray-300"
            } cursor-pointer`}
          />
        ))}
      </div>
    </div>
  );
}
