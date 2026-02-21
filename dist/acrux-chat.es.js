var Y = Object.defineProperty;
var J = (e, a, c) => a in e ? Y(e, a, { enumerable: !0, configurable: !0, writable: !0, value: c }) : e[a] = c;
var S = (e, a, c) => J(e, typeof a != "symbol" ? a + "" : a, c);
import { jsxs as o, jsx as t, Fragment as D } from "react/jsx-runtime";
import { createContext as z, useReducer as Q, useMemo as X, useRef as m, useEffect as _, useContext as Z, useCallback as y, useState as E } from "react";
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
}, k = {
  WS_RECONNECT_BASE: 1e3,
  WS_RECONNECT_MAX: 3e4,
  WS_HEARTBEAT_INTERVAL: 3e4,
  MESSAGE_ACK_TIMEOUT: 5e3,
  SEARCH_DEBOUNCE: 300,
  TYPING_TIMEOUT: 3e3
}, A = {
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
class C {
  constructor(a) {
    S(this, "baseUrl");
    S(this, "token");
    S(this, "chatToken");
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
function I(e) {
  return Array.isArray(e) ? e : e && typeof e == "object" && "results" in e ? e.results : [];
}
const B = z(null);
function ne({ children: e, ...a }) {
  const [c, n] = Q(ce, {
    ...te,
    visitorName: a.userName ?? "",
    visitorEmail: a.userEmail ?? ""
  }), r = X(
    () => ({ state: c, dispatch: n, config: a }),
    [c, a]
  );
  return /* @__PURE__ */ o(B.Provider, { value: r, children: [
    /* @__PURE__ */ t(se, {}),
    e
  ] });
}
function se() {
  const { dispatch: e, config: a } = N(), c = m(!1);
  return _(() => {
    if (c.current) return;
    c.current = !0;
    const n = new C({ baseUrl: a.apiUrl, token: a.token });
    n.getAnnouncements().then((r) => e({ type: "SET_ANNOUNCEMENTS", payload: I(r) })).catch(() => {
    }), n.getRoadmapItems().then((r) => e({ type: "SET_ROADMAP_ITEMS", payload: I(r) })).catch(() => {
    }), n.getKBTopics().then((r) => e({ type: "SET_KB_TOPICS", payload: I(r) })).catch(() => {
    }), n.getOperatingHoursStatus().then((r) => e({ type: "SET_OPERATING_HOURS", payload: r })).catch(() => {
    });
  }, [a.apiUrl, a.token, e]), null;
}
function N() {
  const e = Z(B);
  if (!e)
    throw new Error("useChatContext must be used within a ChatProvider");
  return e;
}
function U({ count: e }) {
  if (e <= 0) return null;
  const a = e > 99 ? "99+" : String(e);
  return /* @__PURE__ */ t("span", { className: "acx-absolute -acx-top-1.5 -acx-right-1.5 acx-min-w-[18px] acx-h-[18px] acx-flex acx-items-center acx-justify-center acx-bg-red-500 acx-text-white acx-text-[10px] acx-font-bold acx-rounded-full acx-px-1 acx-leading-none", children: a });
}
function oe({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }),
    /* @__PURE__ */ t("polyline", { points: "9 22 9 12 15 12 15 22" })
  ] });
}
function P({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) });
}
function ie({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }),
    /* @__PURE__ */ t("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })
  ] });
}
function le({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("polygon", { points: "1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" }),
    /* @__PURE__ */ t("line", { x1: "8", y1: "2", x2: "8", y2: "18" }),
    /* @__PURE__ */ t("line", { x1: "16", y1: "6", x2: "16", y2: "22" })
  ] });
}
function xe({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("circle", { cx: "12", cy: "12", r: "10" }),
    /* @__PURE__ */ t("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
    /* @__PURE__ */ t("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
  ] });
}
function de({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("circle", { cx: "11", cy: "11", r: "8" }),
    /* @__PURE__ */ t("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
  ] });
}
function ue({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
    /* @__PURE__ */ t("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
  ] });
}
function he({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    /* @__PURE__ */ t("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ] });
}
function pe({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" }) });
}
function H({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("polyline", { points: "9 18 15 12 9 6" }) });
}
function me({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("polyline", { points: "15 18 9 12 15 6" }) });
}
function ge({ isOpen: e, onClick: a, position: c }) {
  const { state: n } = N();
  return /* @__PURE__ */ t("div", { className: `acx-fixed acx-bottom-4 sm:acx-bottom-6 ${c === "bottom-right" ? "acx-right-4 sm:acx-right-6" : "acx-left-4 sm:acx-left-6"} acx-z-[9999]`, children: /* @__PURE__ */ t(
    "button",
    {
      onClick: a,
      className: "acx-relative acx-w-14 acx-h-14 acx-rounded-full acx-bg-primary-600 acx-text-white acx-shadow-lg hover:acx-bg-primary-700 acx-transition-all hover:acx-scale-105 acx-flex acx-items-center acx-justify-center",
      "aria-label": e ? "Close chat" : "Open chat",
      children: e ? /* @__PURE__ */ t(he, { className: "acx-w-6 acx-h-6" }) : /* @__PURE__ */ o(D, { children: [
        /* @__PURE__ */ t(P, { className: "acx-w-7 acx-h-7" }),
        n.unreadCount > 0 && /* @__PURE__ */ t(U, { count: n.unreadCount })
      ] })
    }
  ) });
}
const fe = [
  { id: "home", label: "Home", Icon: oe },
  { id: "messages", label: "Messages", Icon: P },
  { id: "news", label: "News", Icon: ie },
  { id: "roadmap", label: "Roadmap", Icon: le },
  { id: "help", label: "Help", Icon: xe }
];
function ye({ activeTab: e, onTabChange: a }) {
  const { state: c } = N(), n = fe.filter(({ id: r }) => {
    var s, i, x;
    switch (r) {
      case "home":
        return !0;
      case "messages":
        return !0;
      case "news":
        return (((s = c.announcements) == null ? void 0 : s.length) ?? 0) > 0;
      case "roadmap":
        return (((i = c.roadmapItems) == null ? void 0 : i.length) ?? 0) > 0;
      case "help":
        return (((x = c.kbTopics) == null ? void 0 : x.length) ?? 0) > 0;
      default:
        return !1;
    }
  });
  return n.length <= 1 ? null : /* @__PURE__ */ t("nav", { className: "acx-flex acx-border-t acx-border-gray-200 acx-bg-white", role: "tablist", children: n.map(({ id: r, label: s, Icon: i }) => /* @__PURE__ */ o(
    "button",
    {
      role: "tab",
      "aria-selected": e === r,
      onClick: () => a(r),
      className: `acx-flex-1 acx-flex acx-flex-col acx-items-center acx-py-2 acx-gap-0.5 acx-relative acx-transition-colors ${e === r ? "acx-text-primary-600" : "acx-text-gray-400 hover:acx-text-gray-600"}`,
      children: [
        /* @__PURE__ */ o("div", { className: "acx-relative", children: [
          /* @__PURE__ */ t(i, { className: "acx-w-5 acx-h-5" }),
          r === "messages" && c.unreadCount > 0 && /* @__PURE__ */ t(U, { count: c.unreadCount })
        ] }),
        /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-font-medium", children: s })
      ]
    },
    r
  )) });
}
function be() {
  const { dispatch: e, config: a } = N(), c = m(), n = m();
  c.current || (c.current = new C({ baseUrl: a.apiUrl, token: a.token }));
  const r = y((s) => {
    if (n.current && clearTimeout(n.current), !s.trim()) {
      e({ type: "SET_KB_RESULTS", payload: [] });
      return;
    }
    e({ type: "SET_KB_LOADING", payload: !0 }), n.current = setTimeout(async () => {
      try {
        const i = await c.current.searchKB(s);
        e({ type: "SET_KB_RESULTS", payload: i });
      } catch {
        e({ type: "SET_KB_RESULTS", payload: [] });
      }
    }, k.SEARCH_DEBOUNCE);
  }, [e]);
  return _(() => () => {
    n.current && clearTimeout(n.current);
  }, []), { search: r };
}
function G() {
  const { state: e, dispatch: a, config: c } = N(), n = m(), r = m(!1);
  return n.current || (n.current = new C({ baseUrl: c.apiUrl, token: c.token })), _(() => {
    r.current || (r.current = !0, n.current.getAnnouncements().then((s) => {
      a({ type: "SET_ANNOUNCEMENTS", payload: I(s) });
    }).catch(() => {
    }));
  }, [a]), { announcements: e.announcements };
}
function Se({ onSearch: e, placeholder: a = "Search for help..." }) {
  const [c, n] = E(""), r = m();
  return _(() => (r.current && clearTimeout(r.current), r.current = setTimeout(() => {
    e(c.trim());
  }, k.SEARCH_DEBOUNCE), () => {
    r.current && clearTimeout(r.current);
  }), [c, e]), /* @__PURE__ */ o("div", { className: "acx-relative", children: [
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
function $({ article: e, onClick: a }) {
  return /* @__PURE__ */ o(
    "button",
    {
      onClick: () => a(e),
      className: "acx-w-full acx-flex acx-items-center acx-justify-between acx-p-3 acx-rounded-lg acx-text-left hover:acx-bg-gray-50 acx-transition-colors acx-group",
      children: [
        /* @__PURE__ */ o("div", { className: "acx-flex-1 acx-min-w-0", children: [
          /* @__PURE__ */ t("h4", { className: "acx-text-sm acx-font-medium acx-text-gray-900 acx-truncate group-hover:acx-text-primary-600 acx-transition-colors", children: e.title }),
          e.summary && /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5 acx-line-clamp-2", children: e.summary })
        ] }),
        /* @__PURE__ */ t(H, { className: "acx-w-4 acx-h-4 acx-text-gray-400 acx-flex-shrink-0 acx-ml-2" })
      ]
    }
  );
}
function j(e) {
  const a = new Date(e), n = (/* @__PURE__ */ new Date()).getTime() - a.getTime(), r = Math.floor(n / 1e3), s = Math.floor(r / 60), i = Math.floor(s / 60), x = Math.floor(i / 24);
  return r < 60 ? "Just now" : s < 60 ? `${s}m ago` : i < 24 ? `${i}h ago` : x < 7 ? `${x}d ago` : a.toLocaleDateString(void 0, {
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
const Te = {
  feature: "acx-bg-green-100 acx-text-green-700",
  improvement: "acx-bg-blue-100 acx-text-blue-700",
  update: "acx-bg-purple-100 acx-text-purple-700",
  maintenance: "acx-bg-orange-100 acx-text-orange-700",
  event: "acx-bg-pink-100 acx-text-pink-700"
}, we = {
  feature: "New Feature",
  improvement: "Improvement",
  update: "Update",
  maintenance: "Maintenance",
  event: "Event"
};
function K({ announcement: e, onClick: a }) {
  return /* @__PURE__ */ o(
    "button",
    {
      onClick: () => a == null ? void 0 : a(e),
      className: "acx-w-full acx-text-left acx-p-4 acx-border acx-border-gray-200 acx-rounded-xl hover:acx-border-primary-200 hover:acx-bg-primary-50/50 acx-transition-all",
      children: [
        /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2 acx-mb-2", children: [
          /* @__PURE__ */ t("span", { className: `acx-text-[10px] acx-font-semibold acx-px-2 acx-py-0.5 acx-rounded-full ${Te[e.category] ?? "acx-bg-gray-100 acx-text-gray-700"}`, children: we[e.category] ?? e.category }),
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
        /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: j(e.published_at) })
      ]
    }
  );
}
function Ee() {
  const { state: e, dispatch: a, config: c } = N(), { search: n } = be(), { announcements: r } = G(), s = r.find((d) => d.is_pinned), i = y((d) => {
    d.url && window.open(d.url, "_blank", "noopener,noreferrer");
  }, []), x = y(() => {
    a({ type: "SET_TAB", payload: "messages" });
  }, [a]);
  return /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ o("div", { className: "acx-bg-gradient-to-b acx-from-primary-600 acx-to-primary-500 acx-px-5 acx-pt-5 acx-pb-8 acx-text-white", children: [
      /* @__PURE__ */ t("h1", { className: "acx-text-xl acx-font-bold acx-mb-1", children: c.greeting ?? "Hi there! 👋" }),
      /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-primary-100", children: "How can we help you today?" })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-px-4 -acx-mt-4", children: /* @__PURE__ */ o("div", { className: "acx-bg-white acx-rounded-xl acx-shadow-lg acx-p-4", children: [
      /* @__PURE__ */ t(Se, { onSearch: n }),
      /* @__PURE__ */ t("div", { className: "acx-mt-3 acx-space-y-1", children: e.kbLoading ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "Searching..." }) : e.kbResults.length > 0 ? e.kbResults.slice(0, 5).map((d) => /* @__PURE__ */ t($, { article: d, onClick: i }, d.id)) : null })
    ] }) }),
    s && /* @__PURE__ */ t("div", { className: "acx-px-4 acx-mt-4", children: /* @__PURE__ */ t(K, { announcement: s }) }),
    /* @__PURE__ */ t("div", { className: "acx-mt-auto acx-p-4", children: /* @__PURE__ */ t(
      "button",
      {
        onClick: x,
        className: "acx-w-full acx-bg-primary-600 acx-text-white acx-py-3 acx-rounded-xl acx-font-medium acx-text-sm hover:acx-bg-primary-700 acx-transition-colors",
        children: "Start a conversation"
      }
    ) })
  ] });
}
const ve = "acrux_chat_";
function O(e, a) {
  const c = `${ve}${e}`, [n, r] = E(() => {
    try {
      const i = window.localStorage.getItem(c);
      return i ? JSON.parse(i) : a;
    } catch {
      return a;
    }
  }), s = y(
    (i) => {
      r(i);
      try {
        window.localStorage.setItem(c, JSON.stringify(i));
      } catch {
      }
    },
    [c]
  );
  return [n, s];
}
function W() {
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
  var b;
  const { state: e, dispatch: a, config: c } = N(), [n, r] = O("session_key", null), [s, i] = O("chat_access_token", null), x = m();
  x.current || (x.current = new C({ baseUrl: c.apiUrl, token: c.token }), s && x.current.setChatToken(s));
  const d = x.current, T = y(async () => {
    var l;
    const f = W(), u = c.mode === "lead" ? ke() : void 0;
    try {
      a({ type: "SET_LOADING", payload: !0 });
      const h = await d.createSession({
        source: c.mode === "lead" ? "lead_bot" : "user_bot",
        session_key: f,
        visitor_name: c.userName,
        visitor_email: c.userEmail,
        visitor_metadata: u
      });
      return h.access_token && (d.setChatToken(h.access_token), i(h.access_token)), a({ type: "SET_SESSION", payload: h }), r(h.session_key), (l = c.onSessionCreated) == null || l.call(c, h.session_key), a({ type: "SET_LOADING", payload: !1 }), h;
    } catch (h) {
      throw a({ type: "SET_ERROR", payload: "Failed to create chat session" }), a({ type: "SET_LOADING", payload: !1 }), h;
    }
  }, [d, c, a, r, i]), g = y(async (f) => {
    try {
      a({ type: "SET_LOADING", payload: !0 });
      const u = await d.getSession(f), { messages: l, ...h } = u;
      return a({ type: "SET_SESSION", payload: h }), a({ type: "SET_MESSAGES", payload: l }), a({ type: "SET_LOADING", payload: !1 }), h;
    } catch {
      return r(null), i(null), d.setChatToken(""), a({ type: "SET_LOADING", payload: !1 }), null;
    }
  }, [d, a, r, i]), p = y(async (f, u) => {
    if (e.session) {
      a({ type: "SET_VISITOR_INFO", payload: { name: f, email: u } });
      try {
        await d.updateVisitor(e.session.session_key, {
          visitor_name: f,
          visitor_email: u
        });
      } catch {
      }
    }
  }, [d, e.session, a]);
  return _(() => {
    n && !e.session && g(n);
  }, []), {
    session: e.session,
    sessionKey: ((b = e.session) == null ? void 0 : b.session_key) ?? n,
    accessToken: d.getChatToken() ?? s,
    createSession: T,
    restoreSession: g,
    updateVisitorInfo: p,
    api: d
  };
}
class Ie {
  constructor(a) {
    S(this, "ws", null);
    S(this, "url");
    S(this, "onMessage");
    S(this, "onStatusChange");
    S(this, "retryCount", 0);
    S(this, "reconnectTimer", null);
    S(this, "heartbeatTimer", null);
    S(this, "messageQueue", []);
    S(this, "intentionallyClosed", !1);
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
      k.WS_RECONNECT_BASE * Math.pow(2, this.retryCount),
      k.WS_RECONNECT_MAX
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null, this.retryCount++, this.connect();
    }, a);
  }
  startHeartbeat() {
    this.stopHeartbeat(), this.heartbeatTimer = setInterval(() => {
      this.send({ type: "heartbeat" });
    }, k.WS_HEARTBEAT_INTERVAL);
  }
  stopHeartbeat() {
    this.heartbeatTimer && (clearInterval(this.heartbeatTimer), this.heartbeatTimer = null);
  }
}
function Ae(e, a) {
  const { state: c, dispatch: n, config: r } = N(), s = m(null), i = m(/* @__PURE__ */ new Map()), x = m(null);
  _(() => {
    if (!e) return;
    const g = r.apiUrl.startsWith("https") ? "wss" : "ws", p = r.apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    let b = `${g}://${p}${ee(e)}`;
    a && (b += `?token=${encodeURIComponent(a)}`);
    const f = new Ie({
      url: b,
      onStatusChange: (l) => {
        n({ type: "SET_CONNECTED", payload: l });
      },
      onMessage: (l) => {
        switch (l.type) {
          case "history":
            l.messages && n({ type: "SET_MESSAGES", payload: l.messages });
            break;
          case "message":
            l.message && (n({ type: "ADD_MESSAGE", payload: l.message }), (!c.isOpen || c.activeTab !== "messages") && n({ type: "INCREMENT_UNREAD" }));
            break;
          case "message_ack":
            if (l.temp_id && l.real_id) {
              n({ type: "ACK_MESSAGE", payload: { temp_id: l.temp_id, real_id: l.real_id } });
              const h = i.current.get(l.temp_id);
              h && (clearTimeout(h), i.current.delete(l.temp_id));
            }
            break;
          case "agent_joined":
            l.agent && n({ type: "AGENT_JOINED", payload: l.agent });
            break;
          case "agent_typing":
            n({
              type: "SET_AGENT_TYPING",
              payload: { is_typing: l.is_typing ?? !1, agent_name: l.agent_name }
            }), x.current && clearTimeout(x.current), l.is_typing && (x.current = setTimeout(() => {
              n({ type: "SET_AGENT_TYPING", payload: { is_typing: !1 } }), x.current = null;
            }, k.TYPING_TIMEOUT));
            break;
          case "heartbeat_ack":
            break;
          case "error":
            n({ type: "SET_ERROR", payload: l.error ?? "WebSocket error" });
            break;
        }
      }
    });
    f.connect(), s.current = f;
    const u = i.current;
    return () => {
      f.disconnect(), s.current = null, u.forEach((l) => clearTimeout(l)), u.clear(), x.current && (clearTimeout(x.current), x.current = null);
    };
  }, [e, a, r.apiUrl]);
  const d = y((g) => {
    if (!s.current) return;
    const p = W(), b = {
      id: p,
      session: 0,
      sender_type: r.mode === "lead" ? "visitor" : "user",
      sender_name: c.visitorName || "You",
      content: g,
      content_type: "text",
      attachments: [],
      is_read: !0,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      temp_id: p,
      status: "sending"
    };
    n({ type: "ADD_MESSAGE", payload: b }), s.current.send({
      type: "message",
      text: g,
      temp_id: p
    });
    const f = setTimeout(() => {
      n({ type: "FAIL_MESSAGE", payload: { temp_id: p } }), i.current.delete(p);
    }, k.MESSAGE_ACK_TIMEOUT);
    i.current.set(p, f);
  }, [r.mode, c.visitorName, n]), T = y((g) => {
    var p;
    (p = s.current) == null || p.send({ type: "typing", is_typing: g });
  }, []);
  return {
    isConnected: c.isConnected,
    sendMessage: d,
    sendTyping: T
  };
}
function Oe() {
  var s, i, x;
  const { state: e, dispatch: a, config: c } = N(), n = m(), r = m(!1);
  return n.current || (n.current = new C({ baseUrl: c.apiUrl, token: c.token })), _(() => {
    r.current || (r.current = !0, n.current.getOperatingHoursStatus().then((d) => {
      a({ type: "SET_OPERATING_HOURS", payload: d });
    }).catch(() => {
    }));
  }, [a]), {
    isOnline: ((s = e.operatingHours) == null ? void 0 : s.is_online) ?? !0,
    offlineMessage: (i = e.operatingHours) == null ? void 0 : i.offline_message,
    responseTime: (x = e.operatingHours) == null ? void 0 : x.response_time
  };
}
function Re(e) {
  return e.split(" ").slice(0, 2).map((a) => a[0] ?? "").join("").toUpperCase();
}
const R = [
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
  return R[Math.abs(a) % R.length];
}
function V({ name: e, avatarUrl: a }) {
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
  const a = e.sender_type === "visitor" || e.sender_type === "user";
  return e.sender_type === "system" ? /* @__PURE__ */ t("div", { className: "acx-flex acx-justify-center acx-py-2", children: /* @__PURE__ */ t("span", { className: "acx-text-xs acx-text-gray-400 acx-italic", children: e.content }) }) : /* @__PURE__ */ o("div", { className: `acx-flex acx-gap-2 acx-mb-3 ${a ? "acx-justify-end" : "acx-justify-start"}`, children: [
    !a && /* @__PURE__ */ t(V, { name: e.sender_name }),
    /* @__PURE__ */ o("div", { className: `acx-max-w-[75%] ${a ? "acx-order-1" : ""}`, children: [
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
      /* @__PURE__ */ o("div", { className: `acx-flex acx-items-center acx-gap-1 acx-mt-0.5 ${a ? "acx-justify-end" : ""}`, children: [
        /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: j(e.created_at) }),
        a && e.status === "sending" && /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: "Sending..." }),
        a && e.status === "failed" && /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-red-500", children: "Failed" })
      ] })
    ] })
  ] });
}
function Ue({ agentName: e }) {
  return /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2 acx-mb-3", children: [
    /* @__PURE__ */ t(V, { name: e ?? "Agent" }),
    /* @__PURE__ */ t("div", { className: "acx-bg-gray-100 acx-rounded-2xl acx-rounded-bl-md acx-px-4 acx-py-3", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-gap-1", children: [
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" })
    ] }) })
  ] });
}
function Pe({ messages: e, agentTyping: a }) {
  const c = m(null), n = m(null);
  return _(() => {
    var r;
    (r = c.current) == null || r.scrollIntoView({ behavior: "smooth" });
  }, [e.length, a.is_typing]), /* @__PURE__ */ o(
    "div",
    {
      ref: n,
      className: "acx-flex-1 acx-overflow-y-auto acx-px-4 acx-py-3 acx-space-y-1",
      children: [
        e.map((r, s) => {
          const i = e[s - 1], x = !i || !_e(i.created_at, r.created_at);
          return /* @__PURE__ */ o("div", { children: [
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
function He({ onSend: e, onTyping: a, onFileUpload: c, mode: n, disabled: r }) {
  const [s, i] = E(""), x = m(null), d = m(), T = y(() => {
    const u = s.trim();
    !u || r || (e(u), i(""), a == null || a(!1));
  }, [s, r, e, a]), g = (u) => {
    u.key === "Enter" && !u.shiftKey && (u.preventDefault(), T());
  }, p = (u) => {
    const l = u.target.value;
    l.length > A.MAX_MESSAGE_LENGTH || (i(l), a == null || a(!0), d.current && clearTimeout(d.current), d.current = setTimeout(() => a == null ? void 0 : a(!1), 2e3));
  }, b = () => {
    var u;
    (u = x.current) == null || u.click();
  }, f = (u) => {
    u.target.files && u.target.files.length > 0 && (c == null || c(u.target.files), u.target.value = "");
  };
  return /* @__PURE__ */ t("div", { className: "acx-border-t acx-border-gray-200 acx-bg-white acx-px-3 acx-py-2", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-items-end acx-gap-2", children: [
    n === "user" && c && /* @__PURE__ */ o(D, { children: [
      /* @__PURE__ */ t(
        "button",
        {
          onClick: b,
          className: "acx-p-1.5 acx-text-gray-400 hover:acx-text-gray-600 acx-transition-colors acx-flex-shrink-0",
          "aria-label": "Attach file",
          type: "button",
          children: /* @__PURE__ */ t(pe, { className: "acx-w-5 acx-h-5" })
        }
      ),
      /* @__PURE__ */ t(
        "input",
        {
          ref: x,
          type: "file",
          className: "acx-hidden",
          accept: A.ALLOWED_FILE_TYPES.join(","),
          multiple: !0,
          onChange: f
        }
      )
    ] }),
    /* @__PURE__ */ t(
      "textarea",
      {
        value: s,
        onChange: p,
        onKeyDown: g,
        placeholder: "Type a message...",
        disabled: r,
        rows: 1,
        className: "acx-flex-1 acx-resize-none acx-border-0 acx-outline-none acx-text-sm acx-py-2 acx-max-h-24 acx-bg-transparent placeholder:acx-text-gray-400",
        style: { fieldSizing: "content" }
      }
    ),
    /* @__PURE__ */ t(
      "button",
      {
        onClick: T,
        disabled: !s.trim() || r,
        className: "acx-p-1.5 acx-text-primary-600 hover:acx-text-primary-700 disabled:acx-text-gray-300 acx-transition-colors acx-flex-shrink-0",
        "aria-label": "Send message",
        type: "button",
        children: /* @__PURE__ */ t(ue, { className: "acx-w-5 acx-h-5" })
      }
    )
  ] }) });
}
function L({ isOnline: e, offlineMessage: a, responseTime: c }) {
  return e ? null : /* @__PURE__ */ t("div", { className: "acx-bg-amber-50 acx-border-b acx-border-amber-200 acx-px-4 acx-py-2.5", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2", children: [
    /* @__PURE__ */ t("div", { className: "acx-w-2 acx-h-2 acx-rounded-full acx-bg-amber-400 acx-flex-shrink-0" }),
    /* @__PURE__ */ o("p", { className: "acx-text-xs acx-text-amber-800", children: [
      a ?? "We're currently offline.",
      c && /* @__PURE__ */ o("span", { className: "acx-font-medium", children: [
        " We typically respond ",
        c,
        "."
      ] })
    ] })
  ] }) });
}
function Ge({ onSubmit: e, loading: a }) {
  const [c, n] = E(""), [r, s] = E("");
  return /* @__PURE__ */ o("form", { onSubmit: (x) => {
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
  const { state: e, dispatch: a, config: c } = N(), { session: n, sessionKey: r, accessToken: s, createSession: i, updateVisitorInfo: x } = Ce(), { sendMessage: d, sendTyping: T, isConnected: g } = Ae(r, s), { isOnline: p, offlineMessage: b, responseTime: f } = Oe(), [u, l] = E(!1), h = m(null);
  _(() => {
    g && h.current && (d(h.current), h.current = null);
  }, [g, d]);
  const F = y(async (v) => {
    if (!n) {
      if (c.mode === "lead" && !e.visitorEmail) {
        h.current = v, l(!0);
        return;
      }
      try {
        h.current = v, await i();
      } catch {
        h.current = null;
      }
      return;
    }
    d(v);
  }, [n, c.mode, e.visitorEmail, i, d]), q = y(async (v) => {
    a({ type: "SET_VISITOR_INFO", payload: v }), l(!1);
    try {
      await i() && await x(v.name, v.email);
    } catch {
      h.current = null;
    }
  }, [i, x, a]);
  return _(() => {
    e.unreadCount > 0 && e.activeTab === "messages" && a({ type: "RESET_UNREAD" });
  }, [e.unreadCount, e.activeTab, a]), u && !n ? /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ t(L, { isOnline: p, offlineMessage: b, responseTime: f }),
    /* @__PURE__ */ t(Ge, { onSubmit: q, loading: e.loading })
  ] }) : /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ t(L, { isOnline: p, offlineMessage: b, responseTime: f }),
    e.messages.length === 0 && !n ? /* @__PURE__ */ o("div", { className: "acx-flex-1 acx-flex acx-flex-col acx-items-center acx-justify-center acx-px-6 acx-text-center", children: [
      /* @__PURE__ */ t("div", { className: "acx-w-12 acx-h-12 acx-bg-primary-100 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-mb-3", children: /* @__PURE__ */ t("svg", { className: "acx-w-6 acx-h-6 acx-text-primary-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ t("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }) }),
      /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-600 acx-font-medium", children: "No messages yet" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-400 acx-mt-1", children: "Send a message to start a conversation" })
    ] }) : /* @__PURE__ */ t(Pe, { messages: e.messages, agentTyping: e.agentTyping }),
    /* @__PURE__ */ t(
      He,
      {
        onSend: F,
        onTyping: T,
        mode: c.mode,
        disabled: e.loading
      }
    )
  ] });
}
function je() {
  const { announcements: e } = G();
  return /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ o("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ t("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: "News & Updates" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: "Latest from the team" })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-3", children: e.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-8 acx-text-center", children: /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-400", children: "No announcements yet" }) }) : e.map((a) => /* @__PURE__ */ t(K, { announcement: a }, a.id)) })
  ] });
}
function Ke() {
  const { state: e, dispatch: a, config: c } = N(), n = m(), r = m(!1);
  return n.current || (n.current = new C({ baseUrl: c.apiUrl, token: c.token })), _(() => {
    r.current || (r.current = !0, n.current.getRoadmapItems().then((s) => {
      a({ type: "SET_ROADMAP_ITEMS", payload: I(s) });
    }).catch(() => {
    }));
  }, [a]), { roadmapItems: e.roadmapItems };
}
const M = {
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
  const a = M[e.status] ?? M.planned;
  return /* @__PURE__ */ o("div", { className: "acx-p-4 acx-border acx-border-gray-200 acx-rounded-xl", children: [
    /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-justify-between acx-mb-2", children: [
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
    const s = e.filter((i) => i.status === r);
    return s.length > 0 && n.push({ status: r, items: s }), n;
  }, []), c = {
    planned: "Planned",
    in_progress: "In Progress",
    beta: "Beta",
    released: "Released"
  };
  return /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ o("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ t("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: "Product Roadmap" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: "See what we're building" })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-5", children: a.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-8 acx-text-center", children: /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-400", children: "No roadmap items yet" }) }) : a.map(({ status: n, items: r }) => /* @__PURE__ */ o("div", { children: [
      /* @__PURE__ */ t("h3", { className: "acx-text-xs acx-font-semibold acx-text-gray-500 acx-uppercase acx-tracking-wider acx-mb-2", children: c[n] ?? n }),
      /* @__PURE__ */ t("div", { className: "acx-space-y-2", children: r.map((s) => /* @__PURE__ */ t(Ve, { item: s }, s.id)) })
    ] }, n)) })
  ] });
}
function Ye() {
  var u;
  const { state: e, dispatch: a, config: c } = N(), n = e.kbTopics, [r, s] = E(null), [i, x] = E([]), [d, T] = E(!1), g = m();
  g.current || (g.current = new C({ baseUrl: c.apiUrl, token: c.token })), _(() => {
    var l;
    ((l = e.kbTopics) == null ? void 0 : l.length) > 0 || g.current.getKBTopics().then((h) => a({ type: "SET_KB_TOPICS", payload: Array.isArray(h) ? h : [] })).catch(() => {
    });
  }, [(u = e.kbTopics) == null ? void 0 : u.length, a]);
  const p = y(async (l) => {
    s(l), T(!0);
    try {
      const h = await g.current.getKBTopicArticles(l.slug);
      x(h);
    } catch {
      x([]);
    } finally {
      T(!1);
    }
  }, []), b = y((l) => {
    l.url && window.open(l.url, "_blank", "noopener,noreferrer");
  }, []), f = y(() => {
    s(null), x([]);
  }, []);
  return r ? /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ o("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ o(
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
      /* @__PURE__ */ o("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: [
        r.article_count,
        " article",
        r.article_count !== 1 ? "s" : ""
      ] })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-1", children: d ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "Loading..." }) : i.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "No articles found" }) : i.map((l) => /* @__PURE__ */ t($, { article: l, onClick: b }, l.id)) })
  ] }) : /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ o("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ t("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: "Help Centre" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: "Browse help topics" })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-1", children: n.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-8 acx-text-center", children: /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-400", children: "No help topics available" }) }) : n.map((l) => /* @__PURE__ */ o(
      "button",
      {
        onClick: () => p(l),
        className: "acx-w-full acx-flex acx-items-center acx-justify-between acx-p-3 acx-rounded-lg acx-text-left hover:acx-bg-gray-50 acx-transition-colors",
        children: [
          /* @__PURE__ */ o("div", { children: [
            /* @__PURE__ */ t("h4", { className: "acx-text-sm acx-font-medium acx-text-gray-900", children: l.name }),
            /* @__PURE__ */ o("p", { className: "acx-text-xs acx-text-gray-500", children: [
              l.article_count,
              " article",
              l.article_count !== 1 ? "s" : ""
            ] })
          ] }),
          /* @__PURE__ */ t(H, { className: "acx-w-4 acx-h-4 acx-text-gray-400" })
        ]
      },
      l.id
    )) })
  ] });
}
function ea(e) {
  return /* @__PURE__ */ t(ne, { ...e, children: /* @__PURE__ */ t(Je, { position: e.position ?? ae.POSITION }) });
}
function Je({ position: e }) {
  const { state: a, dispatch: c } = N(), [n, r] = E(!1);
  return /* @__PURE__ */ o("div", { className: "acrux-chat-widget", children: [
    n && /* @__PURE__ */ o(
      "div",
      {
        className: `acx-fixed acx-bottom-20 ${e === "bottom-right" ? "acx-right-4 sm:acx-right-6" : "acx-left-4 sm:acx-left-6"} acx-z-[9999] acx-w-[380px] acx-max-w-[calc(100vw-2rem)] acx-h-[600px] acx-max-h-[calc(100vh-6rem)] acx-bg-white acx-rounded-2xl acx-shadow-2xl acx-flex acx-flex-col acx-overflow-hidden acx-animate-slide-up`,
        role: "dialog",
        "aria-label": "Chat widget",
        children: [
          /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-justify-between acx-px-5 acx-py-4 acx-bg-primary-600 acx-text-white", children: [
            /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2.5", children: [
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
          /* @__PURE__ */ o("div", { className: "acx-flex-1 acx-overflow-hidden", children: [
            a.activeTab === "home" && /* @__PURE__ */ t(Ee, {}),
            a.activeTab === "messages" && /* @__PURE__ */ t($e, {}),
            a.activeTab === "news" && /* @__PURE__ */ t(je, {}),
            a.activeTab === "roadmap" && /* @__PURE__ */ t(qe, {}),
            a.activeTab === "help" && /* @__PURE__ */ t(Ye, {})
          ] }),
          /* @__PURE__ */ t(
            ye,
            {
              activeTab: a.activeTab,
              onTabChange: (i) => c({ type: "SET_TAB", payload: i })
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
