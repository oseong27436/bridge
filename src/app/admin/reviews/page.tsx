"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getAllReviews, getAllHostReviews, type DbReview, type DbHostReview } from "@/lib/db";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";

function StarRow({ stars }: { stars: number }) {
  return (
    <div className="flex">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`h-3 w-3 fill-current ${s <= stars ? "text-yellow-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [eventReviews, setEventReviews] = useState<DbReview[]>([]);
  const [hostReviews, setHostReviews] = useState<DbHostReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"event" | "host">("event");

  const localeStr = lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US";

  async function load() {
    const [ev, ho] = await Promise.all([getAllReviews(), getAllHostReviews()]);
    setEventReviews(ev);
    setHostReviews(ho);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleEventFeatured(r: DbReview) {
    await createClient().from("bridge_reviews").update({ featured: !r.featured }).eq("id", r.id);
    load();
  }

  async function deleteEventReview(id: string) {
    if (!confirm(lang === "ja" ? "削除しますか？" : lang === "en" ? "Delete?" : "삭제하시겠습니까?")) return;
    await createClient().from("bridge_reviews").delete().eq("id", id);
    load();
  }

  async function toggleHostFeatured(r: DbHostReview) {
    await createClient().from("bridge_host_reviews").update({ featured: !r.featured }).eq("id", r.id);
    load();
  }

  async function deleteHostReview(id: string) {
    if (!confirm(lang === "ja" ? "削除しますか？" : lang === "en" ? "Delete?" : "삭제하시겠습니까?")) return;
    await createClient().from("bridge_host_reviews").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{tr.admin_reviews}</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab("event")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${tab === "event" ? "bg-primary text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {tr.review_event_title}
          </button>
          <button onClick={() => setTab("host")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${tab === "host" ? "bg-primary text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {tr.review_host_title}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
        </div>
      ) : tab === "event" ? (
        eventReviews.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">💬</div>
            <p className="font-medium">{tr.review_no_reviews}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">{lang === "ja" ? "投稿者" : lang === "en" ? "User" : "작성자"}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">{lang === "ja" ? "イベント" : lang === "en" ? "Event" : "이벤트"}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">{tr.review_stars}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">{lang === "ja" ? "内容" : lang === "en" ? "Content" : "내용"}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">{lang === "ja" ? "日時" : lang === "en" ? "Date" : "날짜"}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {eventReviews.map((r) => {
                  const profile = r.profile as { name?: string } | undefined;
                  const event = r.event as { title_ko?: string; title_ja?: string; title_en?: string } | undefined;
                  const eventName = event ? (lang === "ko" ? event.title_ko : lang === "en" ? event.title_en : event.title_ja) : "-";
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{profile?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{eventName}</td>
                      <td className="px-4 py-3"><StarRow stars={r.stars} /></td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{r.text ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString(localeStr)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => toggleEventFeatured(r)}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${r.featured ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                          >
                            {r.featured ? "★ " : "☆ "}{tr.review_featured}
                          </button>
                          <button onClick={() => deleteEventReview(r.id)} className="text-xs text-red-500 hover:underline">
                            {tr.admin_delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        hostReviews.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">💬</div>
            <p className="font-medium">{tr.review_no_reviews}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">{lang === "ja" ? "投稿者" : lang === "en" ? "User" : "작성자"}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">{tr.field_host}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">{tr.review_stars}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">{lang === "ja" ? "内容" : lang === "en" ? "Content" : "내용"}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">{lang === "ja" ? "日時" : lang === "en" ? "Date" : "날짜"}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hostReviews.map((r) => {
                  const profile = r.profile as { name?: string } | undefined;
                  const host = r.host as { name?: string } | undefined;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{profile?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{host?.name ?? "-"}</td>
                      <td className="px-4 py-3"><StarRow stars={r.stars} /></td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{r.text ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString(localeStr)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => toggleHostFeatured(r)}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${r.featured ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                          >
                            {r.featured ? "★ " : "☆ "}{tr.review_featured}
                          </button>
                          <button onClick={() => deleteHostReview(r.id)} className="text-xs text-red-500 hover:underline">
                            {tr.admin_delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
