"use client";

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

const REVIEWS = [
  { reviewer: "Yuna K.", date: "2026.03.16", stars: 5, text: { ja: "最高の雰囲気！たくさん友達ができました。また来ます。", ko: "최고의 분위기! 친구를 많이 사귀었어요. 또 올게요.", en: "Amazing atmosphere! Made so many new friends. Will come again." }, eventIdx: 0 },
  { reviewer: "Kenji T.", date: "2026.03.09", stars: 5, text: { ja: "食べ物もサイコー、みんなもフレンドリー。最高のイベントでした！", ko: "음식도 최고, 사람들도 친절해요. 최고의 이벤트였어요!", en: "Food was incredible, everyone was so friendly. Best event ever!" }, eventIdx: 1 },
  { reviewer: "Minji L.", date: "2026.03.03", stars: 5, text: { ja: "完璧な春の一日、完璧な仲間たち。主催者ありがとう！", ko: "완벽한 봄날, 완벽한 사람들. 주최자 감사해요!", en: "Perfect spring day, perfect people. Great organizers!" }, eventIdx: 2 },
  { reviewer: "Tom W.", date: "2026.02.22", stars: 5, text: { ja: "大阪を探索しながら新しい友達ができる最高の方法。おすすめ！", ko: "오사카를 탐험하며 친구 사귀기에 최고. 강추!", en: "Great way to explore Osaka while meeting new people. Highly recommend." }, eventIdx: 0 },
];

const GALLERY = [
  "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=400&q=80",
  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80",
  "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&q=80",
  "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&q=80",
  "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&q=80",
  "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400&q=80",
  "https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=400&q=80",
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80",
];

export default function HomePage() {
  const { lang } = useLanguage();
  const tr = translations[lang];

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
        <section className="relative h-[480px] sm:h-[540px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1543353071-873f17a7a088?w=1600&q=80"
            alt="Bridge Osaka"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative z-10 flex h-full flex-col justify-center px-6 sm:px-12 max-w-6xl mx-auto pb-20">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-3">
              BRIDGE<br />OSAKA
            </h1>
            <p className="text-white/80 text-lg mb-6">{tr.hero_tagline}</p>
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 self-start rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              {tr.hero_cta}
            </Link>
          </div>

          {/* Search bar */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2">
              <div className="bg-white px-6 py-4 flex flex-wrap gap-3 items-center">
                <select className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700">
                  <option>{tr.cat_all}</option>
                  <option>{tr.cat_meetup}</option>
                  <option>{tr.cat_party}</option>
                  <option>{tr.cat_food}</option>
                  <option>{tr.cat_culture}</option>
                </select>
                <button className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
                  Search
                </button>
              </div>
              <div className="bg-primary px-6 py-4">
                <p className="text-white text-sm font-semibold mb-2">
                  {lang === "ja" && "どんなイベントをお探しですか？"}
                  {lang === "ko" && "어떤 이벤트를 찾고 계세요?"}
                  {lang === "en" && "What event are you looking for?"}
                </p>
                <div className="flex items-center gap-2 bg-white rounded px-3 py-2">
                  <input
                    type="text"
                    placeholder={
                      lang === "ja" ? "場所・イベント名で検索..." :
                      lang === "ko" ? "장소, 이벤트명 검색..." :
                      "Search location, meetup..."
                    }
                    className="flex-1 text-sm outline-none text-gray-700 bg-transparent"
                  />
                  <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick filter chips */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-wrap gap-2">
            {[tr.filter_today, tr.filter_weekend, tr.cat_meetup, tr.cat_party, tr.cat_food, tr.cat_culture].map((tag) => (
              <Link
                key={tag}
                href="/events"
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* ── EVENT TYPE ────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{tr.event_type}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {EVENT_TYPES.map((type) => (
              <Link key={type.title} href={type.href} className="group block">
                <div className="overflow-hidden rounded-lg mb-4 aspect-[4/3] bg-gray-100">
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
        <section className="bg-gray-100 border-y border-gray-200">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2 aspect-video rounded-lg overflow-hidden bg-gray-300 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80" alt="Osaka" className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{tr.about_bridge}</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{tr.about_text}</p>
              <Link href="/about" className="text-sm font-semibold text-primary hover:underline">{tr.more}</Link>
            </div>
          </div>
        </section>

        {/* ── RECOMMENDED ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{tr.recommended}</h2>
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            {[tr.tab_today, tr.tab_new, tr.tab_popular].map((tab, i) => (
              <button
                key={tab}
                className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${i === 0 ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800"}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_EVENTS.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group flex gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:shadow-md transition-shadow"
              >
                <div className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.imageUrl} alt={event.title[lang]} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 mb-1">
                    <span className="rounded text-[10px] font-semibold bg-orange-100 text-orange-600 px-1.5 py-0.5 capitalize">
                      {tr[`cat_${event.category}` as keyof typeof tr] ?? event.category}
                    </span>
                    <span className="rounded text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5">Osaka</span>
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
        </section>

        {/* ── FEATURED CAROUSEL ─────────────────────────────────────── */}
        <section className="overflow-hidden">
          <div className="flex overflow-x-auto snap-x snap-mandatory">
            {MOCK_EVENTS.map((event) => (
              <div key={event.id} className="relative shrink-0 w-full sm:w-1/2 md:w-1/3 snap-start aspect-[16/9] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.imageUrl} alt={event.title[lang]} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white/70 text-xs mb-1">{event.date}</p>
                  <h3 className="text-white font-bold text-sm leading-snug mb-2">{event.title[lang]}</h3>
                  <hr className="border-white/30 mb-2" />
                  <Link href={`/events/${event.id}`} className="inline-block rounded bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary/90">
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
                <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-1 mb-1">
                        <span className="rounded text-[10px] font-semibold bg-orange-100 text-orange-600 px-1.5 py-0.5 capitalize">{event.category}</span>
                        <span className="rounded text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5">Osaka</span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{event.title[lang]}</h3>
                    </div>
                  </div>
                  <hr className="border-gray-100 mb-3" />
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{review.reviewer[0]}</div>
                    <span className="text-xs font-semibold text-gray-700">{review.reviewer}</span>
                    <span className="text-yellow-400 text-xs">{"★".repeat(review.stars)}</span>
                    <span className="ml-auto text-xs text-gray-400">{review.date}</span>
                  </div>
                  <p className="text-sm text-gray-600">{review.text[lang]}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-6">
            <Link href="/reviews" className="text-sm font-semibold text-primary hover:underline">{tr.more}</Link>
          </div>
        </section>

        {/* ── GALLERY ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{tr.photo_gallery}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {GALLERY.map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
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
