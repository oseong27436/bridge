"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { MessageSquare, Save, RotateCcw } from "lucide-react";

type Action = "applied" | "approved" | "rejected";
type Lang = "ja" | "ko" | "en";

interface Template {
  action: Action;
  lang: Lang;
  body: string;
}

const ACTIONS: { value: Action; label: string }[] = [
  { value: "applied", label: "신청 완료 (applied)" },
  { value: "approved", label: "승인 (approved)" },
  { value: "rejected", label: "거절 (rejected)" },
];

const LANGS: { value: Lang; label: string }[] = [
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
];

const DEFAULTS: Record<Action, Record<Lang, string>> = {
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
    en: "Your registration for \"{eventTitle}\" was not approved this time. Hope to see you at future events!",
  },
};

export default function AdminLinePage() {
  const [templates, setTemplates] = useState<Record<Action, Record<Lang, string>>>(() =>
    JSON.parse(JSON.stringify(DEFAULTS))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Lang>("ja");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("bridge_line_templates")
      .select("action, lang, body")
      .then(({ data }) => {
        if (data) {
          const next = JSON.parse(JSON.stringify(DEFAULTS)) as typeof templates;
          data.forEach((t: Template) => {
            next[t.action][t.lang] = t.body;
          });
          setTemplates(next);
        }
        setLoading(false);
      });
  }, []);

  async function handleSave(action: Action) {
    const key = `${action}-${activeLang}`;
    setSaving(key);
    const supabase = createClient();
    await supabase
      .from("bridge_line_templates")
      .upsert(
        { action, lang: activeLang, body: templates[action][activeLang], updated_at: new Date().toISOString() },
        { onConflict: "action,lang" }
      );
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  }

  async function handleReset(action: Action) {
    if (!confirm("デフォルトに戻しますか？")) return;
    const defaultBody = DEFAULTS[action][activeLang];
    setTemplates((prev) => ({
      ...prev,
      [action]: { ...prev[action], [activeLang]: defaultBody },
    }));
    const supabase = createClient();
    await supabase
      .from("bridge_line_templates")
      .upsert(
        { action, lang: activeLang, body: defaultBody, updated_at: new Date().toISOString() },
        { onConflict: "action,lang" }
      );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#06C755" }}>
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">LINE メッセージ管理</h1>
          <p className="text-xs text-gray-400 mt-0.5">通知メッセージのテンプレートを編集できます</p>
        </div>
      </div>

      {/* 사용 가능한 변수 안내 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-xs text-amber-800">
        <p className="font-bold mb-1">使用可能な変数</p>
        <ul className="space-y-0.5">
          <li><code className="bg-amber-100 px-1 rounded">{"{eventTitle}"}</code> — イベント名</li>
          <li><code className="bg-amber-100 px-1 rounded">{"{openChatLine}"}</code> — オープンチャットリンク（approved のみ、設定されている場合に自動挿入）</li>
        </ul>
      </div>

      {/* 언어 탭 */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {LANGS.map((l) => (
          <button
            key={l.value}
            onClick={() => setActiveLang(l.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              activeLang === l.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* 액션별 템플릿 */}
      <div className="space-y-5">
        {ACTIONS.map(({ value: action, label }) => {
          const key = `${action}-${activeLang}`;
          const isSaving = saving === key;
          const isSaved = saved === key;
          return (
            <div key={action} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className={`inline-block text-xs font-bold rounded-full px-2.5 py-0.5 ${
                    action === "applied" ? "bg-yellow-100 text-yellow-700"
                    : action === "approved" ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                  }`}>
                    {action}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">{label}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReset(action)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title="デフォルトに戻す"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleSave(action)}
                    disabled={isSaving}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isSaved
                        ? "bg-green-100 text-green-700"
                        : "bg-primary text-white hover:bg-primary/90"
                    } disabled:opacity-60`}
                  >
                    <Save className="h-3 w-3" />
                    {isSaving ? "保存中..." : isSaved ? "保存済み ✓" : "保存"}
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={templates[action][activeLang]}
                onChange={(e) =>
                  setTemplates((prev) => ({
                    ...prev,
                    [action]: { ...prev[action], [activeLang]: e.target.value },
                  }))
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none font-mono"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
