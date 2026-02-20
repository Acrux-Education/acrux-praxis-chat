var Y = Object.defineProperty;
var J = (e, a, c) => a in e ? Y(e, a, { enumerable: !0, configurable: !0, writable: !0, value: c }) : e[a] = c;
var S = (e, a, c) => J(e, typeof a != "symbol" ? a + "" : a, c);
import { jsxs as o, jsx as t, Fragment as B } from "react/jsx-runtime";
import { createContext as z, useReducer as Q, useMemo as X, useRef as g, useEffect as _, useContext as Z, useCallback as y, useState as w } from "react";
const E = {
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
  SEARCH_DEBOUNCE: 300
}, R = {
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
    case "SET_MESSAGES":
      return { ...e, messages: a.payload };
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
class k {
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
    return this.request(E.SESSIONS, {
      method: "POST",
      body: JSON.stringify(a)
    });
  }
  async getSession(a) {
    return this.request(E.SESSION(a));
  }
  async sendMessage(a, c) {
    return this.request(E.SESSION_MESSAGES(a), {
      method: "POST",
      body: JSON.stringify(c)
    });
  }
  async updateVisitor(a, c) {
    return this.request(E.SESSION_VISITOR(a), {
      method: "PATCH",
      body: JSON.stringify(c)
    });
  }
  async getAnnouncements() {
    return this.request(E.ANNOUNCEMENTS);
  }
  async getRoadmapItems() {
    return this.request(E.ROADMAP);
  }
  async searchKB(a) {
    const c = new URLSearchParams({ q: a });
    return this.request(`${E.KB_SEARCH}?${c}`);
  }
  async getKBTopics() {
    return this.request(E.KB_TOPICS);
  }
  async getKBTopicArticles(a) {
    return this.request(E.KB_TOPIC_ARTICLES(a));
  }
  async getOperatingHoursStatus() {
    return this.request(E.OPERATING_HOURS);
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
const U = z(null);
function ne({ children: e, ...a }) {
  const [c, n] = Q(ce, {
    ...te,
    visitorName: a.userName ?? "",
    visitorEmail: a.userEmail ?? ""
  }), r = X(
    () => ({ state: c, dispatch: n, config: a }),
    [c, a]
  );
  return /* @__PURE__ */ o(U.Provider, { value: r, children: [
    /* @__PURE__ */ t(se, {}),
    e
  ] });
}
function se() {
  const { dispatch: e, config: a } = N(), c = g(!1);
  return _(() => {
    if (c.current) return;
    c.current = !0;
    const n = new k({ baseUrl: a.apiUrl, token: a.token });
    n.getAnnouncements().then((r) => e({ type: "SET_ANNOUNCEMENTS", payload: A(r) })).catch(() => {
    }), n.getRoadmapItems().then((r) => e({ type: "SET_ROADMAP_ITEMS", payload: A(r) })).catch(() => {
    }), n.getKBTopics().then((r) => e({ type: "SET_KB_TOPICS", payload: A(r) })).catch(() => {
    }), n.getOperatingHoursStatus().then((r) => e({ type: "SET_OPERATING_HOURS", payload: r })).catch(() => {
    });
  }, [a.apiUrl, a.token, e]), null;
}
function N() {
  const e = Z(U);
  if (!e)
    throw new Error("useChatContext must be used within a ChatProvider");
  return e;
}
function P({ count: e }) {
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
function H({ className: e }) {
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
function $({ className: e }) {
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
      children: e ? /* @__PURE__ */ t(he, { className: "acx-w-6 acx-h-6" }) : /* @__PURE__ */ o(B, { children: [
        /* @__PURE__ */ t(H, { className: "acx-w-7 acx-h-7" }),
        n.unreadCount > 0 && /* @__PURE__ */ t(P, { count: n.unreadCount })
      ] })
    }
  ) });
}
const fe = [
  { id: "home", label: "Home", Icon: oe },
  { id: "messages", label: "Messages", Icon: H },
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
          r === "messages" && c.unreadCount > 0 && /* @__PURE__ */ t(P, { count: c.unreadCount })
        ] }),
        /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-font-medium", children: s })
      ]
    },
    r
  )) });
}
function be() {
  const { dispatch: e, config: a } = N(), c = g(), n = g();
  c.current || (c.current = new k({ baseUrl: a.apiUrl, token: a.token }));
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
    }, C.SEARCH_DEBOUNCE);
  }, [e]);
  return _(() => () => {
    n.current && clearTimeout(n.current);
  }, []), { search: r };
}
function G() {
  const { state: e, dispatch: a, config: c } = N(), n = g(), r = g(!1);
  return n.current || (n.current = new k({ baseUrl: c.apiUrl, token: c.token })), _(() => {
    r.current || (r.current = !0, n.current.getAnnouncements().then((s) => {
      a({ type: "SET_ANNOUNCEMENTS", payload: A(s) });
    }).catch(() => {
    }));
  }, [a]), { announcements: e.announcements };
}
function Se({ onSearch: e, placeholder: a = "Search for help..." }) {
  const [c, n] = w(""), r = g();
  return _(() => (r.current && clearTimeout(r.current), r.current = setTimeout(() => {
    e(c.trim());
  }, C.SEARCH_DEBOUNCE), () => {
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
function j({ article: e, onClick: a }) {
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
        /* @__PURE__ */ t($, { className: "acx-w-4 acx-h-4 acx-text-gray-400 acx-flex-shrink-0 acx-ml-2" })
      ]
    }
  );
}
function K(e) {
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
}, Ee = {
  feature: "New Feature",
  improvement: "Improvement",
  update: "Update",
  maintenance: "Maintenance",
  event: "Event"
};
function W({ announcement: e, onClick: a }) {
  return /* @__PURE__ */ o(
    "button",
    {
      onClick: () => a == null ? void 0 : a(e),
      className: "acx-w-full acx-text-left acx-p-4 acx-border acx-border-gray-200 acx-rounded-xl hover:acx-border-primary-200 hover:acx-bg-primary-50/50 acx-transition-all",
      children: [
        /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2 acx-mb-2", children: [
          /* @__PURE__ */ t("span", { className: `acx-text-[10px] acx-font-semibold acx-px-2 acx-py-0.5 acx-rounded-full ${Te[e.category] ?? "acx-bg-gray-100 acx-text-gray-700"}`, children: Ee[e.category] ?? e.category }),
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
        /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: K(e.published_at) })
      ]
    }
  );
}
function we() {
  const { state: e, dispatch: a, config: c } = N(), { search: n } = be(), { announcements: r } = G(), s = r.find((u) => u.is_pinned), i = y((u) => {
    u.url && window.open(u.url, "_blank", "noopener,noreferrer");
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
      /* @__PURE__ */ t("div", { className: "acx-mt-3 acx-space-y-1", children: e.kbLoading ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "Searching..." }) : e.kbResults.length > 0 ? e.kbResults.slice(0, 5).map((u) => /* @__PURE__ */ t(j, { article: u, onClick: i }, u.id)) : null })
    ] }) }),
    s && /* @__PURE__ */ t("div", { className: "acx-px-4 acx-mt-4", children: /* @__PURE__ */ t(W, { announcement: s }) }),
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
  const c = `${ve}${e}`, [n, r] = w(() => {
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
function V() {
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
  var p;
  const { state: e, dispatch: a, config: c } = N(), [n, r] = O("session_key", null), [s, i] = O("chat_access_token", null), x = g();
  x.current || (x.current = new k({ baseUrl: c.apiUrl, token: c.token }), s && x.current.setChatToken(s));
  const u = x.current, T = y(async () => {
    var h;
    const f = V(), d = c.mode === "lead" ? ke() : void 0;
    try {
      a({ type: "SET_LOADING", payload: !0 });
      const l = await u.createSession({
        source: c.mode === "lead" ? "lead_bot" : "user_bot",
        session_key: f,
        visitor_name: c.userName,
        visitor_email: c.userEmail,
        visitor_metadata: d
      });
      return l.access_token && (u.setChatToken(l.access_token), i(l.access_token)), a({ type: "SET_SESSION", payload: l }), r(l.session_key), (h = c.onSessionCreated) == null || h.call(c, l.session_key), a({ type: "SET_LOADING", payload: !1 }), l;
    } catch (l) {
      throw a({ type: "SET_ERROR", payload: "Failed to create chat session" }), a({ type: "SET_LOADING", payload: !1 }), l;
    }
  }, [u, c, a, r, i]), b = y(async (f) => {
    try {
      a({ type: "SET_LOADING", payload: !0 });
      const d = await u.getSession(f), { messages: h, ...l } = d;
      return a({ type: "SET_SESSION", payload: l }), a({ type: "SET_MESSAGES", payload: h }), a({ type: "SET_LOADING", payload: !1 }), l;
    } catch {
      return r(null), i(null), u.setChatToken(""), a({ type: "SET_LOADING", payload: !1 }), null;
    }
  }, [u, a, r, i]), m = y(async (f, d) => {
    if (e.session) {
      a({ type: "SET_VISITOR_INFO", payload: { name: f, email: d } });
      try {
        await u.updateVisitor(e.session.session_key, {
          visitor_name: f,
          visitor_email: d
        });
      } catch {
      }
    }
  }, [u, e.session, a]);
  return _(() => {
    n && !e.session && b(n);
  }, []), {
    session: e.session,
    sessionKey: ((p = e.session) == null ? void 0 : p.session_key) ?? n,
    accessToken: u.getChatToken() ?? s,
    createSession: T,
    restoreSession: b,
    updateVisitorInfo: m,
    api: u
  };
}
class Ae {
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
function Ie(e, a) {
  const { state: c, dispatch: n, config: r } = N(), s = g(null), i = g(/* @__PURE__ */ new Map());
  _(() => {
    if (!e) return;
    const m = r.apiUrl.startsWith("https") ? "wss" : "ws", p = r.apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    let f = `${m}://${p}${ee(e)}`;
    a && (f += `?token=${encodeURIComponent(a)}`);
    const d = new Ae({
      url: f,
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
              const I = i.current.get(l.temp_id);
              I && (clearTimeout(I), i.current.delete(l.temp_id));
            }
            break;
          case "agent_joined":
            l.agent && n({ type: "AGENT_JOINED", payload: l.agent });
            break;
          case "agent_typing":
            n({
              type: "SET_AGENT_TYPING",
              payload: { is_typing: l.is_typing ?? !1, agent_name: l.agent_name }
            });
            break;
          case "heartbeat_ack":
            break;
          case "error":
            n({ type: "SET_ERROR", payload: l.error ?? "WebSocket error" });
            break;
        }
      }
    });
    d.connect(), s.current = d;
    const h = i.current;
    return () => {
      d.disconnect(), s.current = null, h.forEach((l) => clearTimeout(l)), h.clear();
    };
  }, [e, a, r.apiUrl]);
  const x = y((m) => {
    if (!s.current) return;
    const p = V(), f = {
      id: p,
      session: 0,
      sender_type: r.mode === "lead" ? "visitor" : "user",
      sender_name: c.visitorName || "You",
      content: m,
      content_type: "text",
      attachments: [],
      is_read: !0,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      temp_id: p,
      status: "sending"
    };
    n({ type: "ADD_MESSAGE", payload: f }), s.current.send({
      type: "message",
      text: m,
      temp_id: p
    });
    const d = setTimeout(() => {
      n({ type: "FAIL_MESSAGE", payload: { temp_id: p } }), i.current.delete(p);
    }, C.MESSAGE_ACK_TIMEOUT);
    i.current.set(p, d);
  }, [r.mode, c.visitorName, n]), u = y((m) => {
    var p;
    (p = s.current) == null || p.send({ type: "typing", is_typing: m });
  }, []), T = y(() => {
    var m;
    (m = s.current) == null || m.send({ type: "request_agent" });
  }, []), b = y((m) => {
    var p;
    (p = s.current) == null || p.send({ type: "read", message_id: m });
  }, []);
  return {
    isConnected: c.isConnected,
    sendMessage: x,
    sendTyping: u,
    requestAgent: T,
    markRead: b
  };
}
function Re() {
  var s, i, x;
  const { state: e, dispatch: a, config: c } = N(), n = g(), r = g(!1);
  return n.current || (n.current = new k({ baseUrl: c.apiUrl, token: c.token })), _(() => {
    r.current || (r.current = !0, n.current.getOperatingHoursStatus().then((u) => {
      a({ type: "SET_OPERATING_HOURS", payload: u });
    }).catch(() => {
    }));
  }, [a]), {
    isOnline: ((s = e.operatingHours) == null ? void 0 : s.is_online) ?? !0,
    offlineMessage: (i = e.operatingHours) == null ? void 0 : i.offline_message,
    responseTime: (x = e.operatingHours) == null ? void 0 : x.response_time
  };
}
function Oe(e) {
  return e.split(" ").slice(0, 2).map((a) => a[0] ?? "").join("").toUpperCase();
}
const M = [
  "acx-bg-blue-500",
  "acx-bg-green-500",
  "acx-bg-purple-500",
  "acx-bg-orange-500",
  "acx-bg-pink-500",
  "acx-bg-teal-500"
];
function Me(e) {
  let a = 0;
  for (let c = 0; c < e.length; c++)
    a = e.charCodeAt(c) + ((a << 5) - a);
  return M[Math.abs(a) % M.length];
}
function q({ name: e, avatarUrl: a }) {
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
      className: `acx-w-8 acx-h-8 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-text-white acx-text-xs acx-font-semibold acx-flex-shrink-0 ${Me(e)}`,
      children: Oe(e)
    }
  );
}
function Le(e) {
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
    !a && /* @__PURE__ */ t(q, { name: e.sender_name }),
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
              dangerouslySetInnerHTML: { __html: Le(e.content) }
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
        /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: K(e.created_at) }),
        a && e.status === "sending" && /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: "Sending..." }),
        a && e.status === "failed" && /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-red-500", children: "Failed" })
      ] })
    ] })
  ] });
}
function Ue({ agentName: e }) {
  return /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2 acx-mb-3", children: [
    /* @__PURE__ */ t(q, { name: e ?? "Agent" }),
    /* @__PURE__ */ t("div", { className: "acx-bg-gray-100 acx-rounded-2xl acx-rounded-bl-md acx-px-4 acx-py-3", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-gap-1", children: [
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" })
    ] }) })
  ] });
}
function Pe({ messages: e, agentTyping: a }) {
  const c = g(null), n = g(null);
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
  const [s, i] = w(""), x = g(null), u = g(), T = y(() => {
    const d = s.trim();
    !d || r || (e(d), i(""), a == null || a(!1));
  }, [s, r, e, a]), b = (d) => {
    d.key === "Enter" && !d.shiftKey && (d.preventDefault(), T());
  }, m = (d) => {
    const h = d.target.value;
    h.length > R.MAX_MESSAGE_LENGTH || (i(h), a == null || a(!0), u.current && clearTimeout(u.current), u.current = setTimeout(() => a == null ? void 0 : a(!1), 2e3));
  }, p = () => {
    var d;
    (d = x.current) == null || d.click();
  }, f = (d) => {
    d.target.files && d.target.files.length > 0 && (c == null || c(d.target.files), d.target.value = "");
  };
  return /* @__PURE__ */ t("div", { className: "acx-border-t acx-border-gray-200 acx-bg-white acx-px-3 acx-py-2", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-items-end acx-gap-2", children: [
    n === "user" && c && /* @__PURE__ */ o(B, { children: [
      /* @__PURE__ */ t(
        "button",
        {
          onClick: p,
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
          accept: R.ALLOWED_FILE_TYPES.join(","),
          multiple: !0,
          onChange: f
        }
      )
    ] }),
    /* @__PURE__ */ t(
      "textarea",
      {
        value: s,
        onChange: m,
        onKeyDown: b,
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
function $e({ onSubmit: e, loading: a }) {
  const [c, n] = w(""), [r, s] = w("");
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
function Ge() {
  const { state: e, dispatch: a, config: c } = N(), { session: n, sessionKey: r, accessToken: s, createSession: i, updateVisitorInfo: x } = Ce(), { sendMessage: u, sendTyping: T, isConnected: b } = Ie(r, s), { isOnline: m, offlineMessage: p, responseTime: f } = Re(), [d, h] = w(!1), l = g(null);
  _(() => {
    b && l.current && (u(l.current), l.current = null);
  }, [b, u]);
  const I = y(async (v) => {
    if (!n) {
      if (c.mode === "lead" && !e.visitorEmail) {
        l.current = v, h(!0);
        return;
      }
      try {
        l.current = v, await i();
      } catch {
        l.current = null;
      }
      return;
    }
    u(v);
  }, [n, c.mode, e.visitorEmail, i, u]), F = y(async (v) => {
    a({ type: "SET_VISITOR_INFO", payload: v }), h(!1);
    try {
      await i() && await x(v.name, v.email);
    } catch {
      l.current = null;
    }
  }, [i, x, a]);
  return _(() => {
    e.unreadCount > 0 && e.activeTab === "messages" && a({ type: "RESET_UNREAD" });
  }, [e.unreadCount, e.activeTab, a]), d && !n ? /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ t(L, { isOnline: m, offlineMessage: p, responseTime: f }),
    /* @__PURE__ */ t($e, { onSubmit: F, loading: e.loading })
  ] }) : /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ t(L, { isOnline: m, offlineMessage: p, responseTime: f }),
    e.messages.length === 0 && !n ? /* @__PURE__ */ o("div", { className: "acx-flex-1 acx-flex acx-flex-col acx-items-center acx-justify-center acx-px-6 acx-text-center", children: [
      /* @__PURE__ */ t("div", { className: "acx-w-12 acx-h-12 acx-bg-primary-100 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-mb-3", children: /* @__PURE__ */ t("svg", { className: "acx-w-6 acx-h-6 acx-text-primary-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ t("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }) }),
      /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-600 acx-font-medium", children: "No messages yet" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-400 acx-mt-1", children: "Send a message to start a conversation" })
    ] }) : /* @__PURE__ */ t(Pe, { messages: e.messages, agentTyping: e.agentTyping }),
    /* @__PURE__ */ t(
      He,
      {
        onSend: I,
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
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-3", children: e.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-8 acx-text-center", children: /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-400", children: "No announcements yet" }) }) : e.map((a) => /* @__PURE__ */ t(W, { announcement: a }, a.id)) })
  ] });
}
function Ke() {
  const { state: e, dispatch: a, config: c } = N(), n = g(), r = g(!1);
  return n.current || (n.current = new k({ baseUrl: c.apiUrl, token: c.token })), _(() => {
    r.current || (r.current = !0, n.current.getRoadmapItems().then((s) => {
      a({ type: "SET_ROADMAP_ITEMS", payload: A(s) });
    }).catch(() => {
    }));
  }, [a]), { roadmapItems: e.roadmapItems };
}
const D = {
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
  const a = D[e.status] ?? D.planned;
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
const qe = ["in_progress", "beta", "planned", "released"];
function Fe() {
  const { roadmapItems: e } = Ke(), a = qe.reduce((n, r) => {
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
  var d;
  const { state: e, dispatch: a, config: c } = N(), n = e.kbTopics, [r, s] = w(null), [i, x] = w([]), [u, T] = w(!1), b = g();
  b.current || (b.current = new k({ baseUrl: c.apiUrl, token: c.token })), _(() => {
    var h;
    ((h = e.kbTopics) == null ? void 0 : h.length) > 0 || b.current.getKBTopics().then((l) => a({ type: "SET_KB_TOPICS", payload: Array.isArray(l) ? l : [] })).catch(() => {
    });
  }, [(d = e.kbTopics) == null ? void 0 : d.length, a]);
  const m = y(async (h) => {
    s(h), T(!0);
    try {
      const l = await b.current.getKBTopicArticles(h.slug);
      x(l);
    } catch {
      x([]);
    } finally {
      T(!1);
    }
  }, []), p = y((h) => {
    h.url && window.open(h.url, "_blank", "noopener,noreferrer");
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
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-1", children: u ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "Loading..." }) : i.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "No articles found" }) : i.map((h) => /* @__PURE__ */ t(j, { article: h, onClick: p }, h.id)) })
  ] }) : /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ o("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ t("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: "Help Centre" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: "Browse help topics" })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-1", children: n.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-8 acx-text-center", children: /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-400", children: "No help topics available" }) }) : n.map((h) => /* @__PURE__ */ o(
      "button",
      {
        onClick: () => m(h),
        className: "acx-w-full acx-flex acx-items-center acx-justify-between acx-p-3 acx-rounded-lg acx-text-left hover:acx-bg-gray-50 acx-transition-colors",
        children: [
          /* @__PURE__ */ o("div", { children: [
            /* @__PURE__ */ t("h4", { className: "acx-text-sm acx-font-medium acx-text-gray-900", children: h.name }),
            /* @__PURE__ */ o("p", { className: "acx-text-xs acx-text-gray-500", children: [
              h.article_count,
              " article",
              h.article_count !== 1 ? "s" : ""
            ] })
          ] }),
          /* @__PURE__ */ t($, { className: "acx-w-4 acx-h-4 acx-text-gray-400" })
        ]
      },
      h.id
    )) })
  ] });
}
function ea(e) {
  return /* @__PURE__ */ t(ne, { ...e, children: /* @__PURE__ */ t(Je, { position: e.position ?? ae.POSITION }) });
}
function Je({ position: e }) {
  const { state: a, dispatch: c } = N(), [n, r] = w(!1);
  return /* @__PURE__ */ o("div", { className: "acrux-chat-widget", children: [
    n && /* @__PURE__ */ o(
      "div",
      {
        className: `acx-fixed acx-bottom-20 ${e === "bottom-right" ? "acx-right-4 sm:acx-right-6" : "acx-left-4 sm:acx-left-6"} acx-z-[9999] acx-w-[380px] acx-max-w-[calc(100vw-2rem)] acx-h-[600px] acx-max-h-[calc(100vh-6rem)] acx-bg-white acx-rounded-2xl acx-shadow-2xl acx-flex acx-flex-col acx-overflow-hidden acx-animate-slide-up`,
        role: "dialog",
        "aria-label": "Chat widget",
        children: [
          /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-justify-between acx-px-5 acx-py-4 acx-bg-primary-600 acx-text-white", children: [
            /* @__PURE__ */ t("h2", { className: "acx-text-lg acx-font-semibold", children: "Acrux" }),
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
            a.activeTab === "home" && /* @__PURE__ */ t(we, {}),
            a.activeTab === "messages" && /* @__PURE__ */ t(Ge, {}),
            a.activeTab === "news" && /* @__PURE__ */ t(je, {}),
            a.activeTab === "roadmap" && /* @__PURE__ */ t(Fe, {}),
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
