"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { DbHost } from "@/lib/db";
import ImageUpload from "@/components/admin/image-upload";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const EMPTY_FORM = {
  name: "", avatar_url: "", location: "", langs: "", bio: "",
};
type FormData = typeof EMPTY_FORM;

function Field({ label, name, textarea, form, setForm }: {
  label: string;
  name: keyof FormData;
  textarea?: boolean;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {textarea ? (
        <textarea rows={3} value={form[name]} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
      ) : (
        <input type="text" value={form[name]} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
      )}
    </div>
  );
}

function SortableCard({ host, onEdit, onDelete, editLabel, deleteLabel }: {
  host: DbHost;
  onEdit: (h: DbHost) => void;
  onDelete: (id: string) => void;
  editLabel: string;
  deleteLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: host.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-white rounded-2xl border border-gray-200 p-4 cursor-grab active:cursor-grabbing select-none ${isDragging ? "shadow-xl opacity-80 z-50 ring-2 ring-primary" : "hover:shadow-md"}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-gray-300 text-lg">⠿</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={host.avatar_url} alt={host.name} className="h-12 w-12 rounded-full object-cover bg-gray-100" />
        <div>
          <p className="font-bold text-gray-900">{host.name}</p>
          <p className="text-xs text-gray-400">{host.location}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {host.langs.map((l) => (
          <span key={l} className="rounded-full bg-blue-50 text-blue-600 px-2 py-0.5 text-xs font-semibold">{l}</span>
        ))}
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{host.bio_ko || host.bio_ja}</p>
      <div className="flex gap-2">
        <button onClick={() => onEdit(host)} className="text-xs text-primary hover:underline">{editLabel}</button>
        <button onClick={() => onDelete(host.id)} className="text-xs text-red-500 hover:underline">{deleteLabel}</button>
      </div>
    </div>
  );
}

export default function AdminHostsPage() {
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [hosts, setHosts] = useState<DbHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("bridge_hosts").select("*").order("sort_order", { ascending: true });
    setHosts(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = hosts.findIndex((h) => h.id === active.id);
    const newIndex = hosts.findIndex((h) => h.id === over.id);
    const reordered = arrayMove(hosts, oldIndex, newIndex);
    setHosts(reordered);
    const supabase = createClient();
    await Promise.all(reordered.map((h, i) => supabase.from("bridge_hosts").update({ sort_order: i }).eq("id", h.id)));
  }

  function openNew() { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); }

  function openEdit(h: DbHost) {
    setEditId(h.id);
    setForm({ name: h.name, avatar_url: h.avatar_url, location: h.location, langs: h.langs.join(", "), bio: h.bio_ko || h.bio_ja || h.bio_en });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name, avatar_url: form.avatar_url, location: form.location,
      langs: form.langs.split(",").map((s) => s.trim()).filter(Boolean),
      bio_ja: form.bio, bio_ko: form.bio, bio_en: form.bio,
      sort_order: editId ? hosts.find((h) => h.id === editId)?.sort_order ?? 0 : hosts.length,
    };
    if (editId) { await supabase.from("bridge_hosts").update(payload).eq("id", editId); }
    else { await supabase.from("bridge_hosts").insert(payload); }
    setSaving(false); setShowForm(false); load();
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === "ja" ? "ホストを削除しますか？" : lang === "en" ? "Delete this host?" : "호스트를 삭제하시겠습니까?")) return;
    await createClient().from("bridge_hosts").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tr.admin_hosts}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{tr.admin_drag_reorder}</p>
        </div>
        <button onClick={openNew} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
          {tr.admin_new_host}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl w-full max-w-xl mx-4 p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editId ? tr.admin_edit_host : tr.admin_new_host_title}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label={tr.field_name} name="name" form={form} setForm={setForm} />
                <Field label={tr.field_position} name="location" form={form} setForm={setForm} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_avatar}</label>
                <ImageUpload value={form.avatar_url} onChange={(url) => setForm((f) => ({ ...f, avatar_url: url }))} folder="hosts" />
              </div>
              <Field label={tr.field_langs} name="langs" form={form} setForm={setForm} />
              <Field label={tr.field_bio} name="bio" textarea form={form} setForm={setForm} />
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">{tr.admin_cancel}</button>
              <button onClick={handleSave} disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                {saving ? tr.admin_saving : tr.admin_save}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1,2,3].map((i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl" />)}
        </div>
      ) : hosts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">👤</div>
          <p className="font-medium">{tr.admin_no_hosts}</p>
          <button onClick={openNew} className="mt-3 text-sm text-primary hover:underline">{tr.admin_add_first_host}</button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={hosts.map((h) => h.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hosts.map((h) => (
                <SortableCard
                  key={h.id}
                  host={h}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  editLabel={tr.admin_edit}
                  deleteLabel={tr.admin_delete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
