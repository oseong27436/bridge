"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getAllEvents, eventTitle, type DbEvent } from "@/lib/db";
import { MessageSquare, Send, Save, RotateCcw, ChevronDown } from "lucide-react";

type Action = "applied" | "approved" | "rejected";

interface Templates {
  ja: string;
  ko: string;
  en: string;
}

type AllTemplates = Record<Action, Templates>;

const DEFAULTS: AllTemplates = {
  applied: {
    ja: "📋 イベント「{eventTitle}」への参加申請を受け付けました。承認をお待ちください。",
    ko: "📋 이벤트 「{eventTitle}」 참가 신청이 접수되었습니다. 승인을 기다려주세요.",
    en: '📋 Your registration for "{eventTitle}" has been received. Please wait for approval.',
  },
  approved: {
    ja: "🎉 イベント「{eventTitle}」への参加が承認されました！当日お会いできるのを楽しみにしています。{openChatLine}",
    ko: "🎉 이벤트 「{eventTitle}」 참가가 승인되었습니다! 당일 뵙겠습니다.{openChatLine}",
    en: '🎉 Your registration for "{eventTitle}" has been approved! See you there!{openChatLine}',
  },
  rejected: {
    ja: "「{eventTitle}」への参加申請は今回見送りとなりました。またのご参加をお待ちしています。",
    ko: "「{eventTitle}」 참가 신청은 이번에 승인되지 않았습니다. 다음에 또 신청해주세요.",
    en: 'Your registration for "{eventTitle}" was not approved this time. Hope to see you at future events!',
  },
};

const ACTION_LABELS: Record<Action, string> = {
  applied: "신청 완료",
  approved: "승인",
  rejected: "거절",
};

