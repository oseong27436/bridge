"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { Star, ImagePlus, X } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase";
import { getUserRegistrations, eventTitle, eventLocation, type DbRegistration } from "@/lib/db";

type RegistrationStatus = "pending" | "approved" | "confirmed" | "cancelled" | "attended";

const STATUS_COLORS: Record<RegistrationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  attended: "bg-blue-100 text-blue-700",
};

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}
          className={`transition-colors ${s <= value ? "text-yellow-400" : "text-gray-300"}`}>
          <Star className="h-6 w-6 fill-current" />
        </button>
      ))}
    </div>
  );
}

interface ReviewFormState {
  eventStars: number;
  eventText: string;
  hostStars: number;
  hostText: string;
  images: string[]; // public URLs
  uploading: boolean;
  submitting: boolean;
  done: boolean;
}

export default function ReservationsPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [user, setUser] = useState<User | null>(null);
  const [registrations, setRegistrations] = useState<DbRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // reviewed event ids
  const [reviewedEventIds, setReviewedEventIds] = useState<Set<string>>(new Set());

  // review forms per event_id
  const [reviewForms, setReviewForms] = useState<Record<string, ReviewFormState>>({});

  // open review form for which event
  const [openReviewId, setOpenReviewId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const localeStr = lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setUser(session.user);

      const regs = await getUserRegistrations(session.user.id);
      setRegistrations(regs);

      // fetch which events already reviewed
      const { data: myReviews } = await supabase
        .from("bridge_reviews")
        .select("event_id")
        .eq("user_id", session.user.id);
      if (myReviews) {
        setReviewedEventIds(new Set(myReviews.map((r: { event_id: string }) => r.event_id)));
      }

      setLoading(false);
    }
    init();
  }, [router]);

  function getForm(eventId: string): ReviewFormState {
    return reviewForms[eventId] ?? {
      eventStars: 0, eventText: "", hostStars: 0, hostText: "",
      images: [], uploading: false, submitting: false, done: false,
    };
  }

  function setForm(eventId: string, patch: Partial<ReviewFormState>) {
    setReviewForms((prev) => ({
      ...prev,
      [eventId]: { ...getForm(eventId), ...patch },
    }));
  }

  async function handleUploadImage(eventId: string, file: File) {
    setForm(eventId, { uploading: true });
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `reviews/${eventId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("bridge-images").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("bridge-images").getPublicUrl(path);
      const form = getForm(eventId);
      setForm(eventId, { images: [...form.images, data.publicUrl], uploading: false });
    } else {
      setForm(eventId, { uploading: false });
    }
  }

  function removeImage(eventId: string, url: string) {
    const form = getForm(eventId);
    setForm(eventId, { images: form.images.filter((u) => u !== url) });
  }

  async function handleSubmitReview(reg: DbRegistration) {
    const event = reg.event;
    if (!event || !user) return;
    const form = getForm(reg.event_id);
    if (form.eventStars === 0) return;
    setForm(reg.event_id, { submitting: true });

    const supabase = createClient();
    await supabase.from("bridge_reviews").insert({
      event_id: reg.event_id,
      user_id: user.id,
      stars: form.eventStars,
      text: form.eventText || null,
      image_urls: form.images,
    });

    if (event.host_id && form.hostStars > 0) {
      await supabase.from("bridge_host_reviews").insert({
        host_id: event.host_id, user_id: user.id, event_id: reg.event_id,
        stars: form.hostStars, text: form.hostText || null,
      });
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

    setReviewedEventIds((prev) => new Set([...prev, reg.event_id]));
    setForm(reg.event_id, { submitting: false, done: true });
    setOpenReviewId(null);
  }

  async function handleCancel(id: string) {
    if (!confirm(tr.reg_cancel_confirm)) return;
    setCancellingId(id);
    const supabase = createClient();
    await supabase.from("bridge_registrations").update({ status: "cancelled" }).eq("id", id);
    setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
    setCancellingId(null);
  }

  const activeRegs = registrations.filter((r) => {
    if (r.status === "cancelled") return false;
    return r.event?.status !== "finished";
  });

  const pastApprovedRegs = registrations.filter((r) => {
    if (r.status !== "approved" && r.status !== "attended") return false;
    return r.event?.status === "finished";
  });

  const statusLabel = (status: string) => {
    if (status === "pending") return tr.reg_status_pending;
    if (status === "approved" || status === "confirmed") return tr.reg_status_approved;
    if (status === "cancelled") return tr.reg_status_cancelled;
    if (status === "attended") return tr.reg_status_attended;
    return status;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <Link href="/my/profile"
            className="rounded-full px-5 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-100 transition">
            {tr.nav_my_profile}
          </Link>
          <span className="rounded-full px-5 py-2 text-sm font-bold bg-primary text-white">
            {tr.nav_my_reservations}
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-6">{tr.nav_my_reservations}</h1>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-4 animate-pulse">
                <div className="rounded-xl bg-gray-200 shrink-0" style={{ width: 72, height: 72 }} />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : registrations.filter(r => r.status !== "cancelled").length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-gray-500 mb-6">{tr.no_reservations}</p>
            <Link href="/events" className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition">
              {tr.nav_events}
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active registrations */}
            {activeRegs.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                  {lang === "ja" ? "申し込み中" : lang === "ko" ? "신청 중" : "Upcoming"}
                </h2>
                <div className="space-y-3">
                  {activeRegs.map((reg) => {
                    const event = reg.event;
                    if (!event) return null;
                    const status = reg.status as RegistrationStatus;
                    const canCancel = status === "pending" || status === "approved" || status === "confirmed";
                    return (
                      <div key={reg.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={event.image_url} alt={eventTitle(event, lang)}
                          className="rounded-xl object-cover shrink-0" style={{ width: 72, height: 72 }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <Link href={`/events/${event.id}`} className="font-bold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
                              {eventTitle(event, lang)}
                            </Link>
                            <span className={`shrink-0 rounded-full text-[10px] font-bold px-2 py-0.5 ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-500"}`}>
                              {statusLabel(status)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-0.5">
                            {new Date(event.date + "T00:00:00").toLocaleDateString(localeStr, { month: "long", day: "numeric", weekday: "short" })}
                            {event.time_start ? ` · ${event.time_start}` : ""}
                          </p>
                          <p className="text-xs text-gray-400">📍 {eventLocation(event, lang)}</p>
                          {canCancel && (
                            <button onClick={() => handleCancel(reg.id)} disabled={cancellingId === reg.id}
                              className="mt-2 text-xs text-red-400 hover:underline disabled:opacity-50">
                              {cancellingId === reg.id ? "..." : tr.reg_cancel_registration}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past approved events */}
            {pastApprovedRegs.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                  {lang === "ja" ? "参加済みのイベント" : lang === "ko" ? "참가한 이벤트" : "Past Events"}
                </h2>
                <div className="space-y-3">
                  {pastApprovedRegs.map((reg) => {
                    const event = reg.event;
                    if (!event) return null;
                    const alreadyReviewed = reviewedEventIds.has(reg.event_id);
                    const form = getForm(reg.event_id);
                    const isOpen = openReviewId === reg.event_id;

                    return (
                      <div key={reg.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="p-4 flex gap-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={event.image_url} alt={eventTitle(event, lang)}
                            className="rounded-xl object-cover shrink-0" style={{ width: 72, height: 72 }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <Link href={`/events/${event.id}`} className="font-bold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
                                {eventTitle(event, lang)}
                              </Link>
                              <span className="shrink-0 rounded-full text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700">
                                {lang === "ja" ? "参加済み" : lang === "ko" ? "참가 완료" : "Attended"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-0.5">
                              {new Date(event.date + "T00:00:00").toLocaleDateString(localeStr, { month: "long", day: "numeric", weekday: "short" })}
                            </p>
                            <p className="text-xs text-gray-400">📍 {eventLocation(event, lang)}</p>
                          </div>
                        </div>

                        {/* Review CTA / form */}
                        {alreadyReviewed ? (
                          <div className="px-4 pb-4">
                            <p className="text-xs text-gray-400">{tr.review_already}</p>
                          </div>
                        ) : form.done ? (
                          <div className="px-4 pb-4">
                            <p className="text-xs font-semibold text-green-600">{tr.review_submitted}</p>
                          </div>
                        ) : isOpen ? (
                          <div className="border-t border-gray-100 p-4 space-y-4">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-sm font-extrabold text-gray-900">{tr.review_write}</h3>
                              <button onClick={() => setOpenReviewId(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Event stars */}
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{tr.review_event_title}</p>
                              <StarPicker value={form.eventStars} onChange={(v) => setForm(reg.event_id, { eventStars: v })} />
                              <textarea rows={2} value={form.eventText}
                                onChange={(e) => setForm(reg.event_id, { eventText: e.target.value })}
                                placeholder={tr.review_placeholder}
                                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
                            </div>

                            {/* Host stars */}
                            {event.host_id && (
                              <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{tr.review_host_title}</p>
                                <StarPicker value={form.hostStars} onChange={(v) => setForm(reg.event_id, { hostStars: v })} />
                                <textarea rows={2} value={form.hostText}
                                  onChange={(e) => setForm(reg.event_id, { hostText: e.target.value })}
                                  placeholder={tr.review_placeholder}
                                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
                              </div>
                            )}

                            {/* Image upload */}
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                {lang === "ja" ? "写真を追加" : lang === "ko" ? "사진 추가" : "Add Photos"}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {form.images.map((url) => (
                                  <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button onClick={() => removeImage(reg.event_id, url)}
                                      className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                                {form.images.length < 5 && (
                                  <button
                                    onClick={() => {
                                      setOpenReviewId(reg.event_id);
                                      fileInputRef.current?.click();
                                      fileInputRef.current?.setAttribute("data-event-id", reg.event_id);
                                    }}
                                    disabled={form.uploading}
                                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
                                    <ImagePlus className="h-5 w-5" />
                                    <span className="text-[10px]">{form.uploading ? "..." : lang === "ko" ? "추가" : "Add"}</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleSubmitReview(reg)}
                              disabled={form.submitting || form.eventStars === 0}
                              className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition">
                              {form.submitting ? "..." : tr.review_submit}
                            </button>
                          </div>
                        ) : (
                          <div className="px-4 pb-4">
                            <button
                              onClick={() => setOpenReviewId(reg.event_id)}
                              className="w-full rounded-xl border border-primary text-primary py-2 text-sm font-bold hover:bg-primary/5 transition">
                              {lang === "ja" ? "レビューを書く ✍️" : lang === "ko" ? "리뷰 작성하기 ✍️" : "Write a Review ✍️"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const eventId = fileInputRef.current?.getAttribute("data-event-id");
            const file = e.target.files?.[0];
            if (file && eventId) handleUploadImage(eventId, file);
            e.target.value = "";
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
