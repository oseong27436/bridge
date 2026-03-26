"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";

export default function AdminDashboard() {
  const { lang } = useLanguage();
  const tr = translations[lang];
  const [counts, setCounts] = useState({ events: 0, hosts: 0, gallery: 0 });

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("bridge_events").select("id", { count: "exact", head: true }),
      supabase.from("bridge_hosts").select("id", { count: "exact", head: true }),
      supabase.from("bridge_gallery").select("id", { count: "exact", head: true }),
    ]).then(([events, hosts, gallery]) => {
      setCounts({
        events: events.count ?? 0,
        hosts: hosts.count ?? 0,
        gallery: gallery.count ?? 0,
      });
    });
  }, []);

  const stats = [
    { label: tr.admin_events, value: counts.events, href: "/admin/events", color: "text-orange-600" },
    { label: tr.admin_hosts, value: counts.hosts, href: "/admin/hosts", color: "text-blue-600" },
    { label: tr.admin_gallery, value: counts.gallery, href: "/admin/gallery", color: "text-green-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{tr.admin_dashboard}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <a key={s.label} href={s.href} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-4xl font-extrabold ${s.color}`}>{s.value}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
