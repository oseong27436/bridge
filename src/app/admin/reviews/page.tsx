"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getAllReviews, type DbReview } from "@/lib/db";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import CorkBoard from "@/components/cork-board";

export default function AdminReviewsPage() {
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await getAllReviews();
    setReviews(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm(lang === "ja" ? "削除しますか？" : lang === "en" ? "Delete?" : "삭제하시겠습니까?")) return;
    await createClient().from("bridge_reviews").delete().eq("id", id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{tr.admin_reviews}</h1>
        <span className="text-sm text-gray-400">{reviews.length}{lang === "ko" ? "개" : lang === "ja" ? "件" : ""}</span>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-[#c19a6b]/30 animate-pulse" />
      ) : (
        <CorkBoard
          reviews={reviews}
          lang={lang}
          onDelete={handleDelete}
          emptyMessage={lang === "ja" ? "まだレビューはありません" : lang === "ko" ? "아직 등록된 리뷰가 없어요" : "No reviews yet"}
        />
      )}
    </div>
  );
}
