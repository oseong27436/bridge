"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  maxWidth?: number;  // 최대 가로 (px), 기본 1200
  quality?: number;   // JPEG 품질 0~1, 기본 0.85
}

async function compressImage(file: File, maxWidth: number, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", quality);
    };
    img.src = url;
  });
}

export default function ImageUpload({ value, onChange, folder = "misc", maxWidth = 1200, quality = 0.85 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [sizeInfo, setSizeInfo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSizeInfo(null);

    const compressed = await compressImage(file, maxWidth, quality);
    const savedPct = Math.round((1 - compressed.size / file.size) * 100);
    if (savedPct > 0) setSizeInfo(`${(compressed.size / 1024).toFixed(0)}KB (${savedPct}% 압축)`);

    const supabase = createClient();
    const path = `${folder}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("bridge-images").upload(path, compressed, {
      upsert: true,
      contentType: "image/jpeg",
    });

    if (!error) {
      const { data } = supabase.storage.from("bridge-images").getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-full h-36 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors flex items-center justify-center bg-gray-50 overflow-hidden"
      >
        {value ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={value} alt="preview" className="h-full w-full object-cover" />
        ) : (
          <div className="text-center text-gray-400">
            <div className="text-3xl mb-1">📷</div>
            <p className="text-xs font-medium">{uploading ? "업로드 중..." : "클릭해서 이미지 선택"}</p>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        {sizeInfo && <p className="text-xs text-gray-400">{sizeInfo}</p>}
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); setSizeInfo(null); }}
            className="text-xs text-red-400 hover:underline ml-auto"
          >
            이미지 제거
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
