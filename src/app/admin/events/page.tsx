"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { DbEvent } from "@/lib/db";
import ImageUpload from "@/components/admin/image-upload";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "meetup",
  status: "published",
  date: "",
  time_start: "19:00",
  time_end: "",
  location: "",
  location_url: "",
  image_url: "",
  capacity: "",
};

type FormData = typeof EMPTY_FORM;

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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("bridge_events").select("*").order("date", { ascending: false });
    setEvents(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(e: DbEvent) {
    setEditId(e.id);
    setForm({
      title: e.title_ko || e.title_ja || e.title_en,
      description: e.description_ko || e.description_ja || e.description_en,
      category: e.category,
      status: e.status,
      date: e.date,
      time_start: e.time_start,
      time_end: e.time_end ?? "",
      location: e.location_ko || e.location_ja || e.location_en,
      location_url: e.location_url ?? "",
      image_url: e.image_url,
      capacity: e.capacity?.toString() ?? "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title_ja: form.title,
      title_ko: form.title,
      title_en: form.title,
      description_ja: form.description,
      description_ko: form.description,
      description_en: form.description,
      location_ja: form.location,
      location_ko: form.location,
      location_en: form.location,
      category: form.category,
      status: form.status,
      date: form.date,
      time_start: form.time_start,
      time_end: form.time_end || null,
      location_url: form.location_url || null,
      image_url: form.image_url,
      capacity: form.capacity ? parseInt(form.capacity) : null,
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editId ? tr.admin_edit_event : tr.admin_new_event_title}</h2>
            <div className="space-y-3">
              <Field label={tr.field_title} name="title" form={form} setForm={setForm} />
              <Field label={tr.field_description} name="description" textarea form={form} setForm={setForm} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_category}</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {["meetup","party","sports","food","culture","other"].map((c) => (
                      <option key={c} value={c}>{tr[`cat_${c}` as keyof typeof tr] ?? c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_status}</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
                  >
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
              <Field label={tr.field_location} name="location" form={form} setForm={setForm} />
              <Field label={tr.field_map_url} name="location_url" form={form} setForm={setForm} />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_image}</label>
                <ImageUpload value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} folder="events" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_capacity}</label>
                <input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
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

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📅</div>
          <p className="font-medium">{tr.admin_no_events}</p>
          <button onClick={openNew} className="mt-3 text-sm text-primary hover:underline">{tr.admin_add_first_event}</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{tr.field_date}</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{tr.field_title}</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{tr.field_category}</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{tr.field_status}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{e.date}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{e.title_ko || e.title_ja}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-orange-100 text-orange-600 px-2 py-0.5 text-xs font-semibold">{e.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {e.status === "published" ? tr.status_published : tr.status_draft}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(e)} className="text-xs text-primary hover:underline">{tr.admin_edit}</button>
                      <button onClick={() => handleDelete(e.id)} className="text-xs text-red-500 hover:underline">{tr.admin_delete}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
