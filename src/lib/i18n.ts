export type Lang = "ja" | "ko" | "en";

export const translations = {
  ja: {
    // Nav
    nav_home: "HOME",
    nav_events: "EVENTS",
    nav_about: "ABOUT",
    login: "ログイン",
    signup: "登録",

    // Hero
    hero_tagline: "大阪で新しい友達を作ろう",
    hero_cta: "イベントを見る",

    // Sections
    event_type: "イベントタイプ",
    about_bridge: "Bridgeについて",
    recommended: "おすすめ",
    latest_reviews: "最新レビュー",
    photo_gallery: "フォトギャラリー",
    tab_today: "今日",
    tab_new: "新着",
    tab_popular: "人気",
    more: "もっと見る >",

    // Event type descriptions
    meetup_desc: "大阪で気軽に集まれるミートアップ。新しい人と出会い、友達を作ろう。",
    party_desc: "音楽・ドリンク・最高の雰囲気でみんなと楽しもう。",
    food_desc: "大阪のグルメを一緒に楽しむフードツアーや食べ歩き。",

    // About text
    about_text:
      "BridgeはOsaka発の国際コミュニティです。ミートアップ・パーティー・フードツアー・スポーツなど多彩なイベントを年間を通じて開催しています。韓国人・日本人・外国人、みんな歓迎。一人でも、友達と一緒でも気軽に参加してください。",

    // Events page
    events_title: "大阪のイベント",
    events_found: "件のイベントが見つかりました",
    clear: "クリア",
    going: "参加",
    spots: "名",
    address_after_approval: "承認後に詳細をお知らせ",

    // Calendar
    months: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
    days: ["日","月","火","水","木","金","土"],

    // Categories
    cat_all: "すべて",
    cat_meetup: "ミートアップ",
    cat_party: "パーティー",
    cat_sports: "スポーツ",
    cat_food: "フード",
    cat_culture: "カルチャー",
    cat_other: "その他",

    // Quick filters
    filter_today: "今日",
    filter_weekend: "今週末",
    filter_korean: "韓国語",
    filter_japanese: "日本語",
    filter_english: "英語",
  },

  ko: {
    nav_home: "HOME",
    nav_events: "EVENTS",
    nav_about: "ABOUT",
    login: "로그인",
    signup: "회원가입",

    hero_tagline: "오사카에서 새로운 친구를 만들어요",
    hero_cta: "이벤트 보기",

    event_type: "이벤트 종류",
    about_bridge: "Bridge 소개",
    recommended: "추천",
    latest_reviews: "최근 리뷰",
    photo_gallery: "포토 갤러리",
    tab_today: "오늘",
    tab_new: "신규",
    tab_popular: "인기",
    more: "더보기 >",

    meetup_desc: "오사카에서 편하게 모이는 미팅. 새로운 사람들과 친구를 사귀어요.",
    party_desc: "음악·음료·최고의 분위기로 함께 즐겨요.",
    food_desc: "오사카 맛집을 함께 즐기는 푸드 투어.",

    about_text:
      "Bridge는 오사카 기반의 국제 커뮤니티입니다. 미팅·파티·푸드 투어·스포츠 등 다양한 이벤트를 연중 개최합니다. 한국인·일본인·외국인 모두 환영. 혼자도, 친구와 함께도 편하게 참가하세요.",

    events_title: "오사카 이벤트",
    events_found: "개의 이벤트",
    clear: "초기화",
    going: "참석",
    spots: "명",
    address_after_approval: "승인 후 주소 안내",

    months: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
    days: ["일","월","화","수","목","금","토"],

    cat_all: "전체",
    cat_meetup: "미팅",
    cat_party: "파티",
    cat_sports: "스포츠",
    cat_food: "음식",
    cat_culture: "문화",
    cat_other: "기타",

    filter_today: "오늘",
    filter_weekend: "이번 주말",
    filter_korean: "한국어",
    filter_japanese: "일본어",
    filter_english: "영어",
  },

  en: {
    nav_home: "HOME",
    nav_events: "EVENTS",
    nav_about: "ABOUT",
    login: "Login",
    signup: "Sign up",

    hero_tagline: "Make new friends in Osaka",
    hero_cta: "Browse Events",

    event_type: "Event Type",
    about_bridge: "About Bridge",
    recommended: "Recommended",
    latest_reviews: "Latest Reviews",
    photo_gallery: "Photo Gallery",
    tab_today: "Today",
    tab_new: "New",
    tab_popular: "Popular",
    more: "More >",

    meetup_desc: "Casual gatherings in Osaka. Meet new people and make friends.",
    party_desc: "Parties with music, drinks, and a great atmosphere.",
    food_desc: "Food tours and eating adventures around Osaka.",

    about_text:
      "Bridge is an international community based in Osaka. We host meetups, parties, food tours, sports, and cultural events year-round. Korean, Japanese, international — everyone is welcome. Come alone or with friends, just show up.",

    events_title: "Osaka Events",
    events_found: "events found",
    clear: "Clear",
    going: "Going",
    spots: "spots",
    address_after_approval: "Address shared after approval",

    months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    days: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],

    cat_all: "All",
    cat_meetup: "Meetup",
    cat_party: "Party",
    cat_sports: "Sports",
    cat_food: "Food",
    cat_culture: "Culture",
    cat_other: "Other",

    filter_today: "Today",
    filter_weekend: "This Weekend",
    filter_korean: "Korean",
    filter_japanese: "Japanese",
    filter_english: "English",
  },
} as const;

export type T = typeof translations.en;
export type TKey = keyof T;

export function t(lang: Lang, key: TKey): string {
  const val = translations[lang][key];
  if (Array.isArray(val)) return val.join(",");
  return val as string;
}

export function tArr(lang: Lang, key: TKey): string[] {
  const val = translations[lang][key];
  if (Array.isArray(val)) return val as string[];
  return [val as string];
}
