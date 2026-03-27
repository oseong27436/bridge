"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { getAllReviews, getAllHostReviews, type DbReview, type DbHostReview } from "@/lib/db";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";

function StarRow({ stars }: { stars: number }) {
  return (
    <div className="flex">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`h-3.5 w-3.5 fill-current ${s <= stars ? "text-yellow-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [eventReviews, setEventReviews] = useState<DbReview[]>([]);
  const [hostReviews, setHostReviews] = useState<DbHostReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"event" | "host">("event");

  const localeStr = lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US";

  useEffect(() => {
    Promise.all([getAllReviews(), getAllHostReviews()]).then(([ev, ho]) => {
      setEventReviews(ev);
      setHostReviews(ho);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">{tr.review_list_title}</h1>

        {/* Tab */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("event")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${tab === "event" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {tr.review_event_title}
          </button>
          <button
            onClick={() => setTab("host")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${tab === "host" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {tr.review_host_title}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : tab === "event" ? (
          eventReviews.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">💬</div>
              <p className="font-medium">{tr.review_no_reviews}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {eventReviews.map((r) => {
                const profile = r.profile as { name?: string; avatar_url?: string } | undefined;
                const event = r.event as { title_ko?: string; title_ja?: string; title_en?: string } | undefined;
                const eventName = event ? (lang === "ko" ? event.title_ko : lang === "en" ? event.title_en : event.title_ja) : null;
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0 overflow-hidden">
                      {profile?.avatar_url
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        : profile?.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800">{profile?.name ?? (lang === "ja" ? "匿名" : lang === "en" ? "Anonymous" : "익명")}</span>
                        <StarRow stars={r.stars} />
                      </div>
                      {eventName && <p className="text-xs text-primary font-medium mt-0.5">{eventName}</p>}
                      {r.text && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.text}</p>}
                      <p className="text-[11px] text-gray-300 mt-1">{new Date(r.created_at).toLocaleDateString(localeStr)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          hostReviews.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">💬</div>
              <p className="font-medium">{tr.review_no_reviews}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hostReviews.map((r) => {
                const profile = r.profile as { name?: string; avatar_url?: string } | undefined;
                const host = r.host as { name?: string; avatar_url?: string } | undefined;
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0 overflow-hidden">
                      {profile?.avatar_url
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        : profile?.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800">{profile?.name ?? (lang === "ja" ? "匿名" : lang === "en" ? "Anonymous" : "익명")}</span>
                        <StarRow stars={r.stars} />
                      </div>
                      {host?.name && <p className="text-xs text-primary font-medium mt-0.5">{host.name}</p>}
                      {r.text && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.text}</p>}
                      <p className="text-[11px] text-gray-300 mt-1">{new Date(r.created_at).toLocaleDateString(localeStr)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>
      <Footer />
    </div>
  );
}
