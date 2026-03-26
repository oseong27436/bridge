"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/context/language-context";
import { translations, type Lang } from "@/lib/i18n";

const LANGS: { code: Lang; label: string }[] = [
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const { lang, setLang } = useLanguage();
  const tr = translations[lang];

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("bridge_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        router.replace("/");
        return;
      }
      setChecking(false);
    }
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="text-lg font-extrabold text-primary">Bridge Osaka</Link>
          <p className="text-xs text-gray-400 mt-0.5">Admin</p>
          <div className="flex gap-2 mt-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`text-xs font-semibold transition-colors ${lang === l.code ? "text-primary" : "text-gray-400 hover:text-gray-700"}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { href: "/admin", label: tr.admin_dashboard },
            { href: "/admin/events", label: tr.admin_events },
            { href: "/admin/hosts", label: tr.admin_hosts },
            { href: "/admin/gallery", label: tr.admin_gallery },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <Link href="/" className="block px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
            {tr.admin_back}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
