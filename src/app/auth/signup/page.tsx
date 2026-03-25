"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSso = searchParams.get("sso") === "1";
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

  // SSO: pre-fill name/email from Google
  useEffect(() => {
    if (!isSso) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) setName(user.user_metadata.full_name);
      if (user?.email) setEmail(user.email);
    });
  }, [isSso]);

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

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    let userId: string;

    if (isSso) {
      // Already authenticated via Google — just get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError(tr.signup_error_generic); setLoading(false); return; }
      userId = user.id;
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError || !authData.user) {
        setError(tr.signup_error_generic);
        setLoading(false);
        return;
      }
      userId = authData.user.id;
    }

    const { error: profileError } = await supabase.from("bridge_profiles").insert({
      id: userId,
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
              <>
              {/* Google SSO — 이메일 회원가입 시에만 표시 */}
              {!isSso && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors mb-5"
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                      <path d="M43.611 20.083H42V20H24v8h11.303a11.995 11.995 0 01-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
                    </svg>
                    Google로 계속하기
                  </button>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">또는</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                </>
              )}

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

                {!isSso && (
                  <>
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
                  </>
                )}

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
              </>
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

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  );
}
