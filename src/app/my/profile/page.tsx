"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase";
import type { NativeLang, TargetLevel } from "@/lib/types";

interface BridgeProfile {
  id: string;
  name: string;
  email: string;
  gender?: "male" | "female" | "other";
  native_lang?: NativeLang;
  target_lang?: NativeLang;
  target_level?: TargetLevel;
}

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-gray-100 text-gray-600",
  2: "bg-blue-100 text-blue-600",
  3: "bg-green-100 text-green-600",
  4: "bg-yellow-100 text-yellow-700",
  5: "bg-orange-100 text-orange-600",
  6: "bg-red-100 text-red-600",
};

const LEVEL_KEYS = ["level_1", "level_2", "level_3", "level_4", "level_5", "level_6"] as const;
const LANG_KEYS: Record<string, keyof typeof translations.en> = {
  ja: "lang_ja",
  ko: "lang_ko",
  en: "lang_en",
  zh: "lang_zh",
  other: "lang_other",
};

export default function ProfilePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const tr = translations[lang];
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BridgeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
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

      setProfile(data ?? null);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const genderLabel =
    profile?.gender === "male"
      ? tr.signup_male
      : profile?.gender === "female"
      ? tr.signup_female
      : "—";

  const nativeLangLabel = profile?.native_lang
    ? tr[LANG_KEYS[profile.native_lang] ?? "lang_other"]
    : "—";

  const targetLangLabel = profile?.target_lang
    ? tr[LANG_KEYS[profile.target_lang] ?? "lang_other"]
    : "—";

  const levelKey = profile?.target_level
    ? LEVEL_KEYS[profile.target_level - 1]
    : null;
  const levelLabel = levelKey ? tr[levelKey] : "—";
  const levelColor = profile?.target_level ? LEVEL_COLORS[profile.target_level] : "";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-10">
        {/* 탭 */}
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

        <h1 className="text-2xl font-bold mb-6">{tr.nav_my_profile}</h1>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 max-w-lg flex flex-col gap-5">
          {/* 이름 */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
              {tr.signup_name}
            </span>
            <span className="text-base font-semibold">{profile?.name ?? "—"}</span>
          </div>

          {/* 이메일 */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
              {tr.signup_email}
            </span>
            <span className="text-base">{user?.email ?? "—"}</span>
          </div>

          {/* 성별 */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
              {tr.signup_gender}
            </span>
            <span className="text-base">{genderLabel}</span>
          </div>

          {/* 모국어 */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
              {tr.signup_native_lang}
            </span>
            <span className="text-base">{nativeLangLabel}</span>
          </div>

          {/* 학습 언어 + 레벨 */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
              {tr.signup_target_lang}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base">{targetLangLabel}</span>
              {levelKey && (
                <span
                  className={`rounded-full text-[10px] font-bold px-2 py-0.5 ${levelColor}`}
                >
                  {levelLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
