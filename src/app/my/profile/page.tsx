"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase";
import type { NativeLang, TargetLevel } from "@/lib/types";
import { Camera } from "lucide-react";

const LINE_FRIEND_URL = "https://line.me/R/ti/p/@194rkuvr";

interface BridgeProfile {
  id: string;
  name: string;
  email: string;
  gender?: "male" | "female" | "other";
  native_lang?: NativeLang;
  target_langs?: { lang: NativeLang; level: TargetLevel }[];
  avatar_url?: string | null;
  line_user_id?: string | null;
}

const LANG_KEYS: Record<string, string> = {
  ja: "lang_ja",
  ko: "lang_ko",
  en: "lang_en",
  zh: "lang_zh",
  other: "lang_other",
};

const LEVEL_KEYS: Record<number, string> = {
  1: "level_1",
  2: "level_2",
  3: "level_3",
  4: "level_4",
  5: "level_5",
  6: "level_6",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-gray-100 text-gray-600",
  2: "bg-blue-100 text-blue-600",
  3: "bg-green-100 text-green-700",
  4: "bg-yellow-100 text-yellow-700",
  5: "bg-orange-100 text-orange-700",
  6: "bg-red-100 text-red-700",
};

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 400 / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9);
    };
    img.src = url;
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BridgeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editNativeLang, setEditNativeLang] = useState("");
  const [editTargetLangs, setEditTargetLangs] = useState<{ lang: NativeLang; level: TargetLevel }[]>([]);
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }
      setUser(session.user);

      const { data } = await supabase
        .from("bridge_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setProfile(data as BridgeProfile);
        setEditName(data.name ?? "");
        setEditGender(data.gender ?? "");
        setEditNativeLang(data.native_lang ?? "");
        setEditTargetLangs(data.target_langs ?? []);
        setEditAvatarUrl(data.avatar_url ?? "");
      }
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const compressed = await compressImage(file);
      const timestamp = Date.now();
      const path = `avatars/${timestamp}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("bridge-images")
        .upload(path, compressed, { contentType: "image/jpeg", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("bridge-images")
        .getPublicUrl(path);

      const url = urlData.publicUrl;

      setEditAvatarUrl(url);
      setProfile((prev) => (prev ? { ...prev, avatar_url: url } : prev));

      await supabase
        .from("bridge_profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from("bridge_profiles")
        .update({
          name: editName,
          gender: editGender || null,
          native_lang: editNativeLang || null,
          target_langs: editTargetLangs,
          avatar_url: editAvatarUrl || null,
        })
        .eq("id", user.id);

      const { data } = await supabase
        .from("bridge_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data as BridgeProfile);
      setEditMode(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  const displayAvatar =
    profile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined) ?? "";

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded-full w-48" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <span className="rounded-full px-5 py-2 text-sm font-bold bg-primary text-white">
            {tr.nav_my_profile}
          </span>
          <Link
            href="/my/reservations"
            className="rounded-full px-5 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-100 transition"
          >
            {tr.nav_my_reservations}
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          {/* Avatar section - always visible, always editable */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="relative group cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={profile?.name ?? ""}
                  className="rounded-full object-cover border-4 border-white shadow-md"
                  style={{ width: 88, height: 88 }}
                />
              ) : (
                <div
                  className="rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md"
                  style={{ width: 88, height: 88 }}
                >
                  {(profile?.name ?? "?")[0].toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="mt-3 text-lg font-bold text-gray-900">{profile?.name ?? ""}</p>
            <p className="text-sm text-gray-400">{user?.email ?? ""}</p>
          </div>

          {/* View mode */}
          {!editMode && (
            <>
              <div className="space-y-4">
                {/* Gender */}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {tr.signup_gender}
                  </p>
                  <p className="text-sm text-gray-800">
                    {profile?.gender === "male"
                      ? tr.signup_male
                      : profile?.gender === "female"
                      ? tr.signup_female
                      : profile?.gender === "other"
                      ? tr.signup_other
                      : "—"}
                  </p>
                </div>

                {/* Native lang */}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {tr.signup_native_lang}
                  </p>
                  <p className="text-sm text-gray-800">
                    {profile?.native_lang
                      ? ((tr[LANG_KEYS[profile.native_lang] as keyof typeof tr] as string) ?? "—")
                      : "—"}
                  </p>
                </div>

                {/* Target langs */}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                    {tr.signup_target_lang}
                  </p>
                  {profile?.target_langs?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.target_langs.map((t, i) => (
                        <div key={i} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${LEVEL_COLORS[t.level] ?? "bg-gray-100 text-gray-600"}`}>
                          <span>{(tr[LANG_KEYS[t.lang] as keyof typeof tr] as string) ?? t.lang}</span>
                          <span className="opacity-60">Lv.{t.level}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-800">—</p>
                  )}
                </div>
              </div>

              {/* LINE 연동 */}
              <div className="mt-6 rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#06C755" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.03 2 11c0 3.45 2.01 6.47 5.03 8.22L6 22l3.17-1.7C10.03 20.73 11 21 12 21c5.52 0 10-4.03 10-9S17.52 2 12 2zm1 13H8v-1.5h5V15zm2-3H8v-1.5h7V12zm0-3H8V7.5h7V9z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    {profile?.line_user_id ? (
                      <>
                        <p className="text-sm font-semibold text-green-600">{tr.line_connected}</p>
                        <a
                          href={LINE_FRIEND_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
                        >
                          {tr.line_add_friend_btn}
                        </a>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-700">{tr.line_connect}</p>
                        <p className="text-xs text-gray-400">{tr.line_connect_desc}</p>
                      </>
                    )}
                  </div>
                  {!profile?.line_user_id && (
                    <button
                      onClick={async () => {
                        const supabase = createClient();
                        await supabase.auth.signInWithOAuth({
                          provider: "custom:line" as never,
                          options: { redirectTo: `${window.location.origin}/auth/callback` },
                        });
                      }}
                      className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#06C755" }}
                    >
                      LINE
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => setEditMode(true)}
                className="mt-4 w-full rounded-xl border border-gray-300 py-2.5 text-sm font-semibold hover:bg-gray-50 transition"
              >
                {tr.profile_edit}
              </button>
            </>
          )}

          {/* Edit mode */}
          {editMode && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  {tr.signup_name}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  {tr.signup_gender}
                </label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary bg-white"
                >
                  <option value="">—</option>
                  <option value="male">{tr.signup_male}</option>
                  <option value="female">{tr.signup_female}</option>
                  <option value="other">{tr.signup_other}</option>
                </select>
              </div>

              {/* Native lang */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  {tr.signup_native_lang}
                </label>
                <select
                  value={editNativeLang}
                  onChange={(e) => setEditNativeLang(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary bg-white"
                >
                  <option value="">—</option>
                  {["ja", "ko", "en", "zh", "other"].map((l) => (
                    <option key={l} value={l}>
                      {tr[`lang_${l}` as keyof typeof tr] as string}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target langs */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  {tr.signup_target_lang}
                </label>
                <div className="space-y-2">
                  {editTargetLangs.map((entry, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-wrap gap-1.5">
                          {(["ja", "ko", "en", "zh", "other"] as NativeLang[]).map((l) => (
                            <button key={l} type="button"
                              onClick={() => setEditTargetLangs((prev) => prev.map((t, i) => i === idx ? { ...t, lang: l } : t))}
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${entry.lang === l ? "bg-primary border-primary text-white" : "border-gray-300 text-gray-500 hover:border-primary hover:text-primary"}`}>
                              {tr[`lang_${l}` as keyof typeof tr] as string}
                            </button>
                          ))}
                        </div>
                        {editTargetLangs.length > 1 && (
                          <button type="button" onClick={() => setEditTargetLangs((prev) => prev.filter((_, i) => i !== idx))}
                            className="ml-2 text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                        )}
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        {([1, 2, 3, 4, 5, 6] as TargetLevel[]).map((lvl) => (
                          <button key={lvl} type="button"
                            onClick={() => setEditTargetLangs((prev) => prev.map((t, i) => i === idx ? { ...t, level: lvl } : t))}
                            className={`rounded-lg border py-1.5 text-xs font-bold transition-all ${entry.level === lvl ? `${LEVEL_COLORS[lvl]} border-current scale-105` : "border-gray-200 text-gray-400 hover:border-gray-400"}`}>
                            {lvl}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-[10px] text-center text-gray-400">
                        {tr[`level_${entry.level}` as keyof typeof tr] as string}
                      </p>
                    </div>
                  ))}
                </div>
                {editTargetLangs.length < 3 && (
                  <button type="button"
                    onClick={() => setEditTargetLangs((prev) => [...prev, { lang: "en", level: 1 as TargetLevel }])}
                    className="mt-2 w-full rounded-xl border-2 border-dashed border-gray-300 py-2 text-xs font-semibold text-gray-400 hover:border-primary hover:text-primary transition-colors">
                    + 言語を追加 / 언어 추가
                  </button>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold hover:bg-gray-50 transition"
                >
                  {tr.admin_cancel}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition"
                >
                  {saving ? tr.profile_saving : tr.profile_save}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
