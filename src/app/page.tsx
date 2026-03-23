import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { MOCK_EVENTS } from "@/lib/mock-data";

const EVENT_TYPES = [
  {
    href: "/events?category=meetup",
    img: "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=600&q=80",
    title: "Meetup",
    description:
      "Casual gatherings in Osaka where you can meet new people, practice languages, and make friends.",
  },
  {
    href: "/events?category=party",
    img: "https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=600&q=80",
    title: "Party",
    description:
      "Weekend parties with music, drinks, and a great atmosphere. Meet hundreds of people from around the world.",
  },
  {
    href: "/events?category=food",
    img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
    title: "Food & Culture",
    description:
      "Food tours and cultural activities that let you experience the best of Osaka together.",
  },
];

const FEATURED_EVENTS = MOCK_EVENTS.slice(0, 3);

const REVIEWS = [
  {
    event: "梅田国際交流パーティー",
    type: "Party",
    location: "Umeda",
    date: "Sat, Mar 15 | 7:00 PM - 10:00 PM",
    reviewer: "Yuna K.",
    reviewDate: "2026.03.16",
    text: "Amazing atmosphere! Made so many new friends. Will definitely come again.",
  },
  {
    event: "難波フードツアー",
    type: "Food",
    location: "Namba",
    date: "Sat, Mar 8 | 5:30 PM - 8:30 PM",
    reviewer: "Kenji T.",
    reviewDate: "2026.03.09",
    text: "The food was incredible and the people were so friendly. Best event ever!",
  },
  {
    event: "大阪城公園ピクニック",
    type: "Meetup",
    location: "Osaka Castle",
    date: "Sun, Mar 2 | 1:00 PM - 5:00 PM",
    reviewer: "Minji L.",
    reviewDate: "2026.03.03",
    text: "Perfect spring day, perfect people. The organizers did a great job!",
  },
  {
    event: "心斎橋ナイトウォーク",
    type: "Meetup",
    location: "Shinsaibashi",
    date: "Fri, Feb 21 | 7:00 PM - 9:30 PM",
    reviewer: "Tom W.",
    reviewDate: "2026.02.22",
    text: "Great way to explore Osaka while meeting new people. Highly recommend.",
  },
];

