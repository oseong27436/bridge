"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

export default function ImageUpload({ value, onChange, folder = "misc" }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("bridge-images").upload(path, file, { upsert: true });

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
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-red-400 hover:underline"
        >
          이미지 제거
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
