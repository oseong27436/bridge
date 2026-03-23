import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import EventCard from "@/components/events/event-card";
import { MOCK_EVENTS } from "@/lib/mock-data";

const UPCOMING_EVENTS = MOCK_EVENTS.slice(0, 4);

const HOW_IT_WORKS = [
  {
    icon: CalendarDays,
    title: "Browse Events",
    description:
      "Check the calendar for upcoming Bridge events — parties, meetups, food tours, and more.",
  },
  {
    icon: CheckCircle2,
    title: "Apply to Join",
    description:
      "Hit the participate button. Our team reviews applications and confirms your spot.",
  },
  {
    icon: MessageCircle,
    title: "Get Notified via LINE",
    description:
      "Once approved, you'll receive the event details and location directly through LINE.",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/5 via-white to-primary/10 border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-5">
                <Sparkles className="h-3 w-3" />
                International Community · Osaka
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight text-foreground mb-4">
                Make new friends
                <br />
                <span className="text-primary">in Osaka.</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Join Bridge — a community in Osaka for people from Korea, Japan, and beyond. Events every week.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/events"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  Browse Events
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Join Bridge
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Upcoming Events</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Don't miss out on what's next</p>
            </div>
            <Link
              href="/events"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {UPCOMING_EVENTS.map((event) => (
              <EventCard key={event.id} event={event} lang="en" />
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-muted/40 border-y border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-16">
            <div className="text-center mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">How Bridge Works</h2>
              <p className="text-sm text-muted-foreground mt-1">Simple, friendly, and fast</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Photo gallery teaser */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Past Events</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Memories from the Bridge community</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {[
              "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=400&q=80",
              "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80",
              "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&q=80",
              "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&q=80",
              "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&q=80",
              "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400&q=80",
              "https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=400&q=80",
              "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80",
            ].map((src, i) => (
              <div
                key={i}
                className="aspect-square overflow-hidden rounded-xl bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Past event ${i + 1}`}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Ready to join?</h2>
            <p className="text-primary-foreground/80 text-sm mb-6">
              Sign up free and start attending Bridge events in Osaka.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-white/90 transition-colors"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
