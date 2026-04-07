"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { getEvents, getHosts, getGallery, getReviews, getSettings, eventTitle, eventDesc, hostBio, type DbEvent, type DbHost, type DbGallery, type DbReview } from "@/lib/db";
import { Star } from "lucide-react";

const LANG_FILTERS = ["日本語", "한국어", "English", "中文"];

const FALLBACK_IMGS: Record<string, string> = {
  hero:    "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=960&q=80",
  meetup:  "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=600&q=80",
  party:   "https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=600&q=80",
  food:    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
  sports:  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
  culture: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80",
  about:   "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80",
};

function EmptyState({ icon, message, sub, href, cta }: { icon: string; message: string; sub?: string; href?: string; cta?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm font-semibold text-gray-500">{message}</p>
      {sub && <p className="text-xs mt-1">{sub}</p>}
      {href && cta && (
        <Link href={href} className="mt-4 rounded-full border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-500 hover:border-primary hover:text-primary transition-colors">
          {cta}
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const { lang } = useLanguage();
  const tr = translations[lang];
  const [activeTab, setActiveTab] = useState(0);
  const [activeLang, setActiveLang] = useState<string | null>(null);

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [hosts, setHosts] = useState<DbHost[]>([]);
  const [gallery, setGallery] = useState<DbGallery[]>([]);
  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [siteImgs, setSiteImgs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEvents(), getHosts(), getGallery(), getReviews(), getSettings()]).then(
      ([ev, ho, ga, rv, cfg]) => {
        setEvents(ev);
        setHosts(ho);
        setGallery(ga);
        setReviews(rv);
        setSiteImgs({
          hero:    cfg.hero_image    || FALLBACK_IMGS.hero,
          meetup:  cfg.meetup_image  || FALLBACK_IMGS.meetup,
          party:   cfg.party_image   || FALLBACK_IMGS.party,
          food:    cfg.food_image    || FALLBACK_IMGS.food,
          sports:  FALLBACK_IMGS.sports,
          culture: FALLBACK_IMGS.culture,
          about:   cfg.about_image   || FALLBACK_IMGS.about,
        });
        setLoading(false);
      }
    );
  }, []);

  const CATEGORY_FILTERS = [tr.cat_meetup, tr.cat_party, tr.cat_sports, tr.cat_food, tr.cat_culture];

  const EVENT_TYPES = [
    { href: "/events?category=meetup", img: siteImgs.meetup, title: tr.cat_meetup, description: tr.meetup_desc },
    { href: "/events?category=party",  img: siteImgs.party,  title: tr.cat_party,  description: tr.party_desc  },
    { href: "/events?category=food",   img: siteImgs.food,   title: tr.cat_food,   description: tr.food_desc   },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="relative min-h-[92vh] flex flex-col">
          {/* Background image */}
          <div className="absolute inset-0 bg-gray-900">
            {siteImgs.hero && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={siteImgs.hero} alt="Bridge Osaka" className="h-full w-full object-cover animate-fade-in" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/70" />
          </div>

          {/* Main text — vertically centered */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pb-32">
            <p className="text-white/70 text-xs font-bold tracking-[0.3em] uppercase mb-4">Osaka International Community</p>
            <h1 className="text-6xl sm:text-8xl md:text-9xl font-extrabold text-white leading-none mb-4 drop-shadow-lg">
              BRIDGE<br /><span className="text-primary">OSAKA</span>
            </h1>
            <p className="text-white/80 text-lg sm:text-xl mb-8 max-w-md">{tr.hero_tagline}</p>
            <Link href="/events" className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-bold text-white hover:bg-primary/90 transition-colors shadow-xl">
              {tr.hero_cta} →
            </Link>
          </div>

          {/* Filter bar — pinned to bottom */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md border-t border-white/20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white/60 uppercase tracking-wide w-20 shrink-0">{tr.event_type}</span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_FILTERS.map((cat) => (
                    <Link key={cat} href="/events" className="rounded-full border border-white/40 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white hover:bg-white hover:text-gray-800 transition-colors">{cat}</Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white/60 uppercase tracking-wide w-20 shrink-0">
                  {lang === "ja" ? "言語" : lang === "ko" ? "언어" : "Lang"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {LANG_FILTERS.map((l) => (
                    <button key={l} onClick={() => setActiveLang(activeLang === l ? null : l)}
                      className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${activeLang === l ? "bg-primary border-primary text-white" : "border-white/40 bg-white/10 text-white hover:bg-white hover:text-gray-800"}`}>
                      {l}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 ml-2 flex-1 max-w-xs bg-white/10 border border-white/30 rounded-full px-4 py-1.5">
                  <svg className="h-3.5 w-3.5 text-white/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder={lang === "ja" ? "検索..." : lang === "ko" ? "검색..." : "Search..."}
                    className="flex-1 text-xs outline-none text-white bg-transparent placeholder:text-white/50" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── EVENT TYPE ────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{tr.event_type}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {EVENT_TYPES.map((type) => (
              <Link key={type.title} href={type.href} className="group block">
                <div className="overflow-hidden rounded-2xl mb-4 aspect-[4/3] bg-gray-100 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={type.img} alt={type.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{type.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-2">{type.description}</p>
                <span className="text-sm font-semibold text-primary group-hover:underline">{tr.more}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── ABOUT ─────────────────────────────────────────────────── */}
        <section className="bg-gray-50 border-y border-gray-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 flex flex-col md:flex-row gap-10 items-center">
            <div className="w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden bg-gray-200 shrink-0 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={siteImgs.about} alt="Osaka" className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{tr.about_bridge}</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{tr.about_text}</p>
              <Link href="/about" className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary px-5 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors">
                MORE →
              </Link>
            </div>
          </div>
        </section>

        {/* ── RECOMMENDED ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{tr.recommended}</h2>
          <div className="flex gap-2 mb-6">
            {[tr.tab_today, tr.tab_new, tr.tab_popular].map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${activeTab === i ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : events.length === 0 ? (
            <EmptyState icon="📅" message={lang === "ja" ? "イベントはまだありません" : lang === "ko" ? "아직 등록된 이벤트가 없어요" : "No events yet"} sub={lang === "ja" ? "管理者がイベントを追加すると表示されます" : lang === "ko" ? "어드민이 이벤트를 추가하면 표시돼요" : "Events will appear once added by admin"} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}
                  className="group flex gap-3 rounded-2xl border border-gray-200 bg-white p-3 hover:shadow-md transition-shadow">
                  <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={event.image_url || siteImgs[event.category] || siteImgs.meetup} alt={eventTitle(event, lang)} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      <span className="rounded-full text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5">{tr[`cat_${event.category}` as keyof typeof tr] ?? event.category}</span>
                      <span className="rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5">Osaka</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-1">{eventTitle(event, lang)}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(event.date + "T00:00:00").toLocaleDateString(lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US", { month: "short", day: "numeric", weekday: "short" })}
                      {" · "}{event.time_start}{event.time_end ? `–${event.time_end}` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </section>

        {/* ── REVIEWS ───────────────────────────────────────────────── */}
        <section className="bg-gray-50 border-y border-gray-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{tr.latest_reviews}</h2>
            {loading ? (
              <div className="flex gap-4 overflow-hidden">
                {[1,2,3].map(i => <div key={i} className="h-52 w-72 shrink-0 rounded-2xl bg-gray-200 animate-pulse" />)}
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState icon="💬" message={lang === "ja" ? "まだレビューはありません" : lang === "ko" ? "아직 등록된 리뷰가 없어요" : "No reviews yet"} />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                {reviews.map((r) => {
                  const profile = r.profile as { name?: string; avatar_url?: string } | undefined;
                  const event = r.event as { title_ko?: string; title_ja?: string; title_en?: string; image_url?: string; category?: string; date?: string; time_start?: string; time_end?: string; location_ko?: string; location_ja?: string; location_en?: string } | undefined;
                  const eventName = event ? (lang === "ko" ? event.title_ko : lang === "en" ? event.title_en : event.title_ja) : null;
                  const location = event ? (lang === "ko" ? event.location_ko : lang === "en" ? event.location_en : event.location_ja) : null;
                  return (
                    <div key={r.id} className="shrink-0 w-72 snap-start bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      {/* Event thumbnail */}
                      <div className="relative h-32 bg-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={event?.image_url || siteImgs[event?.category ?? ""] || siteImgs.meetup}
                          alt={eventName ?? ""}
                          className="w-full h-full object-cover"
                        />
                        {event?.category && (
                          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase bg-black/50 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {event.category}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        {/* Event info */}
                        {eventName && <p className="text-xs font-bold text-gray-900 line-clamp-1 mb-0.5">{eventName}</p>}
                        {(location || event?.date) && (
                          <p className="text-[11px] text-gray-400 mb-2 line-clamp-1">
                            {location}{location && event?.date ? " · " : ""}{event?.date}
                          </p>
                        )}
                        {/* Stars */}
                        <div className="flex mb-2">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`h-3 w-3 fill-current ${s <= r.stars ? "text-yellow-400" : "text-gray-200"}`} />
                          ))}
                        </div>
                        {/* Review text */}
                        {r.text && <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">{r.text}</p>}
                        {/* Reviewer */}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                          <div className="w-6 h-6 rounded-full bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold text-gray-400">
                            {profile?.avatar_url
                              /* eslint-disable-next-line @next/next/no-img-element */
                              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                              : profile?.name?.charAt(0) ?? "?"}
                          </div>
                          <p className="text-xs font-semibold text-gray-700">{profile?.name ?? (lang === "ja" ? "匿名" : lang === "en" ? "Anonymous" : "익명")}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── HOSTS ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 id="hosts" className="text-2xl font-bold text-gray-900 mb-6">
            {lang === "ja" ? "ホストを紹介" : lang === "ko" ? "호스트 소개" : "Meet our hosts"}
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : hosts.length === 0 ? (
            <EmptyState icon="👋" message={lang === "ja" ? "ホストはまだいません" : lang === "ko" ? "아직 등록된 호스트가 없어요" : "No hosts yet"} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {hosts.map((host) => (
                <div key={host.id} className="group rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="aspect-square overflow-hidden bg-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={host.avatar_url || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80"}
                      alt={host.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-bold text-gray-900 mb-1.5">{host.name}</h4>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5">{host.location}</span>
                      {host.langs.map((l) => (
                        <span key={l} className="rounded-full text-[10px] font-semibold bg-orange-50 text-orange-500 px-2 py-0.5">{l}</span>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{hostBio(host, lang)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── FEATURED CAROUSEL ─────────────────────────────────────── */}
        {events.length > 0 && (
          <section className="bg-gray-900 overflow-hidden">
            <div className="flex overflow-x-auto snap-x snap-mandatory">
              {events.map((event) => (
                <div key={event.id} className="relative shrink-0 w-full snap-start overflow-hidden" style={{ minHeight: 320 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.image_url || siteImgs[event.category] || siteImgs.meetup} alt={eventTitle(event, lang)} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                  <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 flex flex-col justify-center h-full">
                    <p className="text-white/60 text-xs mb-2 uppercase tracking-wide">{event.date}</p>
                    <h3 className="text-white font-extrabold text-2xl sm:text-3xl leading-tight mb-4 max-w-lg">{eventTitle(event, lang)}</h3>
                    <p className="text-white/70 text-sm mb-6 max-w-md line-clamp-2">{eventDesc(event, lang)}</p>
                    <Link href={`/events/${event.id}`} className="self-start rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
                      {lang === "ja" ? "詳細を見る" : lang === "ko" ? "자세히 보기" : "Learn More"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── GALLERY ───────────────────────────────────────────────── */}
        <section id="gallery" className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{tr.photo_gallery}</h2>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : gallery.length === 0 ? (
            <EmptyState icon="🖼️" message={lang === "ja" ? "ギャラリーはまだありません" : lang === "ko" ? "아직 갤러리 이미지가 없어요" : "No gallery images yet"} />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {gallery.map((img, i) => (
                <div key={img.id} className={`overflow-hidden rounded-2xl bg-gray-100 ${i === 0 ? "row-span-2" : ""}`} style={{ aspectRatio: i === 0 ? "1/2" : "1/1" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} alt={img.caption} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
      <Footer />

    </>
  );
}
