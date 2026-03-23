import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Users } from "lucide-react";
import type { Event, EventCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<EventCategory, { label: string; color: string }> = {
  meetup: { label: "Meetup", color: "bg-blue-100 text-blue-700" },
  party: { label: "Party", color: "bg-purple-100 text-purple-700" },
  sports: { label: "Sports", color: "bg-green-100 text-green-700" },
  culture: { label: "Culture", color: "bg-amber-100 text-amber-700" },
  food: { label: "Food", color: "bg-orange-100 text-orange-700" },
  other: { label: "Other", color: "bg-gray-100 text-gray-600" },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface EventCardProps {
  event: Event;
  lang?: "ja" | "ko" | "en";
}

export default function EventCard({ event, lang = "en" }: EventCardProps) {
  const category = CATEGORY_LABELS[event.category];
  const spotsLeft =
    event.capacity !== null ? event.capacity - event.registrationCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const fillPercent =
    event.capacity !== null
      ? Math.min(100, (event.registrationCount / event.capacity) * 100)
      : null;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={event.imageUrl}
          alt={event.title[lang]}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${category.color}`}
          >
            {category.label}
          </span>
        </div>
        {/* Full badge */}
        {isFull && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-700">
              FULL
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-foreground leading-snug line-clamp-2 mb-2">
          {event.title[lang]}
        </h3>

        <div className="mt-auto space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>
              {formatDate(event.date)} · {event.timeStart}–{event.timeEnd}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{event.location[lang]}</span>
          </div>

          {/* Capacity bar */}
          <div className="pt-1">
            {event.capacity !== null ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>
                      {event.registrationCount} / {event.capacity}
                    </span>
                  </div>
                  {!isFull && spotsLeft !== null && spotsLeft <= 5 && (
                    <span className="text-xs font-medium text-orange-500">
                      {spotsLeft} spots left
                    </span>
                  )}
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isFull ? "bg-gray-400" : fillPercent! >= 80 ? "bg-orange-400" : "bg-primary"
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{event.registrationCount} going · Unlimited</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
