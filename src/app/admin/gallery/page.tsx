"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { DbGallery } from "@/lib/db";

export default function AdminGalleryPage() {
  const [items, setItems] = useState<DbGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ image_url: "", caption: "", sort_order: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("bridge_gallery").select("*").order("sort_order", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!form.image_url) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("bridge_gallery").insert({
      image_url: form.image_url,
      caption: form.caption,
      sort_order: parseInt(form.sort_order) || (items.length * 10),
    });
    setSaving(false);
    setForm({ image_url: "", caption: "", sort_order: "" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("사진을 삭제하시겠습니까?")) return;
    const supabase = createClient();
    await supabase.from("bridge_gallery").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">갤러리 관리</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
        >
          + 사진 추가
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">사진 추가</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">이미지 URL *</label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">캡션</label>
                <input
                  type="text"
                  value={form.caption}
                  onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">정렬 순서</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              {form.image_url && (
                <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image_url} alt="preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                취소
              </button>
              <button onClick={handleAdd} disabled={saving || !form.image_url}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                {saving ? "추가 중..." : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="aspect-square rounded-2xl bg-gray-100" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🖼️</div>
          <p className="font-medium">갤러리 사진이 없습니다</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-primary hover:underline">첫 사진 추가</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative rounded-2xl overflow-hidden bg-gray-100 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.caption} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-red-500 text-white text-xs font-bold px-3 py-1.5"
                >
                  삭제
                </button>
              </div>
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs truncate">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