const ACTION_COLORS: Record<Action, string> = {
  applied: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

const LANG_LABELS = { ja: "日本語", ko: "한국어", en: "English" };

export default function AdminLinePage() {
  const [tab, setTab] = useState<"template" | "broadcast">("broadcast");
  const [templates, setTemplates] = useState<AllTemplates>(JSON.parse(JSON.stringify(DEFAULTS)));
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [savingAction, setSavingAction] = useState<Action | null>(null);
  const [savedAction, setSavedAction] = useState<Action | null>(null);

  // broadcast
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [lineUserCount, setLineUserCount] = useState<number>(0);
  const [broadcastImageUrl, setBroadcastImageUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: number; fail: number } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    // load templates
    supabase.from("bridge_line_templates").select("action, lang, body").then(({ data }) => {
      if (data) {
        const next: AllTemplates = JSON.parse(JSON.stringify(DEFAULTS));
        data.forEach((t: { action: Action; lang: "ja" | "ko" | "en"; body: string }) => {
          next[t.action][t.lang] = t.body;
        });
        setTemplates(next);
      }
      setLoadingTemplates(false);
    });
    // load events
    getAllEvents().then((evs) => {
      setEvents(evs.filter((e) => e.status === "published" || !e.status));
    });
    // count LINE users
    supabase.from("bridge_profiles").select("id", { count: "exact" }).not("line_user_id", "is", null).then(({ count }) => {
      setLineUserCount(count ?? 0);
    });
  }, []);

  // Auto-fill broadcast message when event is selected
  useEffect(() => {
    if (!selectedEventId) { setBroadcastImageUrl(""); return; }
    const ev = events.find((e) => e.id === selectedEventId);
    if (!ev) return;
    const date = ev.date ? new Date(ev.date + "T00:00:00").toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" }) : "";
    const time = ev.time_start ? ` ${ev.time_start}〜` : "";
    const location = ev.location_ja || ev.location_ko || "";
    const fee = ev.fee_type === "free" ? "無料" : ev.fee_type === "paid" && ev.fee_amount ? `¥${ev.fee_amount.toLocaleString()}` : "料金未定";
    const linkLine = ev.location_url ? `\n🗺 ${ev.location_url}` : "";
    setBroadcastMsg(
      `📣 イベントのお知らせ\n\n「${ev.title_ja || ev.title_ko}」\n📅 ${date}${time}\n📍 ${location}${linkLine}\n💴 ${fee}\n\n参加申請はこちらからどうぞ！`
    );
    setBroadcastImageUrl(ev.image_url ?? "");
  }, [selectedEventId, events]);

  async function handleSaveAction(action: Action) {
    setSavingAction(action);
    const supabase = createClient();
    const rows = (["ja", "ko", "en"] as const).map((l) => ({
      action, lang: l, body: templates[action][l], updated_at: new Date().toISOString(),
    }));
    await supabase.from("bridge_line_templates").upsert(rows, { onConflict: "action,lang" });
    setSavingAction(null);
    setSavedAction(action);
    setTimeout(() => setSavedAction(null), 2000);
  }

  async function handleResetAction(action: Action) {
    if (!confirm("이 액션의 템플릿을 기본값으로 되돌릴까요?")) return;
    setTemplates((prev) => ({ ...prev, [action]: { ...DEFAULTS[action] } }));
    const supabase = createClient();
    const rows = (["ja", "ko", "en"] as const).map((l) => ({
      action, lang: l, body: DEFAULTS[action][l], updated_at: new Date().toISOString(),
    }));
    await supabase.from("bridge_line_templates").upsert(rows, { onConflict: "action,lang" });
  }

  async function handleBroadcast() {
    if (!broadcastMsg.trim()) return;
    if (!confirm(`LINE 연동 유저 ${lineUserCount}명에게 메시지를 발송할까요?`)) return;
    setSending(true);
    setSendResult(null);
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: broadcastMsg, imageUrl: broadcastImageUrl || null }),
    });
    const data = await res.json();
    setSendResult({ ok: data.ok ?? 0, fail: data.fail ?? 0 });
    setSending(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#06C755" }}>
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">LINE 관리</h1>
          <p className="text-xs text-gray-400 mt-0.5">LINE 연동 유저: {lineUserCount}명</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("broadcast")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "broadcast" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          일괄 발송
        </button>
        <button onClick={() => setTab("template")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "template" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          알림 템플릿
        </button>
      </div>

      {/* ── 일괄 발송 탭 ── */}
      {tab === "broadcast" && (
        <div className="space-y-4">
          {/* Event select */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-bold text-gray-700 mb-3">이벤트 선택 (선택사항)</p>
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 px-4 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
              >
                <option value="">— 이벤트 선택 안 함</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title_ja || ev.title_ko} {ev.date ? `(${ev.date})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-400 mt-2">이벤트를 선택하면 메시지가 자동으로 채워집니다.</p>
          </div>

          {/* Message */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-bold text-gray-700 mb-3">발송 메시지</p>
            <textarea
              rows={6}
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder={"LINE 연동 유저 전체에게 보낼 메시지를 입력하세요."}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
            {/* Image */}
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">이미지 URL (선택사항)</p>
              <div className="flex gap-2 items-center">
                <input
                  type="url"
                  value={broadcastImageUrl}
                  onChange={(e) => setBroadcastImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {broadcastImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={broadcastImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">이미지를 설정하면 텍스트 메시지 앞에 이미지가 먼저 발송됩니다.</p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-400">발송 대상: LINE 연동 유저 <span className="font-bold text-gray-700">{lineUserCount}명</span></p>
              <button
                onClick={handleBroadcast}
                disabled={sending || !broadcastMsg.trim() || lineUserCount === 0}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition"
              >
                <Send className="h-4 w-4" />
                {sending ? "발송 중..." : "전체 발송"}
              </button>
            </div>
            {sendResult && (
              <div className={`mt-3 rounded-xl px-4 py-3 text-sm font-semibold ${sendResult.fail === 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                ✅ 성공 {sendResult.ok}건{sendResult.fail > 0 ? ` / ❌ 실패 ${sendResult.fail}건` : ""}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 알림 템플릿 탭 ── */}
      {tab === "template" && (
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            <p className="font-bold mb-1">사용 가능한 변수</p>
            <ul className="space-y-0.5">
              <li><code className="bg-amber-100 px-1 rounded">{"{eventTitle}"}</code> — 이벤트명</li>
              <li><code className="bg-amber-100 px-1 rounded">{"{openChatLine}"}</code> — 오픈채팅 링크 (approved 전용, 설정된 경우 자동 삽입)</li>
            </ul>
          </div>

          {loadingTemplates ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
          ) : (
            (["applied", "approved", "rejected"] as Action[]).map((action) => (
              <div key={action} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${ACTION_COLORS[action]}`}>
                    {ACTION_LABELS[action]}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => handleResetAction(action)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="기본값으로 되돌리기">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleSaveAction(action)} disabled={savingAction === action}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        savedAction === action ? "bg-green-100 text-green-700" : "bg-primary text-white hover:bg-primary/90"
                      } disabled:opacity-60`}>
                      <Save className="h-3 w-3" />
                      {savingAction === action ? "저장 중..." : savedAction === action ? "저장됨 ✓" : "저장"}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {(["ja", "ko", "en"] as const).map((l) => (
                    <div key={l}>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{LANG_LABELS[l]}</label>
                      <textarea rows={2} value={templates[action][l]}
                        onChange={(e) => setTemplates((prev) => ({
                          ...prev,
                          [action]: { ...prev[action], [l]: e.target.value },
                        }))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
