import { createClient } from "./supabase";

export interface DbEvent {
  id: string;
  title_ja: string;
  title_ko: string;
  title_en: string;
  description_ja: string;
  description_ko: string;
  description_en: string;
  category: string;
  status: string;
  date: string;
  time_start: string;
  time_end: string | null;
  location_ja: string;
  location_ko: string;
  location_en: string;
  location_url: string | null;
  image_url: string;
  capacity: number | null;
  created_by: string | null;
  created_at: string;
}

export interface DbHost {
  id: string;
  name: string;
  avatar_url: string;
  location: string;
  langs: string[];
  bio_ja: string;
  bio_ko: string;
  bio_en: string;
  stars: number;
  review_count: number;
  sort_order: number;
}

export interface DbGallery {
  id: string;
  image_url: string;
  caption: string;
  sort_order: number;
}

export interface DbReview {
  id: string;
  event_id: string;
  user_id: string;
  stars: number;
  text: string;
  created_at: string;
}

export async function getEvents(): Promise<DbEvent[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("bridge_events")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: true });
  return data ?? [];
}

export async function getAllEvents(): Promise<DbEvent[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("bridge_events")
    .select("*")
    .order("date", { ascending: true });
  return data ?? [];
}

export async function getEventById(id: string): Promise<DbEvent | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("bridge_events")
    .select("*")
    .eq("id", id)
    .single();
  return data ?? null;
}

export async function getHosts(): Promise<DbHost[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("bridge_hosts")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getGallery(): Promise<DbGallery[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("bridge_gallery")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getReviews(): Promise<DbReview[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("bridge_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

export function eventTitle(e: DbEvent, lang: string) {
  return lang === "ko" ? e.title_ko : lang === "en" ? e.title_en : e.title_ja;
}
export function eventDesc(e: DbEvent, lang: string) {
  return lang === "ko" ? e.description_ko : lang === "en" ? e.description_en : e.description_ja;
}
export function eventLocation(e: DbEvent, lang: string) {
  return lang === "ko" ? e.location_ko : lang === "en" ? e.location_en : e.location_ja;
}
export function hostBio(h: DbHost, lang: string) {
  return lang === "ko" ? h.bio_ko : lang === "en" ? h.bio_en : h.bio_ja;
}
