"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getEventImages, type DbEvent } from "@/lib/db";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import { ChevronDown, ChevronUp, Users, Banknote, MapPin, Calendar, X } from "lucide-react";

async function compressImage(file: File, maxWidth: number, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", quality);
    };
    img.src = url;
  });
}

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "meetup",
  status: "published",
  date: "",
  time_start: "19:00",
  time_end: "",
  location_type: "address",
  location: "",
  location_url: "",
  image_url: "",
  capacity: "",
  fee_type: "free",
  fee_amount: "",
  approval_required: "true",
  open_chat_url: "",
  open_chat_qr_url: "",
};

type FormData = typeof EMPTY_FORM;

type Registration = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profile: { name: string; email: string; avatar_url: string | null; line_user_id: string | null; lang?: string } | null;
};

/* ── Reusable field components ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-5 mb-2 first:mt-0">
      {children}
    </p>
  );
}

function Field({ label, name, textarea, type = "text", form, setForm, placeholder }: {
  label: string;
  name: keyof FormData;
  textarea?: boolean;
  type?: string;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  placeholder?: string;
}) {
  const cls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition";
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {textarea ? (
        <textarea rows={3} value={form[name]} placeholder={placeholder}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          className={cls + " resize-none"} />
      ) : (
        <input type={type} value={form[name]} placeholder={placeholder}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          className={cls} />
      )}
    </div>
  );
}

function Select({ label, name, options, form, setForm }: {
  label: string;
  name: keyof FormData;
  options: { value: string; label: string }[];
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <select value={form[name]} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition appearance-none">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ── Main page ── */
export default function AdminEventsPage() {
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [images, setImages] = useState<string[]>([]); // all uploaded image URLs
  const [saving, setSaving] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const extraInputRef = useRef<HTMLInputElement>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const supabaseClient = createClient();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Record<string, Registration[]>>({});
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("bridge_events").select("*").order("date", { ascending: false });
    const evs = data ?? [];
    setEvents(evs);
    setLoading(false);
    if (evs.length > 0) {
      const { data: counts } = await supabase
        .from("bridge_registrations")
        .select("event_id, status")
        .in("event_id", evs.map((e) => e.id))
        .neq("status", "cancelled");
      const map: Record<string, number> = {};
      (counts ?? []).forEach((r) => { map[r.event_id] = (map[r.event_id] ?? 0) + 1; });
      setRegCounts(map);
    }
  }

  useEffect(() => { load(); }, []);

  async function loadRegistrations(eventId: string) {
    if (registrations[eventId]) return;
    const supabase = createClient();

    // Fetch registrations first
    const { data: regsData } = await supabase
      .from("bridge_registrations")
      .select("id, user_id, status, created_at")
      .eq("event_id", eventId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });

    if (!regsData || regsData.length === 0) {
      setRegistrations((prev) => ({ ...prev, [eventId]: [] }));
      return;
    }

    // Fetch profiles separately (no direct FK between registrations and profiles)
    const userIds = regsData.map((r) => r.user_id);
    const { data: profilesData } = await supabase
      .from("bridge_profiles")
      .select("id, name, email, avatar_url, line_user_id, lang")
      .in("id", userIds);

    const profileMap = Object.fromEntries((profilesData ?? []).map((p) => [p.id, p]));
    const merged: Registration[] = regsData.map((r) => ({
      ...r,
      profile: profileMap[r.user_id] ?? null,
    }));

    setRegistrations((prev) => ({ ...prev, [eventId]: merged }));
  }

  function toggleExpand(eventId: string) {
    if (expandedId === eventId) { setExpandedId(null); return; }
    setExpandedId(eventId);
    loadRegistrations(eventId);
  }

  async function sendNotification(regId: string, eventId: string, action: "approved" | "rejected") {
    const reg = registrations[eventId]?.find((r) => r.id === regId);
    const evt = events.find((e) => e.id === eventId);
    if (!reg || !evt) return;
    const eventTitle = evt.title_ja || evt.title_ko || evt.title_en || "";
    const openChatUrl = (evt as DbEvent & { open_chat_url?: string }).open_chat_url ?? null;
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineUserId: reg.profile?.line_user_id ?? null,
        email: reg.profile?.email ?? null,
        action,
        eventTitle,
        openChatUrl,
        lang: reg.profile?.lang ?? "ja",
      }),
    });
  }

  async function handleApprove(regId: string, eventId: string) {
    setApprovingId(regId);
    await createClient().from("bridge_registrations").update({ status: "approved" }).eq("id", regId);
    setRegistrations((prev) => ({
      ...prev,
      [eventId]: prev[eventId].map((r) => r.id === regId ? { ...r, status: "approved" } : r),
    }));
    await sendNotification(regId, eventId, "approved");
    setApprovingId(null);
  }

  async function handleReject(regId: string, eventId: string) {
    setApprovingId(regId);
    await createClient().from("bridge_registrations").update({ status: "rejected" }).eq("id", regId);
    setRegistrations((prev) => ({
      ...prev,
      [eventId]: prev[eventId].map((r) => r.id === regId ? { ...r, status: "rejected" } : r),
    }));
    await sendNotification(regId, eventId, "rejected");
    setApprovingId(null);
  }

  function openNew() { setEditId(null); setForm(EMPTY_FORM); setImages([]); setShowForm(true); }

  async function openEdit(e: DbEvent) {
    setEditId(e.id);
    const loc = e.location_ko || e.location_ja || e.location_en;
    const locType = loc === "__tba__" ? "tba" : e.location_url && !loc ? "link" : "address";
    setForm({
      title: e.title_ko || e.title_ja || e.title_en,
      description: e.description_ko || e.description_ja || e.description_en,
      category: e.category,
      status: e.status,
      date: e.date,
      time_start: e.time_start,
      time_end: e.time_end ?? "",
      location_type: locType,
      location: locType === "address" ? loc : "",
      location_url: e.location_url ?? "",
      image_url: e.image_url,
      capacity: e.capacity?.toString() ?? "",
      fee_type: e.fee_type ?? "free",
      fee_amount: e.fee_amount?.toString() ?? "",
      approval_required: e.approval_required === false ? "false" : "true",
      open_chat_url: (e as DbEvent & { open_chat_url?: string }).open_chat_url ?? "",
      open_chat_qr_url: (e as DbEvent & { open_chat_qr_url?: string }).open_chat_qr_url ?? "",
    });
    const imgs = await getEventImages(e.id);
    const urls = imgs.map((i) => i.image_url);
    // merge with main image_url if not already in list
    const merged = e.image_url && !urls.includes(e.image_url) ? [e.image_url, ...urls] : urls;
    setImages(merged.length ? merged : e.image_url ? [e.image_url] : []);
    setShowForm(true);
  }

  async function handleUploadExtra(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingExtra(true);
    const blob = await compressImage(file, 1600, 0.88);
    const path = `events/${Date.now()}.jpg`;
    const { error } = await supabaseClient.storage.from("bridge-images").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (!error) {
      const { data } = supabaseClient.storage.from("bridge-images").getPublicUrl(path);
      const url = data.publicUrl;
      setImages((prev) => {
        const next = [...prev, url];
        if (next.length === 1) setForm((f) => ({ ...f, image_url: url }));
        return next;
      });
    }
    setUploadingExtra(false);
    if (extraInputRef.current) extraInputRef.current.value = "";
  }

  async function handleUploadQr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    const blob = await compressImage(file, 800, 0.9);
    const path = `events/qr_${Date.now()}.jpg`;
    const { error } = await supabaseClient.storage.from("bridge-images").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (!error) {
      const { data } = supabaseClient.storage.from("bridge-images").getPublicUrl(path);
      setForm((f) => ({ ...f, open_chat_qr_url: data.publicUrl }));
    }
    setUploadingQr(false);
    if (qrInputRef.current) qrInputRef.current.value = "";
  }

  function removeImage(url: string) {
    setImages((prev) => {
      const next = prev.filter((u) => u !== url);
      // if removed was main, set next main
      setForm((f) => ({
        ...f,
        image_url: f.image_url === url ? (next[0] ?? "") : f.image_url,
      }));
      return next;
    });
  }

  async function handleSave() {
    if (!form.open_chat_url.trim()) {
      alert(lang === "ja" ? "LINEオープンチャットURLは必須です。" : lang === "ko" ? "LINE 오픈채팅 URL은 필수입니다." : "LINE Open Chat URL is required.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const locationText = form.location_type === "tba" ? "__tba__" : form.location_type === "link" ? "" : form.location;
    const payload = {
      title_ja: form.title, title_ko: form.title, title_en: form.title,
      description_ja: form.description, description_ko: form.description, description_en: form.description,
      location_ja: locationText, location_ko: locationText, location_en: locationText,
      category: form.category, status: form.status,
      date: form.date, time_start: form.time_start, time_end: form.time_end || null,
      location_url: form.location_type === "tba" ? null : form.location_url || null,
      image_url: form.image_url,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      fee_type: form.fee_type,
      fee_amount: form.fee_type === "paid" && form.fee_amount ? parseInt(form.fee_amount) : null,
      approval_required: form.approval_required !== "false",
      open_chat_url: form.open_chat_url || null,
      open_chat_qr_url: form.open_chat_qr_url || null,
    };

    // Check if status is being changed to finished (for review reminder)
    const prevEvent = editId ? events.find((e) => e.id === editId) : null;
    const becomingFinished = editId && payload.status === "finished" && prevEvent?.status !== "finished";

    let eventId = editId;
    if (editId) {
      await supabase.from("bridge_events").update(payload).eq("id", editId);
    } else {
      const { data: inserted } = await supabase.from("bridge_events").insert(payload).select("id").single();
      eventId = inserted?.id ?? null;
    }

    // Send review reminder to confirmed participants
    if (becomingFinished && eventId) {
      const { data: regs } = await supabase
        .from("bridge_registrations")
        .select("user_id")
        .eq("event_id", eventId)
        .in("status", ["confirmed", "approved", "attended"]);
      if (regs?.length) {
        const userIds = regs.map((r: { user_id: string }) => r.user_id);
        const { data: profiles } = await supabase
          .from("bridge_profiles")
          .select("line_user_id")
          .in("id", userIds)
          .not("line_user_id", "is", null);
        const lineUserIds = (profiles ?? []).map((p: { line_user_id: string }) => p.line_user_id).filter(Boolean);
        if (lineUserIds.length > 0) {
          await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lineUserIds,
              action: "review",
              eventTitle: payload.title_ja || payload.title_ko || payload.title_en,
            }),
          });
        }
      }
    }

    // sync bridge_event_images
    if (eventId) {
      await supabase.from("bridge_event_images").delete().eq("event_id", eventId);
      if (images.length > 0) {
        await supabase.from("bridge_event_images").insert(
          images.map((url, i) => ({ event_id: eventId, image_url: url, sort_order: i }))
        );
      }
    }

    setSaving(false);
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === "ja" ? "イベントを削除しますか？" : lang === "en" ? "Delete this event?" : "이벤트를 삭제하시겠습니까?")) return;
    await createClient().from("bridge_events").delete().eq("id", id);
    load();
  }

  const statusLabel = (s: string) => s === "approved" ? tr.reg_status_approved : s === "rejected" ? tr.reg_status_rejected : tr.reg_status_pending;
  const statusColor = (s: string) => s === "approved" ? "bg-green-100 text-green-700" : s === "rejected" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700";

  const catOptions = ["meetup","party","sports","food","culture","other"].map((c) => ({
    value: c, label: (tr[`cat_${c}` as keyof typeof tr] as string) ?? c,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{tr.admin_events}</h1>
        <button onClick={openNew}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
          {tr.admin_new_event}
        </button>
      </div>

      {/* ── Edit / New Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/50 md:items-center md:justify-center">
          {/* Mobile: full-screen slide-up. Desktop: centered card */}
          <div className="flex flex-col bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-2xl md:shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-base font-extrabold text-gray-900">
                {editId ? tr.admin_edit_event : tr.admin_new_event_title}
              </h2>
              <button onClick={() => setShowForm(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">

              <SectionLabel>{lang === "ja" ? "基本情報" : lang === "ko" ? "기본 정보" : "Basic Info"}</SectionLabel>
              <Field label={tr.field_title} name="title" form={form} setForm={setForm} />
              <div className="pt-2">
                <Field label={tr.field_description} name="description" textarea form={form} setForm={setForm} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Select label={tr.field_category} name="category" options={catOptions} form={form} setForm={setForm} />
                <Select label={tr.field_status} name="status"
                  options={[
                    { value: "published", label: tr.status_published },
                    { value: "draft", label: tr.status_draft },
                    { value: "finished", label: tr.status_finished },
                  ]}
                  form={form} setForm={setForm} />
              </div>

              <SectionLabel>{lang === "ja" ? "日程" : lang === "ko" ? "일정" : "Schedule"}</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3 sm:col-span-1">
                  <Field label={tr.field_date} name="date" type="date" form={form} setForm={setForm} />
                </div>
                <Field label={tr.field_time_start} name="time_start" type="time" form={form} setForm={setForm} />
                <Field label={tr.field_time_end} name="time_end" type="time" form={form} setForm={setForm} />
              </div>

              <SectionLabel>{lang === "ja" ? "場所" : lang === "ko" ? "장소" : "Location"}</SectionLabel>
              <Select label={tr.location_type} name="location_type"
                options={[
                  { value: "address", label: tr.location_address },
                  { value: "link", label: tr.location_link },
                  { value: "tba", label: tr.location_tba },
                ]}
                form={form}
                setForm={(fn) => setForm((f) => {
                  const next = typeof fn === "function" ? fn(f) : fn;
                  return { ...next, location: "", location_url: "" };
                })} />
              {form.location_type === "address" && (
                <div className="pt-2">
                  <Field label={tr.field_location} name="location" form={form} setForm={setForm} />
                </div>
              )}
              {(form.location_type === "address" || form.location_type === "link") && (
                <div className="pt-2">
                  <Field label={tr.field_map_url} name="location_url" placeholder="https://maps.google.com/..." form={form} setForm={setForm} />
                </div>
              )}

              <SectionLabel>{lang === "ja" ? "画像" : lang === "ko" ? "이미지" : "Image"}</SectionLabel>
              {/* Multi-image upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  {tr.field_image}
                  <span className="ml-1 text-gray-400 font-normal">(첫 번째가 대표 사진)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {images.map((url, i) => (
                    <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer"
                      style={{ borderColor: form.image_url === url ? "var(--color-primary, #f97316)" : "#e5e7eb" }}
                      onClick={() => setForm((f) => ({ ...f, image_url: url }))}
                      title="클릭해서 대표 사진 설정"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {form.image_url === url && (
                        <div className="absolute top-0.5 left-0.5 bg-primary text-white text-[10px] font-bold px-1 rounded">대표</div>
                      )}
                      <button type="button"
                        onClick={(ev) => { ev.stopPropagation(); removeImage(url); }}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-500"
                      >✕</button>
                      {i > 0 && (
                        <button type="button"
                          onClick={(ev) => { ev.stopPropagation(); setImages((prev) => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; }); }}
                          className="absolute bottom-0.5 left-0.5 bg-black/60 text-white rounded text-[10px] px-1 hover:bg-gray-700"
                        >←</button>
                      )}
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => extraInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary flex flex-col items-center justify-center text-gray-400 hover:text-primary transition-colors text-xs gap-1"
                  >
                    {uploadingExtra
                      ? <div className="animate-spin h-4 w-4 rounded-full border-2 border-primary border-t-transparent" />
                      : <><span className="text-2xl leading-none">+</span><span>사진 추가</span></>}
                  </button>
                  <input ref={extraInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadExtra} />
                </div>
              </div>

              <SectionLabel>{lang === "ja" ? "定員・参加費" : lang === "ko" ? "정원 & 참가비" : "Capacity & Fee"}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <Field label={tr.field_capacity} name="capacity" type="number" placeholder="20" form={form} setForm={setForm} />
                <Select label={tr.field_fee_type} name="fee_type"
                  options={[
                    { value: "free", label: tr.fee_free },
                    { value: "paid", label: tr.fee_paid },
                    { value: "tba", label: tr.fee_tba },
                  ]}
                  form={form} setForm={setForm} />
              </div>
              {form.fee_type === "paid" && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{tr.field_fee_amount}</label>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition">
                    <span className="text-sm font-semibold text-gray-400">¥</span>
                    <input type="number" value={form.fee_amount}
                      onChange={(e) => setForm((f) => ({ ...f, fee_amount: e.target.value }))}
                      placeholder="1500"
                      className="flex-1 bg-transparent text-sm outline-none" />
                  </div>
                </div>
              )}

              <SectionLabel>{lang === "ja" ? "参加方式" : lang === "ko" ? "참가 방식" : "Registration Type"}</SectionLabel>
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {lang === "ja" ? "承認制" : lang === "ko" ? "승인제" : "Approval Required"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {form.approval_required !== "false"
                      ? (lang === "ja" ? "申込後、管理者が承認します" : lang === "ko" ? "신청 후 어드민이 승인합니다" : "Admin approves after application")
                      : (lang === "ja" ? "申込後、即時参加確定" : lang === "ko" ? "신청 즉시 참가 확정" : "Confirmed immediately on apply")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, approval_required: f.approval_required !== "false" ? "false" : "true" }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.approval_required !== "false" ? "bg-primary" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.approval_required !== "false" ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <SectionLabel>{lang === "ja" ? "LINE オープンチャット" : lang === "ko" ? "LINE 오픈채팅" : "LINE Open Chat"}</SectionLabel>
              <Field
                label={lang === "ja" ? "オープンチャットURL" : lang === "ko" ? "오픈채팅 URL" : "Open Chat URL"}
                name="open_chat_url"
                placeholder="https://line.me/ti/g2/..."
                form={form}
                setForm={setForm}
              />
              {/* QR 이미지 업로드 */}
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  {lang === "ja" ? "QRコード画像" : lang === "ko" ? "QR 코드 이미지" : "QR Code Image"}
                </p>
                <div className="flex items-center gap-3">
                  {form.open_chat_qr_url && (
                    <div className="relative">
                      <img src={form.open_chat_qr_url} alt="QR" className="w-20 h-20 rounded-lg border border-gray-200 object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, open_chat_qr_url: "" }))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >×</button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => qrInputRef.current?.click()}
                    className="rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-xs font-semibold text-gray-400 hover:border-primary hover:text-primary transition-colors"
                  >
                    {uploadingQr ? "..." : form.open_chat_qr_url ? (lang === "ko" ? "변경" : lang === "en" ? "Change" : "変更") : (lang === "ko" ? "+ QR 업로드" : lang === "en" ? "+ Upload QR" : "+ QR アップロード")}
                  </button>
                  <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadQr} />
                </div>
              </div>
            </div>

            {/* Sticky footer buttons */}
            <div className="shrink-0 px-5 py-4 border-t border-gray-100 bg-white flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                {tr.admin_cancel}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? tr.admin_saving : tr.admin_save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Event list ── */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📅</div>
          <p className="font-medium">{tr.admin_no_events}</p>
          <button onClick={openNew} className="mt-3 text-sm text-primary hover:underline">{tr.admin_add_first_event}</button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => {
            const title = e.title_ko || e.title_ja || e.title_en;
            const loc = e.location_ko || e.location_ja || e.location_en;
            const count = regCounts[e.id] ?? 0;
            const isExpanded = expandedId === e.id;
            const regs = registrations[e.id];
            const pendingCount = regs?.filter((r) => r.status === "pending").length ?? 0;

            return (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          e.status === "published" ? "bg-green-100 text-green-700"
                          : e.status === "finished" ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                        }`}>
                          {e.status === "published" ? tr.status_published
                            : e.status === "finished" ? tr.status_finished
                            : tr.status_draft}
                        </span>
                        <span className="rounded-full bg-orange-100 text-orange-600 px-2 py-0.5 text-xs font-semibold">
                          {tr[`cat_${e.category}` as keyof typeof tr] as string ?? e.category}
                        </span>
                      </div>
                      <p className="font-bold text-gray-900 text-sm leading-snug truncate">{title}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => openEdit(e)} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        {tr.admin_edit}
                      </button>
                      <button onClick={() => handleDelete(e.id)} className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-50">
                        {tr.admin_delete}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{e.date} {e.time_start}</span>
                    {loc && loc !== "__tba__" && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{loc}</span>}
                    <span className="flex items-center gap-1">
                      <Banknote className="h-3 w-3" />
                      {e.fee_type === "free" ? tr.fee_free : e.fee_type === "paid" && e.fee_amount ? `¥${e.fee_amount.toLocaleString()}` : tr.fee_tba}
                    </span>
                    {e.capacity && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{lang === "ko" ? `정원 ${e.capacity}명` : `Cap. ${e.capacity}`}</span>}
                  </div>

                  <button onClick={() => toggleExpand(e.id)}
                    className="w-full flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      {tr.admin_applicants}: {count}{lang === "ko" ? "명" : ""}
                      {isExpanded && pendingCount > 0 && (
                        <span className="rounded-full bg-yellow-100 text-yellow-700 px-1.5 py-0.5 text-[10px] font-bold">
                          {lang === "ko" ? `대기 ${pendingCount}` : `${pendingCount} pending`}
                        </span>
                      )}
                    </span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    {!regs ? (
                      <p className="text-xs text-gray-400 text-center py-2">로딩 중...</p>
                    ) : regs.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">{tr.admin_no_applicants}</p>
                    ) : (
                      <div className="space-y-2">
                        {regs.map((r) => (
                          <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 overflow-hidden">
                              {r.profile?.avatar_url
                                ? <img src={r.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                : (r.profile?.name?.charAt(0) ?? "?")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{r.profile?.name ?? "—"}</p>
                              <p className="text-[10px] text-gray-400 truncate">{r.profile?.email ?? r.user_id.slice(0, 8)}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor(r.status)}`}>
                                {statusLabel(r.status)}
                              </span>
                              {r.status === "pending" && (
                                <>
                                  <button onClick={() => handleApprove(r.id, e.id)} disabled={approvingId === r.id}
                                    className="rounded-lg bg-green-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-green-600 disabled:opacity-50">
                                    {tr.admin_approve}
                                  </button>
                                  <button onClick={() => handleReject(r.id, e.id)} disabled={approvingId === r.id}
                                    className="rounded-lg bg-red-400 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-500 disabled:opacity-50">
                                    {tr.admin_reject}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
