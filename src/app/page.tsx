"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { MOCK_EVENTS } from "@/lib/mock-data";

const EVENT_TYPE_IMGS = [
  "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=600&q=80",
  "https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=600&q=80",
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
];

const HOSTS = [
  {
    name: "Yuki M.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80",
    langs: ["日本語", "English"],
    location: "Osaka",
    bio: { ja: "こんにちは！大阪生まれ大阪育ち。英語と日本語の言語交換ホストをしています。一緒に楽しみましょう！", ko: "안녕하세요! 오사카 토박이. 영어와 일본어 언어교환 호스트입니다.", en: "Hey! Osaka native hosting Japanese-English exchanges. Let's have fun!" },
    stars: 4.9, reviews: 42,
  },
  {
    name: "Minho K.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    langs: ["한국어", "日本語"],
    location: "Osaka",
    bio: { ja: "大阪在住の韓国人。韓国語・日本語の交換パートナーを探しています！", ko: "오사카 거주 한국인입니다. 한국어·일본어 언어교환 환영!", en: "Korean living in Osaka. Looking for Korean-Japanese language partners!" },
    stars: 5.0, reviews: 18,
  },
  {
    name: "Sarah W.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    langs: ["English", "日本語"],
    location: "Osaka",
    bio: { ja: "カナダ出身、大阪在住3年。英語ネイティブとして言語交換しましょう！", ko: "캐나다 출신, 오사카 3년 거주. 영어 네이티브로 언어교환해요!", en: "Canadian living in Osaka for 3 years. Native English speaker for exchanges!" },
    stars: 4.8, reviews: 27,
  },
  {
    name: "Jian L.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
    langs: ["中文", "日本語"],
    location: "Osaka",
    bio: { ja: "大阪在住の中国人留学生。中国語と日本語の交換ができます！", ko: "오사카 거주 중국 유학생. 중국어·일본어 교환 가능해요!", en: "Chinese student in Osaka. Can exchange Chinese and Japanese!" },
    stars: 4.7, reviews: 11,
  },
];

