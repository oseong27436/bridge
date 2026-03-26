"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";

type MonthData = { label: string; count: number };

function BarChart({ data, lang }: { data: MonthData[]; lang: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const chartH = 140;

  return (
    <div className="flex items-end gap-1.5 h-[140px] w-full">
      {data.map((d, i) => {
        const barH = Math.max(Math.round((d.count / max) * chartH), d.count > 0 ? 4 : 0);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex justify-center">
              {d.count > 0 && (
                <span className="absolute -top-5 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {d.count}
                </span>
              )}
              <div
                style={{ height: barH }}
                className="w-full rounded-t-md bg-primary/80 group-hover:bg-primary transition-colors"
              />
            </div>
            <span className="text-[10px] text-gray-400 leading-none">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const { lang } = useLanguage();
  const tr = translations[lang];
  const [counts, setCounts] = useState({ events: 0, hosts: 0, gallery: 0, users: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 4 stat counts
    Promise.all([
      supabase.from("bridge_events").select("id", { count: "exact", head: true }),
      supabase.from("bridge_hosts").select("id", { count: "exact", head: true }),
      supabase.from("bridge_gallery").select("id", { count: "exact", head: true }),
      supabase.from("bridge_profiles").select("id", { count: "exact", head: true }),
    ]).then(([events, hosts, gallery, users]) => {
      setCounts({
        events: events.count ?? 0,
        hosts: hosts.count ?? 0,
        gallery: gallery.count ?? 0,
        users: users.count ?? 0,
      });
    });

    // Monthly registrations for last 12 months
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();

    supabase
      .from("bridge_registrations")
      .select("created_at")
      .gte("created_at", from)
      .then(({ data }) => {
        const monthLocale = lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US";
        const buckets: Record<string, number> = {};

        // Build 12-month skeleton
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          buckets[key] = 0;
        }

        // Fill counts
        (data ?? []).forEach((row) => {
          const d = new Date(row.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (key in buckets) buckets[key]++;
        });

        const result: MonthData[] = Object.entries(buckets).map(([key, count]) => {
          const [y, m] = key.split("-").map(Number);
          const label = new Date(y, m - 1, 1).toLocaleDateString(monthLocale, { month: "short" });
          return { label, count };
        });

        setMonthlyData(result);
        setChartLoading(false);
      });
  }, [lang]);

  const stats = [
    { label: tr.admin_events,  value: counts.events,  href: "/admin/events",  color: "text-orange-500", bg: "bg-orange-50",  icon: "📅" },
    { label: tr.admin_hosts,   value: counts.hosts,   href: "/admin/hosts",   color: "text-blue-500",   bg: "bg-blue-50",    icon: "🧑‍💼" },
    { label: tr.admin_gallery, value: counts.gallery, href: "/admin/gallery", color: "text-green-500",  bg: "bg-green-50",   icon: "🖼️" },
    { label: tr.admin_users,   value: counts.users,   href: "/admin/users",   color: "text-purple-500", bg: "bg-purple-50",  icon: "👤" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{tr.admin_dashboard}</h1>

      {/* 4-grid stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col gap-2"
          >
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center text-lg`}>
              {s.icon}
            </div>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Monthly participants chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-5">{tr.admin_monthly_participants}</h2>
        {chartLoading ? (
          <div className="h-[140px] flex items-end gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gray-100 animate-pulse" style={{ height: Math.random() * 80 + 20 }} />
            ))}
          </div>
        ) : (
          <BarChart data={monthlyData} lang={lang} />
        )}
      </div>
    </div>
  );
}
