var K = Object.defineProperty;
var V = (e, t, c) => t in e ? K(e, t, { enumerable: !0, configurable: !0, writable: !0, value: c }) : e[t] = c;
var y = (e, t, c) => V(e, typeof t != "symbol" ? t + "" : t, c);
import { jsxs as o, jsx as a, Fragment as I } from "react/jsx-runtime";
import { createContext as Y, useReducer as F, useMemo as q, useRef as S, useEffect as k, useContext as z, useState as E, useCallback as N } from "react";
const J = "0x4AAAAAADHbxC4Cc2tAgr_N", w = {
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
}, Q = (e) => `/ws/chat/${e}/`, X = {
  POSITION: "bottom-right"
}, A = {
  WS_RECONNECT_BASE: 1e3,
  WS_RECONNECT_MAX: 3e4,
  WS_HEARTBEAT_INTERVAL: 3e4,
  MESSAGE_ACK_TIMEOUT: 5e3,
  TYPING_TIMEOUT: 3e3
}, L = {
  MAX_MESSAGE_LENGTH: 5e3,
  ALLOWED_FILE_TYPES: [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "application/pdf"
  ]
}, B = {
  session: null,
  messages: [],
  isConnected: !1,
  isOpen: !1,
  activeTab: "messages",
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
  wsRetryCount: 0,
  loading: !1,
  error: null
};
function Z(e, t) {
  switch (t.type) {
    case "SET_SESSION":
      return { ...e, session: t.payload };
    case "SET_MESSAGES": {
      const c = e.messages.filter(
        (l) => l.temp_id && l.status !== "sent"
      ), r = new Set(t.payload.map((l) => l.id)), n = c.filter((l) => !r.has(l.id));
      return { ...e, messages: [...t.payload, ...n] };
    }
    case "ADD_MESSAGE":
      return {
        ...e,
        messages: [...e.messages, t.payload]
      };
    case "ACK_MESSAGE":
      return {
        ...e,
        messages: e.messages.map(
          (c) => c.temp_id === t.payload.temp_id ? { ...c, id: t.payload.real_id, status: "sent", temp_id: void 0 } : c
        )
      };
    case "FAIL_MESSAGE":
      return {
        ...e,
        messages: e.messages.map(
          (c) => c.temp_id === t.payload.temp_id ? { ...c, status: "failed" } : c
        )
      };
    case "SET_AGENT_TYPING":
      return { ...e, agentTyping: t.payload };
    case "AGENT_JOINED":
      return { ...e, currentAgent: t.payload };
    case "SET_CONNECTED":
      return { ...e, isConnected: t.payload };
    case "SET_TAB":
      return { ...e, activeTab: t.payload };
    case "SET_OPEN":
      return { ...e, isOpen: t.payload };
    case "INCREMENT_UNREAD":
      return { ...e, unreadCount: e.unreadCount + 1 };
    case "RESET_UNREAD":
      return { ...e, unreadCount: 0 };
    case "SET_ANNOUNCEMENTS":
      return { ...e, announcements: t.payload };
    case "SET_ROADMAP_ITEMS":
      return { ...e, roadmapItems: t.payload };
    case "SET_KB_TOPICS":
      return { ...e, kbTopics: t.payload };
    case "SET_KB_RESULTS":
      return { ...e, kbResults: t.payload, kbLoading: !1 };
    case "SET_KB_LOADING":
      return { ...e, kbLoading: t.payload };
    case "SET_OPERATING_HOURS":
      return { ...e, operatingHours: t.payload };
    case "SET_VISITOR_INFO":
      return {
        ...e,
        visitorName: t.payload.name ?? e.visitorName,
        visitorEmail: t.payload.email ?? e.visitorEmail
      };
    case "SET_LOADING":
      return { ...e, loading: t.payload };
    case "SET_ERROR":
      return { ...e, error: t.payload };
    case "SET_WS_RETRY_COUNT":
      return { ...e, wsRetryCount: t.payload };
    default:
      return e;
  }
}
class R {
  constructor(t) {
    y(this, "baseUrl");
    y(this, "token");
    y(this, "chatToken");
    this.baseUrl = t.baseUrl.replace(/\/$/, ""), this.token = t.token;
  }
  setToken(t) {
    this.token = t;
  }
  setChatToken(t) {
    this.chatToken = t;
  }
  getChatToken() {
    return this.chatToken;
  }
  async request(t, c = {}) {
    const r = {
      "Content-Type": "application/json",
      ...c.headers
    };
    this.token && (r.Authorization = `Bearer ${this.token}`), this.chatToken && (r["X-Chat-Token"] = this.chatToken);
    const n = await fetch(`${this.baseUrl}${t}`, {
      ...c,
      headers: r
    });
    if (!n.ok) {
      const l = await n.text().catch(() => "");
      throw new ee(n.status, n.statusText, l);
    }
    if (n.status !== 204)
      return n.json();
  }
  async createSession(t) {
    return this.request(w.SESSIONS, {
      method: "POST",
      body: JSON.stringify(t)
    });
  }
  async getSession(t) {
    return this.request(w.SESSION(t));
  }
  async sendMessage(t, c) {
    return this.request(w.SESSION_MESSAGES(t), {
      method: "POST",
      body: JSON.stringify(c)
    });
  }
  async updateVisitor(t, c) {
    return this.request(w.SESSION_VISITOR(t), {
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
  async searchKB(t) {
    const c = new URLSearchParams({ q: t });
    return this.request(`${w.KB_SEARCH}?${c}`);
  }
  async getKBTopics() {
    return this.request(w.KB_TOPICS);
  }
  async getKBTopicArticles(t) {
    return this.request(w.KB_TOPIC_ARTICLES(t));
  }
  async getOperatingHoursStatus() {
    return this.request(w.OPERATING_HOURS);
  }
}
class ee extends Error {
  constructor(t, c, r) {
    super(`API Error ${t}: ${c}`), this.status = t, this.statusText = c, this.body = r, this.name = "ApiError";
  }
}
function M(e) {
  return Array.isArray(e) ? e : e && typeof e == "object" && "results" in e ? e.results : [];
}
const $ = Y(null);
function te({ children: e, ...t }) {
  const [c, r] = F(Z, {
    ...B,
    activeTab: t.defaultTab ?? B.activeTab,
    visitorName: t.userName ?? "",
    visitorEmail: t.userEmail ?? ""
  }), n = q(
    () => ({ state: c, dispatch: r, config: t }),
    [c, t]
  );
  return /* @__PURE__ */ o($.Provider, { value: n, children: [
    /* @__PURE__ */ a(ae, {}),
    e
  ] });
}
function ae() {
  const { dispatch: e, config: t } = v(), c = S(!1);
  return k(() => {
    if (c.current) return;
    c.current = !0;
    const r = new R({ baseUrl: t.apiUrl, token: t.token });
    r.getAnnouncements().then((n) => e({ type: "SET_ANNOUNCEMENTS", payload: M(n) })).catch(() => {
    }), r.getRoadmapItems().then((n) => e({ type: "SET_ROADMAP_ITEMS", payload: M(n) })).catch(() => {
    }), r.getKBTopics().then((n) => e({ type: "SET_KB_TOPICS", payload: M(n) })).catch(() => {
    }), r.getOperatingHoursStatus().then((n) => e({ type: "SET_OPERATING_HOURS", payload: n })).catch(() => {
    });
  }, [t.apiUrl, t.token, e]), null;
}
function v() {
  const e = z($);
  if (!e)
    throw new Error("useChatContext must be used within a ChatProvider");
  return e;
}
function j({ count: e }) {
  if (e <= 0) return null;
  const t = e > 99 ? "99+" : String(e);
  return /* @__PURE__ */ a("span", { className: "acx-absolute -acx-top-1.5 -acx-right-1.5 acx-min-w-[18px] acx-h-[18px] acx-flex acx-items-center acx-justify-center acx-bg-red-500 acx-text-white acx-text-[10px] acx-font-bold acx-rounded-full acx-px-1 acx-leading-none", children: t });
}
function ce({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ a("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) });
}
function re({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "currentColor", stroke: "none", children: /* @__PURE__ */ a("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) });
}
function ne({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ a("circle", { cx: "12", cy: "12", r: "10" }),
    /* @__PURE__ */ a("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
    /* @__PURE__ */ a("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
  ] });
}
function se({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ a("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
    /* @__PURE__ */ a("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
  ] });
}
function ie({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ a("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    /* @__PURE__ */ a("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ] });
}
function oe({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ a("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" }) });
}
function W({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ a("polyline", { points: "9 18 15 12 9 6" }) });
}
function le({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ a("polyline", { points: "15 18 9 12 15 6" }) });
}
function xe({ isOpen: e, onClick: t, position: c }) {
  const { state: r } = v();
  return /* @__PURE__ */ a("div", { className: `acx-fixed acx-bottom-4 sm:acx-bottom-6 ${c === "bottom-right" ? "acx-right-4 sm:acx-right-6" : "acx-left-4 sm:acx-left-6"} acx-z-[9999]`, children: /* @__PURE__ */ a(
    "button",
    {
      onClick: t,
      className: "acx-launcher-btn acx-relative acx-w-14 acx-h-14 acx-rounded-full acx-shadow-lg acx-transition-all hover:acx-scale-105 acx-flex acx-items-center acx-justify-center",
      "aria-label": e ? "Close chat" : "Open chat",
      children: e ? /* @__PURE__ */ a("span", { className: "acx-launcher-icon-stroke", children: /* @__PURE__ */ a(ie, { className: "acx-w-6 acx-h-6" }) }) : /* @__PURE__ */ o(I, { children: [
        /* @__PURE__ */ a(re, { className: "acx-w-7 acx-h-7" }),
        r.unreadCount > 0 && /* @__PURE__ */ a(j, { count: r.unreadCount })
      ] })
    }
  ) });
}
const ue = [
  { id: "messages", label: "Messages", Icon: ce },
  { id: "help", label: "Help", Icon: ne }
];
function de({ activeTab: e, onTabChange: t }) {
  const { state: c } = v();
  return /* @__PURE__ */ a("nav", { className: "acx-flex acx-border-t acx-border-gray-200 acx-bg-white", role: "tablist", children: ue.map(({ id: r, label: n, Icon: l }) => /* @__PURE__ */ o(
    "button",
    {
      role: "tab",
      "aria-selected": e === r,
      onClick: () => t(r),
      className: `acx-flex-1 acx-flex acx-flex-col acx-items-center acx-py-2 acx-gap-0.5 acx-relative acx-transition-colors ${e === r ? "acx-text-primary-600" : "acx-text-gray-400 hover:acx-text-primary-600"}`,
      children: [
        /* @__PURE__ */ o("div", { className: "acx-relative", children: [
          /* @__PURE__ */ a(l, { className: "acx-w-5 acx-h-5" }),
          r === "messages" && c.unreadCount > 0 && /* @__PURE__ */ a(j, { count: c.unreadCount })
        ] }),
        /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-font-medium", children: n })
      ]
    },
    r
  )) });
}
const he = "acrux_chat_";
function me(e, t) {
  const c = `${he}${e}`, [r, n] = E(() => {
    try {
      const x = window.localStorage.getItem(c);
      return x ? JSON.parse(x) : t;
    } catch {
      return t;
    }
  }), l = N(
    (x) => {
      n(x);
      try {
        window.localStorage.setItem(c, JSON.stringify(x));
      } catch {
      }
    },
    [c]
  );
  return [r, l];
}
function pe() {
  const e = new URLSearchParams(window.location.search);
  let t = "";
  if (document.referrer)
    try {
      const c = new URL(document.referrer);
      t = c.origin + c.pathname;
    } catch {
    }
  return {
    page_url: window.location.origin + window.location.pathname,
    referrer: t,
    utm_source: e.get("utm_source") ?? void 0,
    utm_medium: e.get("utm_medium") ?? void 0,
    utm_campaign: e.get("utm_campaign") ?? void 0
  };
}
const O = "acrux_chat_chat_access_token", fe = "https://challenges.cloudflare.com/turnstile/v0/api.js", ge = 5e3;
function ye() {
  return new Promise((e) => {
    let t = !1, c;
    const r = document.createElement("div");
    r.style.display = "none", document.body.appendChild(r);
    const n = (i) => {
      t || (t = !0, clearTimeout(l), c !== void 0 && clearInterval(c), r.remove(), e(i));
    }, l = setTimeout(() => n(null), ge), x = () => {
      if (!t)
        try {
          const i = window.turnstile;
          if (!i) {
            n(null);
            return;
          }
          i.render(r, {
            sitekey: J,
            size: "invisible",
            callback: (p) => n(p),
            "error-callback": () => n(null),
            "expired-callback": () => n(null)
          });
        } catch {
          n(null);
        }
    };
    try {
      if (!document.getElementById("cf-turnstile-script")) {
        const i = document.createElement("script");
        i.id = "cf-turnstile-script", i.src = fe, i.async = !0, i.onerror = () => n(null), document.head.appendChild(i);
      }
      window.turnstile ? x() : c = window.setInterval(() => {
        window.turnstile && (c !== void 0 && clearInterval(c), x());
      }, 100);
    } catch {
      n(null);
    }
  });
}
function Se() {
  try {
    return window.sessionStorage.getItem(O);
  } catch {
    return null;
  }
}
function be(e) {
  try {
    e === null ? window.sessionStorage.removeItem(O) : window.sessionStorage.setItem(O, e);
  } catch {
  }
}
function _e() {
  var _;
  const { state: e, dispatch: t, config: c } = v(), [r, n] = me("session_key", null), [l, x] = E(() => (localStorage.removeItem(O), Se())), i = S(), p = S(null), m = N((s) => {
    be(s), x(s);
  }, []);
  i.current || (i.current = new R({ baseUrl: c.apiUrl, token: c.token }), l && i.current.setChatToken(l));
  const u = i.current, h = N(async (s) => {
    var g;
    const d = c.mode === "lead" ? pe() : void 0, C = await ye();
    try {
      t({ type: "SET_LOADING", payload: !0 });
      const T = await u.createSession({
        source: c.mode === "lead" ? "lead_bot" : "user_bot",
        visitor_name: (s == null ? void 0 : s.name) || e.visitorName || c.userName,
        visitor_email: (s == null ? void 0 : s.email) || e.visitorEmail || c.userEmail,
        visitor_metadata: d,
        turnstile_token: C ?? void 0
      });
      return T.access_token && (u.setChatToken(T.access_token), m(T.access_token)), p.current = T.session_key, t({ type: "SET_SESSION", payload: T }), n(T.session_key), (g = c.onSessionCreated) == null || g.call(c, T.session_key), t({ type: "SET_LOADING", payload: !1 }), T;
    } catch (T) {
      throw t({ type: "SET_ERROR", payload: "Failed to create chat session" }), t({ type: "SET_LOADING", payload: !1 }), T;
    }
  }, [u, c, e.visitorName, e.visitorEmail, t, n, m]), f = N(async (s) => {
    try {
      t({ type: "SET_LOADING", payload: !0 });
      const d = await u.getSession(s);
      if (p.current && p.current !== s)
        return t({ type: "SET_LOADING", payload: !1 }), null;
      const { messages: C, ...g } = d;
      return p.current = g.session_key, t({ type: "SET_SESSION", payload: g }), t({ type: "SET_MESSAGES", payload: C }), t({ type: "SET_LOADING", payload: !1 }), g;
    } catch {
      return n(null), m(null), u.setChatToken(""), t({ type: "SET_LOADING", payload: !1 }), null;
    }
  }, [u, t, n, m]), b = N(async (s, d) => {
    if (e.session) {
      t({ type: "SET_VISITOR_INFO", payload: { name: s, email: d } });
      try {
        await u.updateVisitor(e.session.session_key, {
          visitor_name: s,
          visitor_email: d
        });
      } catch {
      }
    }
  }, [u, e.session, t]);
  return k(() => {
    r && !e.session && f(r);
  }, []), {
    session: e.session,
    sessionKey: ((_ = e.session) == null ? void 0 : _.session_key) ?? r,
    accessToken: u.getChatToken() ?? l,
    createSession: h,
    restoreSession: f,
    updateVisitorInfo: b,
    api: u
  };
}
const Ne = [
  "history",
  "message",
  "message_ack",
  "agent_joined",
  "agent_typing",
  "heartbeat_ack",
  "error"
];
function Te(e) {
  return typeof e == "object" && e !== null && typeof e.type == "string" && Ne.includes(e.type);
}
class we {
  constructor(t) {
    y(this, "ws", null);
    y(this, "url");
    y(this, "token");
    y(this, "onMessage");
    y(this, "onStatusChange");
    y(this, "retryCount", 0);
    y(this, "reconnectTimer", null);
    y(this, "heartbeatTimer", null);
    y(this, "messageQueue", []);
    y(this, "intentionallyClosed", !1);
    this.url = t.url, this.token = t.token, this.onMessage = t.onMessage, this.onStatusChange = t.onStatusChange;
  }
  connect() {
    var t;
    if (((t = this.ws) == null ? void 0 : t.readyState) !== WebSocket.OPEN) {
      this.intentionallyClosed = !1;
      try {
        const c = this.token ? ["acrux-chat", `acrux-chat-token.${this.token}`] : ["acrux-chat"];
        this.ws = new WebSocket(this.url, c);
      } catch {
        this.scheduleReconnect();
        return;
      }
      this.ws.onopen = () => {
        this.retryCount = 0, this.onStatusChange(!0, 0), this.startHeartbeat(), this.flushQueue();
      }, this.ws.onclose = () => {
        this.onStatusChange(!1, this.retryCount), this.stopHeartbeat(), this.intentionallyClosed || this.scheduleReconnect();
      }, this.ws.onerror = () => {
      }, this.ws.onmessage = (c) => {
        try {
          const r = JSON.parse(c.data);
          Te(r) && this.onMessage(r);
        } catch {
        }
      };
    }
  }
  send(t) {
    var c;
    ((c = this.ws) == null ? void 0 : c.readyState) === WebSocket.OPEN ? this.ws.send(JSON.stringify(t)) : this.messageQueue.push(t);
  }
  disconnect() {
    this.intentionallyClosed = !0, this.stopHeartbeat(), this.reconnectTimer && (clearTimeout(this.reconnectTimer), this.reconnectTimer = null), this.ws && (this.ws.close(), this.ws = null);
  }
  flushQueue() {
    for (; this.messageQueue.length > 0; ) {
      const t = this.messageQueue.shift();
      t && this.send(t);
    }
  }
  scheduleReconnect() {
    if (this.reconnectTimer) return;
    const t = Math.min(
      A.WS_RECONNECT_BASE * Math.pow(2, this.retryCount),
      A.WS_RECONNECT_MAX
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null, this.retryCount++, this.connect();
    }, t);
  }
  startHeartbeat() {
    this.stopHeartbeat(), this.heartbeatTimer = setInterval(() => {
      this.send({ type: "heartbeat" });
    }, A.WS_HEARTBEAT_INTERVAL);
  }
  stopHeartbeat() {
    this.heartbeatTimer && (clearInterval(this.heartbeatTimer), this.heartbeatTimer = null);
  }
}
function Ee() {
  return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
    const t = Math.random() * 16 | 0;
    return (e === "x" ? t : t & 3 | 8).toString(16);
  });
}
function ve(e, t) {
  const { state: c, dispatch: r, config: n } = v(), l = S(null), x = S(/* @__PURE__ */ new Map()), i = S(null);
  k(() => {
    if (!e) return;
    const u = n.apiUrl.startsWith("https") ? "wss" : "ws", h = n.apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""), f = `${u}://${h}${Q(e)}`, b = new we({
      url: f,
      token: t ?? void 0,
      onStatusChange: (s, d) => {
        r({ type: "SET_CONNECTED", payload: s }), r({ type: "SET_WS_RETRY_COUNT", payload: d });
      },
      onMessage: (s) => {
        switch (s.type) {
          case "history":
            Array.isArray(s.messages) && r({ type: "SET_MESSAGES", payload: s.messages });
            break;
          case "message":
            s.message && typeof s.message == "object" && (r({ type: "ADD_MESSAGE", payload: s.message }), (!c.isOpen || c.activeTab !== "messages") && r({ type: "INCREMENT_UNREAD" }));
            break;
          case "message_ack":
            if (typeof s.temp_id == "string" && typeof s.real_id == "number") {
              r({ type: "ACK_MESSAGE", payload: { temp_id: s.temp_id, real_id: s.real_id } });
              const d = x.current.get(s.temp_id);
              d && (clearTimeout(d), x.current.delete(s.temp_id));
            }
            break;
          case "agent_joined":
            s.agent && r({ type: "AGENT_JOINED", payload: s.agent });
            break;
          case "agent_typing":
            r({
              type: "SET_AGENT_TYPING",
              payload: { is_typing: s.is_typing ?? !1, agent_name: s.agent_name }
            }), i.current && clearTimeout(i.current), s.is_typing && (i.current = setTimeout(() => {
              r({ type: "SET_AGENT_TYPING", payload: { is_typing: !1 } }), i.current = null;
            }, A.TYPING_TIMEOUT));
            break;
          case "heartbeat_ack":
            break;
          case "error":
            r({ type: "SET_ERROR", payload: s.error ?? "WebSocket error" });
            break;
        }
      }
    });
    b.connect(), l.current = b;
    const _ = x.current;
    return () => {
      b.disconnect(), l.current = null, _.forEach((s) => clearTimeout(s)), _.clear(), i.current && (clearTimeout(i.current), i.current = null);
    };
  }, [e, t, n.apiUrl]);
  const p = N((u) => {
    if (!u || u.length > L.MAX_MESSAGE_LENGTH || !l.current) return;
    const h = Ee(), f = {
      id: h,
      session: 0,
      sender_type: n.mode === "lead" ? "visitor" : "user",
      sender_name: c.visitorName || "You",
      content: u,
      content_type: "text",
      attachments: [],
      is_read: !0,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      temp_id: h,
      status: "sending"
    };
    r({ type: "ADD_MESSAGE", payload: f }), l.current.send({
      type: "message",
      text: u,
      temp_id: h
    });
    const b = setTimeout(() => {
      r({ type: "FAIL_MESSAGE", payload: { temp_id: h } }), x.current.delete(h);
    }, A.MESSAGE_ACK_TIMEOUT);
    x.current.set(h, b);
  }, [n.mode, c.visitorName, r]), m = N((u) => {
    var h;
    (h = l.current) == null || h.send({ type: "typing", is_typing: u });
  }, []);
  return {
    isConnected: c.isConnected,
    sendMessage: p,
    sendTyping: m
  };
}
function ke() {
  var l, x, i;
  const { state: e, dispatch: t, config: c } = v(), r = S(), n = S(!1);
  return r.current || (r.current = new R({ baseUrl: c.apiUrl, token: c.token })), k(() => {
    n.current || (n.current = !0, r.current.getOperatingHoursStatus().then((p) => {
      t({ type: "SET_OPERATING_HOURS", payload: p });
    }).catch(() => {
    }));
  }, [t]), {
    isOnline: ((l = e.operatingHours) == null ? void 0 : l.is_online) ?? !0,
    offlineMessage: (x = e.operatingHours) == null ? void 0 : x.offline_message,
    responseTime: (i = e.operatingHours) == null ? void 0 : i.response_time
  };
}
function Ce(e) {
  return e.split(" ").slice(0, 2).map((t) => t[0] ?? "").join("").toUpperCase();
}
const P = [
  "acx-bg-blue-500",
  "acx-bg-green-500",
  "acx-bg-purple-500",
  "acx-bg-orange-500",
  "acx-bg-pink-500",
  "acx-bg-teal-500"
];
function Ae(e) {
  let t = 0;
  for (let c = 0; c < e.length; c++)
    t = e.charCodeAt(c) + ((t << 5) - t);
  return P[Math.abs(t) % P.length];
}
function D({ name: e, avatarUrl: t }) {
  return t ? /* @__PURE__ */ a(
    "img",
    {
      src: t,
      alt: e,
      className: "acx-w-8 acx-h-8 acx-rounded-full acx-object-cover acx-flex-shrink-0"
    }
  ) : /* @__PURE__ */ a(
    "div",
    {
      className: `acx-w-8 acx-h-8 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-text-white acx-text-xs acx-font-semibold acx-flex-shrink-0 ${Ae(e)}`,
      children: Ce(e)
    }
  );
}
function U(e) {
  const t = new Date(e), r = (/* @__PURE__ */ new Date()).getTime() - t.getTime(), n = Math.floor(r / 1e3), l = Math.floor(n / 60), x = Math.floor(l / 60), i = Math.floor(x / 24);
  return n < 60 ? "Just now" : l < 60 ? `${l}m ago` : x < 24 ? `${x}h ago` : i < 7 ? `${i}d ago` : t.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric"
  });
}
function Ie(e) {
  const t = new Date(e), c = /* @__PURE__ */ new Date(), r = new Date(c.getFullYear(), c.getMonth(), c.getDate()), n = new Date(t.getFullYear(), t.getMonth(), t.getDate()), l = Math.floor((r.getTime() - n.getTime()) / (1e3 * 60 * 60 * 24));
  return l === 0 ? "Today" : l === 1 ? "Yesterday" : t.toLocaleDateString(void 0, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}
function Oe(e, t) {
  const c = new Date(e), r = new Date(t);
  return c.getFullYear() === r.getFullYear() && c.getMonth() === r.getMonth() && c.getDate() === r.getDate();
}
function Re(e) {
  let t = Me(e);
  return t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"), t = t.replace(/__(.+?)__/g, "<strong>$1</strong>"), t = t.replace(/\*(.+?)\*/g, "<em>$1</em>"), t = t.replace(new RegExp("(?<!\\w)_(.+?)_(?!\\w)", "g"), "<em>$1</em>"), t = t.replace(/`(.+?)`/g, "<code>$1</code>"), t = t.replace(
    /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  ), t = t.replace(/\n/g, "<br />"), t;
}
function Me(e) {
  const t = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return e.replace(/[&<>"']/g, (c) => t[c] ?? c);
}
function Le({ message: e }) {
  var r;
  const t = e.sender_type === "visitor" || e.sender_type === "user", c = e.sender_type === "system";
  return c && e.content_type === "auto_response" ? /* @__PURE__ */ o("div", { className: "acx-flex acx-gap-2 acx-mb-3 acx-justify-start", children: [
    /* @__PURE__ */ a(D, { name: e.sender_name }),
    /* @__PURE__ */ o("div", { className: "acx-max-w-[75%]", children: [
      e.sender_name && /* @__PURE__ */ a("span", { className: "acx-text-xs acx-text-gray-500 acx-ml-1 acx-mb-0.5 acx-block", children: e.sender_name }),
      /* @__PURE__ */ a("div", { className: "acx-px-3.5 acx-py-2.5 acx-rounded-2xl acx-text-sm acx-leading-relaxed acx-bg-amber-50 acx-text-gray-800 acx-rounded-bl-md acx-border acx-border-amber-200", children: /* @__PURE__ */ a("p", { className: "acx-whitespace-pre-wrap", children: e.content }) }),
      /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-text-gray-400 acx-mt-0.5 acx-block", children: U(e.created_at) })
    ] })
  ] }) : c ? /* @__PURE__ */ a("div", { className: "acx-flex acx-justify-center acx-py-2", children: /* @__PURE__ */ a("span", { className: "acx-text-xs acx-text-gray-400 acx-italic", children: e.content }) }) : /* @__PURE__ */ o("div", { className: `acx-flex acx-gap-2 acx-mb-3 ${t ? "acx-justify-end" : "acx-justify-start"}`, children: [
    !t && /* @__PURE__ */ a(D, { name: e.sender_name }),
    /* @__PURE__ */ o("div", { className: `acx-max-w-[75%] ${t ? "acx-order-1" : ""}`, children: [
      !t && e.sender_name && /* @__PURE__ */ a("span", { className: "acx-text-xs acx-text-gray-500 acx-ml-1 acx-mb-0.5 acx-block", children: e.sender_name }),
      /* @__PURE__ */ a(
        "div",
        {
          className: `acx-px-3.5 acx-py-2.5 acx-rounded-2xl acx-text-sm acx-leading-relaxed ${t ? "acx-bg-primary-600 acx-text-white acx-rounded-br-md" : (e.sender_type === "bot", "acx-bg-gray-100 acx-text-gray-800 acx-rounded-bl-md")}`,
          children: e.content_type === "markdown" ? /* @__PURE__ */ a(
            "div",
            {
              className: "acx-prose acx-prose-sm",
              dangerouslySetInnerHTML: { __html: Re(e.content) }
            }
          ) : /* @__PURE__ */ a("p", { className: "acx-whitespace-pre-wrap", children: e.content })
        }
      ),
      ((r = e.attachments) == null ? void 0 : r.length) > 0 && /* @__PURE__ */ a("div", { className: "acx-mt-1 acx-space-y-1", children: e.attachments.map((n, l) => /* @__PURE__ */ a(
        "a",
        {
          href: n.url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "acx-block acx-text-xs acx-text-primary-600 hover:acx-underline acx-truncate",
          children: n.name
        },
        l
      )) }),
      /* @__PURE__ */ o("div", { className: `acx-flex acx-items-center acx-gap-1 acx-mt-0.5 ${t ? "acx-justify-end" : ""}`, children: [
        /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-text-gray-400", children: U(e.created_at) }),
        t && e.status === "sending" && /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-text-gray-400", children: "Sending..." }),
        t && e.status === "failed" && /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-text-red-500", children: "Failed" })
      ] })
    ] })
  ] });
}
function De({ agentName: e }) {
  return /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2 acx-mb-3", children: [
    /* @__PURE__ */ a(D, { name: e ?? "Agent" }),
    /* @__PURE__ */ a("div", { className: "acx-bg-gray-100 acx-rounded-2xl acx-rounded-bl-md acx-px-4 acx-py-3", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-gap-1", children: [
      /* @__PURE__ */ a("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ a("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ a("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" })
    ] }) })
  ] });
}
function Be({ messages: e, agentTyping: t }) {
  const c = S(null), r = S(null);
  return k(() => {
    var n;
    (n = c.current) == null || n.scrollIntoView({ behavior: "smooth" });
  }, [e.length, t.is_typing]), /* @__PURE__ */ o(
    "div",
    {
      ref: r,
      className: "acx-flex-1 acx-overflow-y-auto acx-px-4 acx-py-3 acx-space-y-1",
      children: [
        e.map((n, l) => {
          const x = e[l - 1], i = !x || !Oe(x.created_at, n.created_at);
          return /* @__PURE__ */ o("div", { children: [
            i && /* @__PURE__ */ a("div", { className: "acx-flex acx-items-center acx-justify-center acx-py-3", children: /* @__PURE__ */ a("span", { className: "acx-text-xs acx-text-gray-400 acx-bg-gray-50 acx-px-3 acx-py-1 acx-rounded-full", children: Ie(n.created_at) }) }),
            /* @__PURE__ */ a(Le, { message: n })
          ] }, n.temp_id ?? n.id);
        }),
        t.is_typing && /* @__PURE__ */ a(De, { agentName: t.agent_name }),
        /* @__PURE__ */ a("div", { ref: c })
      ]
    }
  );
}
function Pe({ onSend: e, onTyping: t, onFileUpload: c, mode: r, disabled: n, placeholder: l }) {
  const [x, i] = E(""), p = S(null), m = S(), u = N(() => {
    const s = x.trim();
    !s || n || (e(s), i(""), t == null || t(!1));
  }, [x, n, e, t]), h = (s) => {
    s.key === "Enter" && !s.shiftKey && (s.preventDefault(), u());
  }, f = (s) => {
    const d = s.target.value;
    d.length > L.MAX_MESSAGE_LENGTH || (i(d), t == null || t(!0), m.current && clearTimeout(m.current), m.current = setTimeout(() => t == null ? void 0 : t(!1), 2e3));
  }, b = () => {
    var s;
    (s = p.current) == null || s.click();
  }, _ = (s) => {
    s.target.files && s.target.files.length > 0 && (c == null || c(s.target.files), s.target.value = "");
  };
  return /* @__PURE__ */ a("div", { className: "acx-border-t acx-border-gray-200 acx-bg-white acx-px-3 acx-py-2", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-items-end acx-gap-2", children: [
    r === "user" && c && /* @__PURE__ */ o(I, { children: [
      /* @__PURE__ */ a(
        "button",
        {
          onClick: b,
          className: "acx-p-1.5 acx-text-gray-400 hover:acx-text-gray-600 acx-transition-colors acx-flex-shrink-0",
          "aria-label": "Attach file",
          type: "button",
          children: /* @__PURE__ */ a(oe, { className: "acx-w-5 acx-h-5" })
        }
      ),
      /* @__PURE__ */ a(
        "input",
        {
          ref: p,
          type: "file",
          className: "acx-hidden",
          accept: L.ALLOWED_FILE_TYPES.join(","),
          multiple: !0,
          onChange: _
        }
      )
    ] }),
    /* @__PURE__ */ a(
      "textarea",
      {
        value: x,
        onChange: f,
        onKeyDown: h,
        placeholder: l ?? "Type a message...",
        disabled: n,
        rows: 1,
        className: "acx-flex-1 acx-resize-none acx-border-0 acx-outline-none acx-text-sm acx-py-2 acx-max-h-24 acx-bg-transparent placeholder:acx-text-gray-400",
        style: { fieldSizing: "content" }
      }
    ),
    /* @__PURE__ */ a(
      "button",
      {
        onClick: u,
        disabled: !x.trim() || n,
        className: "acx-p-1.5 acx-text-primary-600 acx-transition-colors acx-flex-shrink-0 enabled:hover:acx-text-primary-700 disabled:acx-text-gray-300 disabled:acx-cursor-not-allowed",
        "aria-label": "Send message",
        type: "button",
        children: /* @__PURE__ */ a(se, { className: "acx-w-5 acx-h-5" })
      }
    )
  ] }) });
}
function G({ isOnline: e, offlineMessage: t, responseTime: c }) {
  return e ? null : /* @__PURE__ */ a("div", { className: "acx-bg-amber-50 acx-border-b acx-border-amber-200 acx-px-4 acx-py-2.5", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2", children: [
    /* @__PURE__ */ a("div", { className: "acx-w-2 acx-h-2 acx-rounded-full acx-bg-amber-400 acx-flex-shrink-0" }),
    /* @__PURE__ */ o("p", { className: "acx-text-xs acx-text-amber-800", children: [
      t ?? "We're currently offline.",
      c && /* @__PURE__ */ o("span", { className: "acx-font-medium", children: [
        " We typically respond ",
        c,
        "."
      ] })
    ] })
  ] }) });
}
function H({ isConnected: e, retryCount: t }) {
  return e || t === 0 ? null : t >= 5 ? /* @__PURE__ */ a("div", { className: "acx-bg-red-50 acx-border-b acx-border-red-200 acx-px-4 acx-py-2.5", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-justify-between acx-gap-2", children: [
    /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2", children: [
      /* @__PURE__ */ a("div", { className: "acx-w-2 acx-h-2 acx-rounded-full acx-bg-red-400 acx-flex-shrink-0" }),
      /* @__PURE__ */ a("p", { className: "acx-text-xs acx-text-red-800", children: "Connection lost. Please refresh." })
    ] }),
    /* @__PURE__ */ a(
      "button",
      {
        type: "button",
        onClick: () => window.location.reload(),
        className: "acx-text-xs acx-font-medium acx-text-red-700 acx-bg-red-100 acx-px-2 acx-py-0.5 acx-rounded hover:acx-bg-red-200 acx-flex-shrink-0",
        children: "Refresh"
      }
    )
  ] }) }) : /* @__PURE__ */ a("div", { className: "acx-bg-amber-50 acx-border-b acx-border-amber-200 acx-px-4 acx-py-2.5", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2", children: [
    /* @__PURE__ */ o("svg", { className: "acx-w-3 acx-h-3 acx-text-amber-500 acx-animate-spin acx-flex-shrink-0", viewBox: "0 0 24 24", fill: "none", children: [
      /* @__PURE__ */ a("circle", { className: "acx-opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
      /* @__PURE__ */ a("path", { className: "acx-opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })
    ] }),
    /* @__PURE__ */ a("p", { className: "acx-text-xs acx-text-amber-800", children: "Reconnecting..." })
  ] }) });
}
function Ue({ onSubmit: e, loading: t }) {
  const [c, r] = E(""), [n, l] = E("");
  return /* @__PURE__ */ o("form", { onSubmit: (i) => {
    i.preventDefault(), n.trim() && e({ name: c.trim(), email: n.trim() });
  }, className: "acx-p-4 acx-space-y-3", children: [
    /* @__PURE__ */ a("p", { className: "acx-text-sm acx-text-gray-600 acx-mb-1", children: "Before we start, could you share your details?" }),
    /* @__PURE__ */ a(
      "input",
      {
        type: "text",
        value: c,
        onChange: (i) => r(i.target.value),
        placeholder: "Your name",
        className: "acx-w-full acx-px-3 acx-py-2 acx-border acx-border-gray-200 acx-rounded-lg acx-text-sm acx-outline-none focus:acx-border-primary-500 focus:acx-ring-1 focus:acx-ring-primary-500"
      }
    ),
    /* @__PURE__ */ a(
      "input",
      {
        type: "email",
        value: n,
        onChange: (i) => l(i.target.value),
        placeholder: "Your email *",
        required: !0,
        className: "acx-w-full acx-px-3 acx-py-2 acx-border acx-border-gray-200 acx-rounded-lg acx-text-sm acx-outline-none focus:acx-border-primary-500 focus:acx-ring-1 focus:acx-ring-primary-500"
      }
    ),
    /* @__PURE__ */ o("p", { className: "acx-text-xs acx-text-gray-400 acx-leading-snug", children: [
      "By starting a chat, your details, messages, and the page you're on are shared with Acrux to respond to your enquiry — see our",
      " ",
      /* @__PURE__ */ a(
        "a",
        {
          href: "https://www.acrux.education/legal/privacy-policy",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "acx-underline hover:acx-text-gray-600",
          children: "Privacy Policy"
        }
      ),
      "."
    ] }),
    /* @__PURE__ */ a(
      "button",
      {
        type: "submit",
        disabled: !n.trim() || t,
        className: "acx-w-full acx-bg-primary-600 acx-text-white acx-py-2.5 acx-rounded-lg acx-text-sm acx-font-medium acx-transition-colors enabled:hover:acx-bg-primary-700 disabled:acx-bg-gray-200 disabled:acx-text-gray-500 disabled:acx-cursor-not-allowed",
        children: t ? "Starting..." : "Start conversation"
      }
    )
  ] });
}
function Ge() {
  const { state: e, dispatch: t, config: c } = v(), { session: r, sessionKey: n, accessToken: l, createSession: x } = _e(), { sendMessage: i, sendTyping: p, isConnected: m } = ve(n, l), { isOnline: u, offlineMessage: h, responseTime: f } = ke(), [b, _] = E(!1), s = S(null);
  k(() => {
    m && s.current && (i(s.current), s.current = null);
  }, [m, i]);
  const d = N(async (g) => {
    if (!r) {
      if (c.mode === "lead" && !e.visitorEmail) {
        s.current = g, _(!0);
        return;
      }
      try {
        s.current = g, await x();
      } catch {
        s.current = null;
      }
      return;
    }
    i(g);
  }, [r, c.mode, e.visitorEmail, x, i]), C = N(async (g) => {
    t({ type: "SET_VISITOR_INFO", payload: g }), _(!1);
    try {
      await x({ name: g.name, email: g.email });
    } catch {
      s.current = null;
    }
  }, [x, t]);
  return k(() => {
    e.unreadCount > 0 && e.activeTab === "messages" && t({ type: "RESET_UNREAD" });
  }, [e.unreadCount, e.activeTab, t]), b && !r ? /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ a(H, { isConnected: m, retryCount: e.wsRetryCount }),
    /* @__PURE__ */ a(G, { isOnline: u, offlineMessage: h, responseTime: f }),
    /* @__PURE__ */ a(Ue, { onSubmit: C, loading: e.loading })
  ] }) : /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ a(H, { isConnected: m, retryCount: e.wsRetryCount }),
    /* @__PURE__ */ a(G, { isOnline: u, offlineMessage: h, responseTime: f }),
    e.messages.length === 0 && !r ? /* @__PURE__ */ a("div", { className: "acx-flex-1 acx-flex acx-flex-col acx-items-center acx-justify-center acx-px-6 acx-text-center", children: u ? /* @__PURE__ */ o(I, { children: [
      /* @__PURE__ */ a("p", { className: "acx-text-lg acx-font-semibold acx-text-gray-800 acx-mb-1", children: c.greeting || "Hi there! How can we help?" }),
      /* @__PURE__ */ a("p", { className: "acx-text-sm acx-text-gray-500", children: "Send a message to start a conversation" })
    ] }) : /* @__PURE__ */ o(I, { children: [
      /* @__PURE__ */ a("div", { className: "acx-w-12 acx-h-12 acx-bg-amber-100 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-mb-3", children: /* @__PURE__ */ o("svg", { className: "acx-w-6 acx-h-6 acx-text-amber-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
        /* @__PURE__ */ a("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6l-4 4V6c0-1.1.9-2 2-2z" }),
        /* @__PURE__ */ a("path", { d: "M12 11v1" }),
        /* @__PURE__ */ a("path", { d: "M12 8h.01" })
      ] }) }),
      /* @__PURE__ */ a("p", { className: "acx-text-sm acx-text-gray-600 acx-font-medium", children: "Leave us a message" }),
      /* @__PURE__ */ o("p", { className: "acx-text-xs acx-text-gray-400 acx-mt-1", children: [
        "Our team is currently away. Leave a message and we'll get back to you",
        f ? ` ${f}` : " as soon as possible",
        "."
      ] })
    ] }) }) : /* @__PURE__ */ a(Be, { messages: e.messages, agentTyping: e.agentTyping }),
    /* @__PURE__ */ a(
      Pe,
      {
        onSend: d,
        onTyping: p,
        mode: c.mode,
        disabled: e.loading,
        placeholder: u ? "Type a message..." : "Leave a message..."
      }
    )
  ] });
}
function He({ article: e, onClick: t }) {
  return /* @__PURE__ */ o(
    "button",
    {
      onClick: () => t(e),
      className: "acx-w-full acx-flex acx-items-center acx-justify-between acx-p-3 acx-rounded-lg acx-text-left hover:acx-bg-gray-50 acx-transition-colors acx-group",
      children: [
        /* @__PURE__ */ o("div", { className: "acx-flex-1 acx-min-w-0", children: [
          /* @__PURE__ */ a("h4", { className: "acx-text-sm acx-font-medium acx-text-gray-900 acx-truncate group-hover:acx-text-primary-600 acx-transition-colors", children: e.title }),
          e.summary && /* @__PURE__ */ a("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5 acx-line-clamp-2", children: e.summary })
        ] }),
        /* @__PURE__ */ a(W, { className: "acx-w-4 acx-h-4 acx-text-gray-400 acx-flex-shrink-0 acx-ml-2" })
      ]
    }
  );
}
function $e() {
  var _;
  const { state: e, dispatch: t, config: c } = v(), r = e.kbTopics, [n, l] = E(null), [x, i] = E([]), [p, m] = E(!1), u = S();
  u.current || (u.current = new R({ baseUrl: c.apiUrl, token: c.token })), k(() => {
    var s;
    ((s = e.kbTopics) == null ? void 0 : s.length) > 0 || u.current.getKBTopics().then((d) => t({ type: "SET_KB_TOPICS", payload: Array.isArray(d) ? d : [] })).catch(() => {
    });
  }, [(_ = e.kbTopics) == null ? void 0 : _.length, t]);
  const h = N(async (s) => {
    l(s), m(!0);
    try {
      const d = await u.current.getKBTopicArticles(s.slug);
      i(d);
    } catch {
      i([]);
    } finally {
      m(!1);
    }
  }, []), f = N((s) => {
    s.url && window.open(s.url, "_blank", "noopener,noreferrer");
  }, []), b = N(() => {
    l(null), i([]);
  }, []);
  return n ? /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ o("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ o(
        "button",
        {
          onClick: b,
          className: "acx-flex acx-items-center acx-gap-1 acx-text-sm acx-text-primary-600 acx-mb-2 hover:acx-text-primary-700",
          children: [
            /* @__PURE__ */ a(le, { className: "acx-w-4 acx-h-4" }),
            "Back"
          ]
        }
      ),
      /* @__PURE__ */ a("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: n.name }),
      /* @__PURE__ */ o("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: [
        n.article_count,
        " article",
        n.article_count !== 1 ? "s" : ""
      ] })
    ] }),
    /* @__PURE__ */ a("div", { className: "acx-p-4 acx-space-y-1", children: p ? /* @__PURE__ */ a("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "Loading..." }) : x.length === 0 ? /* @__PURE__ */ a("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "No articles found" }) : x.map((s) => /* @__PURE__ */ a(He, { article: s, onClick: f }, s.id)) })
  ] }) : /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ o("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ a("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: "Help Centre" }),
      /* @__PURE__ */ a("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: "Browse help topics" })
    ] }),
    /* @__PURE__ */ a("div", { className: "acx-p-4 acx-space-y-1", children: r.length === 0 ? /* @__PURE__ */ a("div", { className: "acx-py-8 acx-text-center", children: /* @__PURE__ */ a("p", { className: "acx-text-sm acx-text-gray-400", children: "No help topics available" }) }) : r.map((s) => /* @__PURE__ */ o(
      "button",
      {
        onClick: () => h(s),
        className: "acx-w-full acx-flex acx-items-center acx-justify-between acx-p-3 acx-rounded-lg acx-text-left hover:acx-bg-gray-50 acx-transition-colors",
        children: [
          /* @__PURE__ */ o("div", { children: [
            /* @__PURE__ */ a("h4", { className: "acx-text-sm acx-font-medium acx-text-gray-900", children: s.name }),
            /* @__PURE__ */ o("p", { className: "acx-text-xs acx-text-gray-500", children: [
              s.article_count,
              " article",
              s.article_count !== 1 ? "s" : ""
            ] })
          ] }),
          /* @__PURE__ */ a(W, { className: "acx-w-4 acx-h-4 acx-text-gray-400" })
        ]
      },
      s.id
    )) })
  ] });
}
function Ye(e) {
  return /* @__PURE__ */ a(te, { ...e, children: /* @__PURE__ */ a(je, { position: e.position ?? X.POSITION }) });
}
function je({ position: e }) {
  const { state: t, dispatch: c } = v(), [r, n] = E(!1);
  return /* @__PURE__ */ o("div", { className: "acrux-chat-widget", children: [
    r && /* @__PURE__ */ o(
      "div",
      {
        className: `acx-fixed acx-bottom-20 ${e === "bottom-right" ? "acx-right-4 sm:acx-right-6" : "acx-left-4 sm:acx-left-6"} acx-z-[9999] acx-w-[380px] acx-max-w-[calc(100vw-2rem)] acx-h-[600px] acx-max-h-[calc(100vh-6rem)] acx-bg-white acx-rounded-2xl acx-shadow-2xl acx-flex acx-flex-col acx-overflow-hidden acx-animate-slide-up`,
        role: "dialog",
        "aria-label": "Chat widget",
        children: [
          /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-justify-between acx-px-5 acx-py-4 acx-bg-primary-600 acx-text-white", children: [
            /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2.5", children: [
              /* @__PURE__ */ a("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 375 375", className: "acx-flex-shrink-0", children: /* @__PURE__ */ a("path", { fill: "#ffde5a", d: "M 366.039062 86.546875 L 209.414062 117.519531 L 156.304688 4.511719 L 132.847656 127.152344 L 8.957031 142.746094 L 120.160156 174.398438 L 91.242188 158.484375 L 154.742188 150.492188 L 166.765625 87.632812 L 193.984375 145.554688 L 282.449219 125.828125 L 210.808594 181.351562 L 238.035156 239.269531 L 181.964844 208.414062 L 14 374.972656 L 185.960938 240.164062 L 295.355469 300.371094 L 242.242188 187.359375 L 366.039062 86.546875", fillRule: "nonzero" }) }),
              /* @__PURE__ */ a("h2", { className: "acx-text-lg acx-font-semibold", children: "Acrux Chat" })
            ] }),
            /* @__PURE__ */ a(
              "button",
              {
                onClick: () => n(!1),
                className: "acx-p-1 acx-rounded-md acx-bg-white acx-transition-colors hover:acx-bg-gray-100",
                "aria-label": "Close chat",
                children: /* @__PURE__ */ a("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", stroke: "#006383", strokeWidth: "2", strokeLinecap: "round", children: /* @__PURE__ */ a("path", { d: "M15 5L5 15M5 5l10 10" }) })
              }
            )
          ] }),
          /* @__PURE__ */ o("div", { className: "acx-flex-1 acx-overflow-hidden", children: [
            t.activeTab === "messages" && /* @__PURE__ */ a(Ge, {}),
            t.activeTab === "help" && /* @__PURE__ */ a($e, {})
          ] }),
          /* @__PURE__ */ a(
            de,
            {
              activeTab: t.activeTab,
              onTabChange: (x) => c({ type: "SET_TAB", payload: x })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ a(
      xe,
      {
        isOpen: r,
        onClick: () => n(!r),
        position: e
      }
    )
  ] });
}
export {
  Ye as ChatWidget
};