const REVIEWS = [
  { reviewer: "Yuna K.", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80", date: "2026.03.16", stars: 5, text: { ja: "最高の雰囲気！たくさん友達ができました。また来ます。", ko: "최고의 분위기! 친구를 많이 사귀었어요. 또 올게요.", en: "Amazing atmosphere! Made so many new friends. Will come again." }, eventIdx: 0 },
  { reviewer: "Kenji T.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80", date: "2026.03.09", stars: 5, text: { ja: "食べ物もサイコー、みんなもフレンドリー。最高のイベントでした！", ko: "음식도 최고, 사람들도 친절해요. 최고의 이벤트였어요!", en: "Food was incredible, everyone so friendly. Best event ever!" }, eventIdx: 1 },
  { reviewer: "Minji L.", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80", date: "2026.03.03", stars: 5, text: { ja: "完璧な春の一日！主催者ありがとう！", ko: "완벽한 봄날! 주최자 감사해요!", en: "Perfect spring day! Great organizers!" }, eventIdx: 2 },
  { reviewer: "Tom W.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80", date: "2026.02.22", stars: 5, text: { ja: "大阪を探索しながら新しい友達ができる最高の方法。おすすめ！", ko: "오사카를 탐험하며 친구 사귀기에 최고. 강추!", en: "Best way to explore Osaka while making new friends. Highly recommend." }, eventIdx: 0 },
];

const GALLERY = [
  "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=600&q=80",
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
  "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=600&q=80",
  "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80",
  "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&q=80",
  "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80",
];

const LANG_FILTERS = ["日本語", "한국어", "English", "中文"];

export default function HomePage() {
  const { lang } = useLanguage();
  const tr = translations[lang];
  const [activeTab, setActiveTab] = useState(0);
  const [activeLang, setActiveLang] = useState<string | null>(null);

  const CATEGORY_FILTERS = [tr.cat_meetup, tr.cat_party, tr.cat_sports, tr.cat_food, tr.cat_culture];

  const EVENT_TYPES = [
    { href: "/events?category=meetup", img: EVENT_TYPE_IMGS[0], title: tr.cat_meetup, description: tr.meetup_desc },
    { href: "/events?category=party",  img: EVENT_TYPE_IMGS[1], title: tr.cat_party,  description: tr.party_desc  },
    { href: "/events?category=food",   img: EVENT_TYPE_IMGS[2], title: tr.cat_food,   description: tr.food_desc   },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="bg-white border-b border-gray-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16 flex flex-col md:flex-row items-center gap-8">
            {/* Text */}
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-3">
                BRIDGE<br /><span className="text-primary">OSAKA</span>
              </h1>
              <p className="text-gray-500 text-base mb-6">{tr.hero_tagline}</p>
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors shadow-sm"
              >
                {tr.hero_cta}
              </Link>
            </div>
            {/* Image */}
            <div className="w-full md:w-[480px] shrink-0 aspect-[4/3] rounded-2xl overflow-hidden shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1543353071-873f17a7a088?w=960&q=80"
                alt="Bridge Osaka"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Filter chips */}
          <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-6 space-y-3">
            {/* Event type */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-20 shrink-0">
                {tr.event_type}
              </span>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_FILTERS.map((cat) => (
                  <Link
                    key={cat}
                    href={`/events`}
                    className="rounded-full border border-gray-200 bg-white px-3.5 py-1 text-xs font-semibold text-gray-600 hover:border-primary hover:text-primary hover:bg-orange-50 transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
            {/* Language */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-20 shrink-0">
                {lang === "ja" ? "言語" : lang === "ko" ? "언어" : "Language"}
              </span>
              <div className="flex flex-wrap gap-2">
                {LANG_FILTERS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setActiveLang(activeLang === l ? null : l)}
                    className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
                      activeLang === l
                        ? "bg-primary border-primary text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary hover:bg-orange-50"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {/* Search */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-20 shrink-0" />
              <div className="flex-1 max-w-sm flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 bg-white shadow-sm">
                <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={lang === "ja" ? "イベント名・場所で検索..." : lang === "ko" ? "이벤트명·장소 검색..." : "Search events, venues..."}
                  className="flex-1 text-sm outline-none text-gray-700 bg-transparent"
                />
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
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:underline">
                  {tr.more}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── ABOUT ─────────────────────────────────────────────────── */}
        <section className="bg-gray-50 border-y border-gray-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 flex flex-col md:flex-row gap-10 items-center">
            <div className="w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden bg-gray-200 shrink-0 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80" alt="Osaka" className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{tr.about_bridge}</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{tr.about_text}</p>
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary px-5 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors"
              >
                MORE →
              </Link>
            </div>
          </div>
        </section>

        {/* ── RECOMMENDED ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{tr.recommended}</h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[tr.tab_today, tr.tab_new, tr.tab_popular].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeTab === i
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Event cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {MOCK_EVENTS.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group flex gap-3 rounded-2xl border border-gray-200 bg-white p-3 hover:shadow-md transition-shadow"
              >
                <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.imageUrl} alt={event.title[lang]} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    <span className="rounded-full text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5">
                      {tr[`cat_${event.category}` as keyof typeof tr] ?? event.category}
                    </span>
                    <span className="rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5">Osaka</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-1">{event.title[lang]}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(event.date + "T00:00:00").toLocaleDateString(lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US", { month: "short", day: "numeric", weekday: "short" })}
                    {" · "}{event.timeStart}{event.timeEnd ? `–${event.timeEnd}` : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{tr.going} {event.registrationCount}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Host cards */}
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {lang === "ja" ? "ホストを紹介" : lang === "ko" ? "호스트 소개" : "Meet our hosts"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {HOSTS.map((host) => (
              <div key={host.name} className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 mb-3 ring-2 ring-primary/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={host.avatar} alt={host.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-wrap gap-1 justify-center mb-2">
                  <span className="rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5">{host.location}</span>
                  {host.langs.map((l) => (
                    <span key={l} className="rounded-full text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5">{l}</span>
                  ))}
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">{host.name}</h4>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">{host.bio[lang]}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="text-yellow-400">★</span>
                  <span className="font-semibold">{host.stars}</span>
                  <span className="text-gray-400">({host.reviews})</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURED CAROUSEL ─────────────────────────────────────── */}
        <section className="bg-gray-900 overflow-hidden">
          <div className="flex overflow-x-auto snap-x snap-mandatory">
            {MOCK_EVENTS.map((event) => (
              <div key={event.id} className="relative shrink-0 w-full snap-start overflow-hidden" style={{ minHeight: 320 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.imageUrl} alt={event.title[lang]} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 flex flex-col justify-center h-full">
                  <p className="text-white/60 text-xs mb-2 uppercase tracking-wide">{event.date}</p>
                  <h3 className="text-white font-extrabold text-2xl sm:text-3xl leading-tight mb-4 max-w-lg">{event.title[lang]}</h3>
                  <p className="text-white/70 text-sm mb-6 max-w-md line-clamp-2">{event.description[lang]}</p>
                  <Link
                    href={`/events/${event.id}`}
                    className="self-start rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
                  >
                    {lang === "ja" ? "詳細を見る" : lang === "ko" ? "자세히 보기" : "Learn More"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── REVIEWS ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{tr.latest_reviews}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REVIEWS.map((review, i) => {
              const event = MOCK_EVENTS[review.eventIdx];
              return (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
                  {/* Top: event info */}
                  <div className="flex gap-3 p-4">
                    <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-1 mb-1">
                        <span className="rounded-full text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5">
                          {tr[`cat_${event.category}` as keyof typeof tr] ?? event.category}
                        </span>
                        <span className="rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5">Osaka</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{event.title[lang]}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(event.date + "T00:00:00").toLocaleDateString(lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US", { month: "short", day: "numeric", weekday: "short" })}
                        {" · "}{event.timeStart}
                      </p>
                    </div>
                  </div>
                  <hr className="border-gray-100" />
                  {/* Bottom: reviewer */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={review.avatar} alt={review.reviewer} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800">{review.reviewer}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 text-xs">{"★".repeat(review.stars)}</span>
                          <span className="text-gray-400 text-[10px]">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{review.text[lang]}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-6">
            <Link href="/events" className="inline-flex items-center gap-1 rounded-full border-2 border-gray-200 px-5 py-2 text-sm font-bold text-gray-600 hover:border-primary hover:text-primary transition-colors">
              {tr.more}
            </Link>
          </div>
        </section>

        {/* ── GALLERY ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{tr.photo_gallery}</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {GALLERY.map((src, i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-2xl bg-gray-100 ${i === 0 ? "row-span-2" : ""}`}
                style={{ aspectRatio: i === 0 ? "1/2" : "1/1" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
              </div>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
