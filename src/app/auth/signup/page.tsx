"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase";
import type { NativeLang, TargetLevel } from "@/lib/types";

const LANG_OPTIONS: NativeLang[] = ["ja", "ko", "en", "zh", "other"];

const LEVEL_COLORS: Record<TargetLevel, string> = {
  1: "bg-blue-50 border-blue-200 text-blue-700",
  2: "bg-cyan-50 border-cyan-200 text-cyan-700",
  3: "bg-green-50 border-green-200 text-green-700",
  4: "bg-yellow-50 border-yellow-200 text-yellow-700",
  5: "bg-orange-50 border-orange-200 text-orange-700",
  6: "bg-red-50 border-red-200 text-red-700",
};

interface TargetLangEntry {
  lang: NativeLang;
  level: TargetLevel;
}

export default function SignupPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");

  // Step 2 fields
  const [nativeLang, setNativeLang] = useState<NativeLang | "">("");
  const [targetLangs, setTargetLangs] = useState<TargetLangEntry[]>([
    { lang: "ja", level: 1 },
  ]);

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirm) {
      setError(tr.signup_error_pw_match);
      return;
    }
    setStep(2);
  }

  function setTargetLevel(index: number, level: TargetLevel) {
    setTargetLangs((prev) => prev.map((t, i) => (i === index ? { ...t, level } : t)));
  }

  function setTargetLangCode(index: number, l: NativeLang) {
    setTargetLangs((prev) => prev.map((t, i) => (i === index ? { ...t, lang: l } : t)));
  }

  function addTargetLang() {
    setTargetLangs((prev) => [...prev, { lang: "en", level: 1 }]);
  }

  function removeTargetLang(index: number) {
    setTargetLangs((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(tr.signup_error_generic);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("bridge_profiles").insert({
      id: authData.user.id,
      name,
      email,
      gender: gender || null,
      native_lang: nativeLang || null,
      target_langs: targetLangs,
      lang,
    });

    if (profileError) {
      setError(tr.signup_error_generic);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  const LANG_LABEL: Record<NativeLang, string> = {
    ja: tr.lang_ja,
    ko: tr.lang_ko,
    en: tr.lang_en,
    zh: tr.lang_zh,
    other: tr.lang_other,
  };

  const LEVEL_LABEL: Record<TargetLevel, string> = {
    1: tr.level_1,
    2: tr.level_2,
    3: tr.level_3,
    4: tr.level_4,
    5: tr.level_5,
    6: tr.level_6,
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            {/* Logo */}
            <div className="text-center mb-6">
              <Link href="/" className="text-2xl font-extrabold text-primary tracking-tight">
                Bridge Osaka
              </Link>
              <p className="mt-1 text-sm text-gray-500">{tr.signup_title}</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-7">
              {[1, 2].map((s) => (
                <div key={s} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`h-1.5 w-full rounded-full transition-colors ${
                      s <= step ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                  <span className={`text-[10px] font-semibold ${s <= step ? "text-primary" : "text-gray-400"}`}>
                    {s === 1 ? tr.signup_step1 : tr.signup_step2}
                  </span>
                </div>
              ))}
            </div>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {tr.signup_name}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {tr.signup_email}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {tr.signup_password}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {tr.signup_password_confirm}
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {tr.signup_gender}
                  </label>
                  <div className="flex gap-3">
                    {(["male", "female"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
                          gender === g
                            ? "border-primary bg-primary text-white"
                            : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                        }`}
                      >
                        {g === "male" ? tr.signup_male : tr.signup_female}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
                >
                  {tr.signup_next} →
                </button>
              </form>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Native language */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {tr.signup_native_lang}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANG_OPTIONS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setNativeLang(l)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          nativeLang === l
                            ? "bg-primary border-primary text-white"
                            : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                        }`}
                      >
                        {LANG_LABEL[l]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target languages */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {tr.signup_target_lang}
                  </label>
                  <div className="space-y-4">
                    {targetLangs.map((entry, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex flex-wrap gap-1.5">
                            {LANG_OPTIONS.map((l) => (
                              <button
                                key={l}
                                type="button"
                                onClick={() => setTargetLangCode(idx, l)}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                  entry.lang === l
                                    ? "bg-primary border-primary text-white"
                                    : "border-gray-300 text-gray-500 hover:border-primary hover:text-primary"
                                }`}
                              >
                                {LANG_LABEL[l]}
                              </button>
                            ))}
                          </div>
                          {targetLangs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTargetLang(idx)}
                              className="ml-2 text-gray-300 hover:text-red-400 text-lg leading-none"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {/* Level selector */}
                        <div className="grid grid-cols-6 gap-1 mt-2">
                          {([1, 2, 3, 4, 5, 6] as TargetLevel[]).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setTargetLevel(idx, lvl)}
                              className={`rounded-lg border py-2 text-xs font-bold transition-all ${
                                entry.level === lvl
                                  ? LEVEL_COLORS[lvl] + " border-current scale-105"
                                  : "border-gray-200 text-gray-400 hover:border-gray-400"
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                        <p className="mt-1 text-[10px] text-center text-gray-400">
                          {LEVEL_LABEL[entry.level]}
                        </p>
                      </div>
                    ))}
                  </div>

                  {targetLangs.length < 3 && (
                    <button
                      type="button"
                      onClick={addTargetLang}
                      className="mt-2 w-full rounded-xl border-2 border-dashed border-gray-300 py-2 text-xs font-semibold text-gray-400 hover:border-primary hover:text-primary transition-colors"
                    >
                      + 言語を追加 / 언어 추가 / Add language
                    </button>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-bold text-gray-600 hover:border-gray-400 transition-colors"
                  >
                    ← {tr.signup_back}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-2 flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {loading ? "..." : tr.signup_submit}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-gray-500">
              {tr.signup_have_account}{" "}
              <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                {tr.signup_login_link}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
