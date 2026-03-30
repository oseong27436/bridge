"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, Clock, Users, ChevronLeft, Banknote, CheckCircle2, AlertCircle, Star } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { getEventById, getEventImages, getEventReviews, eventTitle, eventDesc, eventLocation, type DbEvent, type DbEventImage, type DbReview } from "@/lib/db";
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
  const [regStatus, setRegStatus] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [eventImages, setEventImages] = useState<DbEventImage[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Reviews
  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [eventStars, setEventStars] = useState(0);
  const [eventText, setEventText] = useState("");
  const [hostStars, setHostStars] = useState(0);
  const [hostText, setHostText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const localeStr = lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US";

  useEffect(() => {
    getEventById(id).then((data) => {
      if (!data) { router.replace("/events"); return; }
      setEvent(data);
      setLoading(false);
    });
    getEventReviews(id).then(setReviews);
    getEventImages(id).then(setEventImages);

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
        setRegStatus(data.status);
        // Check if already reviewed
        const { data: existing } = await supabase
          .from("bridge_reviews")
          .select("id")
          .eq("event_id", id)
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (existing) setHasReviewed(true);
      }
    });
  }, [id, router]);

  async function handleRegister() {
    if (!userId) { router.push("/auth/login"); return; }
    setApplying(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bridge_registrations")
      .upsert(
        { event_id: id, user_id: userId, status: "pending" },
        { onConflict: "event_id,user_id" }
      )
      .select("id")
      .single();
    if (data && !error) {
      setRegistrationId(data.id);
      setIsRegistered(true);
      setRegStatus("pending");
    }
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
    setRegStatus(null);
    setCancelling(false);
  }

  async function handleSubmitReview() {
    if (!userId || !event || eventStars === 0 || hostStars === 0) return;
    setSubmittingReview(true);
    const supabase = createClient();
    await supabase.from("bridge_reviews").insert({
      event_id: id, user_id: userId, stars: eventStars, text: eventText || null,
    });
    if (event.host_id) {
      await supabase.from("bridge_host_reviews").insert({
        host_id: event.host_id, user_id: userId, event_id: id, stars: hostStars, text: hostText || null,
      });
      // Update host stars/review_count
      const { data: hostReviews } = await supabase
        .from("bridge_host_reviews").select("stars").eq("host_id", event.host_id);
      if (hostReviews?.length) {
        const avg = hostReviews.reduce((s: number, r: { stars: number }) => s + r.stars, 0) / hostReviews.length;
        await supabase.from("bridge_hosts").update({
          stars: Math.round(avg * 10) / 10,
          review_count: hostReviews.length,
        }).eq("id", event.host_id);
      }
    }
    setHasReviewed(true);
    setReviewDone(true);
    setSubmittingReview(false);
    getEventReviews(id).then(setReviews);
  }

  function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
      <div className="flex gap-1">
        {[1,2,3,4,5].map((s) => (
          <button key={s} type="button" onClick={() => onChange(s)}
            className={`transition-colors ${s <= value ? "text-yellow-400" : "text-gray-300"}`}>
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
      </div>
    );
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
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-200 mb-3 cursor-pointer" onClick={() => setLightboxImg(event.image_url)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.image_url} alt={title} className="w-full h-full object-cover" />
        </div>

        {/* Additional images */}
        {eventImages.filter((img) => img.image_url !== event.image_url).length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {eventImages.filter((img) => img.image_url !== event.image_url).map((img) => (
              <div key={img.id} className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLightboxImg(img.image_url)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightboxImg && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightboxImg} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          </div>
        )}

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
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <Banknote className="h-4 w-4 text-primary shrink-0" />
              {event.fee_type === "free" && (
                <span className="text-green-600">{tr.fee_free}</span>
              )}
              {event.fee_type === "tba" && (
                <span className="text-gray-400">{tr.fee_tba}</span>
              )}
              {event.fee_type === "paid" && (
                <span className="text-gray-800">
                  {event.fee_amount != null ? `¥${event.fee_amount.toLocaleString()}` : tr.fee_tba}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {desc && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{desc}</p>
            </div>
          )}
        </div>

        {/* Register CTA */}
        <div className={`rounded-2xl border-2 p-6 ${isRegistered ? "bg-green-50 border-green-200" : "bg-white border-primary/20"}`}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            {isRegistered
              ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              : <AlertCircle className="h-5 w-5 text-primary shrink-0" />
            }
            <h2 className="font-extrabold text-gray-900 text-base">
              {isRegistered ? tr.reg_cta_registered : tr.reg_cta_title}
            </h2>
          </div>

          {/* Event summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 space-y-2">
            <p className="font-bold text-gray-900 text-sm leading-snug">{title}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-primary" />
                {timeStr}
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Banknote className="h-3 w-3 text-primary" />
                {event.fee_type === "free"
                  ? <span className="text-green-600">{tr.fee_free}</span>
                  : event.fee_type === "tba"
                    ? <span className="text-gray-400">{tr.fee_tba}</span>
                    : <span className="text-gray-800">{event.fee_amount != null ? `¥${event.fee_amount.toLocaleString()}` : tr.fee_tba}</span>
                }
              </span>
            </div>
          </div>

          {/* Status / note */}
          {isRegistered ? (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">
                {lang === "ja" ? "申し込み状況" : lang === "ko" ? "신청 상태" : "Status"}
              </p>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                regStatus === "approved" ? "bg-green-100 text-green-700"
                : regStatus === "rejected" ? "bg-red-100 text-red-600"
                : "bg-yellow-100 text-yellow-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  regStatus === "approved" ? "bg-green-500"
                  : regStatus === "rejected" ? "bg-red-500"
                  : "bg-yellow-500"
                }`} />
                {regStatus === "approved" ? tr.reg_status_approved
                 : regStatus === "rejected" ? tr.reg_status_rejected
                 : tr.reg_status_pending}
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-4">{tr.reg_note}</p>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {isRegistered ? (
              <>
                <Link
                  href="/my/reservations"
                  className="flex-1 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white text-center hover:bg-primary/90 transition"
                >
                  {lang === "ja" ? "予約内容を確認する" : lang === "ko" ? "예약 내역 확인하기" : "View My Reservation"}
                </Link>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 sm:flex-none rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-50 disabled:opacity-50 transition"
                >
                  {cancelling ? "..." : tr.reg_cancel_registration}
                </button>
              </>
            ) : (
              <button
                onClick={handleRegister}
                disabled={applying}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition"
              >
                {applying ? tr.reg_applying : `${tr.reg_apply} →`}
              </button>
            )}
          </div>
        </div>
        {/* Review Form — approved users who haven't reviewed yet */}
        {regStatus === "approved" && !hasReviewed && (
          <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-extrabold text-gray-900 mb-4">{tr.review_write}</h3>
            {reviewDone ? (
              <p className="text-green-600 font-semibold text-sm">{tr.review_submitted}</p>
            ) : (
              <div className="space-y-5">
                {/* Event review */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{tr.review_event_title}</p>
                  <StarPicker value={eventStars} onChange={setEventStars} />
                  <textarea
                    rows={2}
                    value={eventText}
                    onChange={(e) => setEventText(e.target.value)}
                    placeholder={tr.review_placeholder}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
                {/* Host review */}
                {event.host_id && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{tr.review_host_title}</p>
                    <StarPicker value={hostStars} onChange={setHostStars} />
                    <textarea
                      rows={2}
                      value={hostText}
                      onChange={(e) => setHostText(e.target.value)}
                      placeholder={tr.review_placeholder}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>
                )}
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || eventStars === 0 || (!!event.host_id && hostStars === 0)}
                  className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  {submittingReview ? "..." : tr.review_submit}
                </button>
              </div>
            )}
          </div>
        )}
        {hasReviewed && !reviewDone && (
          <p className="mt-3 text-center text-xs text-gray-400">{tr.review_already}</p>
        )}

        {/* Reviews list */}
        {reviews.length > 0 && (
          <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-extrabold text-gray-900 mb-4">{tr.review_list_title} ({reviews.length})</h3>
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 overflow-hidden">
                    {(r.profile as { name?: string; avatar_url?: string } | undefined)?.avatar_url
                      ? <img src={(r.profile as { name?: string; avatar_url?: string }).avatar_url!} alt="" className="w-full h-full object-cover" />
                      : (r.profile as { name?: string; avatar_url?: string } | undefined)?.name?.charAt(0) ?? "?"
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">
                        {(r.profile as { name?: string } | undefined)?.name ?? lang === "ja" ? "匿名" : lang === "en" ? "Anonymous" : "익명"}
                      </span>
                      <div className="flex">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`h-3 w-3 fill-current ${s <= r.stars ? "text-yellow-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    {r.text && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.text}</p>}
                    <p className="text-[10px] text-gray-300 mt-0.5">
                      {new Date(r.created_at).toLocaleDateString(localeStr)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
