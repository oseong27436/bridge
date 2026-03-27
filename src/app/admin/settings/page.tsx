"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import ImageUpload from "@/components/admin/image-upload";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";

export default function AdminSettingsPage() {
  const { lang } = useLanguage();
  const tr = translations[lang];

  const SETTING_KEYS = [
    { key: "hero_image",   label: tr.admin_hero_image,   maxWidth: 1920, quality: 0.95 },
    { key: "meetup_image", label: tr.admin_meetup_image, maxWidth: 1200, quality: 0.88 },
    { key: "party_image",  label: tr.admin_party_image,  maxWidth: 1200, quality: 0.88 },
    { key: "food_image",   label: tr.admin_food_image,   maxWidth: 1200, quality: 0.88 },
    { key: "events_image", label: tr.admin_events_image, maxWidth: 1600, quality: 0.93 },
    { key: "about_image",  label: tr.admin_about_image,  maxWidth: 1600, quality: 0.93 },
  ];

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
        {[1,2,3,4,5].map((i) => <div key={i} className="h-44 bg-gray-100 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tr.admin_settings}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{tr.admin_settings_subtitle}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {saved ? tr.admin_saved : saving ? tr.admin_saving : tr.admin_save}
        </button>
      </div>

      <div className="space-y-6">
        {SETTING_KEYS.map(({ key, label, maxWidth, quality }) => (
          <div key={key} className="bg-white rounded-2xl border border-gray-200 p-5">
            <label className="block text-sm font-bold text-gray-800 mb-3">{label}</label>
            <ImageUpload
              value={settings[key] ?? ""}
              onChange={(url) => setSettings((s) => ({ ...s, [key]: url }))}
              folder="settings"
              maxWidth={maxWidth}
              quality={quality}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