const GALLERY_IMGS = [
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
  return (
    <>
      <Header />
      <main className="flex-1">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative h-[480px] sm:h-[540px] overflow-hidden">
          {/* Background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1543353071-873f17a7a088?w=1600&q=80"
            alt="Bridge Osaka community"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/55" />

          {/* Hero text */}
          <div className="relative z-10 flex h-full flex-col justify-center px-6 sm:px-12 max-w-6xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-3">
              BRIDGE
              <br />
              OSAKA
            </h1>
            <p className="text-white/80 text-lg mb-6">Make new friends in Osaka</p>
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 self-start rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              See Events
            </Link>
          </div>

          {/* Search bar below hero */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2">
              {/* Left: type filter */}
              <div className="bg-white px-6 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <select className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 w-full sm:w-auto">
                  <option>All Types</option>
                  <option>Meetup</option>
                  <option>Party</option>
                  <option>Food</option>
                  <option>Culture</option>
                </select>
                <button className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
                  Search
                </button>
              </div>
              {/* Right: text search */}
              <div className="bg-primary px-6 py-4">
                <p className="text-white text-sm font-semibold mb-2">
                  What event are you looking for?
                </p>
                <div className="flex items-center gap-2 bg-white rounded px-3 py-2">
                  <input
                    type="text"
                    placeholder="Search location, meetup, host..."
                    className="flex-1 text-sm outline-none text-gray-700 bg-transparent"
                  />
                  <button className="text-gray-400 hover:text-primary">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick filter chips */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-wrap gap-2">
            {["Today", "This Weekend", "Meetup", "Party", "Food", "Culture", "Free"].map((tag) => (
              <Link
                key={tag}
                href={`/events?tag=${tag.toLowerCase().replace(" ", "-")}`}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* ── EVENT TYPE ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Event Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {EVENT_TYPES.map((type) => (
              <Link key={type.title} href={type.href} className="group block">
                <div className="overflow-hidden rounded-lg mb-4 aspect-[4/3] bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={type.img}
                    alt={type.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{type.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-2">{type.description}</p>
                <span className="text-sm font-semibold text-primary group-hover:underline">
                  More &gt;
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── ABOUT BRIDGE ─────────────────────────────────────────────── */}
        <section className="bg-gray-100 border-y border-gray-200">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2 aspect-video rounded-lg overflow-hidden bg-gray-300 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80"
                alt="Osaka night"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Bridge</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Bridge is an international community in Osaka. We host meetups, parties, food tours,
                and cultural events throughout the year. Whether you're Korean, Japanese, or from
                anywhere in the world — you're welcome here. Come alone, bring friends, and just
                show up. New friendships start here.
              </p>
              <Link href="/about" className="text-sm font-semibold text-primary hover:underline">
                More &gt;
              </Link>
            </div>
          </div>
        </section>

        {/* ── RECOMMENDED ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Recommended</h2>
          </div>
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            {["Today", "New", "Popular"].map((tab, i) => (
              <button
                key={tab}
                className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
                  i === 0
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_EVENTS.slice(0, 3).map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group flex gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:shadow-md transition-shadow"
              >
                <div className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.imageUrl}
                    alt={event.title.en}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 mb-1">
                    <span className="rounded text-[10px] font-semibold bg-orange-100 text-orange-600 px-1.5 py-0.5 capitalize">
                      {event.category}
                    </span>
                    <span className="rounded text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5">
                      Osaka
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-1">
                    {event.title.en}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    {" | "}{event.timeStart}–{event.timeEnd}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">
                    Going {event.registrationCount}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── FEATURED EVENTS CAROUSEL ─────────────────────────────────── */}
        <section className="overflow-hidden">
          <div className="flex overflow-x-auto gap-0 snap-x snap-mandatory scrollbar-hide">
            {FEATURED_EVENTS.map((event) => (
              <div
                key={event.id}
                className="relative shrink-0 w-full sm:w-1/2 md:w-1/3 snap-start aspect-[16/9] overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.imageUrl}
                  alt={event.title.en}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white/70 text-xs mb-1">{event.date}</p>
                  <h3 className="text-white font-bold text-sm leading-snug mb-2">
                    {event.title.en}
                  </h3>
                  <hr className="border-white/30 mb-2" />
                  <p className="text-white/60 text-xs mb-2">
                    Don&apos;t miss this featured event
                  </p>
                  <Link
                    href={`/events/${event.id}`}
                    className="inline-block rounded bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary/90"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── LATEST REVIEWS ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Reviews</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REVIEWS.map((review, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex gap-3 mb-3">
                  <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={MOCK_EVENTS[i % MOCK_EVENTS.length].imageUrl}
                      alt={review.event}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-1 mb-1">
                      <span className="rounded text-[10px] font-semibold bg-orange-100 text-orange-600 px-1.5 py-0.5">
                        {review.type}
                      </span>
                      <span className="rounded text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5">
                        {review.location}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                      {review.event}
                    </h3>
                    <p className="text-xs text-gray-500">{review.date}</p>
                  </div>
                </div>
                <hr className="border-gray-100 mb-3" />
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {review.reviewer[0]}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{review.reviewer}</span>
                  <div className="flex text-yellow-400 text-xs">★★★★★</div>
                  <span className="ml-auto text-xs text-gray-400">{review.reviewDate}</span>
                </div>
                <p className="text-sm text-gray-600">{review.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/reviews" className="text-sm font-semibold text-primary hover:underline">
              More &gt;
            </Link>
          </div>
        </section>

        {/* ── PHOTO GALLERY ────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Photo Gallery</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {GALLERY_IMGS.map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Gallery ${i + 1}`}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
