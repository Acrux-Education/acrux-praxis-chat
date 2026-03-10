var K = Object.defineProperty;
var V = (e, a, c) => a in e ? K(e, a, { enumerable: !0, configurable: !0, writable: !0, value: c }) : e[a] = c;
var N = (e, a, c) => V(e, typeof a != "symbol" ? a + "" : a, c);
import { jsxs as i, jsx as t, Fragment as A } from "react/jsx-runtime";
import { createContext as Y, useReducer as F, useMemo as q, useRef as b, useEffect as v, useContext as z, useState as E, useCallback as _ } from "react";
const T = {
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
}, J = (e) => `/ws/chat/${e}/`, Q = {
  POSITION: "bottom-right"
}, k = {
  WS_RECONNECT_BASE: 1e3,
  WS_RECONNECT_MAX: 3e4,
  WS_HEARTBEAT_INTERVAL: 3e4,
  MESSAGE_ACK_TIMEOUT: 5e3,
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
}, L = {
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
function X(e, a) {
  switch (a.type) {
    case "SET_SESSION":
      return { ...e, session: a.payload };
    case "SET_MESSAGES": {
      const c = e.messages.filter(
        (o) => o.temp_id && o.status !== "sent"
      ), r = new Set(a.payload.map((o) => o.id)), n = c.filter((o) => !r.has(o.id));
      return { ...e, messages: [...a.payload, ...n] };
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
    case "SET_WS_RETRY_COUNT":
      return { ...e, wsRetryCount: a.payload };
    default:
      return e;
  }
}
class I {
  constructor(a) {
    N(this, "baseUrl");
    N(this, "token");
    N(this, "chatToken");
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
    const r = {
      "Content-Type": "application/json",
      ...c.headers
    };
    this.token && (r.Authorization = `Bearer ${this.token}`), this.chatToken && (r["X-Chat-Token"] = this.chatToken);
    const n = await fetch(`${this.baseUrl}${a}`, {
      ...c,
      headers: r
    });
    if (!n.ok) {
      const o = await n.text().catch(() => "");
      throw new Z(n.status, n.statusText, o);
    }
    if (n.status !== 204)
      return n.json();
  }
  async createSession(a) {
    return this.request(T.SESSIONS, {
      method: "POST",
      body: JSON.stringify(a)
    });
  }
  async getSession(a) {
    return this.request(T.SESSION(a));
  }
  async sendMessage(a, c) {
    return this.request(T.SESSION_MESSAGES(a), {
      method: "POST",
      body: JSON.stringify(c)
    });
  }
  async updateVisitor(a, c) {
    return this.request(T.SESSION_VISITOR(a), {
      method: "PATCH",
      body: JSON.stringify(c)
    });
  }
  async getAnnouncements() {
    return this.request(T.ANNOUNCEMENTS);
  }
  async getRoadmapItems() {
    return this.request(T.ROADMAP);
  }
  async searchKB(a) {
    const c = new URLSearchParams({ q: a });
    return this.request(`${T.KB_SEARCH}?${c}`);
  }
  async getKBTopics() {
    return this.request(T.KB_TOPICS);
  }
  async getKBTopicArticles(a) {
    return this.request(T.KB_TOPIC_ARTICLES(a));
  }
  async getOperatingHoursStatus() {
    return this.request(T.OPERATING_HOURS);
  }
}
class Z extends Error {
  constructor(a, c, r) {
    super(`API Error ${a}: ${c}`), this.status = a, this.statusText = c, this.body = r, this.name = "ApiError";
  }
}
function O(e) {
  return Array.isArray(e) ? e : e && typeof e == "object" && "results" in e ? e.results : [];
}
const H = Y(null);
function ee({ children: e, ...a }) {
  const [c, r] = F(X, {
    ...L,
    activeTab: a.defaultTab ?? L.activeTab,
    visitorName: a.userName ?? "",
    visitorEmail: a.userEmail ?? ""
  }), n = q(
    () => ({ state: c, dispatch: r, config: a }),
    [c, a]
  );
  return /* @__PURE__ */ i(H.Provider, { value: n, children: [
    /* @__PURE__ */ t(ae, {}),
    e
  ] });
}
function ae() {
  const { dispatch: e, config: a } = w(), c = b(!1);
  return v(() => {
    if (c.current) return;
    c.current = !0;
    const r = new I({ baseUrl: a.apiUrl, token: a.token });
    r.getAnnouncements().then((n) => e({ type: "SET_ANNOUNCEMENTS", payload: O(n) })).catch(() => {
    }), r.getRoadmapItems().then((n) => e({ type: "SET_ROADMAP_ITEMS", payload: O(n) })).catch(() => {
    }), r.getKBTopics().then((n) => e({ type: "SET_KB_TOPICS", payload: O(n) })).catch(() => {
    }), r.getOperatingHoursStatus().then((n) => e({ type: "SET_OPERATING_HOURS", payload: n })).catch(() => {
    });
  }, [a.apiUrl, a.token, e]), null;
}
function w() {
  const e = z(H);
  if (!e)
    throw new Error("useChatContext must be used within a ChatProvider");
  return e;
}
function $({ count: e }) {
  if (e <= 0) return null;
  const a = e > 99 ? "99+" : String(e);
  return /* @__PURE__ */ t("span", { className: "acx-absolute -acx-top-1.5 -acx-right-1.5 acx-min-w-[18px] acx-h-[18px] acx-flex acx-items-center acx-justify-center acx-bg-red-500 acx-text-white acx-text-[10px] acx-font-bold acx-rounded-full acx-px-1 acx-leading-none", children: a });
}
function te({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) });
}
function ce({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "currentColor", stroke: "none", children: /* @__PURE__ */ t("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) });
}
function re({ className: e }) {
  return /* @__PURE__ */ i("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("circle", { cx: "12", cy: "12", r: "10" }),
    /* @__PURE__ */ t("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
    /* @__PURE__ */ t("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
  ] });
}
function ne({ className: e }) {
  return /* @__PURE__ */ i("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
    /* @__PURE__ */ t("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
  ] });
}
function se({ className: e }) {
  return /* @__PURE__ */ i("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ t("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    /* @__PURE__ */ t("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ] });
}
function ie({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" }) });
}
function j({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("polyline", { points: "9 18 15 12 9 6" }) });
}
function oe({ className: e }) {
  return /* @__PURE__ */ t("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ t("polyline", { points: "15 18 9 12 15 6" }) });
}
function le({ isOpen: e, onClick: a, position: c }) {
  const { state: r } = w();
  return /* @__PURE__ */ t("div", { className: `acx-fixed acx-bottom-4 sm:acx-bottom-6 ${c === "bottom-right" ? "acx-right-4 sm:acx-right-6" : "acx-left-4 sm:acx-left-6"} acx-z-[9999]`, children: /* @__PURE__ */ t(
    "button",
    {
      onClick: a,
      className: "acx-launcher-btn acx-relative acx-w-14 acx-h-14 acx-rounded-full acx-shadow-lg acx-transition-all hover:acx-scale-105 acx-flex acx-items-center acx-justify-center",
      "aria-label": e ? "Close chat" : "Open chat",
      children: e ? /* @__PURE__ */ t("span", { className: "acx-launcher-icon-stroke", children: /* @__PURE__ */ t(se, { className: "acx-w-6 acx-h-6" }) }) : /* @__PURE__ */ i(A, { children: [
        /* @__PURE__ */ t(ce, { className: "acx-w-7 acx-h-7" }),
        r.unreadCount > 0 && /* @__PURE__ */ t($, { count: r.unreadCount })
      ] })
    }
  ) });
}
const xe = [
  { id: "messages", label: "Messages", Icon: te },
  { id: "help", label: "Help", Icon: re }
];
function ue({ activeTab: e, onTabChange: a }) {
  const { state: c } = w();
  return /* @__PURE__ */ t("nav", { className: "acx-flex acx-border-t acx-border-gray-200 acx-bg-white", role: "tablist", children: xe.map(({ id: r, label: n, Icon: o }) => /* @__PURE__ */ i(
    "button",
    {
      role: "tab",
      "aria-selected": e === r,
      onClick: () => a(r),
      className: `acx-flex-1 acx-flex acx-flex-col acx-items-center acx-py-2 acx-gap-0.5 acx-relative acx-transition-colors ${e === r ? "acx-text-primary-600" : "acx-text-gray-400 hover:acx-text-primary-600"}`,
      children: [
        /* @__PURE__ */ i("div", { className: "acx-relative", children: [
          /* @__PURE__ */ t(o, { className: "acx-w-5 acx-h-5" }),
          r === "messages" && c.unreadCount > 0 && /* @__PURE__ */ t($, { count: c.unreadCount })
        ] }),
        /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-font-medium", children: n })
      ]
    },
    r
  )) });
}
const de = "acrux_chat_";
function D(e, a) {
  const c = `${de}${e}`, [r, n] = E(() => {
    try {
      const l = window.localStorage.getItem(c);
      return l ? JSON.parse(l) : a;
    } catch {
      return a;
    }
  }), o = _(
    (l) => {
      n(l);
      try {
        window.localStorage.setItem(c, JSON.stringify(l));
      } catch {
      }
    },
    [c]
  );
  return [r, o];
}
function W() {
  return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
    const a = Math.random() * 16 | 0;
    return (e === "x" ? a : a & 3 | 8).toString(16);
  });
}
function he() {
  const e = new URLSearchParams(window.location.search);
  return {
    page_url: window.location.href,
    referrer: document.referrer,
    utm_source: e.get("utm_source") ?? void 0,
    utm_medium: e.get("utm_medium") ?? void 0,
    utm_campaign: e.get("utm_campaign") ?? void 0
  };
}
function me() {
  var S;
  const { state: e, dispatch: a, config: c } = w(), [r, n] = D("session_key", null), [o, l] = D("chat_access_token", null), x = b(), g = b(null);
  x.current || (x.current = new I({ baseUrl: c.apiUrl, token: c.token }), o && x.current.setChatToken(o));
  const u = x.current, h = _(async (d) => {
    var C;
    const s = W(), p = c.mode === "lead" ? he() : void 0;
    try {
      a({ type: "SET_LOADING", payload: !0 });
      const f = await u.createSession({
        source: c.mode === "lead" ? "lead_bot" : "user_bot",
        session_key: s,
        visitor_name: (d == null ? void 0 : d.name) || e.visitorName || c.userName,
        visitor_email: (d == null ? void 0 : d.email) || e.visitorEmail || c.userEmail,
        visitor_metadata: p
      });
      return f.access_token && (u.setChatToken(f.access_token), l(f.access_token)), g.current = f.session_key, a({ type: "SET_SESSION", payload: f }), n(f.session_key), (C = c.onSessionCreated) == null || C.call(c, f.session_key), a({ type: "SET_LOADING", payload: !1 }), f;
    } catch (f) {
      throw a({ type: "SET_ERROR", payload: "Failed to create chat session" }), a({ type: "SET_LOADING", payload: !1 }), f;
    }
  }, [u, c, e.visitorName, e.visitorEmail, a, n, l]), m = _(async (d) => {
    try {
      a({ type: "SET_LOADING", payload: !0 });
      const s = await u.getSession(d);
      if (g.current && g.current !== d)
        return a({ type: "SET_LOADING", payload: !1 }), null;
      const { messages: p, ...C } = s;
      return g.current = C.session_key, a({ type: "SET_SESSION", payload: C }), a({ type: "SET_MESSAGES", payload: p }), a({ type: "SET_LOADING", payload: !1 }), C;
    } catch {
      return n(null), l(null), u.setChatToken(""), a({ type: "SET_LOADING", payload: !1 }), null;
    }
  }, [u, a, n, l]), y = _(async (d, s) => {
    if (e.session) {
      a({ type: "SET_VISITOR_INFO", payload: { name: d, email: s } });
      try {
        await u.updateVisitor(e.session.session_key, {
          visitor_name: d,
          visitor_email: s
        });
      } catch {
      }
    }
  }, [u, e.session, a]);
  return v(() => {
    r && !e.session && m(r);
  }, []), {
    session: e.session,
    sessionKey: ((S = e.session) == null ? void 0 : S.session_key) ?? r,
    accessToken: u.getChatToken() ?? o,
    createSession: h,
    restoreSession: m,
    updateVisitorInfo: y,
    api: u
  };
}
class pe {
  constructor(a) {
    N(this, "ws", null);
    N(this, "url");
    N(this, "onMessage");
    N(this, "onStatusChange");
    N(this, "retryCount", 0);
    N(this, "reconnectTimer", null);
    N(this, "heartbeatTimer", null);
    N(this, "messageQueue", []);
    N(this, "intentionallyClosed", !1);
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
        this.retryCount = 0, this.onStatusChange(!0, 0), this.startHeartbeat(), this.flushQueue();
      }, this.ws.onclose = () => {
        this.onStatusChange(!1, this.retryCount), this.stopHeartbeat(), this.intentionallyClosed || this.scheduleReconnect();
      }, this.ws.onerror = () => {
      }, this.ws.onmessage = (c) => {
        try {
          const r = JSON.parse(c.data);
          this.onMessage(r);
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
function fe(e, a) {
  const { state: c, dispatch: r, config: n } = w(), o = b(null), l = b(/* @__PURE__ */ new Map()), x = b(null);
  v(() => {
    if (!e) return;
    const h = n.apiUrl.startsWith("https") ? "wss" : "ws", m = n.apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    let y = `${h}://${m}${J(e)}`;
    a && (y += `?token=${encodeURIComponent(a)}`);
    const S = new pe({
      url: y,
      onStatusChange: (s, p) => {
        r({ type: "SET_CONNECTED", payload: s }), r({ type: "SET_WS_RETRY_COUNT", payload: p });
      },
      onMessage: (s) => {
        switch (s.type) {
          case "history":
            s.messages && r({ type: "SET_MESSAGES", payload: s.messages });
            break;
          case "message":
            s.message && (r({ type: "ADD_MESSAGE", payload: s.message }), (!c.isOpen || c.activeTab !== "messages") && r({ type: "INCREMENT_UNREAD" }));
            break;
          case "message_ack":
            if (s.temp_id && s.real_id) {
              r({ type: "ACK_MESSAGE", payload: { temp_id: s.temp_id, real_id: s.real_id } });
              const p = l.current.get(s.temp_id);
              p && (clearTimeout(p), l.current.delete(s.temp_id));
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
            }, k.TYPING_TIMEOUT));
            break;
          case "heartbeat_ack":
            break;
          case "error":
            r({ type: "SET_ERROR", payload: s.error ?? "WebSocket error" });
            break;
        }
      }
    });
    S.connect(), o.current = S;
    const d = l.current;
    return () => {
      S.disconnect(), o.current = null, d.forEach((s) => clearTimeout(s)), d.clear(), x.current && (clearTimeout(x.current), x.current = null);
    };
  }, [e, a, n.apiUrl]);
  const g = _((h) => {
    if (!o.current) return;
    const m = W(), y = {
      id: m,
      session: 0,
      sender_type: n.mode === "lead" ? "visitor" : "user",
      sender_name: c.visitorName || "You",
      content: h,
      content_type: "text",
      attachments: [],
      is_read: !0,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      temp_id: m,
      status: "sending"
    };
    r({ type: "ADD_MESSAGE", payload: y }), o.current.send({
      type: "message",
      text: h,
      temp_id: m
    });
    const S = setTimeout(() => {
      r({ type: "FAIL_MESSAGE", payload: { temp_id: m } }), l.current.delete(m);
    }, k.MESSAGE_ACK_TIMEOUT);
    l.current.set(m, S);
  }, [n.mode, c.visitorName, r]), u = _((h) => {
    var m;
    (m = o.current) == null || m.send({ type: "typing", is_typing: h });
  }, []);
  return {
    isConnected: c.isConnected,
    sendMessage: g,
    sendTyping: u
  };
}
function ge() {
  var o, l, x;
  const { state: e, dispatch: a, config: c } = w(), r = b(), n = b(!1);
  return r.current || (r.current = new I({ baseUrl: c.apiUrl, token: c.token })), v(() => {
    n.current || (n.current = !0, r.current.getOperatingHoursStatus().then((g) => {
      a({ type: "SET_OPERATING_HOURS", payload: g });
    }).catch(() => {
    }));
  }, [a]), {
    isOnline: ((o = e.operatingHours) == null ? void 0 : o.is_online) ?? !0,
    offlineMessage: (l = e.operatingHours) == null ? void 0 : l.offline_message,
    responseTime: (x = e.operatingHours) == null ? void 0 : x.response_time
  };
}
function ye(e) {
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
function Se(e) {
  let a = 0;
  for (let c = 0; c < e.length; c++)
    a = e.charCodeAt(c) + ((a << 5) - a);
  return B[Math.abs(a) % B.length];
}
function R({ name: e, avatarUrl: a }) {
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
      className: `acx-w-8 acx-h-8 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-text-white acx-text-xs acx-font-semibold acx-flex-shrink-0 ${Se(e)}`,
      children: ye(e)
    }
  );
}
function P(e) {
  const a = new Date(e), r = (/* @__PURE__ */ new Date()).getTime() - a.getTime(), n = Math.floor(r / 1e3), o = Math.floor(n / 60), l = Math.floor(o / 60), x = Math.floor(l / 24);
  return n < 60 ? "Just now" : o < 60 ? `${o}m ago` : l < 24 ? `${l}h ago` : x < 7 ? `${x}d ago` : a.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric"
  });
}
function be(e) {
  const a = new Date(e), c = /* @__PURE__ */ new Date(), r = new Date(c.getFullYear(), c.getMonth(), c.getDate()), n = new Date(a.getFullYear(), a.getMonth(), a.getDate()), o = Math.floor((r.getTime() - n.getTime()) / (1e3 * 60 * 60 * 24));
  return o === 0 ? "Today" : o === 1 ? "Yesterday" : a.toLocaleDateString(void 0, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}
function Ne(e, a) {
  const c = new Date(e), r = new Date(a);
  return c.getFullYear() === r.getFullYear() && c.getMonth() === r.getMonth() && c.getDate() === r.getDate();
}
function _e(e) {
  let a = Te(e);
  return a = a.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"), a = a.replace(/__(.+?)__/g, "<strong>$1</strong>"), a = a.replace(/\*(.+?)\*/g, "<em>$1</em>"), a = a.replace(new RegExp("(?<!\\w)_(.+?)_(?!\\w)", "g"), "<em>$1</em>"), a = a.replace(/`(.+?)`/g, "<code>$1</code>"), a = a.replace(
    /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  ), a = a.replace(/\n/g, "<br />"), a;
}
function Te(e) {
  const a = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return e.replace(/[&<>"']/g, (c) => a[c] ?? c);
}
function Ee({ message: e }) {
  var r;
  const a = e.sender_type === "visitor" || e.sender_type === "user", c = e.sender_type === "system";
  return c && e.content_type === "auto_response" ? /* @__PURE__ */ i("div", { className: "acx-flex acx-gap-2 acx-mb-3 acx-justify-start", children: [
    /* @__PURE__ */ t(R, { name: e.sender_name }),
    /* @__PURE__ */ i("div", { className: "acx-max-w-[75%]", children: [
      e.sender_name && /* @__PURE__ */ t("span", { className: "acx-text-xs acx-text-gray-500 acx-ml-1 acx-mb-0.5 acx-block", children: e.sender_name }),
      /* @__PURE__ */ t("div", { className: "acx-px-3.5 acx-py-2.5 acx-rounded-2xl acx-text-sm acx-leading-relaxed acx-bg-amber-50 acx-text-gray-800 acx-rounded-bl-md acx-border acx-border-amber-200", children: /* @__PURE__ */ t("p", { className: "acx-whitespace-pre-wrap", children: e.content }) }),
      /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400 acx-mt-0.5 acx-block", children: P(e.created_at) })
    ] })
  ] }) : c ? /* @__PURE__ */ t("div", { className: "acx-flex acx-justify-center acx-py-2", children: /* @__PURE__ */ t("span", { className: "acx-text-xs acx-text-gray-400 acx-italic", children: e.content }) }) : /* @__PURE__ */ i("div", { className: `acx-flex acx-gap-2 acx-mb-3 ${a ? "acx-justify-end" : "acx-justify-start"}`, children: [
    !a && /* @__PURE__ */ t(R, { name: e.sender_name }),
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
              dangerouslySetInnerHTML: { __html: _e(e.content) }
            }
          ) : /* @__PURE__ */ t("p", { className: "acx-whitespace-pre-wrap", children: e.content })
        }
      ),
      ((r = e.attachments) == null ? void 0 : r.length) > 0 && /* @__PURE__ */ t("div", { className: "acx-mt-1 acx-space-y-1", children: e.attachments.map((n, o) => /* @__PURE__ */ t(
        "a",
        {
          href: n.url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "acx-block acx-text-xs acx-text-primary-600 hover:acx-underline acx-truncate",
          children: n.name
        },
        o
      )) }),
      /* @__PURE__ */ i("div", { className: `acx-flex acx-items-center acx-gap-1 acx-mt-0.5 ${a ? "acx-justify-end" : ""}`, children: [
        /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: P(e.created_at) }),
        a && e.status === "sending" && /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-gray-400", children: "Sending..." }),
        a && e.status === "failed" && /* @__PURE__ */ t("span", { className: "acx-text-[10px] acx-text-red-500", children: "Failed" })
      ] })
    ] })
  ] });
}
function we({ agentName: e }) {
  return /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-gap-2 acx-mb-3", children: [
    /* @__PURE__ */ t(R, { name: e ?? "Agent" }),
    /* @__PURE__ */ t("div", { className: "acx-bg-gray-100 acx-rounded-2xl acx-rounded-bl-md acx-px-4 acx-py-3", children: /* @__PURE__ */ i("div", { className: "acx-flex acx-gap-1", children: [
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ t("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" })
    ] }) })
  ] });
}
function Ce({ messages: e, agentTyping: a }) {
  const c = b(null), r = b(null);
  return v(() => {
    var n;
    (n = c.current) == null || n.scrollIntoView({ behavior: "smooth" });
  }, [e.length, a.is_typing]), /* @__PURE__ */ i(
    "div",
    {
      ref: r,
      className: "acx-flex-1 acx-overflow-y-auto acx-px-4 acx-py-3 acx-space-y-1",
      children: [
        e.map((n, o) => {
          const l = e[o - 1], x = !l || !Ne(l.created_at, n.created_at);
          return /* @__PURE__ */ i("div", { children: [
            x && /* @__PURE__ */ t("div", { className: "acx-flex acx-items-center acx-justify-center acx-py-3", children: /* @__PURE__ */ t("span", { className: "acx-text-xs acx-text-gray-400 acx-bg-gray-50 acx-px-3 acx-py-1 acx-rounded-full", children: be(n.created_at) }) }),
            /* @__PURE__ */ t(Ee, { message: n })
          ] }, n.temp_id ?? n.id);
        }),
        a.is_typing && /* @__PURE__ */ t(we, { agentName: a.agent_name }),
        /* @__PURE__ */ t("div", { ref: c })
      ]
    }
  );
}
function ve({ onSend: e, onTyping: a, onFileUpload: c, mode: r, disabled: n, placeholder: o }) {
  const [l, x] = E(""), g = b(null), u = b(), h = _(() => {
    const s = l.trim();
    !s || n || (e(s), x(""), a == null || a(!1));
  }, [l, n, e, a]), m = (s) => {
    s.key === "Enter" && !s.shiftKey && (s.preventDefault(), h());
  }, y = (s) => {
    const p = s.target.value;
    p.length > M.MAX_MESSAGE_LENGTH || (x(p), a == null || a(!0), u.current && clearTimeout(u.current), u.current = setTimeout(() => a == null ? void 0 : a(!1), 2e3));
  }, S = () => {
    var s;
    (s = g.current) == null || s.click();
  }, d = (s) => {
    s.target.files && s.target.files.length > 0 && (c == null || c(s.target.files), s.target.value = "");
  };
  return /* @__PURE__ */ t("div", { className: "acx-border-t acx-border-gray-200 acx-bg-white acx-px-3 acx-py-2", children: /* @__PURE__ */ i("div", { className: "acx-flex acx-items-end acx-gap-2", children: [
    r === "user" && c && /* @__PURE__ */ i(A, { children: [
      /* @__PURE__ */ t(
        "button",
        {
          onClick: S,
          className: "acx-p-1.5 acx-text-gray-400 hover:acx-text-gray-600 acx-transition-colors acx-flex-shrink-0",
          "aria-label": "Attach file",
          type: "button",
          children: /* @__PURE__ */ t(ie, { className: "acx-w-5 acx-h-5" })
        }
      ),
      /* @__PURE__ */ t(
        "input",
        {
          ref: g,
          type: "file",
          className: "acx-hidden",
          accept: M.ALLOWED_FILE_TYPES.join(","),
          multiple: !0,
          onChange: d
        }
      )
    ] }),
    /* @__PURE__ */ t(
      "textarea",
      {
        value: l,
        onChange: y,
        onKeyDown: m,
        placeholder: o ?? "Type a message...",
        disabled: n,
        rows: 1,
        className: "acx-flex-1 acx-resize-none acx-border-0 acx-outline-none acx-text-sm acx-py-2 acx-max-h-24 acx-bg-transparent placeholder:acx-text-gray-400",
        style: { fieldSizing: "content" }
      }
    ),
    /* @__PURE__ */ t(
      "button",
      {
        onClick: h,
        disabled: !l.trim() || n,
        className: "acx-p-1.5 acx-text-primary-600 hover:acx-text-primary-700 disabled:acx-text-gray-300 acx-transition-colors acx-flex-shrink-0",
        "aria-label": "Send message",
        type: "button",
        children: /* @__PURE__ */ t(ne, { className: "acx-w-5 acx-h-5" })
      }
    )
  ] }) });
}
function G({ isOnline: e, offlineMessage: a, responseTime: c }) {
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
function U({ isConnected: e, retryCount: a }) {
  return e || a === 0 ? null : a >= 5 ? /* @__PURE__ */ t("div", { className: "acx-bg-red-50 acx-border-b acx-border-red-200 acx-px-4 acx-py-2.5", children: /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-justify-between acx-gap-2", children: [
    /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-gap-2", children: [
      /* @__PURE__ */ t("div", { className: "acx-w-2 acx-h-2 acx-rounded-full acx-bg-red-400 acx-flex-shrink-0" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-red-800", children: "Connection lost. Please refresh." })
    ] }),
    /* @__PURE__ */ t(
      "button",
      {
        type: "button",
        onClick: () => window.location.reload(),
        className: "acx-text-xs acx-font-medium acx-text-red-700 acx-bg-red-100 acx-px-2 acx-py-0.5 acx-rounded hover:acx-bg-red-200 acx-flex-shrink-0",
        children: "Refresh"
      }
    )
  ] }) }) : /* @__PURE__ */ t("div", { className: "acx-bg-amber-50 acx-border-b acx-border-amber-200 acx-px-4 acx-py-2.5", children: /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-gap-2", children: [
    /* @__PURE__ */ i("svg", { className: "acx-w-3 acx-h-3 acx-text-amber-500 acx-animate-spin acx-flex-shrink-0", viewBox: "0 0 24 24", fill: "none", children: [
      /* @__PURE__ */ t("circle", { className: "acx-opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
      /* @__PURE__ */ t("path", { className: "acx-opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })
    ] }),
    /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-amber-800", children: "Reconnecting..." })
  ] }) });
}
function ke({ onSubmit: e, loading: a }) {
  const [c, r] = E(""), [n, o] = E("");
  return /* @__PURE__ */ i("form", { onSubmit: (x) => {
    x.preventDefault(), n.trim() && e({ name: c.trim(), email: n.trim() });
  }, className: "acx-p-4 acx-space-y-3", children: [
    /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-600 acx-mb-1", children: "Before we start, could you share your details?" }),
    /* @__PURE__ */ t(
      "input",
      {
        type: "text",
        value: c,
        onChange: (x) => r(x.target.value),
        placeholder: "Your name",
        className: "acx-w-full acx-px-3 acx-py-2 acx-border acx-border-gray-200 acx-rounded-lg acx-text-sm acx-outline-none focus:acx-border-primary-500 focus:acx-ring-1 focus:acx-ring-primary-500"
      }
    ),
    /* @__PURE__ */ t(
      "input",
      {
        type: "email",
        value: n,
        onChange: (x) => o(x.target.value),
        placeholder: "Your email *",
        required: !0,
        className: "acx-w-full acx-px-3 acx-py-2 acx-border acx-border-gray-200 acx-rounded-lg acx-text-sm acx-outline-none focus:acx-border-primary-500 focus:acx-ring-1 focus:acx-ring-primary-500"
      }
    ),
    /* @__PURE__ */ t(
      "button",
      {
        type: "submit",
        disabled: !n.trim() || a,
        className: "acx-w-full acx-bg-primary-600 acx-text-white acx-py-2.5 acx-rounded-lg acx-text-sm acx-font-medium hover:acx-bg-primary-700 disabled:acx-opacity-50 acx-transition-colors",
        children: a ? "Starting..." : "Start conversation"
      }
    )
  ] });
}
function Ae() {
  const { state: e, dispatch: a, config: c } = w(), { session: r, sessionKey: n, accessToken: o, createSession: l } = me(), { sendMessage: x, sendTyping: g, isConnected: u } = fe(n, o), { isOnline: h, offlineMessage: m, responseTime: y } = ge(), [S, d] = E(!1), s = b(null);
  v(() => {
    u && s.current && (x(s.current), s.current = null);
  }, [u, x]);
  const p = _(async (f) => {
    if (!r) {
      if (c.mode === "lead" && !e.visitorEmail) {
        s.current = f, d(!0);
        return;
      }
      try {
        s.current = f, await l();
      } catch {
        s.current = null;
      }
      return;
    }
    x(f);
  }, [r, c.mode, e.visitorEmail, l, x]), C = _(async (f) => {
    a({ type: "SET_VISITOR_INFO", payload: f }), d(!1);
    try {
      await l({ name: f.name, email: f.email });
    } catch {
      s.current = null;
    }
  }, [l, a]);
  return v(() => {
    e.unreadCount > 0 && e.activeTab === "messages" && a({ type: "RESET_UNREAD" });
  }, [e.unreadCount, e.activeTab, a]), S && !r ? /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ t(U, { isConnected: u, retryCount: e.wsRetryCount }),
    /* @__PURE__ */ t(G, { isOnline: h, offlineMessage: m, responseTime: y }),
    /* @__PURE__ */ t(ke, { onSubmit: C, loading: e.loading })
  ] }) : /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ t(U, { isConnected: u, retryCount: e.wsRetryCount }),
    /* @__PURE__ */ t(G, { isOnline: h, offlineMessage: m, responseTime: y }),
    e.messages.length === 0 && !r ? /* @__PURE__ */ t("div", { className: "acx-flex-1 acx-flex acx-flex-col acx-items-center acx-justify-center acx-px-6 acx-text-center", children: h ? /* @__PURE__ */ i(A, { children: [
      /* @__PURE__ */ t("p", { className: "acx-text-lg acx-font-semibold acx-text-gray-800 acx-mb-1", children: c.greeting || "Hi there! How can we help?" }),
      /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-500", children: "Send a message to start a conversation" })
    ] }) : /* @__PURE__ */ i(A, { children: [
      /* @__PURE__ */ t("div", { className: "acx-w-12 acx-h-12 acx-bg-amber-100 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-mb-3", children: /* @__PURE__ */ i("svg", { className: "acx-w-6 acx-h-6 acx-text-amber-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
        /* @__PURE__ */ t("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6l-4 4V6c0-1.1.9-2 2-2z" }),
        /* @__PURE__ */ t("path", { d: "M12 11v1" }),
        /* @__PURE__ */ t("path", { d: "M12 8h.01" })
      ] }) }),
      /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-600 acx-font-medium", children: "Leave us a message" }),
      /* @__PURE__ */ i("p", { className: "acx-text-xs acx-text-gray-400 acx-mt-1", children: [
        "Our team is currently away. Leave a message and we'll get back to you",
        y ? ` ${y}` : " as soon as possible",
        "."
      ] })
    ] }) }) : /* @__PURE__ */ t(Ce, { messages: e.messages, agentTyping: e.agentTyping }),
    /* @__PURE__ */ t(
      ve,
      {
        onSend: p,
        onTyping: g,
        mode: c.mode,
        disabled: e.loading,
        placeholder: h ? "Type a message..." : "Leave a message..."
      }
    )
  ] });
}
function Ie({ article: e, onClick: a }) {
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
function Oe() {
  var d;
  const { state: e, dispatch: a, config: c } = w(), r = e.kbTopics, [n, o] = E(null), [l, x] = E([]), [g, u] = E(!1), h = b();
  h.current || (h.current = new I({ baseUrl: c.apiUrl, token: c.token })), v(() => {
    var s;
    ((s = e.kbTopics) == null ? void 0 : s.length) > 0 || h.current.getKBTopics().then((p) => a({ type: "SET_KB_TOPICS", payload: Array.isArray(p) ? p : [] })).catch(() => {
    });
  }, [(d = e.kbTopics) == null ? void 0 : d.length, a]);
  const m = _(async (s) => {
    o(s), u(!0);
    try {
      const p = await h.current.getKBTopicArticles(s.slug);
      x(p);
    } catch {
      x([]);
    } finally {
      u(!1);
    }
  }, []), y = _((s) => {
    s.url && window.open(s.url, "_blank", "noopener,noreferrer");
  }, []), S = _(() => {
    o(null), x([]);
  }, []);
  return n ? /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ i("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ i(
        "button",
        {
          onClick: S,
          className: "acx-flex acx-items-center acx-gap-1 acx-text-sm acx-text-primary-600 acx-mb-2 hover:acx-text-primary-700",
          children: [
            /* @__PURE__ */ t(oe, { className: "acx-w-4 acx-h-4" }),
            "Back"
          ]
        }
      ),
      /* @__PURE__ */ t("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: n.name }),
      /* @__PURE__ */ i("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: [
        n.article_count,
        " article",
        n.article_count !== 1 ? "s" : ""
      ] })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-1", children: g ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "Loading..." }) : l.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "No articles found" }) : l.map((s) => /* @__PURE__ */ t(Ie, { article: s, onClick: y }, s.id)) })
  ] }) : /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ i("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ t("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: "Help Centre" }),
      /* @__PURE__ */ t("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: "Browse help topics" })
    ] }),
    /* @__PURE__ */ t("div", { className: "acx-p-4 acx-space-y-1", children: r.length === 0 ? /* @__PURE__ */ t("div", { className: "acx-py-8 acx-text-center", children: /* @__PURE__ */ t("p", { className: "acx-text-sm acx-text-gray-400", children: "No help topics available" }) }) : r.map((s) => /* @__PURE__ */ i(
      "button",
      {
        onClick: () => m(s),
        className: "acx-w-full acx-flex acx-items-center acx-justify-between acx-p-3 acx-rounded-lg acx-text-left hover:acx-bg-gray-50 acx-transition-colors",
        children: [
          /* @__PURE__ */ i("div", { children: [
            /* @__PURE__ */ t("h4", { className: "acx-text-sm acx-font-medium acx-text-gray-900", children: s.name }),
            /* @__PURE__ */ i("p", { className: "acx-text-xs acx-text-gray-500", children: [
              s.article_count,
              " article",
              s.article_count !== 1 ? "s" : ""
            ] })
          ] }),
          /* @__PURE__ */ t(j, { className: "acx-w-4 acx-h-4 acx-text-gray-400" })
        ]
      },
      s.id
    )) })
  ] });
}
function Be(e) {
  return /* @__PURE__ */ t(ee, { ...e, children: /* @__PURE__ */ t(Re, { position: e.position ?? Q.POSITION }) });
}
function Re({ position: e }) {
  const { state: a, dispatch: c } = w(), [r, n] = E(!1);
  return /* @__PURE__ */ i("div", { className: "acrux-chat-widget", children: [
    r && /* @__PURE__ */ i(
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
                onClick: () => n(!1),
                className: "acx-p-1 acx-rounded-md acx-bg-white acx-transition-colors hover:acx-bg-gray-100",
                "aria-label": "Close chat",
                children: /* @__PURE__ */ t("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", stroke: "#006383", strokeWidth: "2", strokeLinecap: "round", children: /* @__PURE__ */ t("path", { d: "M15 5L5 15M5 5l10 10" }) })
              }
            )
          ] }),
          /* @__PURE__ */ i("div", { className: "acx-flex-1 acx-overflow-hidden", children: [
            a.activeTab === "messages" && /* @__PURE__ */ t(Ae, {}),
            a.activeTab === "help" && /* @__PURE__ */ t(Oe, {})
          ] }),
          /* @__PURE__ */ t(
            ue,
            {
              activeTab: a.activeTab,
              onTabChange: (l) => c({ type: "SET_TAB", payload: l })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ t(
      le,
      {
        isOpen: r,
        onClick: () => n(!r),
        position: e
      }
    )
  ] });
}
export {
  Be as ChatWidget
};
//# sourceMappingURL=acrux-chat.es.js.map
