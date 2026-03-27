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
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { lang, setLang } = useLanguage();
  const tr = translations[lang];
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function loadUser(userId: string | undefined) {
      if (!userId) { setIsAdmin(false); return; }
      const { data } = await supabase.from("bridge_profiles").select("role").eq("id", userId).single();
      setIsAdmin(data?.role === "admin");
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      loadUser(session?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      loadUser(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
  }

  const NAV_LINKS = [
    { href: "/", label: tr.nav_home },
    { href: "/events", label: tr.nav_events },
    { href: "/reviews", label: tr.nav_reviews },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-primary">
            Bridge Osaka
          </Link>

          {/* Right: language + hamburger */}
          <div className="flex items-center gap-3">
            {/* Language switcher */}
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

            {/* Hamburger */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="border-t border-gray-200 bg-white shadow-lg">
          <div className="mx-auto max-w-6xl px-4 py-3 space-y-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-gray-100 my-1" />

            {user ? (
              <>
                <Link
                  href="/my/reservations"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {tr.nav_my_reservations}
                </Link>
                <Link
                  href="/my/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {tr.nav_my_profile}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    ⚙ Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {tr.nav_logout}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm font-semibold text-primary hover:bg-orange-50 rounded-lg transition-colors"
                >
                  {tr.login}
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {tr.signup}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
