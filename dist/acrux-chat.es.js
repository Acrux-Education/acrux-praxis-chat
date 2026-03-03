var Y = Object.defineProperty;
var z = (e, a, c) => a in e ? Y(e, a, { enumerable: !0, configurable: !0, writable: !0, value: c }) : e[a] = c;
var _ = (e, a, c) => z(e, typeof a != "symbol" ? a + "" : a, c);
import { jsxs as i, jsx as t, Fragment as O } from "react/jsx-runtime";
import { createContext as J, useReducer as Q, useMemo as X, useRef as m, useEffect as T, useContext as Z, useCallback as S, useState as E } from "react";
const w = {
  SESSIONS: "/api/chat/sessions/",
  SESSION: (e) => `/api/chat/sessions/${e}/`,
  SESSION_MESSAGES: (e) => `/api/chat/sessions/${e}/messages/`,
  SESSION_VISITOR: (e) => `/api/chat/sessions/${e}/visitor/`,
  ANNOUNCEMENTS: "/api/chat/announcements/",
  ROADMAP: "/api/chat/roadmap/",
  KB_SEARCH: "/api/kb/chatbot/search/",
  KB_TOPICS: "/api/kb/topics/",
  KB_TOPIC_ARTICLES: (e) => `/api/kb/topics/${e}/articles/`,
  OPERATING_HOURS: "/api/chat/operating-hours/status/"
}, ee = (e) => `/ws/chat/${e}/`, ae = {
  POSITION: "bottom-right"
}, C = {
  WS_RECONNECT_BASE: 1e3,
  WS_RECONNECT_MAX: 3e4,
  WS_HEARTBEAT_INTERVAL: 3e4,
  MESSAGE_ACK_TIMEOUT: 5e3,
  SEARCH_DEBOUNCE: 300,
  TYPING_TIMEOUT: 3e3
}, M = {
  MAX_MESSAGE_LENGTH: 5e3,
  ALLOWED_FILE_TYPES: [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "application/pdf"
  ]
}, te = {
  session: null,
  messages: [],
  isConnected: !1,
  isOpen: !1,
  activeTab: "home",
  unreadCount: 0,
  agentTyping: { is_typing: !1 },
  currentAgent: null,
  announcements: [],
  roadmapItems: [],
  kbTopics: [],
  kbResults: [],
  kbLoading: !1,
  operatingHours: null,
  visitorName: "",
  visitorEmail: "",
  loading: !1,
  error: null
};
function ce(e, a) {
  switch (a.type) {
    case "SET_SESSION":
      return { ...e, session: a.payload };
    case "SET_MESSAGES": {
      const c = e.messages.filter(
        (s) => s.temp_id && s.status !== "sent"
      ), n = new Set(a.payload.map((s) => s.id)), r = c.filter((s) => !n.has(s.id));
      return { ...e, messages: [...a.payload, ...r] };
    }
    case "ADD_MESSAGE":
      return {
        ...e,
        messages: [...e.messages, a.payload]
      };
    case "ACK_MESSAGE":
      return {
        ...e,
        messages: e.messages.map(
          (c) => c.temp_id === a.payload.temp_id ? { ...c, id: a.payload.real_id, status: "sent", temp_id: void 0 } : c
        )
      };
    case "FAIL_MESSAGE":
      return {
        ...e,
        messages: e.messages.map(
          (c) => c.temp_id === a.payload.temp_id ? { ...c, status: "failed" } : c
        )
      };
    case "SET_AGENT_TYPING":
      return { ...e, agentTyping: a.payload };
    case "AGENT_JOINED":
      return { ...e, currentAgent: a.payload };
    case "SET_CONNECTED":
      return { ...e, isConnected: a.payload };
    case "SET_TAB":
      return { ...e, activeTab: a.payload };
    case "SET_OPEN":
      return { ...e, isOpen: a.payload };
    case "INCREMENT_UNREAD":
      return { ...e, unreadCount: e.unreadCount + 1 };
    case "RESET_UNREAD":
      return { ...e, unreadCount: 0 };
    case "SET_ANNOUNCEMENTS":
      return { ...e, announcements: a.payload };
    case "SET_ROADMAP_ITEMS":
      return { ...e, roadmapItems: a.payload };
    case "SET_KB_TOPICS":
      return { ...e, kbTopics: a.payload };
    case "SET_KB_RESULTS":
      return { ...e, kbResults: a.payload, kbLoading: !1 };
    case "SET_KB_LOADING":
      return { ...e, kbLoading: a.payload };
    case "SET_OPERATING_HOURS":
      return { ...e, operatingHours: a.payload };
    case "SET_VISITOR_INFO":
      return {
        ...e,
        visitorName: a.payload.name ?? e.visitorName,
        visitorEmail: a.payload.email ?? e.visitorEmail
      };
    case "SET_LOADING":
      return { ...e, loading: a.payload };
    case "SET_ERROR":
      return { ...e, error: a.payload };
    default:
      return e;
  }
}
class I {
  constructor(a) {
    _(this, "baseUrl");
    _(this, "token");
    _(this, "chatToken");
    this.baseUrl = a.baseUrl.replace(/\/$/, ""), this.token = a.token;
  }
  setToken(a) {
    this.token = a;
  }
  setChatToken(a) {
    this.chatToken = a;
  }
  getChatToken() {
    return this.chatToken;
  }
  async request(a, c = {}) {
    const n = {
      "Content-Type": "application/json",
      ...c.headers
    };
    this.token && (n.Authorization = `Bearer ${this.token}`), this.chatToken && (n["X-Chat-Token"] = this.chatToken);
    const r = await fetch(`${this.baseUrl}${a}`, {
      ...c,
      headers: n
    });
    if (!r.ok) {
      const s = await r.text().catch(() => "");
      throw new re(r.status, r.statusText, s);
    }
    if (r.status !== 204)
      return r.json();
  }
  async createSession(a) {
    return this.request(w.SESSIONS, {
      method: "POST",
      body: JSON.stringify(a)
    });
  }
  async getSession(a) {
    return this.request(w.SESSION(a));
  }
  async sendMessage(a, c) {
    return this.request(w.SESSION_MESSAGES(a), {
      method: "POST",
      body: JSON.stringify(c)
    });
  }
  async updateVisitor(a, c) {
    return this.request(w.SESSION_VISITOR(a), {
      method: "PATCH",
      body: JSON.stringify(c)
    });
  }
  async getAnnouncements() {
    return this.request(w.ANNOUNCEMENTS);
  }
  async getRoadmapItems() {
    return this.request(w.ROADMAP);
  }
  async searchKB(a) {
    const c = new URLSearchParams({ q: a });
    return this.request(`${w.KB_SEARCH}?${c}`);
  }
  async getKBTopics() {
    return this.request(w.KB_TOPICS);
  }
  async getKBTopicArticles(a) {
    return this.request(w.KB_TOPIC_ARTICLES(a));
  }
  async getOperatingHoursStatus() {
    return this.request(w.OPERATING_HOURS);
  }
}
class re extends Error {
  constructor(a, c, n) {
    super(`API Error ${a}: ${c}`), this.status = a, this.statusText = c, this.body = n, this.name = "ApiError";
  }
}
function A(e) {
  return Array.isArray(e) ? e : e && typeof e == "object" && "results" in e ? e.results : [];
}
const H = J(null);
function ne({ children: e, ...a }) {
  const [c, n] = Q(ce, {
    ...te,
    visitorName: a.userName ?? "",
    visitorEmail: a.userEmail ?? ""
  }), r = X(
    () => ({ state: c, dispatch: n, config: a }),
    [c, a]
  );
  return /* @__PURE__ */ i(H.Provider, { value: r, children: [
    /* @__PURE__ */ t(se, {}),
    e
  ] });
}
function se() {
  const { dispatch: e, config: a } = v(), c = m(!1);
  return T(() => {
    if (c.current) return;
    c.current = !0;
    const n = new I({ baseUrl: a.apiUrl, token: a.token });
    n.getAnnouncements().then((r) => e({ type: "SET_ANNOUNCEMENTS", payload: A(r) })).catch(() => {
    }), n.getRoadmapItems().then((r) => e({ type: "SET_ROADMAP_ITEMS", payload: A(r) })).catch(() => {
    }), n.getKBTopics().then((r) => e({ type: "SET_KB_TOPICS", payload: A(r) })).catch(() => {
    }), n.getOperatingHoursStatus().then((r) => e({ type: "SET_OPERATING_HOURS", payload: r })).catch(() => {
    });
  }, [a.apiUrl, a.token, e]), null;
}
function v() {
  const e = Z(H);
  if (!e)
    throw new Error("useChatContext must be used within a ChatProvider");
  return e;
}
function G({ count: e }) {
  if (e <= 0) return null;
  const a = e > 99 ? "99+" : String(e);
  return /* @__PURE__ */ t("span", { className: "acx-absolute -acx-top-1.5 -acx-right-1.5 acx-min-w-[18px] acx-h-[18px] acx-flex acx-items-center acx-justify-center acx-bg-red-500 acx-text-white acx-text-[10px] acx-font-bold acx-rounded-full acx-px-1 acx-leading-none", children: a });
}
function oe({ className: e }) {
  return /* @__PURE__ */ i("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }),
    /* @__PURE__ */ t("polyline", { points: "9 22 9 12 15 12 15 22" })
  ] });
}
function $({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "currentColor", stroke: "none", children: /* @__PURE__ */ t("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) });
}
function ie({ className: e }) {
  return /* @__PURE__ */ i("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }),
    /* @__PURE__ */ t("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })
  ] });
}
function le({ className: e }) {
  return /* @__PURE__ */ i("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("polygon", { points: "1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" }),
    /* @__PURE__ */ t("line", { x1: "8", y1: "2", x2: "8", y2: "18" }),
    /* @__PURE__ */ t("line", { x1: "16", y1: "6", x2: "16", y2: "22" })
  ] });
}
function xe({ className: e }) {
  return /* @__PURE__ */ i("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("circle", { cx: "12", cy: "12", r: "10" }),
    /* @__PURE__ */ t("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
    /* @__PURE__ */ t("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
  ] });
}
function de({ className: e }) {
  return /* @__PURE__ */ i("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("circle", { cx: "11", cy: "11", r: "8" }),
    /* @__PURE__ */ t("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
  ] });
}
function ue({ className: e }) {
  return /* @__PURE__ */ i("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
    /* @__PURE__ */ t("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
  ] });
}
function he({ className: e }) {
  return /* @__PURE__ */ i("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    /* @__PURE__ */ t("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ] });
}
function pe({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" }) });
}
function j({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("polyline", { points: "9 18 15 12 9 6" }) });
}
function me({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("polyline", { points: "15 18 9 12 15 6" }) });
}
function ge({ isOpen: e, onClick: a, position: c }) {
  const { state: n } = v();
  return /* @__PURE__ */ t("div", { className: `acx-fixed acx-bottom-4 sm:acx-bottom-6 ${c === "bottom-right" ? "acx-right-4 sm:acx-right-6" : "acx-left-4 sm:acx-left-6"} acx-z-[9999]`, children: /* @__PURE__ */ t(
    "button",
    {
      onClick: a,
      className: "acx-group acx-relative acx-w-14 acx-h-14 acx-rounded-full acx-bg-white acx-text-primary-600 acx-shadow-lg acx-border acx-border-gray-200 hover:acx-bg-primary-600 hover:acx-text-white hover:acx-border-primary-600 acx-transition-all hover:acx-scale-105 acx-flex acx-items-center acx-justify-center",
      "aria-label": e ? "Close chat" : "Open chat",
      children: e ? /* @__PURE__ */ t(he, { className: "acx-w-6 acx-h-6" }) : /* @__PURE__ */ i(O, { children: [
        /* @__PURE__ */ t($, { className: "acx-w-7 acx-h-7" }),
        n.unreadCount > 0 && /* @__PURE__ */ t(G, { count: n.unreadCount })
      ] })
    }
  ) });
}
const fe = [
  { id: "home", label: "Home", Icon: oe },
  { id: "messages", label: "Messages", Icon: $ },
  { id: "news", label: "News", Icon: ie },
  { id: "roadmap", label: "Roadmap", Icon: le },
  { id: "help", label: "Help", Icon: xe }
];
function ye({ activeTab: e, onTabChange: a }) {
  const { state: c } = v(), n = fe.filter(({ id: r }) => {
    var s, l, x;
    switch (r) {
      case "home":
        return !0;
      case "messages":
        return !0;
      case "news":
        return (((s = c.announcements) == null ? void 0 : s.length) ?? 0) > 0;
      case "roadmap":
        return (((l = c.roadmapItems) == null ? void 0 : l.length) ?? 0) > 0;
      case "help":
        return (((x = c.kbTopics) == null ? void 0 : x.length) ?? 0) > 0;
      default:
        return !1;
    }
  });
  return n.length <= 1 ? null : /* @__PURE__ */ t("nav", { className: "acx-flex acx-border-t acx-border-gray-200 acx-bg-white", role: "tablist", children: n.map(({ id: r, label: s, Icon: l }) => /* @__PURE__ */ i(
    "button",
    {
      role: "tab",
      "aria-selected": e === r,
      onClick: () => a(r),
      className: `acx-flex-1 acx-flex acx-flex-col acx-items-center acx-py-2 acx-gap-0.5 acx-relative acx-transition-colors ${e === r ? "acx-text-primary-600" : "acx-text-gray-400 hover:acx-text-primary-600"}`,
      children: [
        /* @__PURE__ */ i("div", { className: "acx-relative", children: [
          /* @__PURE__ */ t(l, { className: "acx-w-5 acx-h-5" }),
          r === "messages" && c.unreadCount > 0 && /* @__PURE__ */ t(G, { count: c.unreadCount })
        ] }),
        /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-font-medium", children: s })
      ]
    },
    r
  )) });
}
function be() {
  const { dispatch: e, config: a } = v(), c = m(), n = m();
  c.current || (c.current = new I({ baseUrl: a.apiUrl, token: a.token }));
  const r = S((s) => {
    if (n.current && clearTimeout(n.current), !s.trim()) {
      e({ type: "SET_KB_RESULTS", payload: [] });
      return;
    }
    e({ type: "SET_KB_LOADING", payload: !0 }), n.current = setTimeout(async () => {
      try {
        const l = await c.current.searchKB(s);
        e({ type: "SET_KB_RESULTS", payload: l });
      } catch {
        e({ type: "SET_KB_RESULTS", payload: [] });
      }
    }, C.SEARCH_DEBOUNCE);
  }, [e]);
  return T(() => () => {
    n.current && clearTimeout(n.current);
  }, []), { search: r };
}
function K() {
  const { state: e, dispatch: a, config: c } = v(), n = m(), r = m(!1);
  return n.current || (n.current = new I({ baseUrl: c.apiUrl, token: c.token })), T(() => {
    r.current || (r.current = !0, n.current.getAnnouncements().then((s) => {
      a({ type: "SET_ANNOUNCEMENTS", payload: A(s) });
    }).catch(() => {
    }));
  }, [a]), { announcements: e.announcements };
}
function Se({ onSearch: e, placeholder: a = "Search for help..." }) {
  const [c, n] = E(""), r = m();
  return T(() => (r.current && clearTimeout(r.current), r.current = setTimeout(() => {
    e(c.trim());
  }, C.SEARCH_DEBOUNCE), () => {
    r.current && clearTimeout(r.current);
  }), [c, e]), /* @__PURE__ */ i("div", { className: "acx-relative", children: [
    /* @__PURE__ */ t(de, { className: "acx-absolute acx-left-3 acx-top-1/2 -acx-translate-y-1/2 acx-w-4 acx-h-4 acx-text-gray-400" }),
    /* @__PURE__ */ t(
      "input",
      {
        type: "text",
        value: c,
        onChange: (s) => n(s.target.value),
        placeholder: a,
        className: "acx-w-full acx-pl-9 acx-pr-4 acx-py-2.5 acx-border acx-border-gray-200 acx-rounded-lg acx-text-sm acx-outline-none focus:acx-border-primary-500 focus:acx-ring-1 focus:acx-ring-primary-500 acx-transition-colors acx-bg-white"
      }
    )
  ] });
}
function W({ article: e, onClick: a }) {
  return /* @__PURE__ */ i(
    "button",
    {
      onClick: () => a(e),
      className: "acx-w-full acx-flex acx-items-center acx-justify-between acx-p-3 acx-rounded-lg acx-text-left hover:acx-bg-gray-50 acx-transition-colors acx-group",
      children: [
        /* @__PURE__ */ i("div", { className: "acx-flex-1 acx-min-w-0", children: [
          /* @__PURE__ */ t("h4", { className: "acx-text-sm acx-font-medium acx-text-gray-900 acx-truncate group-hover:acx-text-primary-600 acx-transition-colors", children: e.title }),
          e.summary && /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5 acx-line-clamp-2", children: e.summary })
        ] }),
        /* @__PURE__ */ t(j, { className: "acx-w-4 acx-h-4 acx-text-gray-400 acx-flex-shrink-0 acx-ml-2" })
      ]
    }
  );
}
function R(e) {
  const a = new Date(e), n = (/* @__PURE__ */ new Date()).getTime() - a.getTime(), r = Math.floor(n / 1e3), s = Math.floor(r / 60), l = Math.floor(s / 60), x = Math.floor(l / 24);
  return r < 60 ? "Just now" : s < 60 ? `${s}m ago` : l < 24 ? `${l}h ago` : x < 7 ? `${x}d ago` : a.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric"
  });
}
function Ne(e) {
  const a = new Date(e), c = /* @__PURE__ */ new Date(), n = new Date(c.getFullYear(), c.getMonth(), c.getDate()), r = new Date(a.getFullYear(), a.getMonth(), a.getDate()), s = Math.floor((n.getTime() - r.getTime()) / (1e3 * 60 * 60 * 24));
  return s === 0 ? "Today" : s === 1 ? "Yesterday" : a.toLocaleDateString(void 0, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}
function _e(e, a) {
  const c = new Date(e), n = new Date(a);
  return c.getFullYear() === n.getFullYear() && c.getMonth() === n.getMonth() && c.getDate() === n.getDate();
}
const ve = {
  feature: "acx-bg-green-100 acx-text-green-700",
  improvement: "acx-bg-blue-100 acx-text-blue-700",
  update: "acx-bg-purple-100 acx-text-purple-700",
  maintenance: "acx-bg-orange-100 acx-text-orange-700",
  event: "acx-bg-pink-100 acx-text-pink-700"
}, Te = {
  feature: "New Feature",
  improvement: "Improvement",
  update: "Update",
  maintenance: "Maintenance",
  event: "Event"
};
function V({ announcement: e, onClick: a }) {
  return /* @__PURE__ */ i(
    "button",
    {
      onClick: () => a == null ? void 0 : a(e),
      className: "acx-w-full acx-text-left acx-p-4 acx-border acx-border-gray-200 acx-rounded-xl hover:acx-border-primary-200 hover:acx-bg-primary-50/50 acx-transition-all",
      children: [
        /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-gap-2 acx-mb-2", children: [
          /* @__PURE__ */ t("span", { className: `acx-text-[10px] acx-font-semibold acx-px-2 acx-py-0.5 acx-rounded-full ${ve[e.category] ?? "acx-bg-gray-100 acx-text-gray-700"}`, children: Te[e.category] ?? e.category }),
          e.is_pinned && /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-amber-600 acx-font-medium", children: "Pinned" })
        ] }),
        /* @__PURE__ */ t("h4", { className: "acx-text-sm acx-font-semibold acx-text-gray-900 acx-mb-1", children: e.title }),
        /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-line-clamp-2 acx-mb-2", children: e.summary }),
        e.image_url && /* @__PURE__ */ t(
          "img",
          {
            src: e.image_url,
            alt: "",
            className: "acx-w-full acx-h-32 acx-object-cover acx-rounded-lg acx-mb-2"
          }
        ),
        /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: R(e.published_at) })
      ]
    }
  );
}
function we() {
  const { state: e, dispatch: a, config: c } = v(), { search: n } = be(), { announcements: r } = K(), s = r.find((d) => d.is_pinned), l = S((d) => {
    d.url && window.open(d.url, "_blank", "noopener,noreferrer");
  }, []), x = S(() => {
    a({ type: "SET_TAB", payload: "messages" });
  }, [a]);
  return /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ i("div", { className: "acx-bg-gradient-to-b acx-from-primary-600 acx-to-primary-500 acx-px-5 acx-pt-5 acx-pb-8 acx-text-white", children: [
      /* @__PURE__ */ t("h1", { className: "acx-text-xl acx-font-bold acx-mb-1", children: c.greeting ?? "Hi there! 👋" }),
      /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-primary-100", children: "How can we help you today?" })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-px-4 -acx-mt-4", children: /* @__PURE__ */ i("div", { className: "acx-bg-white acx-rounded-xl acx-shadow-lg acx-p-4", children: [
      /* @__PURE__ */ t(Se, { onSearch: n }),
      /* @__PURE__ */ t("div", { className: "acx-mt-3 acx-space-y-1", children: e.kbLoading ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "Searching..." }) : e.kbResults.length > 0 ? e.kbResults.slice(0, 5).map((d) => /* @__PURE__ */ t(W, { article: d, onClick: l }, d.id)) : null })
    ] }) }),
    s && /* @__PURE__ */ t("div", { className: "acx-px-4 acx-mt-4", children: /* @__PURE__ */ t(V, { announcement: s }) }),
    /* @__PURE__ */ t("div", { className: "acx-mt-auto acx-p-4", children: /* @__PURE__ */ t(
      "button",
      {
        onClick: x,
        className: "acx-w-full acx-bg-white acx-text-primary-600 acx-py-3 acx-rounded-xl acx-font-semibold acx-text-base acx-shadow-md acx-border acx-border-primary-200 hover:acx-bg-primary-600 hover:acx-text-white hover:acx-border-primary-600 acx-transition-colors",
        children: "Start a conversation"
      }
    ) })
  ] });
}
const Ee = "acrux_chat_";
function D(e, a) {
  const c = `${Ee}${e}`, [n, r] = E(() => {
    try {
      const l = window.localStorage.getItem(c);
      return l ? JSON.parse(l) : a;
    } catch {
      return a;
    }
  }), s = S(
    (l) => {
      r(l);
      try {
        window.localStorage.setItem(c, JSON.stringify(l));
      } catch {
      }
    },
    [c]
  );
  return [n, s];
}
function F() {
  return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
    const a = Math.random() * 16 | 0;
    return (e === "x" ? a : a & 3 | 8).toString(16);
  });
}
function ke() {
  const e = new URLSearchParams(window.location.search);
  return {
    page_url: window.location.href,
    referrer: document.referrer,
    utm_source: e.get("utm_source") ?? void 0,
    utm_medium: e.get("utm_medium") ?? void 0,
    utm_campaign: e.get("utm_campaign") ?? void 0
  };
}
function Ce() {
  var f;
  const { state: e, dispatch: a, config: c } = v(), [n, r] = D("session_key", null), [s, l] = D("chat_access_token", null), x = m(), d = m(null);
  x.current || (x.current = new I({ baseUrl: c.apiUrl, token: c.token }), s && x.current.setChatToken(s));
  const p = x.current, g = S(async () => {
    var h;
    const y = F(), o = c.mode === "lead" ? ke() : void 0;
    try {
      a({ type: "SET_LOADING", payload: !0 });
      const b = await p.createSession({
        source: c.mode === "lead" ? "lead_bot" : "user_bot",
        session_key: y,
        visitor_name: c.userName,
        visitor_email: c.userEmail,
        visitor_metadata: o
      });
      return b.access_token && (p.setChatToken(b.access_token), l(b.access_token)), d.current = b.session_key, a({ type: "SET_SESSION", payload: b }), r(b.session_key), (h = c.onSessionCreated) == null || h.call(c, b.session_key), a({ type: "SET_LOADING", payload: !1 }), b;
    } catch (b) {
      throw a({ type: "SET_ERROR", payload: "Failed to create chat session" }), a({ type: "SET_LOADING", payload: !1 }), b;
    }
  }, [p, c, a, r, l]), u = S(async (y) => {
    try {
      a({ type: "SET_LOADING", payload: !0 });
      const o = await p.getSession(y);
      if (d.current && d.current !== y)
        return a({ type: "SET_LOADING", payload: !1 }), null;
      const { messages: h, ...b } = o;
      return d.current = b.session_key, a({ type: "SET_SESSION", payload: b }), a({ type: "SET_MESSAGES", payload: h }), a({ type: "SET_LOADING", payload: !1 }), b;
    } catch {
      return r(null), l(null), p.setChatToken(""), a({ type: "SET_LOADING", payload: !1 }), null;
    }
  }, [p, a, r, l]), N = S(async (y, o) => {
    if (e.session) {
      a({ type: "SET_VISITOR_INFO", payload: { name: y, email: o } });
      try {
        await p.updateVisitor(e.session.session_key, {
          visitor_name: y,
          visitor_email: o
        });
      } catch {
      }
    }
  }, [p, e.session, a]);
  return T(() => {
    n && !e.session && u(n);
  }, []), {
    session: e.session,
    sessionKey: ((f = e.session) == null ? void 0 : f.session_key) ?? n,
    accessToken: p.getChatToken() ?? s,
    createSession: g,
    restoreSession: u,
    updateVisitorInfo: N,
    api: p
  };
}
class Ie {
  constructor(a) {
    _(this, "ws", null);
    _(this, "url");
    _(this, "onMessage");
    _(this, "onStatusChange");
    _(this, "retryCount", 0);
    _(this, "reconnectTimer", null);
    _(this, "heartbeatTimer", null);
    _(this, "messageQueue", []);
    _(this, "intentionallyClosed", !1);
    this.url = a.url, this.onMessage = a.onMessage, this.onStatusChange = a.onStatusChange;
  }
  connect() {
    var a;
    if (((a = this.ws) == null ? void 0 : a.readyState) !== WebSocket.OPEN) {
      this.intentionallyClosed = !1;
      try {
        this.ws = new WebSocket(this.url);
      } catch {
        this.scheduleReconnect();
        return;
      }
      this.ws.onopen = () => {
        this.retryCount = 0, this.onStatusChange(!0), this.startHeartbeat(), this.flushQueue();
      }, this.ws.onclose = () => {
        this.onStatusChange(!1), this.stopHeartbeat(), this.intentionallyClosed || this.scheduleReconnect();
      }, this.ws.onerror = () => {
      }, this.ws.onmessage = (c) => {
        try {
          const n = JSON.parse(c.data);
          this.onMessage(n);
        } catch {
        }
      };
    }
  }
  send(a) {
    var c;
    ((c = this.ws) == null ? void 0 : c.readyState) === WebSocket.OPEN ? this.ws.send(JSON.stringify(a)) : this.messageQueue.push(a);
  }
  disconnect() {
    this.intentionallyClosed = !0, this.stopHeartbeat(), this.reconnectTimer && (clearTimeout(this.reconnectTimer), this.reconnectTimer = null), this.ws && (this.ws.close(), this.ws = null);
  }
  flushQueue() {
    for (; this.messageQueue.length > 0; ) {
      const a = this.messageQueue.shift();
      a && this.send(a);
    }
  }
  scheduleReconnect() {
    if (this.reconnectTimer) return;
    const a = Math.min(
      C.WS_RECONNECT_BASE * Math.pow(2, this.retryCount),
      C.WS_RECONNECT_MAX
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null, this.retryCount++, this.connect();
    }, a);
  }
  startHeartbeat() {
    this.stopHeartbeat(), this.heartbeatTimer = setInterval(() => {
      this.send({ type: "heartbeat" });
    }, C.WS_HEARTBEAT_INTERVAL);
  }
  stopHeartbeat() {
    this.heartbeatTimer && (clearInterval(this.heartbeatTimer), this.heartbeatTimer = null);
  }
}
function Ae(e, a) {
  const { state: c, dispatch: n, config: r } = v(), s = m(null), l = m(/* @__PURE__ */ new Map()), x = m(null);
  T(() => {
    if (!e) return;
    const g = r.apiUrl.startsWith("https") ? "wss" : "ws", u = r.apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    let N = `${g}://${u}${ee(e)}`;
    a && (N += `?token=${encodeURIComponent(a)}`);
    const f = new Ie({
      url: N,
      onStatusChange: (o) => {
        n({ type: "SET_CONNECTED", payload: o });
      },
      onMessage: (o) => {
        switch (o.type) {
          case "history":
            o.messages && n({ type: "SET_MESSAGES", payload: o.messages });
            break;
          case "message":
            o.message && (n({ type: "ADD_MESSAGE", payload: o.message }), (!c.isOpen || c.activeTab !== "messages") && n({ type: "INCREMENT_UNREAD" }));
            break;
          case "message_ack":
            if (o.temp_id && o.real_id) {
              n({ type: "ACK_MESSAGE", payload: { temp_id: o.temp_id, real_id: o.real_id } });
              const h = l.current.get(o.temp_id);
              h && (clearTimeout(h), l.current.delete(o.temp_id));
            }
            break;
          case "agent_joined":
            o.agent && n({ type: "AGENT_JOINED", payload: o.agent });
            break;
          case "agent_typing":
            n({
              type: "SET_AGENT_TYPING",
              payload: { is_typing: o.is_typing ?? !1, agent_name: o.agent_name }
            }), x.current && clearTimeout(x.current), o.is_typing && (x.current = setTimeout(() => {
              n({ type: "SET_AGENT_TYPING", payload: { is_typing: !1 } }), x.current = null;
            }, C.TYPING_TIMEOUT));
            break;
          case "heartbeat_ack":
            break;
          case "error":
            n({ type: "SET_ERROR", payload: o.error ?? "WebSocket error" });
            break;
        }
      }
    });
    f.connect(), s.current = f;
    const y = l.current;
    return () => {
      f.disconnect(), s.current = null, y.forEach((o) => clearTimeout(o)), y.clear(), x.current && (clearTimeout(x.current), x.current = null);
    };
  }, [e, a, r.apiUrl]);
  const d = S((g) => {
    if (!s.current) return;
    const u = F(), N = {
      id: u,
      session: 0,
      sender_type: r.mode === "lead" ? "visitor" : "user",
      sender_name: c.visitorName || "You",
      content: g,
      content_type: "text",
      attachments: [],
      is_read: !0,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      temp_id: u,
      status: "sending"
    };
    n({ type: "ADD_MESSAGE", payload: N }), s.current.send({
      type: "message",
      text: g,
      temp_id: u
    });
    const f = setTimeout(() => {
      n({ type: "FAIL_MESSAGE", payload: { temp_id: u } }), l.current.delete(u);
    }, C.MESSAGE_ACK_TIMEOUT);
    l.current.set(u, f);
  }, [r.mode, c.visitorName, n]), p = S((g) => {
    var u;
    (u = s.current) == null || u.send({ type: "typing", is_typing: g });
  }, []);
  return {
    isConnected: c.isConnected,
    sendMessage: d,
    sendTyping: p
  };
}
function Oe() {
  var s, l, x;
  const { state: e, dispatch: a, config: c } = v(), n = m(), r = m(!1);
  return n.current || (n.current = new I({ baseUrl: c.apiUrl, token: c.token })), T(() => {
    r.current || (r.current = !0, n.current.getOperatingHoursStatus().then((d) => {
      a({ type: "SET_OPERATING_HOURS", payload: d });
    }).catch(() => {
    }));
  }, [a]), {
    isOnline: ((s = e.operatingHours) == null ? void 0 : s.is_online) ?? !0,
    offlineMessage: (l = e.operatingHours) == null ? void 0 : l.offline_message,
    responseTime: (x = e.operatingHours) == null ? void 0 : x.response_time
  };
}
function Re(e) {
  return e.split(" ").slice(0, 2).map((a) => a[0] ?? "").join("").toUpperCase();
}
const B = [
  "acx-bg-blue-500",
  "acx-bg-green-500",
  "acx-bg-purple-500",
  "acx-bg-orange-500",
  "acx-bg-pink-500",
  "acx-bg-teal-500"
];
function Le(e) {
  let a = 0;
  for (let c = 0; c < e.length; c++)
    a = e.charCodeAt(c) + ((a << 5) - a);
  return B[Math.abs(a) % B.length];
}
function L({ name: e, avatarUrl: a }) {
  return a ? /* @__PURE__ */ t(
    "img",
    {
      src: a,
      alt: e,
      className: "acx-w-8 acx-h-8 acx-rounded-full acx-object-cover acx-flex-shrink-0"
    }
  ) : /* @__PURE__ */ t(
    "div",
    {
      className: `acx-w-8 acx-h-8 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-text-white acx-text-xs acx-font-semibold acx-flex-shrink-0 ${Le(e)}`,
      children: Re(e)
    }
  );
}
function Me(e) {
  let a = De(e);
  return a = a.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"), a = a.replace(/__(.+?)__/g, "<strong>$1</strong>"), a = a.replace(/\*(.+?)\*/g, "<em>$1</em>"), a = a.replace(new RegExp("(?<!\\w)_(.+?)_(?!\\w)", "g"), "<em>$1</em>"), a = a.replace(/`(.+?)`/g, "<code>$1</code>"), a = a.replace(
    /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  ), a = a.replace(/\n/g, "<br />"), a;
}
function De(e) {
  const a = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return e.replace(/[&<>"']/g, (c) => a[c] ?? c);
}
function Be({ message: e }) {
  var n;
  const a = e.sender_type === "visitor" || e.sender_type === "user", c = e.sender_type === "system";
  return c && e.content_type === "auto_response" ? /* @__PURE__ */ i("div", { className: "acx-flex acx-gap-2 acx-mb-3 acx-justify-start", children: [
    /* @__PURE__ */ t(L, { name: e.sender_name }),
    /* @__PURE__ */ i("div", { className: "acx-max-w-[75%]", children: [
      e.sender_name && /* @__PURE__ */ t("span", { className: "acx-text-xs acx-text-gray-500 acx-ml-1 acx-mb-0.5 acx-block", children: e.sender_name }),
      /* @__PURE__ */ t("div", { className: "acx-px-3.5 acx-py-2.5 acx-rounded-2xl acx-text-sm acx-leading-relaxed acx-bg-amber-50 acx-text-gray-800 acx-rounded-bl-md acx-border acx-border-amber-200", children: /* @__PURE__ */ t("p", { className: "acx-whitespace-pre-wrap", children: e.content }) }),
      /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400 acx-mt-0.5 acx-block", children: R(e.created_at) })
    ] })
  ] }) : c ? /* @__PURE__ */ t("div", { className: "acx-flex acx-justify-center acx-py-2", children: /* @__PURE__ */ t("span", { className: "acx-text-xs acx-text-gray-400 acx-italic", children: e.content }) }) : /* @__PURE__ */ i("div", { className: `acx-flex acx-gap-2 acx-mb-3 ${a ? "acx-justify-end" : "acx-justify-start"}`, children: [
    !a && /* @__PURE__ */ t(L, { name: e.sender_name }),
    /* @__PURE__ */ i("div", { className: `acx-max-w-[75%] ${a ? "acx-order-1" : ""}`, children: [
      !a && e.sender_name && /* @__PURE__ */ t("span", { className: "acx-text-xs acx-text-gray-500 acx-ml-1 acx-mb-0.5 acx-block", children: e.sender_name }),
      /* @__PURE__ */ t(
        "div",
        {
          className: `acx-px-3.5 acx-py-2.5 acx-rounded-2xl acx-text-sm acx-leading-relaxed ${a ? "acx-bg-primary-600 acx-text-white acx-rounded-br-md" : (e.sender_type === "bot", "acx-bg-gray-100 acx-text-gray-800 acx-rounded-bl-md")}`,
          children: e.content_type === "markdown" ? /* @__PURE__ */ t(
            "div",
            {
              className: "acx-prose acx-prose-sm",
              dangerouslySetInnerHTML: { __html: Me(e.content) }
            }
          ) : /* @__PURE__ */ t("p", { className: "acx-whitespace-pre-wrap", children: e.content })
        }
      ),
      ((n = e.attachments) == null ? void 0 : n.length) > 0 && /* @__PURE__ */ t("div", { className: "acx-mt-1 acx-space-y-1", children: e.attachments.map((r, s) => /* @__PURE__ */ t(
        "a",
        {
          href: r.url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "acx-block acx-text-xs acx-text-primary-600 hover:acx-underline acx-truncate",
          children: r.name
        },
        s
      )) }),
      /* @__PURE__ */ i("div", { className: `acx-flex acx-items-center acx-gap-1 acx-mt-0.5 ${a ? "acx-justify-end" : ""}`, children: [
        /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: R(e.created_at) }),
        a && e.status === "sending" && /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: "Sending..." }),
        a && e.status === "failed" && /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-red-500", children: "Failed" })
      ] })
    ] })
  ] });
}
function Ue({ agentName: e }) {
  return /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-gap-2 acx-mb-3", children: [
    /* @__PURE__ */ t(L, { name: e ?? "Agent" }),
    /* @__PURE__ */ t("div", { className: "acx-bg-gray-100 acx-rounded-2xl acx-rounded-bl-md acx-px-4 acx-py-3", children: /* @__PURE__ */ i("div", { className: "acx-flex acx-gap-1", children: [
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" })
    ] }) })
  ] });
}
function Pe({ messages: e, agentTyping: a }) {
  const c = m(null), n = m(null);
  return T(() => {
    var r;
    (r = c.current) == null || r.scrollIntoView({ behavior: "smooth" });
  }, [e.length, a.is_typing]), /* @__PURE__ */ i(
    "div",
    {
      ref: n,
      className: "acx-flex-1 acx-overflow-y-auto acx-px-4 acx-py-3 acx-space-y-1",
      children: [
        e.map((r, s) => {
          const l = e[s - 1], x = !l || !_e(l.created_at, r.created_at);
          return /* @__PURE__ */ i("div", { children: [
            x && /* @__PURE__ */ t("div", { className: "acx-flex acx-items-center acx-justify-center acx-py-3", children: /* @__PURE__ */ t("span", { className: "acx-text-xs acx-text-gray-400 acx-bg-gray-50 acx-px-3 acx-py-1 acx-rounded-full", children: Ne(r.created_at) }) }),
            /* @__PURE__ */ t(Be, { message: r })
          ] }, r.temp_id ?? r.id);
        }),
        a.is_typing && /* @__PURE__ */ t(Ue, { agentName: a.agent_name }),
        /* @__PURE__ */ t("div", { ref: c })
      ]
    }
  );
}
function He({ onSend: e, onTyping: a, onFileUpload: c, mode: n, disabled: r, placeholder: s }) {
  const [l, x] = E(""), d = m(null), p = m(), g = S(() => {
    const o = l.trim();
    !o || r || (e(o), x(""), a == null || a(!1));
  }, [l, r, e, a]), u = (o) => {
    o.key === "Enter" && !o.shiftKey && (o.preventDefault(), g());
  }, N = (o) => {
    const h = o.target.value;
    h.length > M.MAX_MESSAGE_LENGTH || (x(h), a == null || a(!0), p.current && clearTimeout(p.current), p.current = setTimeout(() => a == null ? void 0 : a(!1), 2e3));
  }, f = () => {
    var o;
    (o = d.current) == null || o.click();
  }, y = (o) => {
    o.target.files && o.target.files.length > 0 && (c == null || c(o.target.files), o.target.value = "");
  };
  return /* @__PURE__ */ t("div", { className: "acx-border-t acx-border-gray-200 acx-bg-white acx-px-3 acx-py-2", children: /* @__PURE__ */ i("div", { className: "acx-flex acx-items-end acx-gap-2", children: [
    n === "user" && c && /* @__PURE__ */ i(O, { children: [
      /* @__PURE__ */ t(
        "button",
        {
          onClick: f,
          className: "acx-p-1.5 acx-text-gray-400 hover:acx-text-gray-600 acx-transition-colors acx-flex-shrink-0",
          "aria-label": "Attach file",
          type: "button",
          children: /* @__PURE__ */ t(pe, { className: "acx-w-5 acx-h-5" })
        }
      ),
      /* @__PURE__ */ t(
        "input",
        {
          ref: d,
          type: "file",
          className: "acx-hidden",
          accept: M.ALLOWED_FILE_TYPES.join(","),
          multiple: !0,
          onChange: y
        }
      )
    ] }),
    /* @__PURE__ */ t(
      "textarea",
      {
        value: l,
        onChange: N,
        onKeyDown: u,
        placeholder: s ?? "Type a message...",
        disabled: r,
        rows: 1,
        className: "acx-flex-1 acx-resize-none acx-border-0 acx-outline-none acx-text-sm acx-py-2 acx-max-h-24 acx-bg-transparent placeholder:acx-text-gray-400",
        style: { fieldSizing: "content" }
      }
    ),
    /* @__PURE__ */ t(
      "button",
      {
        onClick: g,
        disabled: !l.trim() || r,
        className: "acx-p-1.5 acx-text-primary-600 hover:acx-text-primary-700 disabled:acx-text-gray-300 acx-transition-colors acx-flex-shrink-0",
        "aria-label": "Send message",
        type: "button",
        children: /* @__PURE__ */ t(ue, { className: "acx-w-5 acx-h-5" })
      }
    )
  ] }) });
}
function U({ isOnline: e, offlineMessage: a, responseTime: c }) {
  return e ? null : /* @__PURE__ */ t("div", { className: "acx-bg-amber-50 acx-border-b acx-border-amber-200 acx-px-4 acx-py-2.5", children: /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-gap-2", children: [
    /* @__PURE__ */ t("div", { className: "acx-w-2 acx-h-2 acx-rounded-full acx-bg-amber-400 acx-flex-shrink-0" }),
    /* @__PURE__ */ i("p", { className: "acx-text-xs acx-text-amber-800", children: [
      a ?? "We're currently offline.",
      c && /* @__PURE__ */ i("span", { className: "acx-font-medium", children: [
        " We typically respond ",
        c,
        "."
      ] })
    ] })
  ] }) });
}
function Ge({ onSubmit: e, loading: a }) {
  const [c, n] = E(""), [r, s] = E("");
  return /* @__PURE__ */ i("form", { onSubmit: (x) => {
    x.preventDefault(), r.trim() && e({ name: c.trim(), email: r.trim() });
  }, className: "acx-p-4 acx-space-y-3", children: [
    /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-600 acx-mb-1", children: "Before we start, could you share your details?" }),
    /* @__PURE__ */ t(
      "input",
      {
        type: "text",
        value: c,
        onChange: (x) => n(x.target.value),
        placeholder: "Your name",
        className: "acx-w-full acx-px-3 acx-py-2 acx-border acx-border-gray-200 acx-rounded-lg acx-text-sm acx-outline-none focus:acx-border-primary-500 focus:acx-ring-1 focus:acx-ring-primary-500"
      }
    ),
    /* @__PURE__ */ t(
      "input",
      {
        type: "email",
        value: r,
        onChange: (x) => s(x.target.value),
        placeholder: "Your email *",
        required: !0,
        className: "acx-w-full acx-px-3 acx-py-2 acx-border acx-border-gray-200 acx-rounded-lg acx-text-sm acx-outline-none focus:acx-border-primary-500 focus:acx-ring-1 focus:acx-ring-primary-500"
      }
    ),
    /* @__PURE__ */ t(
      "button",
      {
        type: "submit",
        disabled: !r.trim() || a,
        className: "acx-w-full acx-bg-primary-600 acx-text-white acx-py-2.5 acx-rounded-lg acx-text-sm acx-font-medium hover:acx-bg-primary-700 disabled:acx-opacity-50 acx-transition-colors",
        children: a ? "Starting..." : "Start conversation"
      }
    )
  ] });
}
function $e() {
  const { state: e, dispatch: a, config: c } = v(), { session: n, sessionKey: r, accessToken: s, createSession: l, updateVisitorInfo: x } = Ce(), { sendMessage: d, sendTyping: p, isConnected: g } = Ae(r, s), { isOnline: u, offlineMessage: N, responseTime: f } = Oe(), [y, o] = E(!1), h = m(null);
  T(() => {
    g && h.current && (d(h.current), h.current = null);
  }, [g, d]);
  const b = S(async (k) => {
    if (!n) {
      if (c.mode === "lead" && !e.visitorEmail) {
        h.current = k, o(!0);
        return;
      }
      try {
        h.current = k, await l();
      } catch {
        h.current = null;
      }
      return;
    }
    d(k);
  }, [n, c.mode, e.visitorEmail, l, d]), q = S(async (k) => {
    a({ type: "SET_VISITOR_INFO", payload: k }), o(!1);
    try {
      await l() && await x(k.name, k.email);
    } catch {
      h.current = null;
    }
  }, [l, x, a]);
  return T(() => {
    e.unreadCount > 0 && e.activeTab === "messages" && a({ type: "RESET_UNREAD" });
  }, [e.unreadCount, e.activeTab, a]), y && !n ? /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ t(U, { isOnline: u, offlineMessage: N, responseTime: f }),
    /* @__PURE__ */ t(Ge, { onSubmit: q, loading: e.loading })
  ] }) : /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ t(U, { isOnline: u, offlineMessage: N, responseTime: f }),
    e.messages.length === 0 && !n ? /* @__PURE__ */ t("div", { className: "acx-flex-1 acx-flex acx-flex-col acx-items-center acx-justify-center acx-px-6 acx-text-center", children: u ? /* @__PURE__ */ i(O, { children: [
      /* @__PURE__ */ t("div", { className: "acx-w-12 acx-h-12 acx-bg-primary-100 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-mb-3", children: /* @__PURE__ */ t("svg", { className: "acx-w-6 acx-h-6 acx-text-primary-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ t("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }) }),
      /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-600 acx-font-medium", children: "No messages yet" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-400 acx-mt-1", children: "Send a message to start a conversation" })
    ] }) : /* @__PURE__ */ i(O, { children: [
      /* @__PURE__ */ t("div", { className: "acx-w-12 acx-h-12 acx-bg-amber-100 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-mb-3", children: /* @__PURE__ */ i("svg", { className: "acx-w-6 acx-h-6 acx-text-amber-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
        /* @__PURE__ */ t("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6l-4 4V6c0-1.1.9-2 2-2z" }),
        /* @__PURE__ */ t("path", { d: "M12 11v1" }),
        /* @__PURE__ */ t("path", { d: "M12 8h.01" })
      ] }) }),
      /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-600 acx-font-medium", children: "Leave us a message" }),
      /* @__PURE__ */ i("p", { className: "acx-text-xs acx-text-gray-400 acx-mt-1", children: [
        "Our team is currently away. Leave a message and we'll get back to you",
        f ? ` ${f}` : " as soon as possible",
        "."
      ] })
    ] }) }) : /* @__PURE__ */ t(Pe, { messages: e.messages, agentTyping: e.agentTyping }),
    /* @__PURE__ */ t(
      He,
      {
        onSend: b,
        onTyping: p,
        mode: c.mode,
        disabled: e.loading,
        placeholder: u ? "Type a message..." : "Leave a message..."
      }
    )
  ] });
}
function je() {
  const { announcements: e } = K();
  return /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ i("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ t("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: "News & Updates" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: "Latest from the team" })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-3", children: e.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-8 acx-text-center", children: /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-400", children: "No announcements yet" }) }) : e.map((a) => /* @__PURE__ */ t(V, { announcement: a }, a.id)) })
  ] });
}
function Ke() {
  const { state: e, dispatch: a, config: c } = v(), n = m(), r = m(!1);
  return n.current || (n.current = new I({ baseUrl: c.apiUrl, token: c.token })), T(() => {
    r.current || (r.current = !0, n.current.getRoadmapItems().then((s) => {
      a({ type: "SET_ROADMAP_ITEMS", payload: A(s) });
    }).catch(() => {
    }));
  }, [a]), { roadmapItems: e.roadmapItems };
}
const P = {
  planned: { bg: "acx-bg-gray-100", text: "acx-text-gray-600", label: "Planned" },
  in_progress: { bg: "acx-bg-blue-100", text: "acx-text-blue-700", label: "In Progress" },
  beta: { bg: "acx-bg-amber-100", text: "acx-text-amber-700", label: "Beta" },
  released: { bg: "acx-bg-green-100", text: "acx-text-green-700", label: "Released" }
}, We = {
  assessment: "Assessments",
  marking: "Marking",
  reports: "Reports",
  integrations: "Integrations",
  platform: "Platform"
};
function Ve({ item: e }) {
  const a = P[e.status] ?? P.planned;
  return /* @__PURE__ */ i("div", { className: "acx-p-4 acx-border acx-border-gray-200 acx-rounded-xl", children: [
    /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-justify-between acx-mb-2", children: [
      /* @__PURE__ */ t("span", { className: `acx-text-[10px] acx-font-semibold acx-px-2 acx-py-0.5 acx-rounded-full ${a.bg} ${a.text}`, children: a.label }),
      e.quarter && /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: e.quarter })
    ] }),
    /* @__PURE__ */ t("h4", { className: "acx-text-sm acx-font-semibold acx-text-gray-900 acx-mb-1", children: e.title }),
    /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-line-clamp-2 acx-mb-2", children: e.description }),
    /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: We[e.category] ?? e.category })
  ] });
}
const Fe = ["in_progress", "beta", "planned", "released"];
function qe() {
  const { roadmapItems: e } = Ke(), a = Fe.reduce((n, r) => {
    const s = e.filter((l) => l.status === r);
    return s.length > 0 && n.push({ status: r, items: s }), n;
  }, []), c = {
    planned: "Planned",
    in_progress: "In Progress",
    beta: "Beta",
    released: "Released"
  };
  return /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ i("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ t("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: "Product Roadmap" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: "See what we're building" })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-5", children: a.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-8 acx-text-center", children: /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-400", children: "No roadmap items yet" }) }) : a.map(({ status: n, items: r }) => /* @__PURE__ */ i("div", { children: [
      /* @__PURE__ */ t("h3", { className: "acx-text-xs acx-font-semibold acx-text-gray-500 acx-uppercase acx-tracking-wider acx-mb-2", children: c[n] ?? n }),
      /* @__PURE__ */ t("div", { className: "acx-space-y-2", children: r.map((s) => /* @__PURE__ */ t(Ve, { item: s }, s.id)) })
    ] }, n)) })
  ] });
}
function Ye() {
  var y;
  const { state: e, dispatch: a, config: c } = v(), n = e.kbTopics, [r, s] = E(null), [l, x] = E([]), [d, p] = E(!1), g = m();
  g.current || (g.current = new I({ baseUrl: c.apiUrl, token: c.token })), T(() => {
    var o;
    ((o = e.kbTopics) == null ? void 0 : o.length) > 0 || g.current.getKBTopics().then((h) => a({ type: "SET_KB_TOPICS", payload: Array.isArray(h) ? h : [] })).catch(() => {
    });
  }, [(y = e.kbTopics) == null ? void 0 : y.length, a]);
  const u = S(async (o) => {
    s(o), p(!0);
    try {
      const h = await g.current.getKBTopicArticles(o.slug);
      x(h);
    } catch {
      x([]);
    } finally {
      p(!1);
    }
  }, []), N = S((o) => {
    o.url && window.open(o.url, "_blank", "noopener,noreferrer");
  }, []), f = S(() => {
    s(null), x([]);
  }, []);
  return r ? /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ i("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ i(
        "button",
        {
          onClick: f,
          className: "acx-flex acx-items-center acx-gap-1 acx-text-sm acx-text-primary-600 acx-mb-2 hover:acx-text-primary-700",
          children: [
            /* @__PURE__ */ t(me, { className: "acx-w-4 acx-h-4" }),
            "Back"
          ]
        }
      ),
      /* @__PURE__ */ t("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: r.name }),
      /* @__PURE__ */ i("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: [
        r.article_count,
        " article",
        r.article_count !== 1 ? "s" : ""
      ] })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-1", children: d ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "Loading..." }) : l.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "No articles found" }) : l.map((o) => /* @__PURE__ */ t(W, { article: o, onClick: N }, o.id)) })
  ] }) : /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ i("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ t("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: "Help Centre" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: "Browse help topics" })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-1", children: n.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-8 acx-text-center", children: /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-400", children: "No help topics available" }) }) : n.map((o) => /* @__PURE__ */ i(
      "button",
      {
        onClick: () => u(o),
        className: "acx-w-full acx-flex acx-items-center acx-justify-between acx-p-3 acx-rounded-lg acx-text-left hover:acx-bg-gray-50 acx-transition-colors",
        children: [
          /* @__PURE__ */ i("div", { children: [
            /* @__PURE__ */ t("h4", { className: "acx-text-sm acx-font-medium acx-text-gray-900", children: o.name }),
            /* @__PURE__ */ i("p", { className: "acx-text-xs acx-text-gray-500", children: [
              o.article_count,
              " article",
              o.article_count !== 1 ? "s" : ""
            ] })
          ] }),
          /* @__PURE__ */ t(j, { className: "acx-w-4 acx-h-4 acx-text-gray-400" })
        ]
      },
      o.id
    )) })
  ] });
}
function ea(e) {
  return /* @__PURE__ */ t(ne, { ...e, children: /* @__PURE__ */ t(ze, { position: e.position ?? ae.POSITION }) });
}
function ze({ position: e }) {
  const { state: a, dispatch: c } = v(), [n, r] = E(!1);
  return /* @__PURE__ */ i("div", { className: "acrux-chat-widget", children: [
    n && /* @__PURE__ */ i(
      "div",
      {
        className: `acx-fixed acx-bottom-20 ${e === "bottom-right" ? "acx-right-4 sm:acx-right-6" : "acx-left-4 sm:acx-left-6"} acx-z-[9999] acx-w-[380px] acx-max-w-[calc(100vw-2rem)] acx-h-[600px] acx-max-h-[calc(100vh-6rem)] acx-bg-white acx-rounded-2xl acx-shadow-2xl acx-flex acx-flex-col acx-overflow-hidden acx-animate-slide-up`,
        role: "dialog",
        "aria-label": "Chat widget",
        children: [
          /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-justify-between acx-px-5 acx-py-4 acx-bg-primary-600 acx-text-white", children: [
            /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-gap-2.5", children: [
              /* @__PURE__ */ t("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 375 375", className: "acx-flex-shrink-0", children: /* @__PURE__ */ t("path", { fill: "#ffde5a", d: "M 366.039062 86.546875 L 209.414062 117.519531 L 156.304688 4.511719 L 132.847656 127.152344 L 8.957031 142.746094 L 120.160156 174.398438 L 91.242188 158.484375 L 154.742188 150.492188 L 166.765625 87.632812 L 193.984375 145.554688 L 282.449219 125.828125 L 210.808594 181.351562 L 238.035156 239.269531 L 181.964844 208.414062 L 14 374.972656 L 185.960938 240.164062 L 295.355469 300.371094 L 242.242188 187.359375 L 366.039062 86.546875", fillRule: "nonzero" }) }),
              /* @__PURE__ */ t("h2", { className: "acx-text-lg acx-font-semibold", children: "Acrux Chat" })
            ] }),
            /* @__PURE__ */ t(
              "button",
              {
                onClick: () => r(!1),
                className: "acx-p-1 acx-rounded-lg hover:acx-bg-white/20 acx-transition-colors",
                "aria-label": "Close chat",
                children: /* @__PURE__ */ t("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: /* @__PURE__ */ t("path", { d: "M15 5L5 15M5 5l10 10" }) })
              }
            )
          ] }),
          /* @__PURE__ */ i("div", { className: "acx-flex-1 acx-overflow-hidden", children: [
            a.activeTab === "home" && /* @__PURE__ */ t(we, {}),
            a.activeTab === "messages" && /* @__PURE__ */ t($e, {}),
            a.activeTab === "news" && /* @__PURE__ */ t(je, {}),
            a.activeTab === "roadmap" && /* @__PURE__ */ t(qe, {}),
            a.activeTab === "help" && /* @__PURE__ */ t(Ye, {})
          ] }),
          /* @__PURE__ */ t(
            ye,
            {
              activeTab: a.activeTab,
              onTabChange: (l) => c({ type: "SET_TAB", payload: l })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ t(
      ge,
      {
        isOpen: n,
        onClick: () => r(!n),
        position: e
      }
    )
  ] });
}
export {
  ea as ChatWidget
};
//# sourceMappingURL=acrux-chat.es.js.map
