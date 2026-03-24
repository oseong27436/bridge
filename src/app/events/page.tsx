"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { getEvents, eventTitle, eventLocation, type DbEvent } from "@/lib/db";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import type { EventCategory } from "@/lib/types";

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: { day: number; current: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, current: false });
  return cells;
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function EventsPage() {
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [category, setCategory] = useState<EventCategory | "all">("all");

  useEffect(() => {
    getEvents().then((data) => { setEvents(data); setLoading(false); });
  }, []);

  const eventDates = useMemo(() => new Set(events.map((e) => e.date)), [events]);
  const calendarDays = getCalendarDays(calYear, calMonth);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1);
    setSelectedDate(null);
  }

  const filteredEvents = useMemo(() =>
    events.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (selectedDate && e.date !== selectedDate) return false;
      return true;
    }),
    [events, category, selectedDate]
  );

  const CATEGORY_FILTERS = [
    { value: "all",     label: tr.cat_all },
    { value: "meetup",  label: tr.cat_meetup },
    { value: "party",   label: tr.cat_party },
    { value: "sports",  label: tr.cat_sports },
    { value: "food",    label: tr.cat_food },
    { value: "culture", label: tr.cat_culture },
  ];

  const months = (tr.months as unknown as string[]);
  const days   = (tr.days   as unknown as string[]);

  return (
    <>
      <Header />
      <main className="flex-1">

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="relative h-48 sm:h-64 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=1600&q=80" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 h-full flex flex-col justify-end max-w-6xl mx-auto px-4 sm:px-6 pb-5">
            <nav className="text-xs text-white/60 mb-1.5">
              <Link href="/" className="hover:text-white">Home</Link>
              <span className="mx-1">/</span>
              <span className="text-white">Event Calendar</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{tr.events_title}</h1>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">

          {/* ── CALENDAR ──────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                {months[calMonth]} {calYear}
              </h2>
              <div className="flex gap-1">
                <button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {days.map((d: string) => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((cell, i) => {
                if (!cell.current) return (
                  <div key={i} className="aspect-square flex items-center justify-center text-xs text-gray-200">{cell.day}</div>
                );
                const dateStr = toDateStr(calYear, calMonth, cell.day);
                const hasEvent = eventDates.has(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                return (
                  <button
                    key={i}
                    onClick={() => hasEvent && setSelectedDate(isSelected ? null : dateStr)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors
                      ${isSelected ? "bg-primary text-white font-bold" : ""}
                      ${!isSelected && isToday ? "ring-2 ring-primary text-primary font-semibold" : ""}
                      ${!isSelected && !isToday && hasEvent ? "text-primary font-semibold hover:bg-orange-50 cursor-pointer" : ""}
                      ${!isSelected && !isToday && !hasEvent ? "text-gray-700 cursor-default" : ""}
                    `}
                  >
                    {cell.day}
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <p className="mt-3 text-xs text-gray-500 text-center">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US",
                  { weekday: "long", month: "long", day: "numeric" }
                )}
                {" · "}
                <button onClick={() => setSelectedDate(null)} className="text-primary hover:underline">{tr.clear}</button>
              </p>
            )}
          </div>

          {/* ── CATEGORY FILTERS ────────────────────────────────── */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setCategory(f.value as EventCategory | "all")}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  category === f.value
                    ? "bg-primary border-primary text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:border-primary hover:text-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ── EVENT COUNT ─────────────────────────────────────── */}
          <p className="text-sm text-gray-500 mb-3">
            <strong className="text-gray-800">{filteredEvents.length}</strong>{" "}
            {tr.events_found}
          </p>

          {/* ── EVENT LIST ──────────────────────────────────────── */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
                  <div className="w-24 sm:w-32 shrink-0 aspect-square rounded-lg bg-gray-100" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group flex gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-24 sm:w-32 shrink-0 aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={event.image_url} alt={eventTitle(event, lang)} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      <span className="rounded text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5">
                        {tr[`cat_${event.category}` as keyof typeof tr] ?? event.category}
                      </span>
                      <span className="rounded text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5">
                        {eventLocation(event, lang).split("（")[0].split("(")[0].trim()}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug mb-1">
                      {eventTitle(event, lang)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(event.date + "T00:00:00").toLocaleDateString(
                        lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US",
                        { month: "numeric", day: "numeric", weekday: "short" }
                      )}
                      {event.time_end
                        ? ` · ${event.time_start}〜${event.time_end}`
                        : ` · ${event.time_start}〜`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">📍 {eventLocation(event, lang)}</p>
                    {event.capacity !== null && (
                      <p className="text-xs font-semibold text-gray-600 mt-2">
                        {tr.going} / {event.capacity}{tr.spots}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-sm font-medium text-gray-500">
                {lang === "ja" ? "イベントがありません" : lang === "ko" ? "이벤트가 없습니다" : "No events found"}
              </p>
              <button
                onClick={() => { setCategory("all"); setSelectedDate(null); }}
                className="mt-3 text-xs text-primary hover:underline"
              >
                {tr.clear}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
