"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { DbGallery } from "@/lib/db";
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

function SortablePhoto({ item, onDelete, deleteLabel }: { item: DbGallery; onDelete: (id: string) => void; deleteLabel: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative rounded-2xl overflow-hidden bg-gray-100 aspect-square ${isDragging ? "shadow-xl opacity-80 z-50" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.image_url} alt={item.caption} className="h-full w-full object-cover" />
      <div
        {...listeners}
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing bg-black/40 text-white rounded-lg px-1.5 py-0.5 text-sm select-none"
      >
        ⠿
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <button
          onClick={() => onDelete(item.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-red-500 text-white text-xs font-bold px-3 py-1.5"
        >
          {deleteLabel}
        </button>
      </div>
      {item.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <p className="text-white text-xs truncate">{item.caption}</p>
        </div>
      )}
    </div>
  );
}

export default function AdminGalleryPage() {
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [items, setItems] = useState<DbGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ image_url: "", caption: "" });
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("bridge_gallery").select("*").order("sort_order", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    const supabase = createClient();
    await Promise.all(reordered.map((item, i) => supabase.from("bridge_gallery").update({ sort_order: i }).eq("id", item.id)));
  }

  async function handleAdd() {
    if (!form.image_url) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("bridge_gallery").insert({
      image_url: form.image_url,
      caption: form.caption,
      sort_order: items.length,
    });
    setSaving(false);
    setForm({ image_url: "", caption: "" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === "ja" ? "写真を削除しますか？" : lang === "en" ? "Delete this photo?" : "사진을 삭제하시겠습니까?")) return;
    await createClient().from("bridge_gallery").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tr.admin_gallery}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{tr.admin_drag_reorder}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
        >
          {tr.admin_new_photo}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">{tr.admin_add_photo_title}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_image}</label>
                <ImageUpload value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} folder="gallery" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_caption}</label>
                <input
                  type="text"
                  value={form.caption}
                  onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                {tr.admin_cancel}
              </button>
              <button onClick={handleAdd} disabled={saving || !form.image_url}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                {saving ? tr.admin_adding : tr.admin_add}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="aspect-square rounded-2xl bg-gray-100" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🖼️</div>
          <p className="font-medium">{tr.admin_no_photos}</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-primary hover:underline">{tr.admin_add_first_photo}</button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <SortablePhoto key={item.id} item={item} onDelete={handleDelete} deleteLabel={tr.admin_delete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
