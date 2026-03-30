"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase";

function detectInAppBrowser(): "kakao" | "instagram" | "line" | "facebook" | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/KAKAOTALK/i.test(ua)) return "kakao";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/\bLine\b/i.test(ua)) return "line";
  if (/FBAN|FBAV/i.test(ua)) return "facebook";
  return null;
}

function openInExternalBrowser() {
  const url = window.location.href;
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);

  if (isAndroid) {
    // Android: intent scheme으로 Chrome 강제 실행
    const intentUrl = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
  } else {
    // iOS / 기타: 클립보드 복사 후 안내
    navigator.clipboard?.writeText(url).catch(() => {});
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [iab, setIab] = useState<"kakao" | "instagram" | "line" | "facebook" | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIab(detectInAppBrowser());
  }, []);

  function handleOpenExternal() {
    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    if (isAndroid) {
      openInExternalBrowser();
    } else {
      navigator.clipboard?.writeText(window.location.href).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(tr.login_error);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link href="/" className="text-2xl font-extrabold text-primary tracking-tight">
                Bridge Osaka
              </Link>
              <p className="mt-1 text-sm text-gray-500">{tr.login_subtitle}</p>
            </div>

            {/* In-app browser warning */}
            {iab && (
              <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  {lang === "ja"
                    ? "外部ブラウザで開いてください"
                    : lang === "ko"
                    ? "외부 브라우저에서 열어주세요"
                    : "Please open in a browser"}
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  {lang === "ja"
                    ? "アプリ内ブラウザではGoogleログインが使えません。ChromeまたはSafariで開いてください。"
                    : lang === "ko"
                    ? "카카오톡/인스타 내 브라우저에서는 Google 로그인이 차단됩니다. Chrome 또는 Safari로 열어주세요."
                    : "Google login is blocked in in-app browsers. Please open in Chrome or Safari."}
                </p>
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="w-full rounded-lg bg-amber-500 py-2 text-sm font-bold text-white hover:bg-amber-600 transition-colors"
                >
                  {copied
                    ? lang === "ja" ? "コピーしました！Safariで貼り付け" : lang === "ko" ? "복사됨! Safari에 붙여넣기" : "Copied! Paste in Safari"
                    : lang === "ja" ? "外部ブラウザで開く" : lang === "ko" ? "외부 브라우저로 열기" : "Open in browser"}
                </button>
              </div>
            )}

            {/* Google SSO */}
            <button
              type="button"
              onClick={iab ? handleOpenExternal : handleGoogleLogin}
              className={`w-full flex items-center justify-center gap-3 rounded-xl border py-3 text-sm font-semibold transition-colors mb-5 ${
                iab
                  ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {tr.login_email}
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
                  {tr.login_password}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loading ? "..." : tr.login_submit}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {tr.login_no_account}{" "}
              <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
                {tr.login_signup_link}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
