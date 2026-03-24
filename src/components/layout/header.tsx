"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { translations, type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase";

const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { lang, setLang } = useLanguage();
  const tr = translations[lang];
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const NAV_LINKS = [
    { href: "/", label: tr.nav_home },
    { href: "/events", label: tr.nav_events },
    { href: "/about", label: tr.nav_about },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 text-xl font-bold tracking-tight text-primary"
          >
            Bridge Osaka
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 flex-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold tracking-wide text-gray-700 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: language + login/user */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center text-sm text-gray-500">
              {LANGS.map((l, i) => (
                <span key={l.code} className="flex items-center">
                  {i > 0 && <span className="mx-1 text-gray-300">|</span>}
                  <button
                    onClick={() => setLang(l.code)}
                    className={`hover:text-primary transition-colors ${
                      lang === l.code ? "font-semibold text-primary" : ""
                    }`}
                  >
                    {l.label}
                  </button>
                </span>
              ))}
            </div>
            {user ? (
              <>
                <Link
                  href="/my/reservations"
                  className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors"
                >
                  {tr.nav_my_reservations}
                </Link>
                <Link
                  href="/my/profile"
                  className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors"
                >
                  {tr.nav_my_profile}
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-full border-2 border-gray-400 px-4 py-1 text-sm font-semibold text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  {tr.nav_logout}
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-full border-2 border-primary px-4 py-1 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
              >
                {tr.login}
              </Link>
            )}
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            {!user && (
              <Link
                href="/auth/login"
                className="rounded-full border-2 border-primary px-3 py-1 text-xs font-semibold text-primary"
              >
                {tr.login}
              </Link>
            )}
            <button
              className="flex h-8 w-8 items-center justify-center text-gray-600"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-gray-700 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/my/reservations"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-gray-700 hover:text-primary"
                >
                  {tr.nav_my_reservations}
                </Link>
                <Link
                  href="/my/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-gray-700 hover:text-primary"
                >
                  {tr.nav_my_profile}
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="block w-full text-left px-3 py-2 text-sm font-semibold text-gray-500 hover:text-primary"
                >
                  {tr.nav_logout}
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-primary"
              >
                {tr.login}
              </Link>
            )}
            <div className="border-t border-gray-100 pt-2 mt-1 flex gap-2 px-3">
              {LANGS.map((l, i) => (
                <span key={l.code} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300">|</span>}
                  <button
                    onClick={() => { setLang(l.code); setMobileOpen(false); }}
                    className={`text-sm transition-colors ${
                      lang === l.code
                        ? "font-semibold text-primary"
                        : "text-gray-500 hover:text-primary"
                    }`}
                  >
                    {l.label}
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
