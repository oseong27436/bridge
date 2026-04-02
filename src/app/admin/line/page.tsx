"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getAllEvents, getEventImages, type DbEvent, type DbEventImage } from "@/lib/db";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/i18n";
import { MessageSquare, Send, Save, RotateCcw, ChevronDown, Inbox, CornerDownRight, Users, Globe } from "lucide-react";

type Action = "applied" | "approved" | "rejected";
type Tab = "inbox" | "broadcast" | "template";
type TargetType = "all" | "event";

interface LineMessage {
  id: string;
  line_user_id: string;
  display_name: string | null;
  picture_url: string | null;
  message_text: string;
  created_at: string;
  replied_at: string | null;
  reply_text: string | null;
}

const DEFAULTS: Record<Action, string> = {
  applied:
    "📋 イベント「{eventTitle}」への参加申請を受け付けました。承認をお待ちください。\n\n---\n\n📋 Your registration for \"{eventTitle}\" has been received. Please wait for approval.",
  approved:
    "🎉 イベント「{eventTitle}」への参加が承認されました！当日お会いできるのを楽しみにしています。{openChatLine}\n\n---\n\n🎉 Your registration for \"{eventTitle}\" has been approved! See you there!",
  rejected:
    "「{eventTitle}」への参加申請は今回見送りとなりました。またのご参加をお待ちしています。\n\n---\n\nYour registration for \"{eventTitle}\" was not approved this time. Hope to see you at future events!",
};

