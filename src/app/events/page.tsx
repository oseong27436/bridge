"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { getEvents, getSettings, eventTitle, eventLocation, type DbEvent } from "@/lib/db";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase";
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

const CATEGORY_EMOJI: Record<string, string> = {
  all: "🗓",
  meetup: "🗣",
  party: "🎉",
  sports: "⚽",
  food: "🍜",
  culture: "🎨",
};

export default function EventsPage() {
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsImage, setEventsImage] = useState("https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=1600&q=80");
  const [userId, setUserId] = useState<string | null>(null);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [category, setCategory] = useState<EventCategory | "all">("all");

  useEffect(() => {
    getEvents().then((data) => { setEvents(data); setLoading(false); });
    getSettings().then((cfg) => { if (cfg.events_image) setEventsImage(cfg.events_image); });
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase
        .from("bridge_registrations")
        .select("event_id, status")
        .eq("user_id", session.user.id)
        .neq("status", "cancelled");
      setRegisteredIds(new Set((data ?? []).map((r: { event_id: string }) => r.event_id)));
    });
  }, []);

  async function handleRegister(event: DbEvent) {
    if (!userId) { window.location.href = "/auth/login"; return; }
    if (registeredIds.has(event.id)) return;
    setApplyingId(event.id);
    await createClient().from("bridge_registrations").insert({
      event_id: event.id,
      user_id: userId,
      status: "pending",
    });
    setRegisteredIds((prev) => new Set([...prev, event.id]));
    setApplyingId(null);
  }

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

        {/* HERO */}
        <section className="relative h-48 sm:h-64 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={eventsImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── LEFT: Calendar + Filters ── */}
            <div className="lg:w-72 xl:w-80 shrink-0">
              <div className="lg:sticky lg:top-6 space-y-4">

                {/* Calendar */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  {/* Month nav */}
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
                      <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-7 gap-1">
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
                          className={`
                            aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all
                            ${isSelected ? "bg-primary text-white shadow-md scale-105" : ""}
                            ${!isSelected && hasEvent ? "bg-primary/15 text-primary hover:bg-primary/25 cursor-pointer" : ""}
                            ${!isSelected && isToday && !hasEvent ? "ring-2 ring-primary text-primary" : ""}
                            ${!isSelected && !hasEvent && !isToday ? "text-gray-500 cursor-default" : ""}
                          `}
                        >
                          {cell.day}
                        </button>
                      );
                    })}
                  </div>

                  {selectedDate && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                          lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US",
                          { month: "short", day: "numeric", weekday: "short" }
                        )}
                      </p>
                      <button onClick={() => setSelectedDate(null)} className="text-xs text-primary hover:underline">{tr.clear}</button>
                    </div>
                  )}
                </div>

                {/* Category filters */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Category</p>
                  <div className="flex flex-col gap-1.5">
                    {CATEGORY_FILTERS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setCategory(f.value as EventCategory | "all")}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors text-left ${
                          category === f.value
                            ? "bg-primary/10 text-primary"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-base">{CATEGORY_EMOJI[f.value]}</span>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* ── RIGHT: Event List ── */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  <strong className="text-gray-800">{filteredEvents.length}</strong>{" "}{tr.events_found}
                </p>
                {(selectedDate || category !== "all") && (
                  <button
                    onClick={() => { setCategory("all"); setSelectedDate(null); }}
                    className="text-xs text-primary hover:underline"
                  >
                    {tr.clear}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 animate-pulse">
                      <div className="w-28 shrink-0 aspect-square rounded-xl bg-gray-100" />
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
                  {filteredEvents.map((event) => {
                    const isRegistered = registeredIds.has(event.id);
                    const isApplying = applyingId === event.id;
                    return (
                      <div
                        key={event.id}
                        className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden flex gap-0"
                      >
                        {/* Image */}
                        <Link href={`/events/${event.id}`} className="shrink-0 w-28 sm:w-36">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={event.image_url}
                            alt={eventTitle(event, lang)}
                            className="h-full w-full object-cover"
                          />
                        </Link>

                        {/* Content */}
                        <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              <span className="rounded-full text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-0.5">
                                {CATEGORY_EMOJI[event.category]} {tr[`cat_${event.category}` as keyof typeof tr] ?? event.category}
                              </span>
                              <span className="rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500 px-2.5 py-0.5">
                                📍 {eventLocation(event, lang).split("（")[0].split("(")[0].trim()}
                              </span>
                            </div>
                            <Link href={`/events/${event.id}`}>
                              <h3 className="text-sm sm:text-base font-bold text-gray-900 hover:text-primary transition-colors leading-snug mb-1.5">
                                {eventTitle(event, lang)}
                              </h3>
                            </Link>
                            <p className="text-xs text-gray-500">
                              🗓 {new Date(event.date + "T00:00:00").toLocaleDateString(
                                lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US",
                                { month: "numeric", day: "numeric", weekday: "short" }
                              )}
                              {event.time_end
                                ? ` · ${event.time_start}〜${event.time_end}`
                                : ` · ${event.time_start}〜`}
                            </p>
                          </div>

                          {/* Bottom row: capacity + register */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                            {event.capacity !== null ? (
                              <p className="text-xs text-gray-400">
                                {tr.going} / <span className="font-semibold text-gray-600">{event.capacity}{tr.spots}</span>
                              </p>
                            ) : <span />}
                            <button
                              onClick={() => handleRegister(event)}
                              disabled={isRegistered || isApplying}
                              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                                isRegistered
                                  ? "bg-green-100 text-green-700 cursor-default"
                                  : "bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
                              }`}
                            >
                              {isApplying ? tr.reg_applying : isRegistered ? `✓ ${tr.reg_applied}` : tr.reg_apply}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400">
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

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
