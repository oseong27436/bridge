"use client";

import { useRef, useState, useEffect } from "react";
import { type DbReview } from "@/lib/db";

const NOTE_COLORS: Record<string, { bg: string; shadow: string }> = {
  yellow: { bg: "#FEF08A", shadow: "rgba(202,138,4,0.25)" },
  green:  { bg: "#BBF7D0", shadow: "rgba(22,163,74,0.2)" },
  pink:   { bg: "#FBCFE8", shadow: "rgba(219,39,119,0.2)" },
};

const BOARD_W = 2800;
const BOARD_H = 1800;
const MINIMAP_W = 160;
const MINIMAP_H = Math.round((BOARD_H / BOARD_W) * MINIMAP_W);
const MIN_SCALE = 0.15;
const MAX_SCALE = 3;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function clampView(tx: number, ty: number, scale: number, cw: number, ch: number) {
  const pad = 60;
  return {
    tx: clamp(tx, -(BOARD_W * scale - pad), cw - pad),
    ty: clamp(ty, -(BOARD_H * scale - pad), ch - pad),
  };
}

function touchDist(a: Touch, b: Touch) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

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
  const eventName = event
    ? (lang === "ko" ? event.title_ko : lang === "en" ? event.title_en : event.title_ja)
    : null;
  const date = event?.date
    ? new Date(event.date + "T00:00:00").toLocaleDateString(
        lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US",
        { year: "numeric", month: "short", day: "numeric" }
      )
    : new Date(review.created_at).toLocaleDateString(
        lang === "ja" ? "ja-JP" : lang === "ko" ? "ko-KR" : "en-US",
        { year: "numeric", month: "short", day: "numeric" }
      );

  return (
    <div className="absolute group select-none" style={{ left: x, top: y, width: 180 }}>
      <div className="relative transition-all duration-200 ease-out group-hover:-translate-y-2 group-hover:scale-105 group-hover:z-20 group-hover:animate-wiggle">
        {/* Pin */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-5 h-5 rounded-full bg-gray-500 shadow-md border-2 border-gray-400 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        </div>
        {/* Note */}
        <div
          className="relative pt-4 px-3 pb-3 rounded-sm cursor-default"
          style={{
            backgroundColor: color.bg,
            boxShadow: `2px 4px 12px ${color.shadow}, 0 1px 3px rgba(0,0,0,0.1)`,
          }}
        >
          {onDelete && (
            <button
              onClick={() => onDelete(review.id)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/20 hover:bg-red-400 hover:text-white text-gray-600 text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >×</button>
          )}
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 rounded-full bg-white/60 shrink-0 overflow-hidden flex items-center justify-center text-[9px] font-bold text-gray-500">
              {profile?.avatar_url
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : profile?.name?.charAt(0) ?? "?"}
            </div>
            <span className="text-[11px] font-bold text-gray-700 truncate leading-none">{profile?.name ?? "—"}</span>
          </div>
          <p className="text-[10px] text-gray-500 mb-1 leading-none">{date}</p>
          {eventName && <p className="text-[10px] font-semibold text-gray-600 mb-2 line-clamp-1">{eventName}</p>}
          {review.text && <p className="text-xs text-gray-700 leading-relaxed line-clamp-5 mb-2 whitespace-pre-wrap">{review.text}</p>}
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map((s) => (
              <span key={s} className={`text-xs ${s <= review.stars ? "text-yellow-500" : "text-gray-300"}`}>★</span>
            ))}
          </div>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setViewState] = useState({ tx: 0, ty: 0, scale: 1 });
  const viewRef = useRef({ tx: 0, ty: 0, scale: 1 });

  function setView(v: { tx: number; ty: number; scale: number }) {
    viewRef.current = v;
    setViewState(v);
  }

  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinch = useRef<{ dist: number; midX: number; midY: number; tx: number; ty: number; scale: number } | null>(null);
  const minScaleRef = useRef(MIN_SCALE);

  // Init: fit board to container, set min scale dynamically
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const s = Math.min(width / BOARD_W, height / BOARD_H, 1);
    minScaleRef.current = s; // can't zoom out past fit-to-screen
    setView({ scale: s, tx: (width - BOARD_W * s) / 2, ty: (height - BOARD_H * s) / 2 });
  }, []);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const fx = e.clientX - rect.left;
      const fy = e.clientY - rect.top;
      const prev = viewRef.current;
      const newScale = clamp(prev.scale * (e.deltaY < 0 ? 1.1 : 0.9), minScaleRef.current, MAX_SCALE);
      const boardX = (fx - prev.tx) / prev.scale;
      const boardY = (fy - prev.ty) / prev.scale;
      const { tx, ty } = clampView(fx - boardX * newScale, fy - boardY * newScale, newScale, rect.width, rect.height);
      setView({ tx, ty, scale: newScale });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Touch events
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        drag.current = { x: t.clientX, y: t.clientY, tx: viewRef.current.tx, ty: viewRef.current.ty };
        pinch.current = null;
      } else if (e.touches.length === 2) {
        const rect = el.getBoundingClientRect();
        const a = e.touches[0], b = e.touches[1];
        const prev = viewRef.current;
        pinch.current = {
          dist: touchDist(a, b),
          midX: (a.clientX + b.clientX) / 2 - rect.left,
          midY: (a.clientY + b.clientY) / 2 - rect.top,
          tx: prev.tx, ty: prev.ty, scale: prev.scale,
        };
        drag.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      if (e.touches.length === 1 && drag.current) {
        const t = e.touches[0];
        const dx = t.clientX - drag.current.x;
        const dy = t.clientY - drag.current.y;
        const prev = viewRef.current;
        const { tx, ty } = clampView(drag.current.tx + dx, drag.current.ty + dy, prev.scale, rect.width, rect.height);
        setView({ ...prev, tx, ty });
      } else if (e.touches.length === 2 && pinch.current) {
        const a = e.touches[0], b = e.touches[1];
        const dist = touchDist(a, b);
        const midX = (a.clientX + b.clientX) / 2 - rect.left;
        const midY = (a.clientY + b.clientY) / 2 - rect.top;
        const p = pinch.current;
        const newScale = clamp(p.scale * (dist / p.dist), minScaleRef.current, MAX_SCALE);
        const boardX = (p.midX - p.tx) / p.scale;
        const boardY = (p.midY - p.ty) / p.scale;
        const { tx, ty } = clampView(midX - boardX * newScale, midY - boardY * newScale, newScale, rect.width, rect.height);
        setView({ tx, ty, scale: newScale });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        drag.current = null;
        pinch.current = null;
      } else if (e.touches.length === 1) {
        pinch.current = null;
        const t = e.touches[0];
        drag.current = { x: t.clientX, y: t.clientY, tx: viewRef.current.tx, ty: viewRef.current.ty };
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, tx: viewRef.current.tx, ty: viewRef.current.ty };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current) return;
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    const { tx, ty } = clampView(drag.current.tx + dx, drag.current.ty + dy, viewRef.current.scale, width, height);
    setView({ ...viewRef.current, tx, ty });
  };
  const onMouseUp = () => { drag.current = null; };

  // Minimap click → jump to position
  const onMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const rect = e.currentTarget.getBoundingClientRect();
    const boardX = ((e.clientX - rect.left) / MINIMAP_W) * BOARD_W;
    const boardY = ((e.clientY - rect.top) / MINIMAP_H) * BOARD_H;
    const prev = viewRef.current;
    const { tx, ty } = clampView(width / 2 - boardX * prev.scale, height / 2 - boardY * prev.scale, prev.scale, width, height);
    setView({ ...prev, tx, ty });
  };

  // Viewport rect on minimap
  const ms = MINIMAP_W / BOARD_W;
  const vpLeft  = Math.max(0, (-view.tx / view.scale) * ms);
  const vpTop   = Math.max(0, (-view.ty / view.scale) * ms);
  const vpW     = Math.min((containerRef.current?.clientWidth  ?? 0) / view.scale * ms, MINIMAP_W - vpLeft);
  const vpH     = Math.min((containerRef.current?.clientHeight ?? 0) / view.scale * ms, MINIMAP_H - vpTop);

  const boardBg = `
    radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 70%, rgba(0,0,0,0.08) 0%, transparent 60%),
    url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.8' fill='rgba(0,0,0,0.06)'/%3E%3Ccircle cx='3' cy='3' r='0.6' fill='rgba(255,255,255,0.05)'/%3E%3C/svg%3E")
  `;

  return (
    <div className="relative" style={{ height: 520 }}>
      {/* Main canvas */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing select-none relative"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: BOARD_W,
            height: BOARD_H,
            transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`,
            transformOrigin: "0 0",
            willChange: "transform",
            backgroundColor: "#c19a6b",
            backgroundImage: boardBg,
          }}
        >
          {reviews.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/60 text-sm font-medium">{emptyMessage ?? "No reviews yet"}</p>
            </div>
          ) : (
            reviews.map((r) => <Note key={r.id} review={r} lang={lang} onDelete={onDelete} />)
          )}
        </div>
      </div>

      {/* Minimap */}
      <div
        className="absolute bottom-3 right-3 overflow-hidden rounded-lg border-2 border-white/40 shadow-xl cursor-pointer"
        style={{ width: MINIMAP_W, height: MINIMAP_H, backgroundColor: "#c19a6b" }}
        onClick={onMinimapClick}
      >
        {reviews.map((r) => {
          const color = NOTE_COLORS[r.note_color] ?? NOTE_COLORS.yellow;
          return (
            <div
              key={r.id}
              className="absolute rounded-[1px]"
              style={{
                left: `${((r.note_x ?? 0) / BOARD_W) * 100}%`,
                top:  `${((r.note_y ?? 0) / BOARD_H) * 100}%`,
                width:  `${(180 / BOARD_W) * 100}%`,
                height: `${(160 / BOARD_H) * 100}%`,
                backgroundColor: color.bg,
              }}
            />
          );
        })}
        {/* Viewport indicator */}
        <div
          className="absolute border border-white rounded-[2px] pointer-events-none"
          style={{
            left: vpLeft,
            top:  vpTop,
            width:  Math.max(vpW, 0),
            height: Math.max(vpH, 0),
            backgroundColor: "rgba(255,255,255,0.2)",
          }}
        />
      </div>
    </div>
  );
}
