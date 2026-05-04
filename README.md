# Bridge Osaka

> Connect locals and internationals through shared experiences.

A multilingual community event platform for the Osaka international scene — browse events, leave memories on a cork board, and discover local hosts.

---

## Features

- **Multilingual UI** — Japanese, Korean, English, Chinese with a global language switcher
- **Event discovery** — Browse and filter events by category (meetup, party, food, sports, culture) and language
- **Cork board reviews** — Drag-and-drop post-it style community review board powered by dnd-kit
- **Host profiles** — Discover local hosts with language tags and bios
- **Photo gallery** — Masonry-style event gallery
- **Admin dashboard** — Manage events, hosts, and gallery from a private admin panel
- **Auth** — Supabase SSR authentication (login / signup)
- **My page** — User reservations and profile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Drag & Drop | dnd-kit |
| Database & Auth | Supabase (SSR) |
| Icons | Lucide React |

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/oseong27436/bridge.git
cd bridge
npm install
```

### 2. Set up environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
  app/
    page.tsx        # Home — hero, events, cork board, hosts, gallery
    events/         # Event listing & detail pages
    auth/           # Login / signup
    admin/          # Admin dashboard (protected)
    my/             # User profile & reservations
    api/            # API routes
  components/
    cork-board.tsx      # Drag-and-drop review board
    layout/             # Header, footer
    ui/                 # shadcn/ui primitives
  lib/
    db.ts               # Supabase queries (events, hosts, gallery, reviews)
    i18n.ts             # Translation strings (ja / ko / en / zh)
    supabase.ts         # Supabase client
  context/
    language-context.tsx  # Global language state
```
