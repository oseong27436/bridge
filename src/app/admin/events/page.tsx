"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getHosts, type DbEvent, type DbHost } from "@/lib/db";
import ImageUpload from "@/components/admin/image-upload";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import { ChevronDown, ChevronUp, Users, Banknote, MapPin, Calendar } from "lucide-react";

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
  host_id: "",
};

type FormData = typeof EMPTY_FORM;

type Registration = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profile: { name: string; email: string; avatar_url: string | null } | null;
};

function Field({ label, name, textarea, type = "text", form, setForm }: {
  label: string;
  name: keyof FormData;
  textarea?: boolean;
  type?: string;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {textarea ? (
        <textarea
          rows={3}
          value={form[name]}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      )}
    </div>
  );
}

export default function AdminEventsPage() {
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [events, setEvents] = useState<DbEvent[]>([]);
  const [hosts, setHosts] = useState<DbHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Registrations
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

    // Load pending counts for all events
    if (evs.length > 0) {
      const { data: counts } = await supabase
        .from("bridge_registrations")
        .select("event_id, status")
        .in("event_id", evs.map((e) => e.id))
        .neq("status", "cancelled");
      const map: Record<string, number> = {};
      (counts ?? []).forEach((r) => {
        map[r.event_id] = (map[r.event_id] ?? 0) + 1;
      });
      setRegCounts(map);
    }
  }

  useEffect(() => { load(); getHosts().then(setHosts); }, []);

  async function loadRegistrations(eventId: string) {
    if (registrations[eventId]) return; // already loaded
    const supabase = createClient();
    const { data } = await supabase
      .from("bridge_registrations")
      .select("id, user_id, status, created_at, profile:bridge_profiles(name, email, avatar_url)")
      .eq("event_id", eventId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });
    setRegistrations((prev) => ({ ...prev, [eventId]: (data ?? []) as unknown as Registration[] }));
  }

  function toggleExpand(eventId: string) {
    if (expandedId === eventId) {
      setExpandedId(null);
    } else {
      setExpandedId(eventId);
      loadRegistrations(eventId);
    }
  }

  async function handleApprove(regId: string, eventId: string) {
    setApprovingId(regId);
    await createClient().from("bridge_registrations").update({ status: "approved" }).eq("id", regId);
    setRegistrations((prev) => ({
      ...prev,
      [eventId]: prev[eventId].map((r) => r.id === regId ? { ...r, status: "approved" } : r),
    }));
    setApprovingId(null);
  }

  async function handleReject(regId: string, eventId: string) {
    setApprovingId(regId);
    await createClient().from("bridge_registrations").update({ status: "rejected" }).eq("id", regId);
    setRegistrations((prev) => ({
      ...prev,
      [eventId]: prev[eventId].map((r) => r.id === regId ? { ...r, status: "rejected" } : r),
    }));
    setApprovingId(null);
  }

  function openNew() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(e: DbEvent) {
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
      host_id: e.host_id ?? "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const locationText = form.location_type === "tba" ? "__tba__" : form.location_type === "link" ? "" : form.location;
    const payload = {
      title_ja: form.title, title_ko: form.title, title_en: form.title,
      description_ja: form.description, description_ko: form.description, description_en: form.description,
      location_ja: locationText, location_ko: locationText, location_en: locationText,
      category: form.category,
      status: form.status,
      date: form.date,
      time_start: form.time_start,
      time_end: form.time_end || null,
      location_url: form.location_type === "tba" ? null : form.location_url || null,
      image_url: form.image_url,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      fee_type: form.fee_type,
      fee_amount: form.fee_type === "paid" && form.fee_amount ? parseInt(form.fee_amount) : null,
      host_id: form.host_id || null,
    };

    if (editId) {
      await supabase.from("bridge_events").update(payload).eq("id", editId);
    } else {
      await supabase.from("bridge_events").insert(payload);
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

  const statusLabel = (s: string) => {
    if (s === "approved") return tr.reg_status_approved;
    if (s === "rejected") return tr.reg_status_rejected;
    return tr.reg_status_pending;
  };
  const statusColor = (s: string) => {
    if (s === "approved") return "bg-green-100 text-green-700";
    if (s === "rejected") return "bg-red-100 text-red-600";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{tr.admin_events}</h1>
        <button
          onClick={openNew}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
        >
          {tr.admin_new_event}
        </button>
      </div>

      {/* Edit / New Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editId ? tr.admin_edit_event : tr.admin_new_event_title}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_host}</label>
                <select
                  value={form.host_id}
                  onChange={(e) => setForm((f) => ({ ...f, host_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">{lang === "ja" ? "選択してください" : lang === "en" ? "Select a host" : "호스트 선택"}</option>
                  {hosts.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <Field label={tr.field_title} name="title" form={form} setForm={setForm} />
              <Field label={tr.field_description} name="description" textarea form={form} setForm={setForm} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_category}</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                    {["meetup","party","sports","food","culture","other"].map((c) => (
                      <option key={c} value={c}>{tr[`cat_${c}` as keyof typeof tr] ?? c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_status}</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                    <option value="published">{tr.status_published}</option>
                    <option value="draft">{tr.status_draft}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_date}</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_time_start}</label>
                  <input type="time" value={form.time_start} onChange={(e) => setForm((f) => ({ ...f, time_start: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_time_end}</label>
                  <input type="time" value={form.time_end} onChange={(e) => setForm((f) => ({ ...f, time_end: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.location_type}</label>
                <select value={form.location_type} onChange={(e) => setForm((f) => ({ ...f, location_type: e.target.value, location: "", location_url: "" }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="address">{tr.location_address}</option>
                  <option value="link">{tr.location_link}</option>
                  <option value="tba">{tr.location_tba}</option>
                </select>
              </div>
              {form.location_type === "address" && (
                <Field label={tr.field_location} name="location" form={form} setForm={setForm} />
              )}
              {(form.location_type === "address" || form.location_type === "link") && (
                <Field label={tr.field_map_url} name="location_url" form={form} setForm={setForm} />
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_image}</label>
                <ImageUpload value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} folder="events" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_capacity}</label>
                  <input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_fee_type}</label>
                  <select value={form.fee_type} onChange={(e) => setForm((f) => ({ ...f, fee_type: e.target.value, fee_amount: "" }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary">
                    <option value="free">{tr.fee_free}</option>
                    <option value="paid">{tr.fee_paid}</option>
                    <option value="tba">{tr.fee_tba}</option>
                  </select>
                </div>
              </div>
              {form.fee_type === "paid" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_fee_amount}</label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">¥</span>
                    <input type="number" value={form.fee_amount} onChange={(e) => setForm((f) => ({ ...f, fee_amount: e.target.value }))}
                      placeholder="1500"
                      className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                {tr.admin_cancel}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                {saving ? tr.admin_saving : tr.admin_save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event list */}
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
            const regs = registrations[e.id] ?? [];
            const pendingCount = regs.filter((r) => r.status === "pending").length;

            return (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Card header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {e.status === "published" ? tr.status_published : tr.status_draft}
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

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {e.date} {e.time_start}
                    </span>
                    {loc && loc !== "__tba__" && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {loc}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Banknote className="h-3 w-3" />
                      {e.fee_type === "free" ? tr.fee_free : e.fee_type === "paid" && e.fee_amount ? `¥${e.fee_amount.toLocaleString()}` : tr.fee_tba}
                    </span>
                    {e.capacity && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {lang === "ja" ? `定員 ${e.capacity}名` : lang === "ko" ? `정원 ${e.capacity}명` : `Cap. ${e.capacity}`}
                      </span>
                    )}
                  </div>

                  {/* Applicants toggle */}
                  <button
                    onClick={() => toggleExpand(e.id)}
                    className="w-full flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      {tr.admin_applicants}: {count}명
                      {isExpanded && pendingCount > 0 && (
                        <span className="rounded-full bg-yellow-100 text-yellow-700 px-1.5 py-0.5 text-[10px] font-bold">
                          대기 {pendingCount}
                        </span>
                      )}
                    </span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Registrations panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    {regs.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">{tr.admin_no_applicants}</p>
                    ) : (
                      <div className="space-y-2">
                        {regs.map((r) => {
                          const profile = r.profile;
                          const initials = profile?.name?.charAt(0) ?? "?";
                          return (
                            <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                              {/* Avatar */}
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 overflow-hidden">
                                {profile?.avatar_url
                                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                  : initials
                                }
                              </div>
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{profile?.name ?? "—"}</p>
                                <p className="text-[10px] text-gray-400 truncate">{profile?.email ?? r.user_id.slice(0, 8)}</p>
                              </div>
                              {/* Status + Actions */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor(r.status)}`}>
                                  {statusLabel(r.status)}
                                </span>
                                {r.status === "pending" && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(r.id, e.id)}
                                      disabled={approvingId === r.id}
                                      className="rounded-lg bg-green-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-green-600 disabled:opacity-50"
                                    >
                                      {tr.admin_approve}
                                    </button>
                                    <button
                                      onClick={() => handleReject(r.id, e.id)}
                                      disabled={approvingId === r.id}
                                      className="rounded-lg bg-red-400 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-500 disabled:opacity-50"
                                    >
                                      {tr.admin_reject}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
