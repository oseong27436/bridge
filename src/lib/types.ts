export type EventCategory = "meetup" | "party" | "sports" | "culture" | "food" | "other";

export type EventStatus = "draft" | "published" | "cancelled";

export type RegistrationStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface I18nString {
  ja: string;
  ko: string;
  en: string;
}

export interface Event {
  id: string;
  title: I18nString;
  description: I18nString;
  category: EventCategory;
  status: EventStatus;
  date: string; // ISO 8601
  timeStart: string; // "HH:MM"
  timeEnd: string; // "HH:MM"
  location: I18nString;
  locationUrl?: string;
  imageUrl: string;
  capacity: number | null; // null = 미정 (TBD)
  registrationCount: number;
  createdBy: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  createdAt: string;
}

export type NativeLang = "ja" | "ko" | "en" | "zh" | "other";
export type TargetLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface TargetLang {
  lang: NativeLang;
  level: TargetLevel;
}

export interface User {
  id: string;
  name: string;
  email: string;
  gender?: "male" | "female" | "other";
  nativeLang?: NativeLang;
  targetLangs?: TargetLang[];
  avatarUrl?: string;
  lineUserId?: string;
  role: "member" | "admin";
  lang: "ja" | "ko" | "en";
  createdAt: string;
}
