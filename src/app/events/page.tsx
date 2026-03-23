"use client";

import { useState, useMemo } from "react";
import { LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import EventCard from "@/components/events/event-card";
import { MOCK_EVENTS } from "@/lib/mock-data";
import type { EventCategory } from "@/lib/types";

const CATEGORIES: { value: EventCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "meetup", label: "Meetup" },
  { value: "party", label: "Party" },
  { value: "food", label: "Food" },
  { value: "culture", label: "Culture" },
  { value: "sports", label: "Sports" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { day: number; current: boolean }[] = [];

  // Leading days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, current: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }
  // Trailing days to fill 6 rows
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false });
  }

  return cells;
}

export default function EventsPage() {
  const today = new Date();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [category, setCategory] = useState<EventCategory | "all">("all");
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (selectedDate && e.date !== selectedDate) return false;
      return true;
    });
  }, [category, selectedDate]);

  const eventDateSet = useMemo(() => {
    return new Set(MOCK_EVENTS.map((e) => e.date));
  }, []);

  const calendarDays = getCalendarDays(calYear, calMonth);

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  function handleDayClick(day: number) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!eventDateSet.has(dateStr)) return;
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {MOCK_EVENTS.length} upcoming events in Osaka
          </p>
        </div>

        {/* Filters + view toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          {/* Category filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setCategory(cat.value);
                  setSelectedDate(null);
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  category === cat.value
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setView("calendar")}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                view === "calendar"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              aria-label="Calendar view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                view === "list"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {view === "calendar" && (
          <div className="mb-8">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">
                {MONTHS[calMonth]} {calYear}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-muted-foreground py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((cell, i) => {
                const dateStr = cell.current
                  ? `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`
                  : null;
                const hasEvent = dateStr ? eventDateSet.has(dateStr) : false;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr !== null && dateStr === selectedDate;

                return (
                  <button
                    key={i}
                    onClick={() => cell.current && handleDayClick(cell.day)}
                    disabled={!cell.current || !hasEvent}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors
                      ${!cell.current ? "text-muted-foreground/30 cursor-default" : ""}
                      ${cell.current && !hasEvent ? "text-foreground cursor-default" : ""}
                      ${cell.current && hasEvent && !isSelected ? "hover:bg-primary/10 cursor-pointer font-medium text-primary" : ""}
                      ${isSelected ? "bg-primary text-white font-semibold" : ""}
                      ${isToday && !isSelected ? "ring-1 ring-primary rounded-lg" : ""}
                    `}
                  >
                    {cell.day}
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <p className="mt-3 text-xs text-muted-foreground">
                Showing events on{" "}
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
                {" · "}
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-primary hover:underline"
                >
                  Clear
                </button>
              </p>
            )}
          </div>
        )}

        {/* Event grid / list */}
        {filteredEvents.length > 0 ? (
          <div
            className={
              view === "calendar"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} lang="en" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground text-sm">No events found.</p>
            <button
              onClick={() => {
                setCategory("all");
                setSelectedDate(null);
              }}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
