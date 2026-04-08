"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, MapPin, Clock, Users } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { getEvents, getSettings, eventTitle, eventLocation, type DbEvent } from "@/lib/db";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase";

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
  const [eventsImage, setEventsImage] = useState("https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=1600&q=80");
  const [userId, setUserId] = useState<string | null>(null);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // Popup state
  const [popupEvent, setPopupEvent] = useState<DbEvent | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

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

  // Close popup on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopupEvent(null);
        setShowRegForm(false);
      }
    }
    if (popupEvent) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popupEvent]);

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
    setShowRegForm(false);
  }

  const eventsByDate = useMemo(() => {
    const map: Record<string, DbEvent[]> = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const calendarDays = getCalendarDays(calYear, calMonth);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1);
    setPopupEvent(null); setShowRegForm(false);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1);
    setPopupEvent(null); setShowRegForm(false);
  }

  // Upcoming events (future, sorted)
  const upcomingEvents = useMemo(() =>
    events.filter((e) => e.date >= todayStr).slice(0, 8),
    [events, todayStr]
  );

  const months = tr.months as unknown as string[];
  const days   = tr.days   as unknown as string[];

  const localeStr = lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US";

  return (
    <>
      <Header />
      <main className="flex-1">

        {/* HERO */}
        <section className="relative h-48 sm:h-56 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={eventsImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 h-full flex flex-col justify-end max-w-6xl mx-auto px-4 sm:px-6 pb-6">
            <nav className="text-xs text-white/60 mb-1.5">
              <Link href="/" className="hover:text-white">Home</Link>
              <span className="mx-1">/</span>
              <span className="text-white">Event Calendar</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{tr.events_title}</h1>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── LEFT: Upcoming Events ── */}
            <div className="lg:w-64 xl:w-72 shrink-0">
              <div className="lg:sticky lg:top-6">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
                  {lang === "ja" ? "開催予定" : lang === "ko" ? "예정된 이벤트" : "Upcoming"}
                </h2>
                {loading ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    {lang === "ja" ? "予定なし" : lang === "ko" ? "예정 없음" : "No upcoming events"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => { setPopupEvent(event); setShowRegForm(false); }}
                        className={`w-full text-left rounded-xl border p-3 transition-all hover:shadow-md hover:border-primary/40 ${
                          popupEvent?.id === event.id ? "border-primary bg-primary/5" : "border-gray-100 bg-white"
                        }`}
                      >
                        <div className="flex gap-2.5 items-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={event.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate leading-snug">{eventTitle(event, lang)}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(event.date + "T00:00:00").toLocaleDateString(localeStr, { month: "short", day: "numeric", weekday: "short" })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Large Calendar ── */}
            <div className="flex-1 min-w-0 relative">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

                {/* Month nav */}
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-gray-900">
                    {months[calMonth]} {calYear}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); setPopupEvent(null); }}
                      className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-primary hover:text-primary transition-colors"
                    >
                      {lang === "ja" ? "今月" : lang === "ko" ? "이번 달" : "Today"}
                    </button>
                    <button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-7 mb-2">
                  {days.map((d: string) => (
                    <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((cell, i) => {
                    if (!cell.current) return (
                      <div key={i} className="aspect-square flex items-center justify-center text-sm text-gray-200">
                        {cell.day}
                      </div>
                    );
                    const dateStr = toDateStr(calYear, calMonth, cell.day);
                    const dayEvents = eventsByDate[dateStr] ?? [];
                    const hasEvent = dayEvents.length > 0;
                    const isToday = dateStr === todayStr;
                    const isActive = popupEvent && dayEvents.some(e => e.id === popupEvent.id);

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (!hasEvent) return;
                          const first = dayEvents[0];
                          if (popupEvent?.id === first.id) { setPopupEvent(null); setShowRegForm(false); }
                          else { setPopupEvent(first); setShowRegForm(false); }
                        }}
                        className={`
                          aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all relative
                          ${isActive ? "bg-primary text-white shadow-lg scale-105" : ""}
                          ${!isActive && hasEvent ? "bg-primary/15 text-primary hover:bg-primary/25 cursor-pointer hover:scale-105" : ""}
                          ${!isActive && isToday && !hasEvent ? "ring-2 ring-primary text-primary" : ""}
                          ${!isActive && !hasEvent && !isToday ? "text-gray-500 cursor-default" : ""}
                        `}
                      >
                        {cell.day}
                        {hasEvent && !isActive && (
                          <span className="absolute bottom-1.5 flex gap-0.5">
                            {dayEvents.slice(0, 3).map((_, idx) => (
                              <span key={idx} className="w-1 h-1 rounded-full bg-primary" />
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Event Popup Card ── */}
              {popupEvent && (
                <div ref={popupRef} className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                  {/* Card header with image */}
                  <div className="relative h-40 sm:h-48">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={popupEvent.image_url} alt={eventTitle(popupEvent, lang)} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <button
                      onClick={() => { setPopupEvent(null); setShowRegForm(false); }}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 p-4">
                      <h3 className="text-lg font-extrabold text-white leading-snug">{eventTitle(popupEvent, lang)}</h3>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(popupEvent.date + "T00:00:00").toLocaleDateString(localeStr, { month: "long", day: "numeric", weekday: "short" })}
                        {" · "}{popupEvent.time_start}{popupEvent.time_end ? `〜${popupEvent.time_end}` : "〜"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {eventLocation(popupEvent, lang)}
                      </span>
                      {popupEvent.capacity && (
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-gray-400" />
                          {tr.going} / {popupEvent.capacity}{tr.spots}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {!showRegForm ? (
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/events/${popupEvent.id}`}
                          className="flex-1 text-center rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:border-primary hover:text-primary transition-colors"
                        >
                          {lang === "ja" ? "詳細を見る" : lang === "ko" ? "자세히 보기" : "View Details"}
                        </Link>
                        {registeredIds.has(popupEvent.id) ? (
                          <span className="flex-1 text-center rounded-xl bg-green-100 py-2.5 text-sm font-bold text-green-700">
                            ✓ {tr.reg_applied}
                          </span>
                        ) : (
                          <button
                            onClick={() => setShowRegForm(true)}
                            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
                          >
                            {tr.reg_apply}
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Inline registration form */
                      <div className="border border-primary/20 rounded-xl p-4 bg-primary/5">
                        <h4 className="text-sm font-bold text-gray-800 mb-3">
                          {lang === "ja" ? "参加申し込み" : lang === "ko" ? "참가 신청" : "Register"}
                        </h4>
                        <p className="text-xs text-gray-500 mb-4">
                          {lang === "ja"
                            ? "申し込みを確認後、承認メールをお送りします。"
                            : lang === "ko"
                            ? "신청 후 검토 완료 시 승인 메일을 보내드립니다."
                            : "We'll review your application and send a confirmation email."}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowRegForm(false)}
                            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors"
                          >
                            {lang === "ja" ? "戻る" : lang === "ko" ? "취소" : "Back"}
                          </button>
                          <button
                            onClick={() => handleRegister(popupEvent)}
                            disabled={applyingId === popupEvent.id}
                            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                          >
                            {applyingId === popupEvent.id ? "..." : tr.reg_apply}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
