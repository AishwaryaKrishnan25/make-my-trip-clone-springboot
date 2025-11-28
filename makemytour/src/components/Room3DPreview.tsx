// src/components/Room3DPreview.tsx
import React from "react";

type Props = { url: string | null };

export default function Room3DPreview({ url }: Props) {
  // If you later integrate a real 3D viewer (three.js / model-viewer / iframe), replace this.
  if (!url) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
        <div className="text-sm text-gray-600">No 3D preview available</div>
      </div>
    );
  }

  // If URL is a model viewer or iframe source, embed it.
  // For safety and flexibility we use an iframe fallback; you can replace with <model-viewer> later.
  return (
    <div className="w-full h-64 rounded overflow-hidden bg-black">
      <iframe
        src={url}
        title="3D Room Preview"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    </div>
  );
}
