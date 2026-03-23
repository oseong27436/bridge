"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { MOCK_EVENTS } from "@/lib/mock-data";
import type { EventCategory } from "@/lib/types";

const QUICK_FILTERS = [
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "Meetup", value: "meetup" },
  { label: "Party", value: "party" },
  { label: "Food", value: "food" },
  { label: "Culture", value: "culture" },
  { label: "Korean", value: "ko" },
  { label: "Japanese", value: "ja" },
  { label: "English", value: "en" },
];

export default function EventsPage() {
  const [typeFilter, setTypeFilter] = useState<EventCategory | "all">("all");
  const [activeQuick, setActiveQuick] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter((e) => {
      if (typeFilter !== "all" && e.category !== typeFilter) return false;
      return true;
    });
  }, [typeFilter]);

  return (
    <>
      <Header />
      <main className="flex-1">

        {/* ── PAGE HERO ──────────────────────────────────────────────── */}
        <section className="relative h-56 sm:h-72 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=1600&q=80"
            alt="Osaka events"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 h-full flex flex-col justify-end max-w-6xl mx-auto px-4 sm:px-6 pb-6">
            <nav className="text-xs text-white/60 mb-2">
              <Link href="/" className="hover:text-white">Home</Link>
              <span className="mx-1">/</span>
              <span className="text-white">Event Calendar</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              Osaka Events
            </h1>
          </div>

          {/* Filter bar overlapping bottom of hero */}
          <div className="absolute bottom-0 left-0 right-0 z-10 translate-y-1/2">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row shadow-lg rounded-lg overflow-hidden">
                {/* Left: dropdowns */}
                <div className="bg-white px-4 py-3 flex flex-wrap gap-2 flex-1 items-center">
                  <select
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as EventCategory | "all")}
                  >
                    <option value="all">All Types</option>
                    <option value="meetup">Meetup</option>
                    <option value="party">Party</option>
                    <option value="food">Food</option>
                    <option value="culture">Culture</option>
                    <option value="sports">Sports</option>
                  </select>
                  <select className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700">
                    <option>All Days</option>
                    <option>This Weekend</option>
                    <option>Next Week</option>
                  </select>
                  <button className="rounded-full bg-primary px-5 py-1.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
                    Search
                  </button>
                </div>
                {/* Right: text search */}
                <div className="bg-primary px-4 py-3 flex flex-col gap-1 min-w-[240px]">
                  <p className="text-white text-xs font-semibold">What event are you looking for?</p>
                  <div className="flex items-center gap-2 bg-white rounded px-3 py-1.5">
                    <input
                      type="text"
                      placeholder="Search location, meetup, host..."
                      className="flex-1 text-xs outline-none text-gray-700 bg-transparent"
                    />
                    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Spacer for filter bar overflow */}
        <div className="h-16 sm:h-10 bg-gray-50" />

        {/* ── QUICK FILTERS ──────────────────────────────────────────── */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3">
            <ul className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((f) => (
                <li key={f.value}>
                  <button
                    onClick={() => setActiveQuick(activeQuick === f.value ? null : f.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      activeQuick === f.value
                        ? "bg-primary border-primary text-white"
                        : "border-gray-300 bg-white text-gray-600 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {f.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── EVENT LIST ─────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <p className="text-sm text-gray-500 mb-4">
            Events found for you:{" "}
            <strong className="text-gray-800">{filteredEvents.length}</strong>
          </p>

          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group flex gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="w-28 sm:w-36 shrink-0 aspect-square rounded-md overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.imageUrl}
                    alt={event.title.en}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      <span className="rounded text-[10px] font-semibold bg-orange-100 text-orange-600 px-1.5 py-0.5 capitalize">
                        {event.category}
                      </span>
                      <span className="rounded text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5">
                        Osaka
                      </span>
                    </div>
                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
                      {event.title.en}
                    </h3>
                    {/* Date/time */}
                    <p className="text-xs sm:text-sm text-gray-500">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      | {event.timeStart} - {event.timeEnd}
                    </p>
                    {/* Host */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                        B
                      </div>
                      <span className="text-xs text-gray-500">Bridge Osaka</span>
                    </div>
                  </div>

                  {/* Bottom row: rating + going */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <span className="text-yellow-400">★</span>
                      <span className="font-semibold">4.8</span>
                      <span className="text-gray-400">(12)</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-600">
                      Going {event.registrationCount}
                    </span>
                    {event.capacity !== null && (
                      <span className="text-xs text-gray-400">
                        / {event.capacity} spots
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