const ACTION_COLORS: Record<Action, string> = {
  applied: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

export default function AdminLinePage() {
  const { lang } = useLanguage();
  const tr = translations[lang];
  const [tab, setTab] = useState<Tab>("inbox");
  const [templates, setTemplates] = useState<Record<Action, string>>({ ...DEFAULTS });
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [savingAction, setSavingAction] = useState<Action | null>(null);
  const [savedAction, setSavedAction] = useState<Action | null>(null);

  // inbox
  const [messages, setMessages] = useState<LineMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  // broadcast
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [lineUserCount, setLineUserCount] = useState<number>(0);
  const [eventLineCount, setEventLineCount] = useState<number | null>(null);
  const [loadingEventCount, setLoadingEventCount] = useState(false);
  const [eventImages, setEventImages] = useState<{ url: string; id: string }[]>([]);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: number; fail: number } | null>(null);

  const ACTION_LABELS: Record<Action, Record<string, string>> = {
    applied: { ja: "申請完了", ko: "신청 완료", en: "Applied" },
    approved: { ja: "承認", ko: "승인", en: "Approved" },
    rejected: { ja: "拒否", ko: "거절", en: "Rejected" },
  };

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("bridge_line_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setMessages(data ?? []);
        setLoadingMessages(false);
      });

    supabase
      .from("bridge_line_templates")
      .select("action, body")
      .eq("lang", "all")
      .then(({ data }) => {
        if (data?.length) {
          const next: Record<Action, string> = { ...DEFAULTS };
          data.forEach((t: { action: Action; body: string }) => {
            next[t.action] = t.body;
          });
          setTemplates(next);
        }
        setLoadingTemplates(false);
      });

    getAllEvents().then((evs) => {
      setEvents(evs.filter((e) => e.status === "published" || e.status === "finished" || !e.status));
    });

    supabase
      .from("bridge_profiles")
      .select("id", { count: "exact" })
      .not("line_user_id", "is", null)
      .then(({ count }) => setLineUserCount(count ?? 0));
  }, []);

  // Load event images + registrant LINE count when event changes
  useEffect(() => {
    setSelectedImageUrls([]);
    setEventImages([]);
    setEventLineCount(null);

    if (!selectedEventId) { setBroadcastMsg(""); return; }

    const ev = events.find((e) => e.id === selectedEventId);
    if (!ev) return;

    // Auto-fill message
    const dateJa = ev.date ? new Date(ev.date + "T00:00:00").toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" }) : "";
    const dateEn = ev.date ? new Date(ev.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", weekday: "long" }) : "";
    const time = ev.time_start ? ` ${ev.time_start}〜` : "";
    const locationJa = ev.location_ja || ev.location_ko || "";
    const locationEn = ev.location_en || ev.location_ja || ev.location_ko || "";
    const feeJa = ev.fee_type === "free" ? "無料" : ev.fee_type === "paid" && ev.fee_amount ? `¥${ev.fee_amount.toLocaleString()}` : "料金未定";
    const feeEn = ev.fee_type === "free" ? "Free" : ev.fee_type === "paid" && ev.fee_amount ? `¥${ev.fee_amount.toLocaleString()}` : "TBA";
    const titleJa = ev.title_ja || ev.title_ko || "";
    const titleEn = ev.title_en || ev.title_ja || ev.title_ko || "";
    const linkLine = ev.location_url ? `\n🗺 ${ev.location_url}` : "";
    setBroadcastMsg(
      `📣 イベントのお知らせ\n\n「${titleJa}」\n📅 ${dateJa}${time}\n📍 ${locationJa}${linkLine}\n💴 ${feeJa}\n\n参加申請はこちらからどうぞ！` +
      `\n\n---\n\n` +
      `📣 Event Announcement\n\n「${titleEn}」\n📅 ${dateEn}${time}\n📍 ${locationEn}${linkLine}\n💴 ${feeEn}\n\nTo apply for participation, click here!`
    );

    // Load event images
    const imgs: { url: string; id: string }[] = [];
    if (ev.image_url) imgs.push({ id: "main", url: ev.image_url });
    getEventImages(selectedEventId).then((dbImgs: DbEventImage[]) => {
      dbImgs.forEach((img) => {
        if (!imgs.find((i) => i.url === img.image_url)) {
          imgs.push({ id: img.id, url: img.image_url });
        }
      });
      setEventImages(imgs);
    });
  }, [selectedEventId, events]);

  // Load LINE-connected registrant count when targetType=event
  useEffect(() => {
    if (targetType !== "event" || !selectedEventId) { setEventLineCount(null); return; }
    setLoadingEventCount(true);
    const supabase = createClient();
    supabase
      .from("bridge_registrations")
      .select("user_id")
      .eq("event_id", selectedEventId)
      .in("status", ["pending", "approved", "attended"])
      .then(async ({ data: regs }) => {
        if (!regs?.length) { setEventLineCount(0); setLoadingEventCount(false); return; }
        const userIds = regs.map((r: { user_id: string }) => r.user_id);
        const { count } = await supabase
          .from("bridge_profiles")
          .select("id", { count: "exact" })
          .in("id", userIds)
          .not("line_user_id", "is", null);
        setEventLineCount(count ?? 0);
        setLoadingEventCount(false);
      });
  }, [targetType, selectedEventId]);

  function toggleImage(url: string) {
    setSelectedImageUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  }

  async function handleSaveAction(action: Action) {
    setSavingAction(action);
    const supabase = createClient();
    await supabase.from("bridge_line_templates").upsert(
      [{ action, lang: "all", body: templates[action], updated_at: new Date().toISOString() }],
      { onConflict: "action,lang" }
    );
    setSavingAction(null);
    setSavedAction(action);
    setTimeout(() => setSavedAction(null), 2000);
  }

  async function handleResetAction(action: Action) {
    if (!confirm(tr.line_reset_confirm)) return;
    setTemplates((prev) => ({ ...prev, [action]: DEFAULTS[action] }));
    const supabase = createClient();
    await supabase.from("bridge_line_templates").upsert(
      [{ action, lang: "all", body: DEFAULTS[action], updated_at: new Date().toISOString() }],
      { onConflict: "action,lang" }
    );
  }

  async function handleBroadcast() {
    if (!broadcastMsg.trim()) return;
    const targetCount = targetType === "event" ? eventLineCount : lineUserCount;
    const targetLabel = targetType === "event"
      ? `이 이벤트 신청자 중 LINE 연동 ${targetCount}명`
      : `LINE 연동 전체 유저 ${targetCount}명`;
    if (!confirm(`${targetLabel}에게 메시지를 발송할까요?`)) return;
    setSending(true);
    setSendResult(null);
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: broadcastMsg,
        imageUrls: selectedImageUrls,
        targetType,
        eventId: selectedEventId || null,
      }),
    });
    const data = await res.json();
    setSendResult({ ok: data.ok ?? 0, fail: data.fail ?? 0 });
    setSending(false);
  }

  async function handleSendReply(msg: LineMessage) {
    const text = replyTexts[msg.id]?.trim();
    if (!text) return;
    setSendingReply(msg.id);
    const res = await fetch("/api/line/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msg.id, lineUserId: msg.line_user_id, text }),
    });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, replied_at: new Date().toISOString(), reply_text: text } : m
        )
      );
      setReplyTexts((prev) => ({ ...prev, [msg.id]: "" }));
      setReplyingId(null);
    }
    setSendingReply(null);
  }

  const recipientCount = targetType === "event" ? eventLineCount : lineUserCount;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#06C755" }}>
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">{tr.admin_line}</h1>
          <p className="text-xs text-gray-400 mt-0.5">LINE {lang === "ja" ? "連携ユーザー" : lang === "en" ? "linked users" : "연동 유저"}: {lineUserCount}{lang === "ja" ? "名" : lang === "en" ? "" : "명"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("inbox")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "inbox" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Inbox className="h-3.5 w-3.5" />
          {tr.line_inbox_tab}
          {messages.filter((m) => !m.replied_at).length > 0 && (
            <span className="ml-1 rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
              {messages.filter((m) => !m.replied_at).length}
            </span>
          )}
        </button>
        <button onClick={() => setTab("broadcast")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "broadcast" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          {tr.line_broadcast_tab}
        </button>
        <button onClick={() => setTab("template")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "template" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          {tr.line_template_tab}
        </button>
      </div>

      {/* ── 받은 메시지 탭 ── */}
      {tab === "inbox" && (
        <div className="space-y-3">
          {loadingMessages ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
          ) : messages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
              {tr.line_inbox_empty}
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`bg-white rounded-2xl border p-4 ${msg.replied_at ? "border-gray-200" : "border-green-200"}`}>
                <div className="flex items-center gap-3 mb-3">
                  {msg.picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.picture_url} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm shrink-0">
                      {msg.display_name?.[0] ?? "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{msg.display_name ?? msg.line_user_id}</p>
                    <p className="text-[11px] text-gray-400">{new Date(msg.created_at).toLocaleString(lang === "ja" ? "ja-JP" : lang === "en" ? "en-US" : "ko-KR")}</p>
                  </div>
                  {msg.replied_at ? (
                    <span className="shrink-0 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1">{tr.line_inbox_replied}</span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1">NEW</span>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap mb-3">
                  {msg.message_text}
                </div>
                {msg.replied_at && msg.reply_text && (
                  <div className="flex items-start gap-2 mb-3">
                    <CornerDownRight className="h-3.5 w-3.5 text-gray-400 mt-1 shrink-0" />
                    <div className="bg-green-50 rounded-xl px-4 py-3 text-sm text-green-800 whitespace-pre-wrap flex-1">
                      {msg.reply_text}
                    </div>
                  </div>
                )}
                {!msg.replied_at && (
                  replyingId === msg.id ? (
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={replyTexts[msg.id] ?? ""}
                        onChange={(e) => setReplyTexts((prev) => ({ ...prev, [msg.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(msg); } }}
                        placeholder={tr.line_inbox_reply_placeholder}
                        className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSendReply(msg)}
                        disabled={sendingReply === msg.id || !replyTexts[msg.id]?.trim()}
                        className="shrink-0 flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {sendingReply === msg.id ? "..." : tr.line_inbox_send_reply}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingId(msg.id)}
                      className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
                    >
                      <CornerDownRight className="h-3.5 w-3.5" />
                      {tr.line_inbox_reply}
                    </button>
                  )
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── 일괄 발송 탭 ── */}
      {tab === "broadcast" && (
        <div className="space-y-4">
          {/* Target type */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-bold text-gray-700 mb-3">
              {lang === "ja" ? "送信対象" : lang === "en" ? "Recipients" : "발송 대상"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setTargetType("all")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  targetType === "all" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Globe className="h-4 w-4" />
                {lang === "ja" ? "LINE連携全員" : lang === "en" ? "All LINE users" : "LINE 연동 전체"}
                <span className="ml-1 text-xs font-bold text-gray-400">({lineUserCount}{lang === "ja" ? "名" : lang === "en" ? "" : "명"})</span>
              </button>
              <button
                onClick={() => setTargetType("event")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  targetType === "event" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Users className="h-4 w-4" />
                {lang === "ja" ? "イベント申請者" : lang === "en" ? "Event registrants" : "이벤트 신청자"}
                {targetType === "event" && eventLineCount !== null && (
                  <span className="ml-1 text-xs font-bold text-gray-400">({eventLineCount}{lang === "ja" ? "名" : lang === "en" ? "" : "명"})</span>
                )}
              </button>
            </div>
          </div>

          {/* Event select */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-bold text-gray-700 mb-3">{tr.line_event_select}</p>
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 px-4 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
              >
                <option value="">{tr.line_event_none}</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title_ja || ev.title_ko} {ev.date ? `(${ev.date})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-400 mt-2">{tr.line_event_select_desc}</p>
          </div>

          {/* Event image picker */}
          {selectedEventId && eventImages.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-sm font-bold text-gray-700 mb-1">
                {lang === "ja" ? "画像を選択（複数可）" : lang === "en" ? "Select images (multiple)" : "이미지 선택 (다중 가능)"}
              </p>
              <p className="text-xs text-gray-400 mb-3">
                {lang === "ja" ? "選択した画像がテキストより先に送信されます。最大4枚。" : lang === "en" ? "Selected images will be sent before the text. Max 4." : "선택한 이미지가 텍스트 앞에 먼저 발송됩니다. 최대 4장."}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {eventImages.map((img) => {
                  const selected = selectedImageUrls.includes(img.url);
                  const idx = selectedImageUrls.indexOf(img.url);
                  const disabled = !selected && selectedImageUrls.length >= 4;
                  return (
                    <button
                      key={img.id}
                      onClick={() => !disabled && toggleImage(img.url)}
                      disabled={disabled}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        selected ? "border-primary" : "border-transparent"
                      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {selected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedImageUrls.length > 0 && (
                <button onClick={() => setSelectedImageUrls([])} className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline">
                  {lang === "ja" ? "選択解除" : lang === "en" ? "Clear selection" : "선택 해제"}
                </button>
              )}
            </div>
          )}

          {/* Message */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-bold text-gray-700 mb-3">{tr.line_msg_label}</p>
            <textarea
              rows={8}
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder={lang === "ja" ? "メッセージを入力してください。" : lang === "en" ? "Enter a message." : "메시지를 입력하세요."}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-400">
                {lang === "ja" ? "送信対象: " : lang === "en" ? "To: " : "발송 대상: "}
                <span className="font-bold text-gray-700">
                  {targetType === "event"
                    ? loadingEventCount
                      ? "..."
                      : `${lang === "ja" ? "イベント申請者" : lang === "en" ? "event registrants" : "이벤트 신청자"} ${eventLineCount ?? 0}${lang === "ja" ? "名" : lang === "en" ? "" : "명"}`
                    : `${lang === "ja" ? "LINE全員" : lang === "en" ? "all LINE users" : "LINE 전체"} ${lineUserCount}${lang === "ja" ? "名" : lang === "en" ? "" : "명"}`
                  }
                </span>
              </p>
              <button
                onClick={handleBroadcast}
                disabled={sending || !broadcastMsg.trim() || (recipientCount ?? 0) === 0 || (targetType === "event" && !selectedEventId)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition"
              >
                <Send className="h-4 w-4" />
                {sending ? tr.line_sending : tr.line_send_btn}
              </button>
            </div>
            {sendResult && (
              <div className={`mt-3 rounded-xl px-4 py-3 text-sm font-semibold ${sendResult.fail === 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                ✅ {sendResult.ok}{tr.line_result_ok}{sendResult.fail > 0 ? ` / ❌ ${sendResult.fail}${tr.line_result_fail}` : ""}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 알림 템플릿 탭 ── */}
      {tab === "template" && (
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            <p className="font-bold mb-1">{tr.line_vars_title}</p>
            <ul className="space-y-0.5">
              <li><code className="bg-amber-100 px-1 rounded">{"{eventTitle}"}</code> — {lang === "ja" ? "イベント名" : lang === "en" ? "event title" : "이벤트명"}</li>
              <li><code className="bg-amber-100 px-1 rounded">{"{openChatLine}"}</code> — {lang === "ja" ? "オープンチャットリンク（approved専用）" : lang === "en" ? "open chat link (approved only)" : "오픈채팅 링크 (approved 전용)"}</li>
            </ul>
          </div>

          {loadingTemplates ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
          ) : (
            (["applied", "approved", "rejected"] as Action[]).map((action) => (
              <div key={action} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${ACTION_COLORS[action]}`}>
                    {ACTION_LABELS[action][lang]}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => handleResetAction(action)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title={lang === "ja" ? "デフォルトに戻す" : lang === "en" ? "Reset to default" : "기본값으로 되돌리기"}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleSaveAction(action)} disabled={savingAction === action}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        savedAction === action ? "bg-green-100 text-green-700" : "bg-primary text-white hover:bg-primary/90"
                      } disabled:opacity-60`}>
                      <Save className="h-3 w-3" />
                      {savingAction === action ? tr.admin_saving : savedAction === action ? "✓" : tr.admin_save}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={templates[action]}
                  onChange={(e) => setTemplates((prev) => ({ ...prev, [action]: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-mono"
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
