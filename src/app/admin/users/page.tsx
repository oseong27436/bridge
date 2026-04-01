"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  getProfiles, getUserRegistrations,
  type DbProfile, type DbRegistration,
} from "@/lib/db";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";

type EditForm = { name: string; gender: string };

export default function AdminUsersPage() {
  const { lang } = useLanguage();
  const tr = translations[lang];

  const [users, setUsers] = useState<DbProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lineFilter, setLineFilter] = useState<"all" | "linked" | "unlinked">("all");

  // Detail modal
  const [detail, setDetail] = useState<DbProfile | null>(null);
  const [registrations, setRegistrations] = useState<DbRegistration[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit modal
  const [editUser, setEditUser] = useState<DbProfile | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", gender: "" });
  const [saving, setSaving] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  async function load() {
    setLoading(true);
    setUsers(await getProfiles());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function openDetail(u: DbProfile) {
    setDetail(u);
    setLoadingDetail(true);
    setRegistrations(await getUserRegistrations(u.id));
    setLoadingDetail(false);
  }

  function openEdit(u: DbProfile) {
    setEditUser(u);
    setEditForm({ name: u.name, gender: u.gender ?? "" });
    setResetMsg(null);
  }

  async function handleSave() {
    if (!editUser) return;
    setSaving(true);
    await createClient().from("bridge_profiles").update({
      name: editForm.name,
      gender: editForm.gender || null,
    }).eq("id", editUser.id);
    setSaving(false);
    setEditUser(null);
    load();
  }

  async function handleResetPassword() {
    if (!editUser) return;
    setResetting(true);
    setResetMsg(null);
    const { error } = await createClient().auth.resetPasswordForEmail(editUser.email);
    setResetting(false);
    setResetMsg(error
      ? (lang === "ja" ? "送信に失敗しました" : lang === "en" ? "Failed to send" : "전송 실패")
      : (lang === "ja" ? "リセットメールを送信しました" : lang === "en" ? "Reset email sent" : "비밀번호 초기화 이메일을 발송했습니다")
    );
  }

  async function handleDelete(u: DbProfile) {
    if (!confirm(tr.admin_confirm_delete_user)) return;
    await createClient().from("bridge_profiles").delete().eq("id", u.id);
    load();
  }

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchLine = lineFilter === "all" ? true
      : lineFilter === "linked" ? !!u.line_user_id
      : !u.line_user_id;
    return matchSearch && matchLine;
  });
  const linkedCount = users.filter((u) => !!u.line_user_id).length;

  const statusColor: Record<string, string> = {
    registered: "bg-blue-100 text-blue-700",
    attended:   "bg-green-100 text-green-700",
    cancelled:  "bg-gray-100 text-gray-500",
  };

  const statusLabel: Record<string, string> = {
    registered: lang === "ja" ? "申込" : lang === "en" ? "Registered" : "신청",
    attended:   lang === "ja" ? "参加済" : lang === "en" ? "Attended" : "참여완료",
    cancelled:  lang === "ja" ? "キャンセル" : lang === "en" ? "Cancelled" : "취소",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{tr.admin_users}</h1>
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ja" ? "名前・メールで検索" : lang === "en" ? "Search by name or email" : "이름·이메일 검색"}
            className="outline-none text-sm w-48"
          />
        </div>
      </div>

      {/* LINE filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { value: "all", label: `전체 (${users.length})` },
          { value: "linked", label: `LINE 연동 (${linkedCount})` },
          { value: "unlinked", label: `미연동 (${users.length - linkedCount})` },
        ] as const).map((tab) => (
          <button key={tab.value} onClick={() => setLineFilter(tab.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              lineFilter === tab.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1,2,3,4].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">👥</div>
          <p className="font-medium">{tr.admin_no_users}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">{tr.field_name}</th>
                <th className="px-4 py-3 font-semibold text-gray-600">{tr.field_email}</th>
                <th className="px-4 py-3 font-semibold text-gray-600">{tr.field_role}</th>
                <th className="px-4 py-3 font-semibold text-gray-600">LINE</th>
                <th className="px-4 py-3 font-semibold text-gray-600">{tr.field_registrations}</th>
                <th className="px-4 py-3 font-semibold text-gray-600">{tr.field_attended}</th>
                <th className="px-4 py-3 font-semibold text-gray-600">{tr.field_joined}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={u.avatar_url} alt={u.name} className="w-8 h-8 rounded-full object-cover bg-gray-100" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                          {u.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"}`}>
                      {u.role === "admin" ? tr.role_admin : tr.role_user}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.line_user_id
                      ? <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700">연동됨</span>
                      : <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-400">미연동</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-700">{u.registration_count ?? 0}</td>
                  <td className="px-4 py-3 text-center font-semibold text-green-600">{u.attended_count ?? 0}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString(lang === "ja" ? "ja-JP" : lang === "en" ? "en-US" : "ko-KR") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openDetail(u)} className="text-xs text-gray-400 hover:text-gray-700 hover:underline">
                        {lang === "ja" ? "詳細" : lang === "en" ? "Detail" : "상세"}
                      </button>
                      <button onClick={() => openEdit(u)} className="text-xs text-primary hover:underline">{tr.admin_edit}</button>
                      <button onClick={() => handleDelete(u)} className="text-xs text-red-500 hover:underline">{tr.admin_delete}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            총 {filtered.length}명
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{tr.admin_user_detail}</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
              {detail.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={detail.avatar_url} alt={detail.name} className="w-14 h-14 rounded-full object-cover bg-gray-100" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-400">
                  {detail.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 text-lg">{detail.name}</p>
                <p className="text-sm text-gray-500">{detail.email}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${detail.role === "admin" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"}`}>
                    {detail.role === "admin" ? tr.role_admin : tr.role_user}
                  </span>
                  {detail.native_lang && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-600">{detail.native_lang}</span>
                  )}
                  {detail.gender && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
                      {detail.gender === "male" ? (lang === "ja" ? "男性" : lang === "en" ? "Male" : "남성") : (lang === "ja" ? "女性" : lang === "en" ? "Female" : "여성")}
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${detail.line_user_id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                    {detail.line_user_id ? "LINE 연동됨" : "LINE 미연동"}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-extrabold text-gray-800">{detail.registration_count ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">{tr.field_registrations}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-extrabold text-green-600">{detail.attended_count ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">{tr.field_attended}</p>
              </div>
            </div>

            {/* Registration history */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                {lang === "ja" ? "参加履歴" : lang === "en" ? "Event History" : "이벤트 이력"}
              </p>
              {loadingDetail ? (
                <div className="space-y-1.5">
                  {[1,2,3].map((i) => <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : registrations.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  {lang === "ja" ? "参加履歴なし" : lang === "en" ? "No event history" : "참여 이력이 없습니다"}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {registrations.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {r.event ? (r.event as { title_ko?: string; title_ja?: string; title_en?: string }).title_ko || (r.event as { title_ko?: string; title_ja?: string; title_en?: string }).title_ja : r.event_id}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(r.created_at).toLocaleDateString(lang === "ja" ? "ja-JP" : lang === "en" ? "en-US" : "ko-KR")}
                        </p>
                      </div>
                      <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {statusLabel[r.status] ?? r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-5 gap-2">
              <button onClick={() => { openEdit(detail); setDetail(null); }} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                {tr.admin_edit}
              </button>
              <button onClick={() => setDetail(null)} className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                {tr.admin_cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">{tr.admin_edit_user}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_name}</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_gender}</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">{lang === "ja" ? "未設定" : lang === "en" ? "Not set" : "미설정"}</option>
                  <option value="male">{tr.signup_male}</option>
                  <option value="female">{tr.signup_female}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tr.field_email}</label>
                <input
                  type="text"
                  value={editUser.email}
                  disabled
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-400"
                />
              </div>
              <div className="pt-1">
                <button
                  onClick={handleResetPassword}
                  disabled={resetting}
                  className="w-full rounded-lg border border-orange-300 px-3 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 disabled:opacity-60"
                >
                  {resetting
                    ? (lang === "ja" ? "送信中..." : lang === "en" ? "Sending..." : "전송 중...")
                    : (lang === "ja" ? "パスワードリセットメールを送信" : lang === "en" ? "Send Password Reset Email" : "비밀번호 초기화 이메일 발송")}
                </button>
                {resetMsg && (
                  <p className={`mt-1.5 text-xs text-center ${resetMsg.includes("失敗") || resetMsg.includes("Failed") || resetMsg.includes("실패") ? "text-red-500" : "text-green-600"}`}>
                    {resetMsg}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setEditUser(null)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                {tr.admin_cancel}
              </button>
              <button onClick={handleSave} disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                {saving ? tr.admin_saving : tr.admin_save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
