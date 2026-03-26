"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import ImageUpload from "@/components/admin/image-upload";

const SETTING_KEYS = [
  { key: "hero_image", label: "히어로 이미지" },
  { key: "meetup_image", label: "미팅 카드 이미지" },
  { key: "party_image", label: "파티 카드 이미지" },
  { key: "food_image", label: "음식 카드 이미지" },
  { key: "about_image", label: "Bridge 소개 이미지" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("bridge_settings").select("key, value");
    const map: Record<string, string> = {};
    (data ?? []).forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
    setSettings(map);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await Promise.all(
      SETTING_KEYS.map(({ key }) =>
        supabase.from("bridge_settings").upsert({ key, value: settings[key] ?? "" }, { onConflict: "key" })
      )
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        {SETTING_KEYS.map((k) => <div key={k.key} className="h-44 bg-gray-100 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">사이트 설정</h1>
          <p className="text-xs text-gray-400 mt-0.5">홈페이지에 표시되는 고정 이미지 관리</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {saved ? "저장됨 ✓" : saving ? "저장 중..." : "저장"}
        </button>
      </div>

      <div className="space-y-6">
        {SETTING_KEYS.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-2xl border border-gray-200 p-5">
            <label className="block text-sm font-bold text-gray-800 mb-3">{label}</label>
            <ImageUpload
              value={settings[key] ?? ""}
              onChange={(url) => setSettings((s) => ({ ...s, [key]: url }))}
              folder="settings"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
