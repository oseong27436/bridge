"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  const localeStr = lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US";

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsImage, setEventsImage] = useState("https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=1600&q=80");
  const [userId, setUserId] = useState<string | null>(null);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // PC: hover popup
  const [hoverEvent, setHoverEvent] = useState<DbEvent | null>(null);
  const [hoverPos, setHoverPos] = useState<{ top: number; left: number } | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile: click popup
  const [mobilePopup, setMobilePopup] = useState<DbEvent | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);

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
      event_id: event.id, user_id: userId, status: "pending",
    });
    setRegisteredIds((prev) => new Set([...prev, event.id]));
    setApplyingId(null);
    setShowRegForm(false);
  }

  const eventsByDate = useMemo(() => {
    const map: Record<string, DbEvent[]> = {};
    events.forEach((e) => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
    return map;
  }, [events]);

  const upcomingEvents = useMemo(() =>
    events.filter((e) => e.date >= todayStr),
    [events, todayStr]
  );

  const calendarDays = getCalendarDays(calYear, calMonth);

  function prevMonth() { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); setMobilePopup(null); }
  function nextMonth() { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); setMobilePopup(null); }

  const clearHover = useCallback(() => {
    hoverTimer.current = setTimeout(() => { setHoverEvent(null); setHoverPos(null); }, 180);
  }, []);
  const keepHover = useCallback(() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);

  const months = tr.months as unknown as string[];
  const days   = tr.days   as unknown as string[];

  function EventPopupCard({ event, onClose, isMobile }: { event: DbEvent; onClose: () => void; isMobile?: boolean }) {
    const isRegistered = registeredIds.has(event.id);
    const isApplying = applyingId === event.id;
    return (
      <div className={isMobile ? "" : ""}>
        {/* Image */}
        <div className="relative h-36">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.image_url} alt={eventTitle(event, lang)} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button onClick={onClose} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white">
            <X className="w-3.5 h-3.5" />
          </button>
          <h3 className="absolute bottom-0 left-0 p-3 text-sm font-extrabold text-white leading-snug line-clamp-2">
            {eventTitle(event, lang)}
          </h3>
        </div>
        {/* Info */}
        <div className="p-3 space-y-1.5 text-xs text-gray-600">
          <div className="flex items-start gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <span>
              {new Date(event.date + "T00:00:00").toLocaleDateString(localeStr, { month: "short", day: "numeric", weekday: "short" })}
              {" · "}{event.time_start}{event.time_end ? `〜${event.time_end}` : "〜"}
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{eventLocation(event, lang)}</span>
          </div>
          {event.capacity && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{tr.going} / {event.capacity}{tr.spots}</span>
            </div>
          )}
        </div>
        {/* Actions */}
        <div className="px-3 pb-3">
          {!showRegForm ? (
            <div className="flex gap-2">
              <Link href={`/events/${event.id}`} className="flex-1 text-center rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:border-primary hover:text-primary transition-colors">
                {lang === "ja" ? "詳細" : lang === "ko" ? "상세" : "Details"}
              </Link>
              {isRegistered ? (
                <span className="flex-1 text-center rounded-lg bg-green-100 py-2 text-xs font-bold text-green-700">✓ {tr.reg_applied}</span>
              ) : (
                <button onClick={() => setShowRegForm(true)} className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors">
                  {tr.reg_apply}
                </button>
              )}
            </div>
          ) : (
            <div className="border border-primary/20 rounded-lg p-3 bg-primary/5">
              <p className="text-xs text-gray-500 mb-3">
                {lang === "ja" ? "申し込みを確認後、承認メールをお送りします。" : lang === "ko" ? "검토 후 승인 메일을 보내드립니다." : "We'll review and send a confirmation."}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowRegForm(false)} className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-500 hover:border-gray-300 transition-colors">
                  {lang === "ja" ? "戻る" : lang === "ko" ? "취소" : "Back"}
                </button>
                <button onClick={() => handleRegister(event)} disabled={isApplying} className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors">
                  {isApplying ? "..." : tr.reg_apply}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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

            {/* ── LEFT (PC) / TOP (Mobile): Calendar ── */}
            <div className="lg:w-[440px] xl:w-[500px] shrink-0">
              <div className="lg:sticky lg:top-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

                  {/* Month nav */}
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-gray-900">{months[calMonth]} {calYear}</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); setMobilePopup(null); }}
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

                  {/* Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((cell, i) => {
                      if (!cell.current) return (
                        <div key={i} className="aspect-square flex items-center justify-center text-sm text-gray-200">{cell.day}</div>
                      );
                      const dateStr = toDateStr(calYear, calMonth, cell.day);
                      const dayEvents = eventsByDate[dateStr] ?? [];
                      const hasEvent = dayEvents.length > 0;
                      const isToday = dateStr === todayStr;
                      const isActive = mobilePopup && dayEvents.some(e => e.id === mobilePopup.id);

                      return (
                        <button
                          key={i}
                          // PC hover
                          onMouseEnter={(e) => {
                            if (!hasEvent) return;
                            keepHover();
                            const rect = e.currentTarget.getBoundingClientRect();
                            // Position to the right of cell, clamped to viewport
                            const popupW = 280;
                            const left = rect.right + 8 + popupW > window.innerWidth
                              ? rect.left - popupW - 8
                              : rect.right + 8;
                            const top = Math.min(rect.top, window.innerHeight - 360);
                            setHoverEvent(dayEvents[0]);
                            setHoverPos({ top, left });
                          }}
                          onMouseLeave={clearHover}
                          // Mobile click
                          onClick={() => {
                            if (!hasEvent) return;
                            setMobilePopup(prev => prev?.id === dayEvents[0].id ? null : dayEvents[0]);
                            setShowRegForm(false);
                          }}
                          className={`
                            aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all
                            ${isActive ? "bg-primary text-white shadow-md scale-105" : ""}
                            ${!isActive && hasEvent ? "bg-primary/15 text-primary hover:bg-primary/25 cursor-pointer hover:scale-105" : ""}
                            ${!isActive && isToday && !hasEvent ? "ring-2 ring-primary text-primary" : ""}
                            ${!isActive && !hasEvent && !isToday ? "text-gray-500 cursor-default" : ""}
                          `}
                        >
                          {cell.day}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile popup — below calendar */}
                  {mobilePopup && (
                    <div className="lg:hidden mt-4 border-t border-gray-100 pt-4 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                      <EventPopupCard event={mobilePopup} onClose={() => { setMobilePopup(null); setShowRegForm(false); }} isMobile />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT (PC) / BOTTOM (Mobile): Event List ── */}
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
                {lang === "ja" ? "開催予定" : lang === "ko" ? "예정된 이벤트" : "Upcoming Events"}
              </h2>

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-sm">{lang === "ja" ? "予定なし" : lang === "ko" ? "예정 없음" : "No upcoming events"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const isRegistered = registeredIds.has(event.id);
                    return (
                      <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex">
                        <Link href={`/events/${event.id}`} className="shrink-0 w-24 sm:w-28">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={event.image_url} alt={eventTitle(event, lang)} className="h-full w-full object-cover" />
                        </Link>
                        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
                          <div>
                            <Link href={`/events/${event.id}`}>
                              <h3 className="text-sm font-bold text-gray-900 hover:text-primary transition-colors leading-snug line-clamp-2 mb-1">
                                {eventTitle(event, lang)}
                              </h3>
                            </Link>
                            <p className="text-xs text-gray-500">
                              🗓 {new Date(event.date + "T00:00:00").toLocaleDateString(localeStr, { month: "short", day: "numeric", weekday: "short" })}
                              {" · "}{event.time_start}{event.time_end ? `〜${event.time_end}` : "〜"}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">📍 {eventLocation(event, lang)}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            {event.capacity ? <p className="text-xs text-gray-400">{tr.going} / <span className="font-semibold text-gray-600">{event.capacity}{tr.spots}</span></p> : <span />}
                            {isRegistered ? (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">✓ {tr.reg_applied}</span>
                            ) : (
                              <button
                                onClick={() => handleRegister(event)}
                                disabled={applyingId === event.id}
                                className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                              >
                                {applyingId === event.id ? "..." : tr.reg_apply}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* PC Hover Popup — fixed, outside layout flow */}
        {hoverEvent && hoverPos && (
          <div
            className="hidden lg:block fixed z-50 w-[280px] bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden"
            style={{ top: hoverPos.top, left: hoverPos.left }}
            onMouseEnter={keepHover}
            onMouseLeave={clearHover}
          >
            <EventPopupCard event={hoverEvent} onClose={() => { setHoverEvent(null); setHoverPos(null); }} />
          </div>
        )}

      </main>
      <Footer />
    </>
  );
}
