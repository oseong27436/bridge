"use client";

import { type DbReview } from "@/lib/db";

const NOTE_COLORS: Record<string, { bg: string; shadow: string }> = {
  yellow: { bg: "#FEF08A", shadow: "rgba(202,138,4,0.25)" },
  green:  { bg: "#BBF7D0", shadow: "rgba(22,163,74,0.2)" },
  pink:   { bg: "#FBCFE8", shadow: "rgba(219,39,119,0.2)" },
};

const BOARD_W = 1400;
const BOARD_H = 900;

interface NoteProps {
  review: DbReview;
  lang: string;
  onDelete?: (id: string) => void;
}

function Note({ review, lang, onDelete }: NoteProps) {
  const color = NOTE_COLORS[review.note_color] ?? NOTE_COLORS.yellow;
  const x = review.note_x ?? 100;
  const y = review.note_y ?? 100;

  const profile = review.profile as { name?: string; avatar_url?: string } | undefined;
  const event = review.event as { title_ko?: string; title_ja?: string; title_en?: string; date?: string } | undefined;
  const eventName = event ? (lang === "ko" ? event.title_ko : lang === "en" ? event.title_en : event.title_ja) : null;
  const date = new Date(review.created_at).toLocaleDateString(
    lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <div
      className="absolute group select-none"
      style={{ left: x, top: y, width: 180 }}
    >
      {/* Pin */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-5 h-5 rounded-full bg-gray-500 shadow-md border-2 border-gray-400 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-gray-300" />
      </div>

      {/* Note */}
      <div
        className="relative pt-4 px-3 pb-3 rounded-sm transition-all duration-200 ease-out cursor-default
          group-hover:-translate-y-2 group-hover:scale-105 group-hover:z-20
          group-hover:animate-wiggle"
        style={{
          backgroundColor: color.bg,
          boxShadow: `2px 4px 12px ${color.shadow}, 0 1px 3px rgba(0,0,0,0.1)`,
        }}
      >
        {/* Delete button (admin only) */}
        {onDelete && (
          <button
            onClick={() => onDelete(review.id)}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/20 hover:bg-red-400 hover:text-white text-gray-600 text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        )}

        {/* Profile + name */}
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-6 h-6 rounded-full bg-white/60 shrink-0 overflow-hidden flex items-center justify-center text-[9px] font-bold text-gray-500">
            {profile?.avatar_url
              /* eslint-disable-next-line @next/next/no-img-element */
              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              : profile?.name?.charAt(0) ?? "?"}
          </div>
          <span className="text-[11px] font-bold text-gray-700 truncate leading-none">{profile?.name ?? "—"}</span>
        </div>

        {/* Date */}
        <p className="text-[10px] text-gray-500 mb-1 leading-none">{date}</p>

        {/* Event name */}
        {eventName && (
          <p className="text-[10px] font-semibold text-gray-600 mb-2 line-clamp-1">{eventName}</p>
        )}

        {/* Review text */}
        {review.text && (
          <p className="text-xs text-gray-700 leading-relaxed line-clamp-5 mb-2 whitespace-pre-wrap">{review.text}</p>
        )}

        {/* Stars */}
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map((s) => (
            <span key={s} className={`text-xs ${s <= review.stars ? "text-yellow-500" : "text-gray-300"}`}>★</span>
          ))}
        </div>
      </div>
    </div>
  );
}

interface CorkBoardProps {
  reviews: DbReview[];
  lang: string;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}

export default function CorkBoard({ reviews, lang, onDelete, emptyMessage }: CorkBoardProps) {
  return (
    <div
      className="relative overflow-auto rounded-2xl"
      style={{ maxHeight: 520 }}
    >
      {/* Cork texture board */}
      <div
        className="relative"
        style={{
          width: BOARD_W,
          height: BOARD_H,
          backgroundColor: "#c19a6b",
          backgroundImage: `
            radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 70%, rgba(0,0,0,0.08) 0%, transparent 60%),
            url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.8' fill='rgba(0,0,0,0.06)'/%3E%3Ccircle cx='3' cy='3' r='0.6' fill='rgba(255,255,255,0.05)'/%3E%3C/svg%3E")
          `,
        }}
      >
        {reviews.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/60 text-sm font-medium">{emptyMessage ?? "No reviews yet"}</p>
          </div>
        ) : (
          reviews.map((r) => (
            <Note key={r.id} review={r} lang={lang} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}
