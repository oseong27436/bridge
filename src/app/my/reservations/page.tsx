"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase";
import { getUserRegistrations, eventTitle, eventLocation, type DbRegistration } from "@/lib/db";

type RegistrationStatus = "pending" | "confirmed" | "cancelled" | "attended";

const STATUS_COLORS: Record<RegistrationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  attended: "bg-blue-100 text-blue-700",
};

export default function ReservationsPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [user, setUser] = useState<User | null>(null);
  const [registrations, setRegistrations] = useState<DbRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const localeStr =
    lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : lang === "zh" ? "zh-CN" : "en-US";

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }
      setUser(session.user);

      const regs = await getUserRegistrations(session.user.id);
      setRegistrations(regs);
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleCancel(id: string) {
    if (!confirm(tr.reg_cancel_confirm)) return;

    setCancellingId(id);
    const supabase = createClient();
    await supabase
      .from("bridge_registrations")
      .update({ status: "cancelled" })
      .eq("id", id);

    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r))
    );
    setCancellingId(null);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <Link
            href="/my/profile"
            className="rounded-full px-5 py-2 text-sm font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-100 transition"
          >
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
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-4 animate-pulse"
              >
                <div className="rounded-xl bg-gray-200 shrink-0" style={{ width: 72, height: 72 }} />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-gray-500 mb-6">{tr.no_reservations}</p>
            <Link
              href="/events"
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition"
            >
              {tr.nav_events}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg) => {
              const event = reg.event;
              if (!event) return null;

              const status = reg.status as RegistrationStatus;
              const statusColor = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-500";
              const statusLabel =
                status === "pending"
                  ? tr.reg_status_pending
                  : status === "confirmed"
                  ? tr.reg_status_confirmed
                  : status === "cancelled"
                  ? tr.reg_status_cancelled
                  : status === "attended"
                  ? tr.reg_status_attended
                  : status;

              const canCancel = status === "pending" || status === "confirmed";

              return (
                <div
                  key={reg.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-4"
                >
                  {/* Event image */}
                  <img
                    src={event.image_url}
                    alt={eventTitle(event, lang)}
                    className="rounded-xl object-cover shrink-0"
                    style={{ width: 72, height: 72 }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-sm leading-snug line-clamp-2">
                        {eventTitle(event, lang)}
                      </p>
                      <span
                        className={`shrink-0 rounded-full text-[10px] font-bold px-2 py-0.5 ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mb-0.5">
                      {new Date(event.date + "T00:00:00").toLocaleDateString(localeStr, {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })}
                      {event.time_start ? ` · ${event.time_start}` : ""}
                    </p>

                    <p className="text-xs text-gray-400">📍 {eventLocation(event, lang)}</p>

                    {canCancel && (
                      <button
                        onClick={() => handleCancel(reg.id)}
                        disabled={cancellingId === reg.id}
                        className="mt-2 text-xs text-red-400 hover:underline disabled:opacity-50"
                      >
                        {cancellingId === reg.id ? "..." : tr.reg_cancel_registration}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
