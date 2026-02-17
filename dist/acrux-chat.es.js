var F = Object.defineProperty;
var Y = (e, a, c) => a in e ? F(e, a, { enumerable: !0, configurable: !0, writable: !0, value: c }) : e[a] = c;
var S = (e, a, c) => Y(e, typeof a != "symbol" ? a + "" : a, c);
import { jsxs as o, jsx as t, Fragment as D } from "react/jsx-runtime";
import { createContext as J, useReducer as z, useMemo as Q, useRef as m, useEffect as _, useContext as X, useCallback as f, useState as w } from "react";
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
}, Z = (e) => `/ws/chat/${e}/`, ee = {
  POSITION: "bottom-right"
}, C = {
  WS_RECONNECT_BASE: 1e3,
  WS_RECONNECT_MAX: 3e4,
  WS_HEARTBEAT_INTERVAL: 3e4,
  MESSAGE_ACK_TIMEOUT: 5e3,
  SEARCH_DEBOUNCE: 300
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
}, ae = {
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
function te(e, a) {
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
      throw new ce(r.status, r.statusText, s);
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
class ce extends Error {
  constructor(a, c, n) {
    super(`API Error ${a}: ${c}`), this.status = a, this.statusText = c, this.body = n, this.name = "ApiError";
  }
}
const B = J(null);
function re({ children: e, ...a }) {
  const [c, n] = z(te, {
    ...ae,
    visitorName: a.userName ?? "",
    visitorEmail: a.userEmail ?? ""
  }), r = Q(
    () => ({ state: c, dispatch: n, config: a }),
    [c, a]
  );
  return /* @__PURE__ */ o(B.Provider, { value: r, children: [
    /* @__PURE__ */ t(ne, {}),
    e
  ] });
}
function ne() {
  const { dispatch: e, config: a } = N(), c = m(!1);
  return _(() => {
    if (c.current) return;
    c.current = !0;
    const n = new k({ baseUrl: a.apiUrl, token: a.token });
    n.getAnnouncements().then((r) => e({ type: "SET_ANNOUNCEMENTS", payload: r })).catch(() => {
    }), n.getRoadmapItems().then((r) => e({ type: "SET_ROADMAP_ITEMS", payload: r })).catch(() => {
    }), n.getKBTopics().then((r) => e({ type: "SET_KB_TOPICS", payload: r })).catch(() => {
    }), n.getOperatingHoursStatus().then((r) => e({ type: "SET_OPERATING_HOURS", payload: r })).catch(() => {
    });
  }, [a.apiUrl, a.token, e]), null;
}
function N() {
  const e = X(B);
  if (!e)
    throw new Error("useChatContext must be used within a ChatProvider");
  return e;
}
function U({ count: e }) {
  if (e <= 0) return null;
  const a = e > 99 ? "99+" : String(e);
  return /* @__PURE__ */ t("span", { className: "acx-absolute -acx-top-1.5 -acx-right-1.5 acx-min-w-[18px] acx-h-[18px] acx-flex acx-items-center acx-justify-center acx-bg-red-500 acx-text-white acx-text-[10px] acx-font-bold acx-rounded-full acx-px-1 acx-leading-none", children: a });
}
function se({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }),
    /* @__PURE__ */ t("polyline", { points: "9 22 9 12 15 12 15 22" })
  ] });
}
function P({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) });
}
function oe({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }),
    /* @__PURE__ */ t("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })
  ] });
}
function ie({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("polygon", { points: "1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" }),
    /* @__PURE__ */ t("line", { x1: "8", y1: "2", x2: "8", y2: "18" }),
    /* @__PURE__ */ t("line", { x1: "16", y1: "6", x2: "16", y2: "22" })
  ] });
}
function le({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("circle", { cx: "12", cy: "12", r: "10" }),
    /* @__PURE__ */ t("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
    /* @__PURE__ */ t("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
  ] });
}
function xe({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("circle", { cx: "11", cy: "11", r: "8" }),
    /* @__PURE__ */ t("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
  ] });
}
function de({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
    /* @__PURE__ */ t("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
  ] });
}
function ue({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    /* @__PURE__ */ t("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ] });
}
function he({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" }) });
}
function H({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("polyline", { points: "9 18 15 12 9 6" }) });
}
function pe({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("polyline", { points: "15 18 9 12 15 6" }) });
}
function me({ isOpen: e, onClick: a, position: c }) {
  const { state: n } = N();
  return /* @__PURE__ */ t("div", { className: `acx-fixed acx-bottom-4 sm:acx-bottom-6 ${c === "bottom-right" ? "acx-right-4 sm:acx-right-6" : "acx-left-4 sm:acx-left-6"} acx-z-[9999]`, children: /* @__PURE__ */ t(
    "button",
    {
      onClick: a,
      className: "acx-relative acx-w-14 acx-h-14 acx-rounded-full acx-bg-primary-600 acx-text-white acx-shadow-lg hover:acx-bg-primary-700 acx-transition-all hover:acx-scale-105 acx-flex acx-items-center acx-justify-center",
      "aria-label": e ? "Close chat" : "Open chat",
      children: e ? /* @__PURE__ */ t(ue, { className: "acx-w-6 acx-h-6" }) : /* @__PURE__ */ o(D, { children: [
        /* @__PURE__ */ t(P, { className: "acx-w-7 acx-h-7" }),
        n.unreadCount > 0 && /* @__PURE__ */ t(U, { count: n.unreadCount })
      ] })
    }
  ) });
}
const ge = [
  { id: "home", label: "Home", Icon: se },
  { id: "messages", label: "Messages", Icon: P },
  { id: "news", label: "News", Icon: oe },
  { id: "roadmap", label: "Roadmap", Icon: ie },
  { id: "help", label: "Help", Icon: le }
];
function fe({ activeTab: e, onTabChange: a }) {
  const { state: c } = N(), n = ge.filter(({ id: r }) => {
    switch (r) {
      case "home":
        return !0;
      case "messages":
        return !0;
      case "news":
        return c.announcements.length > 0;
      case "roadmap":
        return c.roadmapItems.length > 0;
      case "help":
        return c.kbTopics.length > 0;
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
function ye() {
  const { dispatch: e, config: a } = N(), c = m(), n = m();
  c.current || (c.current = new k({ baseUrl: a.apiUrl, token: a.token }));
  const r = f((s) => {
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
function $() {
  const { state: e, dispatch: a, config: c } = N(), n = m(), r = m(!1);
  return n.current || (n.current = new k({ baseUrl: c.apiUrl, token: c.token })), _(() => {
    r.current || (r.current = !0, n.current.getAnnouncements().then((s) => {
      a({ type: "SET_ANNOUNCEMENTS", payload: s });
    }).catch(() => {
    }));
  }, [a]), { announcements: e.announcements };
}
function be({ onSearch: e, placeholder: a = "Search for help..." }) {
  const [c, n] = w(""), r = m();
  return _(() => (r.current && clearTimeout(r.current), r.current = setTimeout(() => {
    e(c.trim());
  }, C.SEARCH_DEBOUNCE), () => {
    r.current && clearTimeout(r.current);
  }), [c, e]), /* @__PURE__ */ o("div", { className: "acx-relative", children: [
    /* @__PURE__ */ t(xe, { className: "acx-absolute acx-left-3 acx-top-1/2 -acx-translate-y-1/2 acx-w-4 acx-h-4 acx-text-gray-400" }),
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
function G({ article: e, onClick: a }) {
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
  const a = new Date(e), n = (/* @__PURE__ */ new Date()).getTime() - a.getTime(), r = Math.floor(n / 1e3), s = Math.floor(r / 60), i = Math.floor(s / 60), u = Math.floor(i / 24);
  return r < 60 ? "Just now" : s < 60 ? `${s}m ago` : i < 24 ? `${i}h ago` : u < 7 ? `${u}d ago` : a.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric"
  });
}
function Se(e) {
  const a = new Date(e), c = /* @__PURE__ */ new Date(), n = new Date(c.getFullYear(), c.getMonth(), c.getDate()), r = new Date(a.getFullYear(), a.getMonth(), a.getDate()), s = Math.floor((n.getTime() - r.getTime()) / (1e3 * 60 * 60 * 24));
  return s === 0 ? "Today" : s === 1 ? "Yesterday" : a.toLocaleDateString(void 0, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}
function Ne(e, a) {
  const c = new Date(e), n = new Date(a);
  return c.getFullYear() === n.getFullYear() && c.getMonth() === n.getMonth() && c.getDate() === n.getDate();
}
const _e = {
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
function K({ announcement: e, onClick: a }) {
  return /* @__PURE__ */ o(
    "button",
    {
      onClick: () => a == null ? void 0 : a(e),
      className: "acx-w-full acx-text-left acx-p-4 acx-border acx-border-gray-200 acx-rounded-xl hover:acx-border-primary-200 hover:acx-bg-primary-50/50 acx-transition-all",
      children: [
        /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2 acx-mb-2", children: [
          /* @__PURE__ */ t("span", { className: `acx-text-[10px] acx-font-semibold acx-px-2 acx-py-0.5 acx-rounded-full ${_e[e.category] ?? "acx-bg-gray-100 acx-text-gray-700"}`, children: Te[e.category] ?? e.category }),
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
  const { state: e, dispatch: a, config: c } = N(), { search: n } = ye(), { announcements: r } = $(), s = r.find((d) => d.is_pinned), i = f((d) => {
    d.url && window.open(d.url, "_blank", "noopener,noreferrer");
  }, []), u = f(() => {
    a({ type: "SET_TAB", payload: "messages" });
  }, [a]);
  return /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ o("div", { className: "acx-bg-gradient-to-b acx-from-primary-600 acx-to-primary-500 acx-px-5 acx-pt-5 acx-pb-8 acx-text-white", children: [
      /* @__PURE__ */ t("h1", { className: "acx-text-xl acx-font-bold acx-mb-1", children: c.greeting ?? "Hi there! 👋" }),
      /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-primary-100", children: "How can we help you today?" })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-px-4 -acx-mt-4", children: /* @__PURE__ */ o("div", { className: "acx-bg-white acx-rounded-xl acx-shadow-lg acx-p-4", children: [
      /* @__PURE__ */ t(be, { onSearch: n }),
      /* @__PURE__ */ t("div", { className: "acx-mt-3 acx-space-y-1", children: e.kbLoading ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "Searching..." }) : e.kbResults.length > 0 ? e.kbResults.slice(0, 5).map((d) => /* @__PURE__ */ t(G, { article: d, onClick: i }, d.id)) : null })
    ] }) }),
    s && /* @__PURE__ */ t("div", { className: "acx-px-4 acx-mt-4", children: /* @__PURE__ */ t(K, { announcement: s }) }),
    /* @__PURE__ */ t("div", { className: "acx-mt-auto acx-p-4", children: /* @__PURE__ */ t(
      "button",
      {
        onClick: u,
        className: "acx-w-full acx-bg-primary-600 acx-text-white acx-py-3 acx-rounded-xl acx-font-medium acx-text-sm hover:acx-bg-primary-700 acx-transition-colors",
        children: "Start a conversation"
      }
    ) })
  ] });
}
const we = "acrux_chat_";
function R(e, a) {
  const c = `${we}${e}`, [n, r] = w(() => {
    try {
      const i = window.localStorage.getItem(c);
      return i ? JSON.parse(i) : a;
    } catch {
      return a;
    }
  }), s = f(
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
function ve() {
  const e = new URLSearchParams(window.location.search);
  return {
    page_url: window.location.href,
    referrer: document.referrer,
    utm_source: e.get("utm_source") ?? void 0,
    utm_medium: e.get("utm_medium") ?? void 0,
    utm_campaign: e.get("utm_campaign") ?? void 0
  };
}
function ke() {
  var h;
  const { state: e, dispatch: a, config: c } = N(), [n, r] = R("session_key", null), [s, i] = R("chat_access_token", null), u = m();
  u.current || (u.current = new k({ baseUrl: c.apiUrl, token: c.token }), s && u.current.setChatToken(s));
  const d = u.current, T = f(async () => {
    var y;
    const g = W(), l = c.mode === "lead" ? ve() : void 0;
    try {
      a({ type: "SET_LOADING", payload: !0 });
      const x = await d.createSession({
        source: c.mode === "lead" ? "lead_bot" : "user_bot",
        session_key: g,
        visitor_name: c.userName,
        visitor_email: c.userEmail,
        visitor_metadata: l
      });
      return x.access_token && (d.setChatToken(x.access_token), i(x.access_token)), a({ type: "SET_SESSION", payload: x }), r(x.session_key), (y = c.onSessionCreated) == null || y.call(c, x.session_key), a({ type: "SET_LOADING", payload: !1 }), x;
    } catch (x) {
      throw a({ type: "SET_ERROR", payload: "Failed to create chat session" }), a({ type: "SET_LOADING", payload: !1 }), x;
    }
  }, [d, c, a, r, i]), b = f(async (g) => {
    try {
      a({ type: "SET_LOADING", payload: !0 });
      const l = await d.getSession(g), { messages: y, ...x } = l;
      return a({ type: "SET_SESSION", payload: x }), a({ type: "SET_MESSAGES", payload: y }), a({ type: "SET_LOADING", payload: !1 }), x;
    } catch {
      return r(null), i(null), d.setChatToken(""), a({ type: "SET_LOADING", payload: !1 }), null;
    }
  }, [d, a, r, i]), p = f(async (g, l) => {
    if (e.session) {
      a({ type: "SET_VISITOR_INFO", payload: { name: g, email: l } });
      try {
        await d.updateVisitor(e.session.session_key, {
          visitor_name: g,
          visitor_email: l
        });
      } catch {
      }
    }
  }, [d, e.session, a]);
  return _(() => {
    n && !e.session && b(n);
  }, []), {
    session: e.session,
    sessionKey: ((h = e.session) == null ? void 0 : h.session_key) ?? n,
    accessToken: d.getChatToken() ?? s,
    createSession: T,
    restoreSession: b,
    updateVisitorInfo: p,
    api: d
  };
}
class Ce {
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
  const { state: c, dispatch: n, config: r } = N(), s = m(null), i = m(/* @__PURE__ */ new Map());
  _(() => {
    if (!e) return;
    const p = r.apiUrl.startsWith("https") ? "wss" : "ws", h = r.apiUrl.replace(/^https?:\/\//, "");
    let g = `${p}://${h}${Z(e)}`;
    a && (g += `?token=${encodeURIComponent(a)}`);
    const l = new Ce({
      url: g,
      onStatusChange: (x) => {
        n({ type: "SET_CONNECTED", payload: x });
      },
      onMessage: (x) => {
        switch (x.type) {
          case "history":
            x.messages && n({ type: "SET_MESSAGES", payload: x.messages });
            break;
          case "message":
            x.message && (n({ type: "ADD_MESSAGE", payload: x.message }), (!c.isOpen || c.activeTab !== "messages") && n({ type: "INCREMENT_UNREAD" }));
            break;
          case "message_ack":
            if (x.temp_id && x.real_id) {
              n({ type: "ACK_MESSAGE", payload: { temp_id: x.temp_id, real_id: x.real_id } });
              const I = i.current.get(x.temp_id);
              I && (clearTimeout(I), i.current.delete(x.temp_id));
            }
            break;
          case "agent_joined":
            x.agent && n({ type: "AGENT_JOINED", payload: x.agent });
            break;
          case "agent_typing":
            n({
              type: "SET_AGENT_TYPING",
              payload: { is_typing: x.is_typing ?? !1, agent_name: x.agent_name }
            });
            break;
          case "heartbeat_ack":
            break;
          case "error":
            n({ type: "SET_ERROR", payload: x.error ?? "WebSocket error" });
            break;
        }
      }
    });
    l.connect(), s.current = l;
    const y = i.current;
    return () => {
      l.disconnect(), s.current = null, y.forEach((x) => clearTimeout(x)), y.clear();
    };
  }, [e, a, r.apiUrl]);
  const u = f((p) => {
    if (!s.current) return;
    const h = W(), g = {
      id: h,
      session: 0,
      sender_type: r.mode === "lead" ? "visitor" : "user",
      sender_name: c.visitorName || "You",
      content: p,
      content_type: "text",
      attachments: [],
      is_read: !0,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      temp_id: h,
      status: "sending"
    };
    n({ type: "ADD_MESSAGE", payload: g }), s.current.send({
      type: "message",
      text: p,
      temp_id: h
    });
    const l = setTimeout(() => {
      n({ type: "FAIL_MESSAGE", payload: { temp_id: h } }), i.current.delete(h);
    }, C.MESSAGE_ACK_TIMEOUT);
    i.current.set(h, l);
  }, [r.mode, c.visitorName, n]), d = f((p) => {
    var h;
    (h = s.current) == null || h.send({ type: "typing", is_typing: p });
  }, []), T = f(() => {
    var p;
    (p = s.current) == null || p.send({ type: "request_agent" });
  }, []), b = f((p) => {
    var h;
    (h = s.current) == null || h.send({ type: "read", message_id: p });
  }, []);
  return {
    isConnected: c.isConnected,
    sendMessage: u,
    sendTyping: d,
    requestAgent: T,
    markRead: b
  };
}
function Ae() {
  var s, i, u;
  const { state: e, dispatch: a, config: c } = N(), n = m(), r = m(!1);
  return n.current || (n.current = new k({ baseUrl: c.apiUrl, token: c.token })), _(() => {
    r.current || (r.current = !0, n.current.getOperatingHoursStatus().then((d) => {
      a({ type: "SET_OPERATING_HOURS", payload: d });
    }).catch(() => {
    }));
  }, [a]), {
    isOnline: ((s = e.operatingHours) == null ? void 0 : s.is_online) ?? !0,
    offlineMessage: (i = e.operatingHours) == null ? void 0 : i.offline_message,
    responseTime: (u = e.operatingHours) == null ? void 0 : u.response_time
  };
}
function Re(e) {
  return e.split(" ").slice(0, 2).map((a) => a[0] ?? "").join("").toUpperCase();
}
const O = [
  "acx-bg-blue-500",
  "acx-bg-green-500",
  "acx-bg-purple-500",
  "acx-bg-orange-500",
  "acx-bg-pink-500",
  "acx-bg-teal-500"
];
function Oe(e) {
  let a = 0;
  for (let c = 0; c < e.length; c++)
    a = e.charCodeAt(c) + ((a << 5) - a);
  return O[Math.abs(a) % O.length];
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
      className: `acx-w-8 acx-h-8 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-text-white acx-text-xs acx-font-semibold acx-flex-shrink-0 ${Oe(e)}`,
      children: Re(e)
    }
  );
}
function Me(e) {
  let a = Le(e);
  return a = a.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"), a = a.replace(/__(.+?)__/g, "<strong>$1</strong>"), a = a.replace(/\*(.+?)\*/g, "<em>$1</em>"), a = a.replace(new RegExp("(?<!\\w)_(.+?)_(?!\\w)", "g"), "<em>$1</em>"), a = a.replace(/`(.+?)`/g, "<code>$1</code>"), a = a.replace(
    /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  ), a = a.replace(/\n/g, "<br />"), a;
}
function Le(e) {
  const a = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return e.replace(/[&<>"']/g, (c) => a[c] ?? c);
}
function De({ message: e }) {
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
      e.attachments.length > 0 && /* @__PURE__ */ t("div", { className: "acx-mt-1 acx-space-y-1", children: e.attachments.map((n, r) => /* @__PURE__ */ t(
        "a",
        {
          href: n.url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "acx-block acx-text-xs acx-text-primary-600 hover:acx-underline acx-truncate",
          children: n.name
        },
        r
      )) }),
      /* @__PURE__ */ o("div", { className: `acx-flex acx-items-center acx-gap-1 acx-mt-0.5 ${a ? "acx-justify-end" : ""}`, children: [
        /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: j(e.created_at) }),
        a && e.status === "sending" && /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: "Sending..." }),
        a && e.status === "failed" && /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-red-500", children: "Failed" })
      ] })
    ] })
  ] });
}
function Be({ agentName: e }) {
  return /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2 acx-mb-3", children: [
    /* @__PURE__ */ t(V, { name: e ?? "Agent" }),
    /* @__PURE__ */ t("div", { className: "acx-bg-gray-100 acx-rounded-2xl acx-rounded-bl-md acx-px-4 acx-py-3", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-gap-1", children: [
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" })
    ] }) })
  ] });
}
function Ue({ messages: e, agentTyping: a }) {
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
          const i = e[s - 1], u = !i || !Ne(i.created_at, r.created_at);
          return /* @__PURE__ */ o("div", { children: [
            u && /* @__PURE__ */ t("div", { className: "acx-flex acx-items-center acx-justify-center acx-py-3", children: /* @__PURE__ */ t("span", { className: "acx-text-xs acx-text-gray-400 acx-bg-gray-50 acx-px-3 acx-py-1 acx-rounded-full", children: Se(r.created_at) }) }),
            /* @__PURE__ */ t(De, { message: r })
          ] }, r.temp_id ?? r.id);
        }),
        a.is_typing && /* @__PURE__ */ t(Be, { agentName: a.agent_name }),
        /* @__PURE__ */ t("div", { ref: c })
      ]
    }
  );
}
function Pe({ onSend: e, onTyping: a, onFileUpload: c, mode: n, disabled: r }) {
  const [s, i] = w(""), u = m(null), d = m(), T = f(() => {
    const l = s.trim();
    !l || r || (e(l), i(""), a == null || a(!1));
  }, [s, r, e, a]), b = (l) => {
    l.key === "Enter" && !l.shiftKey && (l.preventDefault(), T());
  }, p = (l) => {
    const y = l.target.value;
    y.length > A.MAX_MESSAGE_LENGTH || (i(y), a == null || a(!0), d.current && clearTimeout(d.current), d.current = setTimeout(() => a == null ? void 0 : a(!1), 2e3));
  }, h = () => {
    var l;
    (l = u.current) == null || l.click();
  }, g = (l) => {
    l.target.files && l.target.files.length > 0 && (c == null || c(l.target.files), l.target.value = "");
  };
  return /* @__PURE__ */ t("div", { className: "acx-border-t acx-border-gray-200 acx-bg-white acx-px-3 acx-py-2", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-items-end acx-gap-2", children: [
    n === "user" && c && /* @__PURE__ */ o(D, { children: [
      /* @__PURE__ */ t(
        "button",
        {
          onClick: h,
          className: "acx-p-1.5 acx-text-gray-400 hover:acx-text-gray-600 acx-transition-colors acx-flex-shrink-0",
          "aria-label": "Attach file",
          type: "button",
          children: /* @__PURE__ */ t(he, { className: "acx-w-5 acx-h-5" })
        }
      ),
      /* @__PURE__ */ t(
        "input",
        {
          ref: u,
          type: "file",
          className: "acx-hidden",
          accept: A.ALLOWED_FILE_TYPES.join(","),
          multiple: !0,
          onChange: g
        }
      )
    ] }),
    /* @__PURE__ */ t(
      "textarea",
      {
        value: s,
        onChange: p,
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
        children: /* @__PURE__ */ t(de, { className: "acx-w-5 acx-h-5" })
      }
    )
  ] }) });
}
function M({ isOnline: e, offlineMessage: a, responseTime: c }) {
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
function He({ onSubmit: e, loading: a }) {
  const [c, n] = w(""), [r, s] = w("");
  return /* @__PURE__ */ o("form", { onSubmit: (u) => {
    u.preventDefault(), r.trim() && e({ name: c.trim(), email: r.trim() });
  }, className: "acx-p-4 acx-space-y-3", children: [
    /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-600 acx-mb-1", children: "Before we start, could you share your details?" }),
    /* @__PURE__ */ t(
      "input",
      {
        type: "text",
        value: c,
        onChange: (u) => n(u.target.value),
        placeholder: "Your name",
        className: "acx-w-full acx-px-3 acx-py-2 acx-border acx-border-gray-200 acx-rounded-lg acx-text-sm acx-outline-none focus:acx-border-primary-500 focus:acx-ring-1 focus:acx-ring-primary-500"
      }
    ),
    /* @__PURE__ */ t(
      "input",
      {
        type: "email",
        value: r,
        onChange: (u) => s(u.target.value),
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
  const { state: e, dispatch: a, config: c } = N(), { session: n, sessionKey: r, accessToken: s, createSession: i, updateVisitorInfo: u } = ke(), { sendMessage: d, sendTyping: T, isConnected: b } = Ie(r, s), { isOnline: p, offlineMessage: h, responseTime: g } = Ae(), [l, y] = w(!1), x = m(null);
  _(() => {
    b && x.current && (d(x.current), x.current = null);
  }, [b, d]);
  const I = f(async (v) => {
    if (!n) {
      if (c.mode === "lead" && !e.visitorEmail) {
        x.current = v, y(!0);
        return;
      }
      try {
        x.current = v, await i();
      } catch {
        x.current = null;
      }
      return;
    }
    d(v);
  }, [n, c.mode, e.visitorEmail, i, d]), q = f(async (v) => {
    a({ type: "SET_VISITOR_INFO", payload: v }), y(!1);
    try {
      await i() && await u(v.name, v.email);
    } catch {
      x.current = null;
    }
  }, [i, u, a]);
  return _(() => {
    e.unreadCount > 0 && e.activeTab === "messages" && a({ type: "RESET_UNREAD" });
  }, [e.unreadCount, e.activeTab, a]), l && !n ? /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ t(M, { isOnline: p, offlineMessage: h, responseTime: g }),
    /* @__PURE__ */ t(He, { onSubmit: q, loading: e.loading })
  ] }) : /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ t(M, { isOnline: p, offlineMessage: h, responseTime: g }),
    e.messages.length === 0 && !n ? /* @__PURE__ */ o("div", { className: "acx-flex-1 acx-flex acx-flex-col acx-items-center acx-justify-center acx-px-6 acx-text-center", children: [
      /* @__PURE__ */ t("div", { className: "acx-w-12 acx-h-12 acx-bg-primary-100 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-mb-3", children: /* @__PURE__ */ t("svg", { className: "acx-w-6 acx-h-6 acx-text-primary-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ t("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }) }),
      /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-600 acx-font-medium", children: "No messages yet" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-400 acx-mt-1", children: "Send a message to start a conversation" })
    ] }) : /* @__PURE__ */ t(Ue, { messages: e.messages, agentTyping: e.agentTyping }),
    /* @__PURE__ */ t(
      Pe,
      {
        onSend: I,
        onTyping: T,
        mode: c.mode,
        disabled: e.loading
      }
    )
  ] });
}
function Ge() {
  const { announcements: e } = $();
  return /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ o("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ t("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: "News & Updates" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: "Latest from the team" })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-3", children: e.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-8 acx-text-center", children: /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-400", children: "No announcements yet" }) }) : e.map((a) => /* @__PURE__ */ t(K, { announcement: a }, a.id)) })
  ] });
}
function je() {
  const { state: e, dispatch: a, config: c } = N(), n = m(), r = m(!1);
  return n.current || (n.current = new k({ baseUrl: c.apiUrl, token: c.token })), _(() => {
    r.current || (r.current = !0, n.current.getRoadmapItems().then((s) => {
      a({ type: "SET_ROADMAP_ITEMS", payload: s });
    }).catch(() => {
    }));
  }, [a]), { roadmapItems: e.roadmapItems };
}
const L = {
  planned: { bg: "acx-bg-gray-100", text: "acx-text-gray-600", label: "Planned" },
  in_progress: { bg: "acx-bg-blue-100", text: "acx-text-blue-700", label: "In Progress" },
  beta: { bg: "acx-bg-amber-100", text: "acx-text-amber-700", label: "Beta" },
  released: { bg: "acx-bg-green-100", text: "acx-text-green-700", label: "Released" }
}, Ke = {
  assessment: "Assessments",
  marking: "Marking",
  reports: "Reports",
  integrations: "Integrations",
  platform: "Platform"
};
function We({ item: e }) {
  const a = L[e.status] ?? L.planned;
  return /* @__PURE__ */ o("div", { className: "acx-p-4 acx-border acx-border-gray-200 acx-rounded-xl", children: [
    /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-justify-between acx-mb-2", children: [
      /* @__PURE__ */ t("span", { className: `acx-text-[10px] acx-font-semibold acx-px-2 acx-py-0.5 acx-rounded-full ${a.bg} ${a.text}`, children: a.label }),
      e.quarter && /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: e.quarter })
    ] }),
    /* @__PURE__ */ t("h4", { className: "acx-text-sm acx-font-semibold acx-text-gray-900 acx-mb-1", children: e.title }),
    /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-line-clamp-2 acx-mb-2", children: e.description }),
    /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: Ke[e.category] ?? e.category })
  ] });
}
const Ve = ["in_progress", "beta", "planned", "released"];
function qe() {
  const { roadmapItems: e } = je(), a = Ve.reduce((n, r) => {
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
      /* @__PURE__ */ t("div", { className: "acx-space-y-2", children: r.map((s) => /* @__PURE__ */ t(We, { item: s }, s.id)) })
    ] }, n)) })
  ] });
}
function Fe() {
  const { state: e, dispatch: a, config: c } = N(), n = e.kbTopics, [r, s] = w(null), [i, u] = w([]), [d, T] = w(!1), b = m();
  b.current || (b.current = new k({ baseUrl: c.apiUrl, token: c.token })), _(() => {
    e.kbTopics.length > 0 || b.current.getKBTopics().then((l) => a({ type: "SET_KB_TOPICS", payload: l })).catch(() => {
    });
  }, [e.kbTopics.length, a]);
  const p = f(async (l) => {
    s(l), T(!0);
    try {
      const y = await b.current.getKBTopicArticles(l.slug);
      u(y);
    } catch {
      u([]);
    } finally {
      T(!1);
    }
  }, []), h = f((l) => {
    l.url && window.open(l.url, "_blank", "noopener,noreferrer");
  }, []), g = f(() => {
    s(null), u([]);
  }, []);
  return r ? /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ o("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ o(
        "button",
        {
          onClick: g,
          className: "acx-flex acx-items-center acx-gap-1 acx-text-sm acx-text-primary-600 acx-mb-2 hover:acx-text-primary-700",
          children: [
            /* @__PURE__ */ t(pe, { className: "acx-w-4 acx-h-4" }),
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
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-1", children: d ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "Loading..." }) : i.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "No articles found" }) : i.map((l) => /* @__PURE__ */ t(G, { article: l, onClick: h }, l.id)) })
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
function Ze(e) {
  return /* @__PURE__ */ t(re, { ...e, children: /* @__PURE__ */ t(Ye, { position: e.position ?? ee.POSITION }) });
}
function Ye({ position: e }) {
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
            a.activeTab === "home" && /* @__PURE__ */ t(Ee, {}),
            a.activeTab === "messages" && /* @__PURE__ */ t($e, {}),
            a.activeTab === "news" && /* @__PURE__ */ t(Ge, {}),
            a.activeTab === "roadmap" && /* @__PURE__ */ t(qe, {}),
            a.activeTab === "help" && /* @__PURE__ */ t(Fe, {})
          ] }),
          /* @__PURE__ */ t(
            fe,
            {
              activeTab: a.activeTab,
              onTabChange: (i) => c({ type: "SET_TAB", payload: i })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ t(
      me,
      {
        isOpen: n,
        onClick: () => r(!n),
        position: e
      }
    )
  ] });
}
export {
  Ze as ChatWidget
};
//# sourceMappingURL=acrux-chat.es.js.map
