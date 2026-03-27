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
  fee_type: "free" | "paid" | "tba";
  fee_amount: number | null;
  host_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DbHostReview {
  id: string;
  host_id: string;
  user_id: string;
  event_id: string | null;
  stars: number;
  text: string | null;
  featured: boolean;
  created_at: string;
  host?: DbHost;
  profile?: DbProfile;
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

export interface DbProfile {
  id: string;
  name: string;
  email: string;
  gender: string | null;
  native_lang: string | null;
  target_langs: { lang: string; level: number }[] | null;
  role: string;
  lang: string;
  line_user_id: string | null;
  avatar_url: string | null;
  created_at: string;
  registration_count?: number;
  attended_count?: number;
}

export interface DbRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  created_at: string;
  event?: DbEvent;
}

export interface DbReview {
  id: string;
  event_id: string;
  user_id: string;
  stars: number;
  text: string | null;
  featured: boolean;
  created_at: string;
  event?: DbEvent;
  profile?: DbProfile;
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

export async function getProfiles(): Promise<DbProfile[]> {
  const supabase = createClient();
  const { data: profiles } = await supabase
    .from("bridge_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (!profiles?.length) return [];

  const { data: counts } = await supabase
    .from("bridge_registrations")
    .select("user_id, status");

  const countMap: Record<string, { total: number; attended: number }> = {};
  (counts ?? []).forEach((r: { user_id: string; status: string }) => {
    if (!countMap[r.user_id]) countMap[r.user_id] = { total: 0, attended: 0 };
    countMap[r.user_id].total++;
    if (r.status === "attended") countMap[r.user_id].attended++;
  });

  return profiles.map((p) => ({
    ...p,
    registration_count: countMap[p.id]?.total ?? 0,
    attended_count: countMap[p.id]?.attended ?? 0,
  }));
}

export async function getUserRegistrations(userId: string): Promise<DbRegistration[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("bridge_registrations")
    .select("*, event:bridge_events(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getSettings(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.from("bridge_settings").select("key, value");
  const result: Record<string, string> = {};
  (data ?? []).forEach((row: { key: string; value: string }) => { result[row.key] = row.value; });
  return result;
}

export async function getReviews(): Promise<DbReview[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("bridge_reviews")
    .select("*, event:bridge_events(title_ko,title_ja,title_en), profile:bridge_profiles(name,avatar_url)")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

export async function getAllReviews(): Promise<DbReview[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("bridge_reviews")
    .select("*, event:bridge_events(title_ko,title_ja,title_en), profile:bridge_profiles(name,avatar_url)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getEventReviews(eventId: string): Promise<DbReview[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("bridge_reviews")
    .select("*, profile:bridge_profiles(name,avatar_url)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAllHostReviews(): Promise<DbHostReview[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("bridge_host_reviews")
    .select("*, host:bridge_hosts(name,avatar_url), profile:bridge_profiles(name,avatar_url)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export function eventTitle(e: DbEvent, lang: string) {
  return lang === "ko" ? e.title_ko : lang === "en" ? e.title_en : e.title_ja;
}
export function eventDesc(e: DbEvent, lang: string) {
  return lang === "ko" ? e.description_ko : lang === "en" ? e.description_en : e.description_ja;
}
export function eventLocation(e: DbEvent, lang: string) {
  const raw = lang === "ko" ? e.location_ko : lang === "en" ? e.location_en : e.location_ja;
  if (raw === "__tba__") return lang === "ko" ? "추후 공개" : lang === "en" ? "TBA" : "後日公開";
  return raw;
}
export function hostBio(h: DbHost, lang: string) {
  return lang === "ko" ? h.bio_ko : lang === "en" ? h.bio_en : h.bio_ja;
}
