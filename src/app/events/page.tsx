"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, Banknote } from "lucide-react";
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
  const [lineUserId, setLineUserId] = useState<string | null | undefined>(undefined); // undefined=loading
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // Selected date — drives both PC right panel and mobile popup
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    getEvents().then((data) => { setEvents(data); setLoading(false); });
    getSettings().then((cfg) => { if (cfg.events_image) setEventsImage(cfg.events_image); });
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLineUserId(null); return; }
      setUserId(session.user.id);
      const [{ data: regs }, { data: profile }] = await Promise.all([
        supabase.from("bridge_registrations").select("event_id, status").eq("user_id", session.user.id).neq("status", "cancelled"),
        supabase.from("bridge_profiles").select("line_user_id").eq("id", session.user.id).single(),
      ]);
      setRegisteredIds(new Set((regs ?? []).map((r: { event_id: string }) => r.event_id)));
      setLineUserId(profile?.line_user_id ?? null);
    });
  }, []);

  async function handleRegister(event: DbEvent) {
    if (!userId) { window.location.href = "/auth/login"; return; }
    if (registeredIds.has(event.id)) return;
    setApplyingId(event.id);
    const status = event.approval_required ? "pending" : "confirmed";
    await createClient().from("bridge_registrations").insert({
      event_id: event.id, user_id: userId, status,
    });

    // 자유참가: 신청 완료 + 승인 알림 즉시 발송
    if (!event.approval_required) {
      const title = lang === "ko" ? event.title_ko : lang === "en" ? event.title_en : event.title_ja;
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId,
          action: "applied",
          eventTitle: title,
          lang,
        }),
      });
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId,
          action: "approved",
          eventTitle: title,
          openChatUrl: (event as DbEvent & { open_chat_url?: string }).open_chat_url ?? null,
          lang,
        }),
      });
    }

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

  const selectedEvent = selectedDate ? (eventsByDate[selectedDate]?.[0] ?? null) : null;
  const selectedHasEvent = selectedDate ? (eventsByDate[selectedDate]?.length ?? 0) > 0 : false;

  const calendarDays = getCalendarDays(calYear, calMonth);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1);
    setSelectedDate(null); setShowRegForm(false);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1);
    setSelectedDate(null); setShowRegForm(false);
  }

  const months = tr.months as unknown as string[];
  const days   = tr.days   as unknown as string[];

  // Right panel / mobile popup content
  function EventPanel({ event }: { event: DbEvent }) {
    const isRegistered = registeredIds.has(event.id);
    const isApplying = applyingId === event.id;
    return (
      <div className="flex flex-col h-full">
        {/* Image */}
        <div className="relative h-44 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.image_url} alt={eventTitle(event, lang)} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4">
            <h3 className="text-base font-extrabold text-white leading-snug line-clamp-2">
              {eventTitle(event, lang)}
            </h3>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-2.5 text-sm text-gray-600 border-b border-gray-100">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span>
              {new Date(event.date + "T00:00:00").toLocaleDateString(localeStr, { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
              <br />
              {event.time_start}{event.time_end ? `〜${event.time_end}` : "〜"}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span>{eventLocation(event, lang)}</span>
          </div>
          {event.capacity && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{tr.going} / {event.capacity}{tr.spots}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-gray-400 shrink-0" />
            <span>
              {event.fee_type === "free"
                ? (lang === "ja" ? "無料" : lang === "ko" ? "무료" : "Free")
                : event.fee_type === "tba"
                  ? (lang === "ja" ? "後日公開" : lang === "ko" ? "추후 공개" : "TBA")
                  : `¥${event.fee_amount?.toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 mt-auto">
          {/* LINE 친구 미등록 시 */}
          {userId && lineUserId === null && !isRegistered && (
            <div className="mb-3 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 text-xs text-green-700 text-center">
              {lang === "ja"
                ? <>イベント参加にはLINE友達登録が必要です。<br /><a href="/my/profile" className="underline font-semibold">プロフィールで設定 →</a></>
                : lang === "ko"
                  ? <>이벤트 신청은 LINE 친구 등록이 필요합니다.<br /><a href="/my/profile" className="underline font-semibold">프로필에서 설정하기 →</a></>
                  : <>LINE friend registration required to apply.<br /><a href="/my/profile" className="underline font-semibold">Set up in profile →</a></>}
            </div>
          )}
          {!showRegForm ? (
            <div className="flex gap-2">
              <Link
                href={`/events/${event.id}`}
                className="flex-1 text-center rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:border-primary hover:text-primary transition-colors"
              >
                {lang === "ja" ? "詳細を見る" : lang === "ko" ? "자세히 보기" : "Details"}
              </Link>
              {isRegistered ? (
                <span className="flex-1 text-center rounded-xl bg-green-100 py-2.5 text-sm font-bold text-green-700">✓ {tr.reg_applied}</span>
              ) : (
                <button
                  onClick={() => {
                    if (!userId) { window.location.href = "/auth/login"; return; }
                    if (!lineUserId) return;
                    setShowRegForm(true);
                  }}
                  disabled={userId !== null && lineUserId === null}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {tr.reg_apply}
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs text-gray-500 mb-4">
                {event.approval_required
                  ? (lang === "ja" ? "申し込みを確認後、承認メールをお送りします。" : lang === "ko" ? "검토 후 승인 메일을 보내드립니다." : "We'll review and send a confirmation.")
                  : (lang === "ja" ? "申し込み後、即時参加確定です。" : lang === "ko" ? "신청 즉시 참가 확정됩니다." : "Your spot is confirmed immediately.")}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowRegForm(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors">
                  {lang === "ja" ? "戻る" : lang === "ko" ? "취소" : "Back"}
                </button>
                <button onClick={() => handleRegister(event)} disabled={isApplying} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors">
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

            {/* ── LEFT: Calendar (PC main, Mobile top) ── */}
            <div className="lg:w-[520px] xl:w-[580px] shrink-0">
              <div className="lg:sticky lg:top-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

                  {/* Month nav */}
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-gray-900">{months[calMonth]} {calYear}</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); setSelectedDate(null); }}
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
                  <div className="grid grid-cols-7 gap-1.5">
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
                      const isSelected = selectedDate === dateStr;

                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedDate(prev => prev === dateStr ? null : dateStr);
                            setShowRegForm(false);
                          }}
                          className={`
                            aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer
                            ${isSelected
                              ? hasEvent
                                ? "bg-primary text-white shadow-lg scale-110 ring-2 ring-primary/30"
                                : "bg-gray-100 text-gray-600 scale-105 ring-2 ring-gray-200"
                              : hasEvent
                                ? "bg-primary/20 text-primary border-2 border-primary/40 hover:bg-primary hover:text-white hover:scale-110 hover:shadow-md"
                                : isToday
                                  ? "ring-2 ring-primary text-primary hover:bg-gray-50"
                                  : "text-gray-500 hover:bg-gray-50"
                            }
                          `}
                        >
                          {cell.day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile: selected date panel — below calendar */}
                {selectedDate && (
                  <div className="lg:hidden mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {selectedHasEvent && selectedEvent ? (
                      <EventPanel event={selectedEvent} />
                    ) : (
                      <div className="p-6 text-center text-gray-400">
                        <p className="text-2xl mb-2">📭</p>
                        <p className="text-sm">{lang === "ja" ? "この日はイベントなし" : lang === "ko" ? "이 날은 이벤트가 없어요" : "No events on this day"}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Panel (PC only) ── */}
            <div className="hidden lg:flex flex-col flex-1 min-w-0">
              <div className="lg:sticky lg:top-6 flex flex-col gap-4">

                {/* Event detail panel — shown on hover/select */}
                {selectedDate ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {selectedHasEvent && selectedEvent ? (
                      <EventPanel event={selectedEvent} />
                    ) : (
                      <div className="p-10 text-center text-gray-400">
                        <p className="text-3xl mb-3">📭</p>
                        <p className="text-sm font-medium">{lang === "ja" ? "この日はイベントなし" : lang === "ko" ? "이 날은 이벤트가 없어요" : "No events on this day"}</p>
                        <p className="text-xs text-gray-300 mt-1">
                          {new Date(selectedDate + "T00:00:00").toLocaleDateString(localeStr, { month: "long", day: "numeric", weekday: "long" })}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Default: upcoming list */
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
                      {lang === "ja" ? "開催予定" : lang === "ko" ? "예정된 이벤트" : "Upcoming Events"}
                    </h2>
                    {loading ? (
                      <div className="space-y-3">
                        {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
                      </div>
                    ) : upcomingEvents.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <div className="text-3xl mb-2">📅</div>
                        <p className="text-sm">{lang === "ja" ? "予定なし" : lang === "ko" ? "예정 없음" : "No upcoming events"}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {upcomingEvents.map((event) => (
                          <Link
                            key={event.id}
                            href={`/events/${event.id}`}
                            className="flex gap-3 items-center p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={event.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors truncate">
                                {eventTitle(event, lang)}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(event.date + "T00:00:00").toLocaleDateString(localeStr, { month: "short", day: "numeric", weekday: "short" })}
                                {" · "}{event.time_start}
                              </p>
                            </div>
                            <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180 shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Hint text */}
                {!selectedDate && (
                  <p className="text-xs text-center text-gray-300">
                    {lang === "ja" ? "カレンダーの日付をクリックすると詳細が表示されます" : lang === "ko" ? "달력의 날짜를 클릭해 이벤트를 확인하세요" : "Click a date to see event details"}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile: upcoming list below calendar */}
            <div className="lg:hidden">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
                {lang === "ja" ? "開催予定" : lang === "ko" ? "예정된 이벤트" : "Upcoming Events"}
              </h2>
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex gap-3 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={event.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors truncate">
                        {eventTitle(event, lang)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(event.date + "T00:00:00").toLocaleDateString(localeStr, { month: "short", day: "numeric", weekday: "short" })}
                        {" · "}{event.time_start}
                      </p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
