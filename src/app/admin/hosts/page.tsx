"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { DbHost } from "@/lib/db";
import ImageUpload from "@/components/admin/image-upload";

const EMPTY_FORM = {
  name: "",
  avatar_url: "",
  location: "",
  langs: "",
  bio: "",
  sort_order: "0",
};

type FormData = typeof EMPTY_FORM;

export default function AdminHostsPage() {
  const [hosts, setHosts] = useState<DbHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("bridge_hosts").select("*").order("sort_order", { ascending: true });
    setHosts(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(h: DbHost) {
    setEditId(h.id);
    setForm({
      name: h.name,
      avatar_url: h.avatar_url,
      location: h.location,
      langs: h.langs.join(", "),
      bio: h.bio_ko || h.bio_ja || h.bio_en,
      sort_order: h.sort_order.toString(),
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name,
      avatar_url: form.avatar_url,
      location: form.location,
      langs: form.langs.split(",").map((s) => s.trim()).filter(Boolean),
      bio_ja: form.bio,
      bio_ko: form.bio,
      bio_en: form.bio,
      sort_order: parseInt(form.sort_order) || 0,
    };

    if (editId) {
      await supabase.from("bridge_hosts").update(payload).eq("id", editId);
    } else {
      await supabase.from("bridge_hosts").insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("호스트를 삭제하시겠습니까?")) return;
    const supabase = createClient();
    await supabase.from("bridge_hosts").delete().eq("id", id);
    load();
  }

  function Field({ label, name, textarea }: { label: string; name: keyof FormData; textarea?: boolean }) {
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
            type="text"
            value={form[name]}
            onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">호스트 관리</h1>
        <button
          onClick={openNew}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
        >
          + 새 호스트
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl w-full max-w-xl mx-4 p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editId ? "호스트 수정" : "새 호스트"}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="이름" name="name" />
                <Field label="위치" name="location" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">아바타 이미지</label>
                <ImageUpload value={form.avatar_url} onChange={(url) => setForm((f) => ({ ...f, avatar_url: url }))} folder="hosts" />
              </div>
              <Field label="언어 (쉼표로 구분, 예: 한국어, 日本語)" name="langs" />
              <Field label="소개" name="bio" textarea />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">정렬 순서</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                취소
              </button>
              <button onClick={handleSave} disabled={saving}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1,2,3].map((i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl" />)}
        </div>
      ) : hosts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">👤</div>
          <p className="font-medium">호스트가 없습니다</p>
          <button onClick={openNew} className="mt-3 text-sm text-primary hover:underline">첫 호스트 추가</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hosts.map((h) => (
            <div key={h.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.avatar_url} alt={h.name} className="h-12 w-12 rounded-full object-cover bg-gray-100" />
                <div>
                  <p className="font-bold text-gray-900">{h.name}</p>
                  <p className="text-xs text-gray-400">{h.location}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {h.langs.map((l) => (
                  <span key={l} className="rounded-full bg-blue-50 text-blue-600 px-2 py-0.5 text-xs font-semibold">{l}</span>
                ))}
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{h.bio_ko || h.bio_ja}</p>
              <div className="flex gap-2">
                <button onClick={() => openEdit(h)} className="text-xs text-primary hover:underline">수정</button>
                <button onClick={() => handleDelete(h.id)} className="text-xs text-red-500 hover:underline">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
