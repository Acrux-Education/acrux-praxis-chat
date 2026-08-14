var X = Object.defineProperty;
var Z = (e, t, c) => t in e ? X(e, t, { enumerable: !0, configurable: !0, writable: !0, value: c }) : e[t] = c;
var T = (e, t, c) => Z(e, typeof t != "symbol" ? t + "" : t, c);
import { jsxs as o, jsx as a, Fragment as M } from "react/jsx-runtime";
import { createContext as ee, useReducer as te, useMemo as ae, useRef as g, useEffect as v, useContext as ce, useState as w, useCallback as b } from "react";
const re = "0x4AAAAAADHbxC4Cc2tAgr_N", k = {
  SESSIONS: "/api/chat/sessions/",
  SESSION: (e) => `/api/chat/sessions/${e}/`,
  SESSION_MESSAGES: (e) => `/api/chat/sessions/${e}/messages/`,
  SESSION_VISITOR: (e) => `/api/chat/sessions/${e}/visitor/`,
  ANNOUNCEMENTS: "/api/chat/announcements/",
  ROADMAP: "/api/chat/roadmap/",
  KB_SEARCH: "/api/kb/chatbot/search/",
  KB_ANSWER: "/api/kb/chatbot/answer/",
  KB_TOPICS: "/api/kb/topics/",
  KB_TOPIC_ARTICLES: (e) => `/api/kb/topics/${e}/articles/`,
  OPERATING_HOURS: "/api/chat/operating-hours/status/"
}, ne = (e) => `/ws/chat/${e}/`, se = {
  POSITION: "bottom-right"
}, R = {
  WS_RECONNECT_BASE: 1e3,
  WS_RECONNECT_MAX: 3e4,
  WS_HEARTBEAT_INTERVAL: 3e4,
  MESSAGE_ACK_TIMEOUT: 5e3,
  SEARCH_DEBOUNCE: 300,
  TYPING_TIMEOUT: 3e3
}, U = {
  MAX_MESSAGE_LENGTH: 5e3,
  ALLOWED_FILE_TYPES: [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "application/pdf"
  ]
}, K = {
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
function ie(e, t) {
  switch (t.type) {
    case "SET_SESSION":
      return { ...e, session: t.payload };
    case "SET_MESSAGES": {
      const c = e.messages.filter(
        (i) => i.temp_id && i.status !== "sent"
      ), r = new Set(t.payload.map((i) => i.id)), n = c.filter((i) => !r.has(i.id));
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
class O {
  constructor(t) {
    T(this, "baseUrl");
    T(this, "token");
    T(this, "chatToken");
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
      const i = await n.text().catch(() => "");
      throw new oe(n.status, n.statusText, i);
    }
    if (n.status !== 204)
      return n.json();
  }
  async createSession(t) {
    return this.request(k.SESSIONS, {
      method: "POST",
      body: JSON.stringify(t)
    });
  }
  async getSession(t) {
    return this.request(k.SESSION(t));
  }
  async sendMessage(t, c) {
    return this.request(k.SESSION_MESSAGES(t), {
      method: "POST",
      body: JSON.stringify(c)
    });
  }
  async updateVisitor(t, c) {
    return this.request(k.SESSION_VISITOR(t), {
      method: "PATCH",
      body: JSON.stringify(c)
    });
  }
  async getAnnouncements() {
    return this.request(k.ANNOUNCEMENTS);
  }
  async getRoadmapItems() {
    return this.request(k.ROADMAP);
  }
  async searchKB(t) {
    const c = new URLSearchParams({ q: t });
    return this.request(`${k.KB_SEARCH}?${c}`);
  }
  async askKB(t, c) {
    return this.request(k.KB_ANSWER, {
      method: "POST",
      body: JSON.stringify({ question: t, session_id: c ?? "" })
    });
  }
  async getKBTopics() {
    return this.request(k.KB_TOPICS);
  }
  async getKBTopicArticles(t) {
    return this.request(k.KB_TOPIC_ARTICLES(t));
  }
  async getOperatingHoursStatus() {
    return this.request(k.OPERATING_HOURS);
  }
}
class oe extends Error {
  constructor(t, c, r) {
    super(`API Error ${t}: ${c}`), this.status = t, this.statusText = c, this.body = r, this.name = "ApiError";
  }
}
function B(e) {
  return Array.isArray(e) ? e : e && typeof e == "object" && "results" in e ? e.results : [];
}
const F = ee(null);
function le({ children: e, ...t }) {
  const [c, r] = te(ie, {
    ...K,
    activeTab: t.defaultTab ?? K.activeTab,
    visitorName: t.userName ?? "",
    visitorEmail: t.userEmail ?? ""
  }), n = ae(
    () => ({ state: c, dispatch: r, config: t }),
    [c, t]
  );
  return /* @__PURE__ */ o(F.Provider, { value: n, children: [
    /* @__PURE__ */ a(xe, {}),
    e
  ] });
}
function xe() {
  const { dispatch: e, config: t } = C(), c = g(!1);
  return v(() => {
    if (c.current) return;
    c.current = !0;
    const r = new O({ baseUrl: t.apiUrl, token: t.token });
    r.getAnnouncements().then((n) => e({ type: "SET_ANNOUNCEMENTS", payload: B(n) })).catch(() => {
    }), r.getRoadmapItems().then((n) => e({ type: "SET_ROADMAP_ITEMS", payload: B(n) })).catch(() => {
    }), r.getKBTopics().then((n) => e({ type: "SET_KB_TOPICS", payload: B(n) })).catch(() => {
    }), r.getOperatingHoursStatus().then((n) => e({ type: "SET_OPERATING_HOURS", payload: n })).catch(() => {
    });
  }, [t.apiUrl, t.token, e]), null;
}
function C() {
  const e = ce(F);
  if (!e)
    throw new Error("useChatContext must be used within a ChatProvider");
  return e;
}
function q({ count: e }) {
  if (e <= 0) return null;
  const t = e > 99 ? "99+" : String(e);
  return /* @__PURE__ */ a("span", { className: "acx-absolute -acx-top-1.5 -acx-right-1.5 acx-min-w-[18px] acx-h-[18px] acx-flex acx-items-center acx-justify-center acx-bg-red-500 acx-text-white acx-text-[10px] acx-font-bold acx-rounded-full acx-px-1 acx-leading-none", children: t });
}
function ue({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ a("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) });
}
function de({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "currentColor", stroke: "none", children: /* @__PURE__ */ a("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) });
}
function he({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ a("circle", { cx: "12", cy: "12", r: "10" }),
    /* @__PURE__ */ a("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
    /* @__PURE__ */ a("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
  ] });
}
function me({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ a("circle", { cx: "11", cy: "11", r: "8" }),
    /* @__PURE__ */ a("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
  ] });
}
function pe({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ a("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
    /* @__PURE__ */ a("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
  ] });
}
function ye({ className: e }) {
  return /* @__PURE__ */ o("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ a("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    /* @__PURE__ */ a("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ] });
}
function fe({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ a("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" }) });
}
function J({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ a("polyline", { points: "9 18 15 12 9 6" }) });
}
function ge({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ a("polyline", { points: "15 18 9 12 15 6" }) });
}
function Se({ isOpen: e, onClick: t, position: c }) {
  const { state: r } = C();
  return /* @__PURE__ */ a("div", { className: `acx-fixed acx-bottom-4 sm:acx-bottom-6 ${c === "bottom-right" ? "acx-right-4 sm:acx-right-6" : "acx-left-4 sm:acx-left-6"} acx-z-[9999]`, children: /* @__PURE__ */ a(
    "button",
    {
      onClick: t,
      className: "acx-launcher-btn acx-relative acx-w-14 acx-h-14 acx-rounded-full acx-shadow-lg acx-transition-all hover:acx-scale-105 acx-flex acx-items-center acx-justify-center",
      "aria-label": e ? "Close chat" : "Open chat",
      children: e ? /* @__PURE__ */ a("span", { className: "acx-launcher-icon-stroke", children: /* @__PURE__ */ a(ye, { className: "acx-w-6 acx-h-6" }) }) : /* @__PURE__ */ o(M, { children: [
        /* @__PURE__ */ a(de, { className: "acx-w-7 acx-h-7" }),
        r.unreadCount > 0 && /* @__PURE__ */ a(q, { count: r.unreadCount })
      ] })
    }
  ) });
}
const be = [
  { id: "messages", label: "Messages", Icon: ue },
  { id: "help", label: "Help", Icon: he }
];
function _e({ activeTab: e, onTabChange: t }) {
  const { state: c } = C();
  return /* @__PURE__ */ a("nav", { className: "acx-flex acx-border-t acx-border-gray-200 acx-bg-white", role: "tablist", children: be.map(({ id: r, label: n, Icon: i }) => /* @__PURE__ */ o(
    "button",
    {
      role: "tab",
      "aria-selected": e === r,
      onClick: () => t(r),
      className: `acx-flex-1 acx-flex acx-flex-col acx-items-center acx-py-2 acx-gap-0.5 acx-relative acx-transition-colors ${e === r ? "acx-text-primary-600" : "acx-text-gray-400 hover:acx-text-primary-600"}`,
      children: [
        /* @__PURE__ */ o("div", { className: "acx-relative", children: [
          /* @__PURE__ */ a(i, { className: "acx-w-5 acx-h-5" }),
          r === "messages" && c.unreadCount > 0 && /* @__PURE__ */ a(q, { count: c.unreadCount })
        ] }),
        /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-font-medium", children: n })
      ]
    },
    r
  )) });
}
const Ne = "acrux_chat_";
function Te(e, t) {
  const c = `${Ne}${e}`, [r, n] = w(() => {
    try {
      const l = window.localStorage.getItem(c);
      return l ? JSON.parse(l) : t;
    } catch {
      return t;
    }
  }), i = b(
    (l) => {
      n(l);
      try {
        window.localStorage.setItem(c, JSON.stringify(l));
      } catch {
      }
    },
    [c]
  );
  return [r, i];
}
function Ee() {
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
const D = "acrux_chat_chat_access_token", we = "https://challenges.cloudflare.com/turnstile/v0/api.js", ke = 5e3;
function ve() {
  return new Promise((e) => {
    let t = !1, c;
    const r = document.createElement("div");
    r.style.display = "none", document.body.appendChild(r);
    const n = (x) => {
      t || (t = !0, clearTimeout(i), c !== void 0 && clearInterval(c), r.remove(), e(x));
    }, i = setTimeout(() => n(null), ke), l = () => {
      if (!t)
        try {
          const x = window.turnstile;
          if (!x) {
            n(null);
            return;
          }
          x.render(r, {
            sitekey: re,
            callback: (m) => n(m),
            "error-callback": () => n(null),
            "expired-callback": () => n(null)
          });
        } catch {
          n(null);
        }
    };
    try {
      if (!document.getElementById("cf-turnstile-script")) {
        const x = document.createElement("script");
        x.id = "cf-turnstile-script", x.src = we, x.async = !0, x.onerror = () => n(null), document.head.appendChild(x);
      }
      window.turnstile ? l() : c = window.setInterval(() => {
        window.turnstile && (c !== void 0 && clearInterval(c), l());
      }, 100);
    } catch {
      n(null);
    }
  });
}
function Ce() {
  try {
    return window.sessionStorage.getItem(D);
  } catch {
    return null;
  }
}
function Ae(e) {
  try {
    e === null ? window.sessionStorage.removeItem(D) : window.sessionStorage.setItem(D, e);
  } catch {
  }
}
function Ie() {
  var E;
  const { state: e, dispatch: t, config: c } = C(), [r, n] = Te("session_key", null), [i, l] = w(() => (localStorage.removeItem(D), Ce())), x = g(), m = g(null), f = b((s) => {
    Ae(s), l(s);
  }, []);
  x.current || (x.current = new O({ baseUrl: c.apiUrl, token: c.token }), i && x.current.setChatToken(i));
  const u = x.current, h = b(async (s) => {
    var S;
    const y = c.mode === "lead" ? Ee() : void 0, A = await ve();
    try {
      t({ type: "SET_LOADING", payload: !0 });
      const N = await u.createSession({
        source: c.mode === "lead" ? "lead_bot" : "user_bot",
        visitor_name: (s == null ? void 0 : s.name) || e.visitorName || c.userName,
        visitor_email: (s == null ? void 0 : s.email) || e.visitorEmail || c.userEmail,
        visitor_metadata: y,
        turnstile_token: A ?? void 0
      });
      return N.access_token && (u.setChatToken(N.access_token), f(N.access_token)), m.current = N.session_key, t({ type: "SET_SESSION", payload: N }), n(N.session_key), (S = c.onSessionCreated) == null || S.call(c, N.session_key), t({ type: "SET_LOADING", payload: !1 }), N;
    } catch (N) {
      throw t({ type: "SET_ERROR", payload: "Failed to create chat session" }), t({ type: "SET_LOADING", payload: !1 }), N;
    }
  }, [u, c, e.visitorName, e.visitorEmail, t, n, f]), p = b(async (s) => {
    try {
      t({ type: "SET_LOADING", payload: !0 });
      const y = await u.getSession(s);
      if (m.current && m.current !== s)
        return t({ type: "SET_LOADING", payload: !1 }), null;
      const { messages: A, ...S } = y;
      return m.current = S.session_key, t({ type: "SET_SESSION", payload: S }), t({ type: "SET_MESSAGES", payload: A }), t({ type: "SET_LOADING", payload: !1 }), S;
    } catch {
      return n(null), f(null), u.setChatToken(""), t({ type: "SET_LOADING", payload: !1 }), null;
    }
  }, [u, t, n, f]), _ = b(async (s, y) => {
    if (e.session) {
      t({ type: "SET_VISITOR_INFO", payload: { name: s, email: y } });
      try {
        await u.updateVisitor(e.session.session_key, {
          visitor_name: s,
          visitor_email: y
        });
      } catch {
      }
    }
  }, [u, e.session, t]);
  return v(() => {
    r && !e.session && p(r);
  }, []), {
    session: e.session,
    sessionKey: ((E = e.session) == null ? void 0 : E.session_key) ?? r,
    accessToken: u.getChatToken() ?? i,
    createSession: h,
    restoreSession: p,
    updateVisitorInfo: _,
    api: u
  };
}
const Re = [
  "history",
  "message",
  "message_ack",
  "agent_joined",
  "agent_typing",
  "heartbeat_ack",
  "error"
];
function Oe(e) {
  return typeof e == "object" && e !== null && typeof e.type == "string" && Re.includes(e.type);
}
class Le {
  constructor(t) {
    T(this, "ws", null);
    T(this, "url");
    T(this, "token");
    T(this, "onMessage");
    T(this, "onStatusChange");
    T(this, "retryCount", 0);
    T(this, "reconnectTimer", null);
    T(this, "heartbeatTimer", null);
    T(this, "messageQueue", []);
    T(this, "intentionallyClosed", !1);
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
          Oe(r) && this.onMessage(r);
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
      R.WS_RECONNECT_BASE * Math.pow(2, this.retryCount),
      R.WS_RECONNECT_MAX
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null, this.retryCount++, this.connect();
    }, t);
  }
  startHeartbeat() {
    this.stopHeartbeat(), this.heartbeatTimer = setInterval(() => {
      this.send({ type: "heartbeat" });
    }, R.WS_HEARTBEAT_INTERVAL);
  }
  stopHeartbeat() {
    this.heartbeatTimer && (clearInterval(this.heartbeatTimer), this.heartbeatTimer = null);
  }
}
function Me() {
  return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
    const t = Math.random() * 16 | 0;
    return (e === "x" ? t : t & 3 | 8).toString(16);
  });
}
function De(e, t) {
  const { state: c, dispatch: r, config: n } = C(), i = g(null), l = g(/* @__PURE__ */ new Map()), x = g(null);
  v(() => {
    if (!e) return;
    const u = n.apiUrl.startsWith("https") ? "wss" : "ws", h = n.apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""), p = `${u}://${h}${ne(e)}`, _ = new Le({
      url: p,
      token: t ?? void 0,
      onStatusChange: (s, y) => {
        r({ type: "SET_CONNECTED", payload: s }), r({ type: "SET_WS_RETRY_COUNT", payload: y });
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
              const y = l.current.get(s.temp_id);
              y && (clearTimeout(y), l.current.delete(s.temp_id));
            }
            break;
          case "agent_joined":
            s.agent && r({ type: "AGENT_JOINED", payload: s.agent });
            break;
          case "agent_typing":
            r({
              type: "SET_AGENT_TYPING",
              payload: { is_typing: s.is_typing ?? !1, agent_name: s.agent_name }
            }), x.current && clearTimeout(x.current), s.is_typing && (x.current = setTimeout(() => {
              r({ type: "SET_AGENT_TYPING", payload: { is_typing: !1 } }), x.current = null;
            }, R.TYPING_TIMEOUT));
            break;
          case "heartbeat_ack":
            break;
          case "error":
            r({ type: "SET_ERROR", payload: s.error ?? "WebSocket error" });
            break;
        }
      }
    });
    _.connect(), i.current = _;
    const E = l.current;
    return () => {
      _.disconnect(), i.current = null, E.forEach((s) => clearTimeout(s)), E.clear(), x.current && (clearTimeout(x.current), x.current = null);
    };
  }, [e, t, n.apiUrl]);
  const m = b((u) => {
    if (!u || u.length > U.MAX_MESSAGE_LENGTH || !i.current) return;
    const h = Me(), p = {
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
    r({ type: "ADD_MESSAGE", payload: p }), i.current.send({
      type: "message",
      text: u,
      temp_id: h
    });
    const _ = setTimeout(() => {
      r({ type: "FAIL_MESSAGE", payload: { temp_id: h } }), l.current.delete(h);
    }, R.MESSAGE_ACK_TIMEOUT);
    l.current.set(h, _);
  }, [n.mode, c.visitorName, r]), f = b((u) => {
    var h;
    (h = i.current) == null || h.send({ type: "typing", is_typing: u });
  }, []);
  return {
    isConnected: c.isConnected,
    sendMessage: m,
    sendTyping: f
  };
}
function Be() {
  var i, l, x;
  const { state: e, dispatch: t, config: c } = C(), r = g(), n = g(!1);
  return r.current || (r.current = new O({ baseUrl: c.apiUrl, token: c.token })), v(() => {
    n.current || (n.current = !0, r.current.getOperatingHoursStatus().then((m) => {
      t({ type: "SET_OPERATING_HOURS", payload: m });
    }).catch(() => {
    }));
  }, [t]), {
    isOnline: ((i = e.operatingHours) == null ? void 0 : i.is_online) ?? !0,
    offlineMessage: (l = e.operatingHours) == null ? void 0 : l.offline_message,
    responseTime: (x = e.operatingHours) == null ? void 0 : x.response_time
  };
}
function Ue(e) {
  return e.split(" ").slice(0, 2).map((t) => t[0] ?? "").join("").toUpperCase();
}
const W = [
  "acx-bg-blue-500",
  "acx-bg-green-500",
  "acx-bg-purple-500",
  "acx-bg-orange-500",
  "acx-bg-pink-500",
  "acx-bg-teal-500"
];
function Pe(e) {
  let t = 0;
  for (let c = 0; c < e.length; c++)
    t = e.charCodeAt(c) + ((t << 5) - t);
  return W[Math.abs(t) % W.length];
}
function P({ name: e, avatarUrl: t }) {
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
      className: `acx-w-8 acx-h-8 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-text-white acx-text-xs acx-font-semibold acx-flex-shrink-0 ${Pe(e)}`,
      children: Ue(e)
    }
  );
}
function $(e) {
  const t = new Date(e), r = (/* @__PURE__ */ new Date()).getTime() - t.getTime(), n = Math.floor(r / 1e3), i = Math.floor(n / 60), l = Math.floor(i / 60), x = Math.floor(l / 24);
  return n < 60 ? "Just now" : i < 60 ? `${i}m ago` : l < 24 ? `${l}h ago` : x < 7 ? `${x}d ago` : t.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric"
  });
}
function Ge(e) {
  const t = new Date(e), c = /* @__PURE__ */ new Date(), r = new Date(c.getFullYear(), c.getMonth(), c.getDate()), n = new Date(t.getFullYear(), t.getMonth(), t.getDate()), i = Math.floor((r.getTime() - n.getTime()) / (1e3 * 60 * 60 * 24));
  return i === 0 ? "Today" : i === 1 ? "Yesterday" : t.toLocaleDateString(void 0, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}
function He(e, t) {
  const c = new Date(e), r = new Date(t);
  return c.getFullYear() === r.getFullYear() && c.getMonth() === r.getMonth() && c.getDate() === r.getDate();
}
function Ke(e) {
  let t = We(e);
  return t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"), t = t.replace(/__(.+?)__/g, "<strong>$1</strong>"), t = t.replace(/\*(.+?)\*/g, "<em>$1</em>"), t = t.replace(new RegExp("(?<!\\w)_(.+?)_(?!\\w)", "g"), "<em>$1</em>"), t = t.replace(/`(.+?)`/g, "<code>$1</code>"), t = t.replace(
    /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  ), t = t.replace(/\n/g, "<br />"), t;
}
function We(e) {
  const t = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return e.replace(/[&<>"']/g, (c) => t[c] ?? c);
}
function $e({ message: e }) {
  var r;
  const t = e.sender_type === "visitor" || e.sender_type === "user", c = e.sender_type === "system";
  return c && e.content_type === "auto_response" ? /* @__PURE__ */ o("div", { className: "acx-flex acx-gap-2 acx-mb-3 acx-justify-start", children: [
    /* @__PURE__ */ a(P, { name: e.sender_name }),
    /* @__PURE__ */ o("div", { className: "acx-max-w-[75%]", children: [
      e.sender_name && /* @__PURE__ */ a("span", { className: "acx-text-xs acx-text-gray-500 acx-ml-1 acx-mb-0.5 acx-block", children: e.sender_name }),
      /* @__PURE__ */ a("div", { className: "acx-px-3.5 acx-py-2.5 acx-rounded-2xl acx-text-sm acx-leading-relaxed acx-bg-amber-50 acx-text-gray-800 acx-rounded-bl-md acx-border acx-border-amber-200", children: /* @__PURE__ */ a("p", { className: "acx-whitespace-pre-wrap", children: e.content }) }),
      /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-text-gray-400 acx-mt-0.5 acx-block", children: $(e.created_at) })
    ] })
  ] }) : c ? /* @__PURE__ */ a("div", { className: "acx-flex acx-justify-center acx-py-2", children: /* @__PURE__ */ a("span", { className: "acx-text-xs acx-text-gray-400 acx-italic", children: e.content }) }) : /* @__PURE__ */ o("div", { className: `acx-flex acx-gap-2 acx-mb-3 ${t ? "acx-justify-end" : "acx-justify-start"}`, children: [
    !t && /* @__PURE__ */ a(P, { name: e.sender_name }),
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
              dangerouslySetInnerHTML: { __html: Ke(e.content) }
            }
          ) : /* @__PURE__ */ a("p", { className: "acx-whitespace-pre-wrap", children: e.content })
        }
      ),
      ((r = e.attachments) == null ? void 0 : r.length) > 0 && /* @__PURE__ */ a("div", { className: "acx-mt-1 acx-space-y-1", children: e.attachments.map((n, i) => /* @__PURE__ */ a(
        "a",
        {
          href: n.url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "acx-block acx-text-xs acx-text-primary-600 hover:acx-underline acx-truncate",
          children: n.name
        },
        i
      )) }),
      /* @__PURE__ */ o("div", { className: `acx-flex acx-items-center acx-gap-1 acx-mt-0.5 ${t ? "acx-justify-end" : ""}`, children: [
        /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-text-gray-400", children: $(e.created_at) }),
        t && e.status === "sending" && /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-text-gray-400", children: "Sending..." }),
        t && e.status === "failed" && /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-text-red-500", children: "Failed" })
      ] })
    ] })
  ] });
}
function je({ agentName: e }) {
  return /* @__PURE__ */ o("div", { className: "acx-flex acx-items-center acx-gap-2 acx-mb-3", children: [
    /* @__PURE__ */ a(P, { name: e ?? "Agent" }),
    /* @__PURE__ */ a("div", { className: "acx-bg-gray-100 acx-rounded-2xl acx-rounded-bl-md acx-px-4 acx-py-3", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-gap-1", children: [
      /* @__PURE__ */ a("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ a("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ a("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" })
    ] }) })
  ] });
}
function Ve({ messages: e, agentTyping: t }) {
  const c = g(null), r = g(null);
  return v(() => {
    var n;
    (n = c.current) == null || n.scrollIntoView({ behavior: "smooth" });
  }, [e.length, t.is_typing]), /* @__PURE__ */ o(
    "div",
    {
      ref: r,
      className: "acx-flex-1 acx-overflow-y-auto acx-px-4 acx-py-3 acx-space-y-1",
      children: [
        e.map((n, i) => {
          const l = e[i - 1], x = !l || !He(l.created_at, n.created_at);
          return /* @__PURE__ */ o("div", { children: [
            x && /* @__PURE__ */ a("div", { className: "acx-flex acx-items-center acx-justify-center acx-py-3", children: /* @__PURE__ */ a("span", { className: "acx-text-xs acx-text-gray-400 acx-bg-gray-50 acx-px-3 acx-py-1 acx-rounded-full", children: Ge(n.created_at) }) }),
            /* @__PURE__ */ a($e, { message: n })
          ] }, n.temp_id ?? n.id);
        }),
        t.is_typing && /* @__PURE__ */ a(je, { agentName: t.agent_name }),
        /* @__PURE__ */ a("div", { ref: c })
      ]
    }
  );
}
function Ye({ onSend: e, onTyping: t, onFileUpload: c, mode: r, disabled: n, placeholder: i }) {
  const [l, x] = w(""), m = g(null), f = g(), u = b(() => {
    const s = l.trim();
    !s || n || (e(s), x(""), t == null || t(!1));
  }, [l, n, e, t]), h = (s) => {
    s.key === "Enter" && !s.shiftKey && (s.preventDefault(), u());
  }, p = (s) => {
    const y = s.target.value;
    y.length > U.MAX_MESSAGE_LENGTH || (x(y), t == null || t(!0), f.current && clearTimeout(f.current), f.current = setTimeout(() => t == null ? void 0 : t(!1), 2e3));
  }, _ = () => {
    var s;
    (s = m.current) == null || s.click();
  }, E = (s) => {
    s.target.files && s.target.files.length > 0 && (c == null || c(s.target.files), s.target.value = "");
  };
  return /* @__PURE__ */ a("div", { className: "acx-border-t acx-border-gray-200 acx-bg-white acx-px-3 acx-py-2", children: /* @__PURE__ */ o("div", { className: "acx-flex acx-items-end acx-gap-2", children: [
    r === "user" && c && /* @__PURE__ */ o(M, { children: [
      /* @__PURE__ */ a(
        "button",
        {
          onClick: _,
          className: "acx-p-1.5 acx-text-gray-400 hover:acx-text-gray-600 acx-transition-colors acx-flex-shrink-0",
          "aria-label": "Attach file",
          type: "button",
          children: /* @__PURE__ */ a(fe, { className: "acx-w-5 acx-h-5" })
        }
      ),
      /* @__PURE__ */ a(
        "input",
        {
          ref: m,
          type: "file",
          className: "acx-hidden",
          accept: U.ALLOWED_FILE_TYPES.join(","),
          multiple: !0,
          onChange: E
        }
      )
    ] }),
    /* @__PURE__ */ a(
      "textarea",
      {
        value: l,
        onChange: p,
        onKeyDown: h,
        placeholder: i ?? "Type a message...",
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
        disabled: !l.trim() || n,
        className: "acx-p-1.5 acx-text-primary-600 acx-transition-colors acx-flex-shrink-0 enabled:hover:acx-text-primary-700 disabled:acx-text-gray-300 disabled:acx-cursor-not-allowed",
        "aria-label": "Send message",
        type: "button",
        children: /* @__PURE__ */ a(pe, { className: "acx-w-5 acx-h-5" })
      }
    )
  ] }) });
}
function j({ isOnline: e, offlineMessage: t, responseTime: c }) {
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
function V({ isConnected: e, retryCount: t }) {
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
function Fe({ onSubmit: e, loading: t }) {
  const [c, r] = w(""), [n, i] = w("");
  return /* @__PURE__ */ o("form", { onSubmit: (x) => {
    x.preventDefault(), n.trim() && e({ name: c.trim(), email: n.trim() });
  }, className: "acx-p-4 acx-space-y-3", children: [
    /* @__PURE__ */ a("p", { className: "acx-text-sm acx-text-gray-600 acx-mb-1", children: "Before we start, could you share your details?" }),
    /* @__PURE__ */ a(
      "input",
      {
        type: "text",
        value: c,
        onChange: (x) => r(x.target.value),
        placeholder: "Your name",
        className: "acx-w-full acx-px-3 acx-py-2 acx-border acx-border-gray-200 acx-rounded-lg acx-text-sm acx-outline-none focus:acx-border-primary-500 focus:acx-ring-1 focus:acx-ring-primary-500"
      }
    ),
    /* @__PURE__ */ a(
      "input",
      {
        type: "email",
        value: n,
        onChange: (x) => i(x.target.value),
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
function qe() {
  const { state: e, dispatch: t, config: c } = C(), { session: r, sessionKey: n, accessToken: i, createSession: l } = Ie(), { sendMessage: x, sendTyping: m, isConnected: f } = De(n, i), { isOnline: u, offlineMessage: h, responseTime: p } = Be(), [_, E] = w(!1), s = g(null);
  v(() => {
    f && s.current && (x(s.current), s.current = null);
  }, [f, x]);
  const y = b(async (S) => {
    if (!r) {
      if (c.mode === "lead" && !e.visitorEmail) {
        s.current = S, E(!0);
        return;
      }
      try {
        s.current = S, await l();
      } catch {
        s.current = null;
      }
      return;
    }
    x(S);
  }, [r, c.mode, e.visitorEmail, l, x]), A = b(async (S) => {
    t({ type: "SET_VISITOR_INFO", payload: S }), E(!1);
    try {
      await l({ name: S.name, email: S.email });
    } catch {
      s.current = null;
    }
  }, [l, t]);
  return v(() => {
    e.unreadCount > 0 && e.activeTab === "messages" && t({ type: "RESET_UNREAD" });
  }, [e.unreadCount, e.activeTab, t]), _ && !r ? /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ a(V, { isConnected: f, retryCount: e.wsRetryCount }),
    /* @__PURE__ */ a(j, { isOnline: u, offlineMessage: h, responseTime: p }),
    /* @__PURE__ */ a(Fe, { onSubmit: A, loading: e.loading })
  ] }) : /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ a(V, { isConnected: f, retryCount: e.wsRetryCount }),
    /* @__PURE__ */ a(j, { isOnline: u, offlineMessage: h, responseTime: p }),
    e.messages.length === 0 && !r ? /* @__PURE__ */ a("div", { className: "acx-flex-1 acx-flex acx-flex-col acx-items-center acx-justify-center acx-px-6 acx-text-center", children: u ? /* @__PURE__ */ o(M, { children: [
      /* @__PURE__ */ a("p", { className: "acx-text-lg acx-font-semibold acx-text-gray-800 acx-mb-1", children: c.greeting || "Hi there! How can we help?" }),
      /* @__PURE__ */ a("p", { className: "acx-text-sm acx-text-gray-500", children: "Send a message to start a conversation" })
    ] }) : /* @__PURE__ */ o(M, { children: [
      /* @__PURE__ */ a("div", { className: "acx-w-12 acx-h-12 acx-bg-amber-100 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-mb-3", children: /* @__PURE__ */ o("svg", { className: "acx-w-6 acx-h-6 acx-text-amber-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
        /* @__PURE__ */ a("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6l-4 4V6c0-1.1.9-2 2-2z" }),
        /* @__PURE__ */ a("path", { d: "M12 11v1" }),
        /* @__PURE__ */ a("path", { d: "M12 8h.01" })
      ] }) }),
      /* @__PURE__ */ a("p", { className: "acx-text-sm acx-text-gray-600 acx-font-medium", children: "Leave us a message" }),
      /* @__PURE__ */ o("p", { className: "acx-text-xs acx-text-gray-400 acx-mt-1", children: [
        "Our team is currently away. Leave a message and we'll get back to you",
        p ? ` ${p}` : " as soon as possible",
        "."
      ] })
    ] }) }) : /* @__PURE__ */ a(Ve, { messages: e.messages, agentTyping: e.agentTyping }),
    /* @__PURE__ */ a(
      Ye,
      {
        onSend: y,
        onTyping: m,
        mode: c.mode,
        disabled: e.loading,
        placeholder: u ? "Type a message..." : "Leave a message..."
      }
    )
  ] });
}
function Je() {
  const { dispatch: e, config: t } = C(), c = g(), r = g();
  c.current || (c.current = new O({ baseUrl: t.apiUrl, token: t.token }));
  const n = b((i) => {
    if (r.current && clearTimeout(r.current), !i.trim()) {
      e({ type: "SET_KB_RESULTS", payload: [] });
      return;
    }
    e({ type: "SET_KB_LOADING", payload: !0 }), r.current = setTimeout(async () => {
      try {
        const l = await c.current.searchKB(i);
        e({ type: "SET_KB_RESULTS", payload: l });
      } catch {
        e({ type: "SET_KB_RESULTS", payload: [] });
      }
    }, R.SEARCH_DEBOUNCE);
  }, [e]);
  return v(() => () => {
    r.current && clearTimeout(r.current);
  }, []), { search: n };
}
function ze({ onSearch: e, onSubmit: t, placeholder: c = "Search for help..." }) {
  const [r, n] = w(""), i = g();
  return v(() => (i.current && clearTimeout(i.current), i.current = setTimeout(() => {
    e(r.trim());
  }, R.SEARCH_DEBOUNCE), () => {
    i.current && clearTimeout(i.current);
  }), [r, e]), /* @__PURE__ */ o("div", { className: "acx-relative", children: [
    /* @__PURE__ */ a(me, { className: "acx-absolute acx-left-3 acx-top-1/2 -acx-translate-y-1/2 acx-w-4 acx-h-4 acx-text-gray-400" }),
    /* @__PURE__ */ a(
      "input",
      {
        type: "text",
        value: r,
        onChange: (l) => n(l.target.value),
        onKeyDown: (l) => {
          l.key === "Enter" && t && r.trim() && (l.preventDefault(), t(r.trim()));
        },
        placeholder: c,
        className: "acx-w-full acx-pl-9 acx-pr-4 acx-py-2.5 acx-border acx-border-gray-200 acx-rounded-lg acx-text-sm acx-outline-none focus:acx-border-primary-500 focus:acx-ring-1 focus:acx-ring-primary-500 acx-transition-colors acx-bg-white"
      }
    )
  ] });
}
function Y({ article: e, onClick: t }) {
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
        /* @__PURE__ */ a(J, { className: "acx-w-4 acx-h-4 acx-text-gray-400 acx-flex-shrink-0 acx-ml-2" })
      ]
    }
  );
}
function Qe() {
  var G, H;
  const { state: e, dispatch: t, config: c } = C(), { search: r } = Je(), n = e.kbTopics, [i, l] = w(null), [x, m] = w([]), [f, u] = w(!1), [h, p] = w(null), [_, E] = w(!1), s = g();
  s.current || (s.current = new O({ baseUrl: c.apiUrl, token: c.token }));
  const y = b((d) => {
    d || p(null), r(d);
  }, [r]), A = b(async (d) => {
    var I;
    E(!0), p(null);
    try {
      const L = await s.current.askKB(d, (I = e.session) == null ? void 0 : I.session_key);
      p(L), L.fallback && L.results.length > 0 && t({ type: "SET_KB_RESULTS", payload: L.results });
    } catch {
      p(null);
    } finally {
      E(!1);
    }
  }, [t, (G = e.session) == null ? void 0 : G.session_key]);
  v(() => {
    var d;
    ((d = e.kbTopics) == null ? void 0 : d.length) > 0 || s.current.getKBTopics().then((I) => t({ type: "SET_KB_TOPICS", payload: Array.isArray(I) ? I : [] })).catch(() => {
    });
  }, [(H = e.kbTopics) == null ? void 0 : H.length, t]);
  const S = b(async (d) => {
    l(d), u(!0);
    try {
      const I = await s.current.getKBTopicArticles(d.slug);
      m(I);
    } catch {
      m([]);
    } finally {
      u(!1);
    }
  }, []), N = b((d) => {
    d.url && window.open(d.url, "_blank", "noopener,noreferrer");
  }, []), z = b(() => {
    l(null), m([]);
  }, []);
  if (i)
    return /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
      /* @__PURE__ */ o("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
        /* @__PURE__ */ o(
          "button",
          {
            onClick: z,
            className: "acx-flex acx-items-center acx-gap-1 acx-text-sm acx-text-primary-600 acx-mb-2 hover:acx-text-primary-700",
            children: [
              /* @__PURE__ */ a(ge, { className: "acx-w-4 acx-h-4" }),
              "Back"
            ]
          }
        ),
        /* @__PURE__ */ a("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: i.name }),
        /* @__PURE__ */ o("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: [
          i.article_count,
          " article",
          i.article_count !== 1 ? "s" : ""
        ] })
      ] }),
      /* @__PURE__ */ a("div", { className: "acx-p-4 acx-space-y-1", children: f ? /* @__PURE__ */ a("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "Loading..." }) : x.length === 0 ? /* @__PURE__ */ a("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "No articles found" }) : x.map((d) => /* @__PURE__ */ a(Y, { article: d, onClick: N }, d.id)) })
    ] });
  const Q = e.kbLoading || e.kbResults.length > 0;
  return /* @__PURE__ */ o("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ o("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ a("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: "Help Centre" }),
      /* @__PURE__ */ a("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: "Ask a question or browse topics" }),
      /* @__PURE__ */ a("div", { className: "acx-mt-3", children: /* @__PURE__ */ a(ze, { onSearch: y, onSubmit: A, placeholder: "Ask a question or search..." }) }),
      _ && /* @__PURE__ */ a("div", { className: "acx-mt-3 acx-py-3 acx-text-center acx-text-sm acx-text-gray-400", children: "Finding an answer..." }),
      !_ && (h == null ? void 0 : h.answer) && /* @__PURE__ */ o("div", { className: "acx-mt-3 acx-rounded-lg acx-bg-primary-50 acx-border acx-border-primary-100 acx-p-3", children: [
        /* @__PURE__ */ a("p", { className: "acx-text-sm acx-text-gray-800 acx-whitespace-pre-line", children: h.answer }),
        h.sources.length > 0 && /* @__PURE__ */ a("div", { className: "acx-mt-2 acx-pt-2 acx-border-t acx-border-primary-100 acx-space-y-1", children: h.sources.map((d) => /* @__PURE__ */ o(
          "button",
          {
            onClick: () => N(d),
            className: "acx-block acx-text-xs acx-text-primary-600 hover:acx-text-primary-700 acx-text-left",
            children: [
              d.title,
              " →"
            ]
          },
          d.id
        )) })
      ] }),
      !_ && (h == null ? void 0 : h.fallback) && /* @__PURE__ */ a("p", { className: "acx-mt-3 acx-text-xs acx-text-gray-500", children: "We couldn't find a direct answer — try these articles, or send us a message." })
    ] }),
    Q ? /* @__PURE__ */ a("div", { className: "acx-p-4 acx-space-y-1", children: e.kbLoading ? /* @__PURE__ */ a("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "Searching..." }) : e.kbResults.slice(0, 5).map((d) => /* @__PURE__ */ a(Y, { article: d, onClick: N }, d.id)) }) : /* @__PURE__ */ a("div", { className: "acx-p-4 acx-space-y-1", children: n.length === 0 ? /* @__PURE__ */ a("div", { className: "acx-py-8 acx-text-center", children: /* @__PURE__ */ a("p", { className: "acx-text-sm acx-text-gray-400", children: "No help topics available" }) }) : n.map((d) => /* @__PURE__ */ o(
      "button",
      {
        onClick: () => S(d),
        className: "acx-w-full acx-flex acx-items-center acx-justify-between acx-p-3 acx-rounded-lg acx-text-left hover:acx-bg-gray-50 acx-transition-colors",
        children: [
          /* @__PURE__ */ o("div", { children: [
            /* @__PURE__ */ a("h4", { className: "acx-text-sm acx-font-medium acx-text-gray-900", children: d.name }),
            /* @__PURE__ */ o("p", { className: "acx-text-xs acx-text-gray-500", children: [
              d.article_count,
              " article",
              d.article_count !== 1 ? "s" : ""
            ] })
          ] }),
          /* @__PURE__ */ a(J, { className: "acx-w-4 acx-h-4 acx-text-gray-400" })
        ]
      },
      d.id
    )) })
  ] });
}
function at(e) {
  return /* @__PURE__ */ a(le, { ...e, children: /* @__PURE__ */ a(Xe, { position: e.position ?? se.POSITION }) });
}
function Xe({ position: e }) {
  const { state: t, dispatch: c } = C(), [r, n] = w(!1);
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
            t.activeTab === "messages" && /* @__PURE__ */ a(qe, {}),
            t.activeTab === "help" && /* @__PURE__ */ a(Qe, {})
          ] }),
          /* @__PURE__ */ a(
            _e,
            {
              activeTab: t.activeTab,
              onTabChange: (l) => c({ type: "SET_TAB", payload: l })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ a(
      Se,
      {
        isOpen: r,
        onClick: () => n(!r),
        position: e
      }
    )
  ] });
}
export {
  at as ChatWidget
};
