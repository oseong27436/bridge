"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase";
import { MOCK_EVENTS } from "@/lib/mock-data";

export default function ReservationsPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const tr = translations[lang];
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/auth/login");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sampleEvents = MOCK_EVENTS.slice(0, 2);
  const isEmpty = false; // mock 데이터 사용 중 - 실제 구현 시 registrations 조회로 교체

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-10">
        {/* 탭 / 사이드바 */}
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

        {isEmpty ? (
          /* 빈 상태 */
          <div className="rounded-2xl border border-gray-200 bg-white p-12 flex flex-col items-center gap-4 text-center">
            <p className="text-gray-500 text-base">
              {lang === "ja"
                ? "まだ参加申請したイベントはありません"
                : lang === "ko"
                ? "아직 참가 신청한 이벤트가 없어요"
                : "You haven't registered for any events yet."}
            </p>
            <Link
              href="/events"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white"
            >
              {tr.nav_events}
            </Link>
          </div>
        ) : (
          /* 더미 카드 목록 */
          <div className="grid gap-4 sm:grid-cols-2">
            {sampleEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 flex gap-4"
              >
                <img
                  src={event.imageUrl}
                  alt={event.title[lang]}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="rounded-full text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 self-start">
                    {event.category}
                  </span>
                  <p className="font-bold text-sm leading-snug line-clamp-2">
                    {event.title[lang]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {event.date} {event.timeStart && `· ${event.timeStart}`}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{event.location[lang]}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
