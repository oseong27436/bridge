"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, Clock, Users, ChevronLeft } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { getEventById, eventTitle, eventDesc, eventLocation, type DbEvent } from "@/lib/db";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [event, setEvent] = useState<DbEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const localeStr = lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US";

  useEffect(() => {
    getEventById(id).then((data) => {
      if (!data) { router.replace("/events"); return; }
      setEvent(data);
      setLoading(false);
    });

    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase
        .from("bridge_registrations")
        .select("id, status")
        .eq("event_id", id)
        .eq("user_id", session.user.id)
        .neq("status", "cancelled")
        .maybeSingle();
      if (data) {
        setIsRegistered(true);
        setRegistrationId(data.id);
      }
    });
  }, [id, router]);

  async function handleRegister() {
    if (!userId) { router.push("/auth/login"); return; }
    setApplying(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("bridge_registrations")
      .insert({ event_id: id, user_id: userId, status: "pending" })
      .select("id")
      .single();
    if (data) { setRegistrationId(data.id); setIsRegistered(true); }
    setApplying(false);
  }

  async function handleCancel() {
    if (!registrationId) return;
    if (!confirm(tr.reg_cancel_confirm)) return;
    setCancelling(true);
    const supabase = createClient();
    await supabase.from("bridge_registrations").update({ status: "cancelled" }).eq("id", registrationId);
    setIsRegistered(false);
    setRegistrationId(null);
    setCancelling(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-64 sm:h-80 bg-gray-200 rounded-2xl" />
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) return null;

  const title = eventTitle(event, lang);
  const desc = eventDesc(event, lang);
  const location = eventLocation(event, lang);
  const dateStr = new Date(event.date + "T00:00:00").toLocaleDateString(localeStr, {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });
  const timeStr = event.time_end
    ? `${event.time_start} 〜 ${event.time_end}`
    : `${event.time_start} 〜`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          href="/events"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {lang === "ja" ? "イベント一覧" : lang === "ko" ? "이벤트 목록" : "All Events"}
        </Link>

        {/* Hero image */}
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-200 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.image_url} alt={title} className="w-full h-full object-cover" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-4">
          {/* Category badge */}
          <span className="inline-block rounded-full text-xs font-bold bg-orange-100 text-orange-600 px-3 py-1 mb-3">
            {tr[`cat_${event.category}` as keyof typeof tr] as string ?? event.category}
          </span>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-5 leading-snug">
            {title}
          </h1>

          {/* Meta info */}
          <div className="space-y-2.5 mb-6">
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>{timeStr}</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span>{location}</span>
                {event.location_url && (
                  <a
                    href={event.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-primary hover:underline text-xs"
                  >
                    {lang === "ja" ? "地図を見る" : lang === "ko" ? "지도 보기" : "View Map"}
                  </a>
                )}
              </div>
            </div>
            {event.capacity !== null && (
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span>
                  {lang === "ja" ? `定員 ${event.capacity}名` : lang === "ko" ? `정원 ${event.capacity}명` : `Capacity: ${event.capacity}`}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {desc && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{desc}</p>
            </div>
          )}
        </div>

        {/* Register CTA */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900">
              {isRegistered
                ? (lang === "ja" ? "参加申請済みです" : lang === "ko" ? "참가 신청 완료!" : "You're registered!")
                : (lang === "ja" ? "このイベントに参加しますか？" : lang === "ko" ? "이 이벤트에 참가하시겠습니까?" : "Want to join this event?")}
            </p>
            {isRegistered && (
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === "ja" ? "マイページで確認できます" : lang === "ko" ? "내 예약에서 확인할 수 있어요" : "Check My Reservations"}
              </p>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {isRegistered ? (
              <>
                <Link
                  href="/my/reservations"
                  className="flex-1 sm:flex-none rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white text-center hover:bg-primary/90 transition"
                >
                  {lang === "ja" ? "予約を確認" : lang === "ko" ? "예약 확인" : "View Reservation"}
                </Link>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 sm:flex-none rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50 transition"
                >
                  {cancelling ? "..." : tr.reg_cancel_registration}
                </button>
              </>
            ) : (
              <button
                onClick={handleRegister}
                disabled={applying}
                className="w-full sm:w-auto rounded-xl bg-primary px-8 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition"
              >
                {applying ? tr.reg_applying : tr.reg_apply}
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
