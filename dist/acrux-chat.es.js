var Y = Object.defineProperty;
var F = (e, t, c) => t in e ? Y(e, t, { enumerable: !0, configurable: !0, writable: !0, value: c }) : e[t] = c;
var _ = (e, t, c) => F(e, typeof t != "symbol" ? t + "" : t, c);
import { jsxs as i, jsx as a, Fragment as I } from "react/jsx-runtime";
import { createContext as q, useReducer as z, useMemo as J, useRef as S, useEffect as w, useContext as Q, useState as v, useCallback as N } from "react";
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
}, X = (e) => `/ws/chat/${e}/`, Z = {
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
function ee(e, t) {
  switch (t.type) {
    case "SET_SESSION":
      return { ...e, session: t.payload };
    case "SET_MESSAGES": {
      const c = e.messages.filter(
        (o) => o.temp_id && o.status !== "sent"
      ), r = new Set(t.payload.map((o) => o.id)), n = c.filter((o) => !r.has(o.id));
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
class A {
  constructor(t) {
    _(this, "baseUrl");
    _(this, "token");
    _(this, "chatToken");
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
      const o = await n.text().catch(() => "");
      throw new te(n.status, n.statusText, o);
    }
    if (n.status !== 204)
      return n.json();
  }
  async createSession(t) {
    return this.request(E.SESSIONS, {
      method: "POST",
      body: JSON.stringify(t)
    });
  }
  async getSession(t) {
    return this.request(E.SESSION(t));
  }
  async sendMessage(t, c) {
    return this.request(E.SESSION_MESSAGES(t), {
      method: "POST",
      body: JSON.stringify(c)
    });
  }
  async updateVisitor(t, c) {
    return this.request(E.SESSION_VISITOR(t), {
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
  async searchKB(t) {
    const c = new URLSearchParams({ q: t });
    return this.request(`${E.KB_SEARCH}?${c}`);
  }
  async getKBTopics() {
    return this.request(E.KB_TOPICS);
  }
  async getKBTopicArticles(t) {
    return this.request(E.KB_TOPIC_ARTICLES(t));
  }
  async getOperatingHoursStatus() {
    return this.request(E.OPERATING_HOURS);
  }
}
class te extends Error {
  constructor(t, c, r) {
    super(`API Error ${t}: ${c}`), this.status = t, this.statusText = c, this.body = r, this.name = "ApiError";
  }
}
function O(e) {
  return Array.isArray(e) ? e : e && typeof e == "object" && "results" in e ? e.results : [];
}
const H = q(null);
function ae({ children: e, ...t }) {
  const [c, r] = z(ee, {
    ...L,
    activeTab: t.defaultTab ?? L.activeTab,
    visitorName: t.userName ?? "",
    visitorEmail: t.userEmail ?? ""
  }), n = J(
    () => ({ state: c, dispatch: r, config: t }),
    [c, t]
  );
  return /* @__PURE__ */ i(H.Provider, { value: n, children: [
    /* @__PURE__ */ a(ce, {}),
    e
  ] });
}
function ce() {
  const { dispatch: e, config: t } = C(), c = S(!1);
  return w(() => {
    if (c.current) return;
    c.current = !0;
    const r = new A({ baseUrl: t.apiUrl, token: t.token });
    r.getAnnouncements().then((n) => e({ type: "SET_ANNOUNCEMENTS", payload: O(n) })).catch(() => {
    }), r.getRoadmapItems().then((n) => e({ type: "SET_ROADMAP_ITEMS", payload: O(n) })).catch(() => {
    }), r.getKBTopics().then((n) => e({ type: "SET_KB_TOPICS", payload: O(n) })).catch(() => {
    }), r.getOperatingHoursStatus().then((n) => e({ type: "SET_OPERATING_HOURS", payload: n })).catch(() => {
    });
  }, [t.apiUrl, t.token, e]), null;
}
function C() {
  const e = Q(H);
  if (!e)
    throw new Error("useChatContext must be used within a ChatProvider");
  return e;
}
function $({ count: e }) {
  if (e <= 0) return null;
  const t = e > 99 ? "99+" : String(e);
  return /* @__PURE__ */ a("span", { className: "acx-absolute -acx-top-1.5 -acx-right-1.5 acx-min-w-[18px] acx-h-[18px] acx-flex acx-items-center acx-justify-center acx-bg-red-500 acx-text-white acx-text-[10px] acx-font-bold acx-rounded-full acx-px-1 acx-leading-none", children: t });
}
function re({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ a("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) });
}
function ne({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "currentColor", stroke: "none", children: /* @__PURE__ */ a("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) });
}
function se({ className: e }) {
  return /* @__PURE__ */ i("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ a("circle", { cx: "12", cy: "12", r: "10" }),
    /* @__PURE__ */ a("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
    /* @__PURE__ */ a("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
  ] });
}
function ie({ className: e }) {
  return /* @__PURE__ */ i("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ a("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
    /* @__PURE__ */ a("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
  ] });
}
function oe({ className: e }) {
  return /* @__PURE__ */ i("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ a("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    /* @__PURE__ */ a("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ] });
}
function le({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ a("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" }) });
}
function j({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ a("polyline", { points: "9 18 15 12 9 6" }) });
}
function xe({ className: e }) {
  return /* @__PURE__ */ a("svg", { className: e, width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ a("polyline", { points: "15 18 9 12 15 6" }) });
}
function ue({ isOpen: e, onClick: t, position: c }) {
  const { state: r } = C();
  return /* @__PURE__ */ a("div", { className: `acx-fixed acx-bottom-4 sm:acx-bottom-6 ${c === "bottom-right" ? "acx-right-4 sm:acx-right-6" : "acx-left-4 sm:acx-left-6"} acx-z-[9999]`, children: /* @__PURE__ */ a(
    "button",
    {
      onClick: t,
      className: "acx-launcher-btn acx-relative acx-w-14 acx-h-14 acx-rounded-full acx-shadow-lg acx-transition-all hover:acx-scale-105 acx-flex acx-items-center acx-justify-center",
      "aria-label": e ? "Close chat" : "Open chat",
      children: e ? /* @__PURE__ */ a("span", { className: "acx-launcher-icon-stroke", children: /* @__PURE__ */ a(oe, { className: "acx-w-6 acx-h-6" }) }) : /* @__PURE__ */ i(I, { children: [
        /* @__PURE__ */ a(ne, { className: "acx-w-7 acx-h-7" }),
        r.unreadCount > 0 && /* @__PURE__ */ a($, { count: r.unreadCount })
      ] })
    }
  ) });
}
const de = [
  { id: "messages", label: "Messages", Icon: re },
  { id: "help", label: "Help", Icon: se }
];
function he({ activeTab: e, onTabChange: t }) {
  const { state: c } = C();
  return /* @__PURE__ */ a("nav", { className: "acx-flex acx-border-t acx-border-gray-200 acx-bg-white", role: "tablist", children: de.map(({ id: r, label: n, Icon: o }) => /* @__PURE__ */ i(
    "button",
    {
      role: "tab",
      "aria-selected": e === r,
      onClick: () => t(r),
      className: `acx-flex-1 acx-flex acx-flex-col acx-items-center acx-py-2 acx-gap-0.5 acx-relative acx-transition-colors ${e === r ? "acx-text-primary-600" : "acx-text-gray-400 hover:acx-text-primary-600"}`,
      children: [
        /* @__PURE__ */ i("div", { className: "acx-relative", children: [
          /* @__PURE__ */ a(o, { className: "acx-w-5 acx-h-5" }),
          r === "messages" && c.unreadCount > 0 && /* @__PURE__ */ a($, { count: c.unreadCount })
        ] }),
        /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-font-medium", children: n })
      ]
    },
    r
  )) });
}
const pe = "acrux_chat_";
function D(e, t) {
  const c = `${pe}${e}`, [r, n] = v(() => {
    try {
      const l = window.localStorage.getItem(c);
      return l ? JSON.parse(l) : t;
    } catch {
      return t;
    }
  }), o = N(
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
    const t = Math.random() * 16 | 0;
    return (e === "x" ? t : t & 3 | 8).toString(16);
  });
}
function me() {
  const e = new URLSearchParams(window.location.search);
  return {
    page_url: window.location.href,
    referrer: document.referrer,
    utm_source: e.get("utm_source") ?? void 0,
    utm_medium: e.get("utm_medium") ?? void 0,
    utm_campaign: e.get("utm_campaign") ?? void 0
  };
}
function fe() {
  var g;
  const { state: e, dispatch: t, config: c } = C(), [r, n] = D("session_key", null), [o, l] = D("chat_access_token", null), x = S(), f = S(null);
  x.current || (x.current = new A({ baseUrl: c.apiUrl, token: c.token }), o && x.current.setChatToken(o));
  const h = x.current, p = N(async () => {
    var u;
    const y = W(), s = c.mode === "lead" ? me() : void 0;
    try {
      t({ type: "SET_LOADING", payload: !0 });
      const m = await h.createSession({
        source: c.mode === "lead" ? "lead_bot" : "user_bot",
        session_key: y,
        visitor_name: c.userName,
        visitor_email: c.userEmail,
        visitor_metadata: s
      });
      return m.access_token && (h.setChatToken(m.access_token), l(m.access_token)), f.current = m.session_key, t({ type: "SET_SESSION", payload: m }), n(m.session_key), (u = c.onSessionCreated) == null || u.call(c, m.session_key), t({ type: "SET_LOADING", payload: !1 }), m;
    } catch (m) {
      throw t({ type: "SET_ERROR", payload: "Failed to create chat session" }), t({ type: "SET_LOADING", payload: !1 }), m;
    }
  }, [h, c, t, n, l]), d = N(async (y) => {
    try {
      t({ type: "SET_LOADING", payload: !0 });
      const s = await h.getSession(y);
      if (f.current && f.current !== y)
        return t({ type: "SET_LOADING", payload: !1 }), null;
      const { messages: u, ...m } = s;
      return f.current = m.session_key, t({ type: "SET_SESSION", payload: m }), t({ type: "SET_MESSAGES", payload: u }), t({ type: "SET_LOADING", payload: !1 }), m;
    } catch {
      return n(null), l(null), h.setChatToken(""), t({ type: "SET_LOADING", payload: !1 }), null;
    }
  }, [h, t, n, l]), b = N(async (y, s) => {
    if (e.session) {
      t({ type: "SET_VISITOR_INFO", payload: { name: y, email: s } });
      try {
        await h.updateVisitor(e.session.session_key, {
          visitor_name: y,
          visitor_email: s
        });
      } catch {
      }
    }
  }, [h, e.session, t]);
  return w(() => {
    r && !e.session && d(r);
  }, []), {
    session: e.session,
    sessionKey: ((g = e.session) == null ? void 0 : g.session_key) ?? r,
    accessToken: h.getChatToken() ?? o,
    createSession: p,
    restoreSession: d,
    updateVisitorInfo: b,
    api: h
  };
}
class ge {
  constructor(t) {
    _(this, "ws", null);
    _(this, "url");
    _(this, "onMessage");
    _(this, "onStatusChange");
    _(this, "retryCount", 0);
    _(this, "reconnectTimer", null);
    _(this, "heartbeatTimer", null);
    _(this, "messageQueue", []);
    _(this, "intentionallyClosed", !1);
    this.url = t.url, this.onMessage = t.onMessage, this.onStatusChange = t.onStatusChange;
  }
  connect() {
    var t;
    if (((t = this.ws) == null ? void 0 : t.readyState) !== WebSocket.OPEN) {
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
      k.WS_RECONNECT_BASE * Math.pow(2, this.retryCount),
      k.WS_RECONNECT_MAX
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null, this.retryCount++, this.connect();
    }, t);
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
function ye(e, t) {
  const { state: c, dispatch: r, config: n } = C(), o = S(null), l = S(/* @__PURE__ */ new Map()), x = S(null);
  w(() => {
    if (!e) return;
    const p = n.apiUrl.startsWith("https") ? "wss" : "ws", d = n.apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    let b = `${p}://${d}${X(e)}`;
    t && (b += `?token=${encodeURIComponent(t)}`);
    const g = new ge({
      url: b,
      onStatusChange: (s, u) => {
        r({ type: "SET_CONNECTED", payload: s }), r({ type: "SET_WS_RETRY_COUNT", payload: u });
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
              const u = l.current.get(s.temp_id);
              u && (clearTimeout(u), l.current.delete(s.temp_id));
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
    g.connect(), o.current = g;
    const y = l.current;
    return () => {
      g.disconnect(), o.current = null, y.forEach((s) => clearTimeout(s)), y.clear(), x.current && (clearTimeout(x.current), x.current = null);
    };
  }, [e, t, n.apiUrl]);
  const f = N((p) => {
    if (!o.current) return;
    const d = W(), b = {
      id: d,
      session: 0,
      sender_type: n.mode === "lead" ? "visitor" : "user",
      sender_name: c.visitorName || "You",
      content: p,
      content_type: "text",
      attachments: [],
      is_read: !0,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      temp_id: d,
      status: "sending"
    };
    r({ type: "ADD_MESSAGE", payload: b }), o.current.send({
      type: "message",
      text: p,
      temp_id: d
    });
    const g = setTimeout(() => {
      r({ type: "FAIL_MESSAGE", payload: { temp_id: d } }), l.current.delete(d);
    }, k.MESSAGE_ACK_TIMEOUT);
    l.current.set(d, g);
  }, [n.mode, c.visitorName, r]), h = N((p) => {
    var d;
    (d = o.current) == null || d.send({ type: "typing", is_typing: p });
  }, []);
  return {
    isConnected: c.isConnected,
    sendMessage: f,
    sendTyping: h
  };
}
function Se() {
  var o, l, x;
  const { state: e, dispatch: t, config: c } = C(), r = S(), n = S(!1);
  return r.current || (r.current = new A({ baseUrl: c.apiUrl, token: c.token })), w(() => {
    n.current || (n.current = !0, r.current.getOperatingHoursStatus().then((f) => {
      t({ type: "SET_OPERATING_HOURS", payload: f });
    }).catch(() => {
    }));
  }, [t]), {
    isOnline: ((o = e.operatingHours) == null ? void 0 : o.is_online) ?? !0,
    offlineMessage: (l = e.operatingHours) == null ? void 0 : l.offline_message,
    responseTime: (x = e.operatingHours) == null ? void 0 : x.response_time
  };
}
function be(e) {
  return e.split(" ").slice(0, 2).map((t) => t[0] ?? "").join("").toUpperCase();
}
const B = [
  "acx-bg-blue-500",
  "acx-bg-green-500",
  "acx-bg-purple-500",
  "acx-bg-orange-500",
  "acx-bg-pink-500",
  "acx-bg-teal-500"
];
function _e(e) {
  let t = 0;
  for (let c = 0; c < e.length; c++)
    t = e.charCodeAt(c) + ((t << 5) - t);
  return B[Math.abs(t) % B.length];
}
function R({ name: e, avatarUrl: t }) {
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
      className: `acx-w-8 acx-h-8 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-text-white acx-text-xs acx-font-semibold acx-flex-shrink-0 ${_e(e)}`,
      children: be(e)
    }
  );
}
function P(e) {
  const t = new Date(e), r = (/* @__PURE__ */ new Date()).getTime() - t.getTime(), n = Math.floor(r / 1e3), o = Math.floor(n / 60), l = Math.floor(o / 60), x = Math.floor(l / 24);
  return n < 60 ? "Just now" : o < 60 ? `${o}m ago` : l < 24 ? `${l}h ago` : x < 7 ? `${x}d ago` : t.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric"
  });
}
function Ne(e) {
  const t = new Date(e), c = /* @__PURE__ */ new Date(), r = new Date(c.getFullYear(), c.getMonth(), c.getDate()), n = new Date(t.getFullYear(), t.getMonth(), t.getDate()), o = Math.floor((r.getTime() - n.getTime()) / (1e3 * 60 * 60 * 24));
  return o === 0 ? "Today" : o === 1 ? "Yesterday" : t.toLocaleDateString(void 0, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}
function Te(e, t) {
  const c = new Date(e), r = new Date(t);
  return c.getFullYear() === r.getFullYear() && c.getMonth() === r.getMonth() && c.getDate() === r.getDate();
}
function Ee(e) {
  let t = we(e);
  return t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"), t = t.replace(/__(.+?)__/g, "<strong>$1</strong>"), t = t.replace(/\*(.+?)\*/g, "<em>$1</em>"), t = t.replace(new RegExp("(?<!\\w)_(.+?)_(?!\\w)", "g"), "<em>$1</em>"), t = t.replace(/`(.+?)`/g, "<code>$1</code>"), t = t.replace(
    /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  ), t = t.replace(/\n/g, "<br />"), t;
}
function we(e) {
  const t = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return e.replace(/[&<>"']/g, (c) => t[c] ?? c);
}
function ve({ message: e }) {
  var r;
  const t = e.sender_type === "visitor" || e.sender_type === "user", c = e.sender_type === "system";
  return c && e.content_type === "auto_response" ? /* @__PURE__ */ i("div", { className: "acx-flex acx-gap-2 acx-mb-3 acx-justify-start", children: [
    /* @__PURE__ */ a(R, { name: e.sender_name }),
    /* @__PURE__ */ i("div", { className: "acx-max-w-[75%]", children: [
      e.sender_name && /* @__PURE__ */ a("span", { className: "acx-text-xs acx-text-gray-500 acx-ml-1 acx-mb-0.5 acx-block", children: e.sender_name }),
      /* @__PURE__ */ a("div", { className: "acx-px-3.5 acx-py-2.5 acx-rounded-2xl acx-text-sm acx-leading-relaxed acx-bg-amber-50 acx-text-gray-800 acx-rounded-bl-md acx-border acx-border-amber-200", children: /* @__PURE__ */ a("p", { className: "acx-whitespace-pre-wrap", children: e.content }) }),
      /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-text-gray-400 acx-mt-0.5 acx-block", children: P(e.created_at) })
    ] })
  ] }) : c ? /* @__PURE__ */ a("div", { className: "acx-flex acx-justify-center acx-py-2", children: /* @__PURE__ */ a("span", { className: "acx-text-xs acx-text-gray-400 acx-italic", children: e.content }) }) : /* @__PURE__ */ i("div", { className: `acx-flex acx-gap-2 acx-mb-3 ${t ? "acx-justify-end" : "acx-justify-start"}`, children: [
    !t && /* @__PURE__ */ a(R, { name: e.sender_name }),
    /* @__PURE__ */ i("div", { className: `acx-max-w-[75%] ${t ? "acx-order-1" : ""}`, children: [
      !t && e.sender_name && /* @__PURE__ */ a("span", { className: "acx-text-xs acx-text-gray-500 acx-ml-1 acx-mb-0.5 acx-block", children: e.sender_name }),
      /* @__PURE__ */ a(
        "div",
        {
          className: `acx-px-3.5 acx-py-2.5 acx-rounded-2xl acx-text-sm acx-leading-relaxed ${t ? "acx-bg-primary-600 acx-text-white acx-rounded-br-md" : (e.sender_type === "bot", "acx-bg-gray-100 acx-text-gray-800 acx-rounded-bl-md")}`,
          children: e.content_type === "markdown" ? /* @__PURE__ */ a(
            "div",
            {
              className: "acx-prose acx-prose-sm",
              dangerouslySetInnerHTML: { __html: Ee(e.content) }
            }
          ) : /* @__PURE__ */ a("p", { className: "acx-whitespace-pre-wrap", children: e.content })
        }
      ),
      ((r = e.attachments) == null ? void 0 : r.length) > 0 && /* @__PURE__ */ a("div", { className: "acx-mt-1 acx-space-y-1", children: e.attachments.map((n, o) => /* @__PURE__ */ a(
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
      /* @__PURE__ */ i("div", { className: `acx-flex acx-items-center acx-gap-1 acx-mt-0.5 ${t ? "acx-justify-end" : ""}`, children: [
        /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-text-gray-400", children: P(e.created_at) }),
        t && e.status === "sending" && /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-text-gray-400", children: "Sending..." }),
        t && e.status === "failed" && /* @__PURE__ */ a("span", { className: "acx-text-[10px] acx-text-red-500", children: "Failed" })
      ] })
    ] })
  ] });
}
function Ce({ agentName: e }) {
  return /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-gap-2 acx-mb-3", children: [
    /* @__PURE__ */ a(R, { name: e ?? "Agent" }),
    /* @__PURE__ */ a("div", { className: "acx-bg-gray-100 acx-rounded-2xl acx-rounded-bl-md acx-px-4 acx-py-3", children: /* @__PURE__ */ i("div", { className: "acx-flex acx-gap-1", children: [
      /* @__PURE__ */ a("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ a("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" }),
      /* @__PURE__ */ a("span", { className: "acx-w-1.5 acx-h-1.5 acx-bg-gray-400 acx-rounded-full acx-typing-dot" })
    ] }) })
  ] });
}
function ke({ messages: e, agentTyping: t }) {
  const c = S(null), r = S(null);
  return w(() => {
    var n;
    (n = c.current) == null || n.scrollIntoView({ behavior: "smooth" });
  }, [e.length, t.is_typing]), /* @__PURE__ */ i(
    "div",
    {
      ref: r,
      className: "acx-flex-1 acx-overflow-y-auto acx-px-4 acx-py-3 acx-space-y-1",
      children: [
        e.map((n, o) => {
          const l = e[o - 1], x = !l || !Te(l.created_at, n.created_at);
          return /* @__PURE__ */ i("div", { children: [
            x && /* @__PURE__ */ a("div", { className: "acx-flex acx-items-center acx-justify-center acx-py-3", children: /* @__PURE__ */ a("span", { className: "acx-text-xs acx-text-gray-400 acx-bg-gray-50 acx-px-3 acx-py-1 acx-rounded-full", children: Ne(n.created_at) }) }),
            /* @__PURE__ */ a(ve, { message: n })
          ] }, n.temp_id ?? n.id);
        }),
        t.is_typing && /* @__PURE__ */ a(Ce, { agentName: t.agent_name }),
        /* @__PURE__ */ a("div", { ref: c })
      ]
    }
  );
}
function Ie({ onSend: e, onTyping: t, onFileUpload: c, mode: r, disabled: n, placeholder: o }) {
  const [l, x] = v(""), f = S(null), h = S(), p = N(() => {
    const s = l.trim();
    !s || n || (e(s), x(""), t == null || t(!1));
  }, [l, n, e, t]), d = (s) => {
    s.key === "Enter" && !s.shiftKey && (s.preventDefault(), p());
  }, b = (s) => {
    const u = s.target.value;
    u.length > M.MAX_MESSAGE_LENGTH || (x(u), t == null || t(!0), h.current && clearTimeout(h.current), h.current = setTimeout(() => t == null ? void 0 : t(!1), 2e3));
  }, g = () => {
    var s;
    (s = f.current) == null || s.click();
  }, y = (s) => {
    s.target.files && s.target.files.length > 0 && (c == null || c(s.target.files), s.target.value = "");
  };
  return /* @__PURE__ */ a("div", { className: "acx-border-t acx-border-gray-200 acx-bg-white acx-px-3 acx-py-2", children: /* @__PURE__ */ i("div", { className: "acx-flex acx-items-end acx-gap-2", children: [
    r === "user" && c && /* @__PURE__ */ i(I, { children: [
      /* @__PURE__ */ a(
        "button",
        {
          onClick: g,
          className: "acx-p-1.5 acx-text-gray-400 hover:acx-text-gray-600 acx-transition-colors acx-flex-shrink-0",
          "aria-label": "Attach file",
          type: "button",
          children: /* @__PURE__ */ a(le, { className: "acx-w-5 acx-h-5" })
        }
      ),
      /* @__PURE__ */ a(
        "input",
        {
          ref: f,
          type: "file",
          className: "acx-hidden",
          accept: M.ALLOWED_FILE_TYPES.join(","),
          multiple: !0,
          onChange: y
        }
      )
    ] }),
    /* @__PURE__ */ a(
      "textarea",
      {
        value: l,
        onChange: b,
        onKeyDown: d,
        placeholder: o ?? "Type a message...",
        disabled: n,
        rows: 1,
        className: "acx-flex-1 acx-resize-none acx-border-0 acx-outline-none acx-text-sm acx-py-2 acx-max-h-24 acx-bg-transparent placeholder:acx-text-gray-400",
        style: { fieldSizing: "content" }
      }
    ),
    /* @__PURE__ */ a(
      "button",
      {
        onClick: p,
        disabled: !l.trim() || n,
        className: "acx-p-1.5 acx-text-primary-600 hover:acx-text-primary-700 disabled:acx-text-gray-300 acx-transition-colors acx-flex-shrink-0",
        "aria-label": "Send message",
        type: "button",
        children: /* @__PURE__ */ a(ie, { className: "acx-w-5 acx-h-5" })
      }
    )
  ] }) });
}
function G({ isOnline: e, offlineMessage: t, responseTime: c }) {
  return e ? null : /* @__PURE__ */ a("div", { className: "acx-bg-amber-50 acx-border-b acx-border-amber-200 acx-px-4 acx-py-2.5", children: /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-gap-2", children: [
    /* @__PURE__ */ a("div", { className: "acx-w-2 acx-h-2 acx-rounded-full acx-bg-amber-400 acx-flex-shrink-0" }),
    /* @__PURE__ */ i("p", { className: "acx-text-xs acx-text-amber-800", children: [
      t ?? "We're currently offline.",
      c && /* @__PURE__ */ i("span", { className: "acx-font-medium", children: [
        " We typically respond ",
        c,
        "."
      ] })
    ] })
  ] }) });
}
function U({ isConnected: e, retryCount: t }) {
  return e || t === 0 ? null : t >= 5 ? /* @__PURE__ */ a("div", { className: "acx-bg-red-50 acx-border-b acx-border-red-200 acx-px-4 acx-py-2.5", children: /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-justify-between acx-gap-2", children: [
    /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-gap-2", children: [
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
  ] }) }) : /* @__PURE__ */ a("div", { className: "acx-bg-amber-50 acx-border-b acx-border-amber-200 acx-px-4 acx-py-2.5", children: /* @__PURE__ */ i("div", { className: "acx-flex acx-items-center acx-gap-2", children: [
    /* @__PURE__ */ i("svg", { className: "acx-w-3 acx-h-3 acx-text-amber-500 acx-animate-spin acx-flex-shrink-0", viewBox: "0 0 24 24", fill: "none", children: [
      /* @__PURE__ */ a("circle", { className: "acx-opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
      /* @__PURE__ */ a("path", { className: "acx-opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })
    ] }),
    /* @__PURE__ */ a("p", { className: "acx-text-xs acx-text-amber-800", children: "Reconnecting..." })
  ] }) });
}
function Ae({ onSubmit: e, loading: t }) {
  const [c, r] = v(""), [n, o] = v("");
  return /* @__PURE__ */ i("form", { onSubmit: (x) => {
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
        onChange: (x) => o(x.target.value),
        placeholder: "Your email *",
        required: !0,
        className: "acx-w-full acx-px-3 acx-py-2 acx-border acx-border-gray-200 acx-rounded-lg acx-text-sm acx-outline-none focus:acx-border-primary-500 focus:acx-ring-1 focus:acx-ring-primary-500"
      }
    ),
    /* @__PURE__ */ a(
      "button",
      {
        type: "submit",
        disabled: !n.trim() || t,
        className: "acx-w-full acx-bg-primary-600 acx-text-white acx-py-2.5 acx-rounded-lg acx-text-sm acx-font-medium hover:acx-bg-primary-700 disabled:acx-opacity-50 acx-transition-colors",
        children: t ? "Starting..." : "Start conversation"
      }
    )
  ] });
}
function Oe() {
  const { state: e, dispatch: t, config: c } = C(), { session: r, sessionKey: n, accessToken: o, createSession: l, updateVisitorInfo: x } = fe(), { sendMessage: f, sendTyping: h, isConnected: p } = ye(n, o), { isOnline: d, offlineMessage: b, responseTime: g } = Se(), [y, s] = v(!1), u = S(null), m = N(() => p && u.current ? (f(u.current), u.current = null, !0) : !1, [p, f]);
  w(() => {
    m();
  }, [m]), w(() => {
    if (!u.current) return;
    const T = setInterval(() => {
      m() && clearInterval(T);
    }, 300);
    return () => clearInterval(T);
  }, [m]);
  const K = N(async (T) => {
    if (!r) {
      if (c.mode === "lead" && !e.visitorEmail) {
        u.current = T, s(!0);
        return;
      }
      try {
        u.current = T, await l();
      } catch {
        u.current = null;
      }
      return;
    }
    f(T);
  }, [r, c.mode, e.visitorEmail, l, f]), V = N(async (T) => {
    t({ type: "SET_VISITOR_INFO", payload: T }), s(!1);
    try {
      await l() && await x(T.name, T.email);
    } catch {
      u.current = null;
    }
  }, [l, x, t]);
  return w(() => {
    e.unreadCount > 0 && e.activeTab === "messages" && t({ type: "RESET_UNREAD" });
  }, [e.unreadCount, e.activeTab, t]), y && !r ? /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ a(U, { isConnected: p, retryCount: e.wsRetryCount }),
    /* @__PURE__ */ a(G, { isOnline: d, offlineMessage: b, responseTime: g }),
    /* @__PURE__ */ a(Ae, { onSubmit: V, loading: e.loading })
  ] }) : /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full", children: [
    /* @__PURE__ */ a(U, { isConnected: p, retryCount: e.wsRetryCount }),
    /* @__PURE__ */ a(G, { isOnline: d, offlineMessage: b, responseTime: g }),
    e.messages.length === 0 && !r ? /* @__PURE__ */ a("div", { className: "acx-flex-1 acx-flex acx-flex-col acx-items-center acx-justify-center acx-px-6 acx-text-center", children: d ? /* @__PURE__ */ i(I, { children: [
      /* @__PURE__ */ a("p", { className: "acx-text-lg acx-font-semibold acx-text-gray-800 acx-mb-1", children: c.greeting || "Hi there! How can we help?" }),
      /* @__PURE__ */ a("p", { className: "acx-text-sm acx-text-gray-500", children: "Send a message to start a conversation" })
    ] }) : /* @__PURE__ */ i(I, { children: [
      /* @__PURE__ */ a("div", { className: "acx-w-12 acx-h-12 acx-bg-amber-100 acx-rounded-full acx-flex acx-items-center acx-justify-center acx-mb-3", children: /* @__PURE__ */ i("svg", { className: "acx-w-6 acx-h-6 acx-text-amber-600", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
        /* @__PURE__ */ a("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6l-4 4V6c0-1.1.9-2 2-2z" }),
        /* @__PURE__ */ a("path", { d: "M12 11v1" }),
        /* @__PURE__ */ a("path", { d: "M12 8h.01" })
      ] }) }),
      /* @__PURE__ */ a("p", { className: "acx-text-sm acx-text-gray-600 acx-font-medium", children: "Leave us a message" }),
      /* @__PURE__ */ i("p", { className: "acx-text-xs acx-text-gray-400 acx-mt-1", children: [
        "Our team is currently away. Leave a message and we'll get back to you",
        g ? ` ${g}` : " as soon as possible",
        "."
      ] })
    ] }) }) : /* @__PURE__ */ a(ke, { messages: e.messages, agentTyping: e.agentTyping }),
    /* @__PURE__ */ a(
      Ie,
      {
        onSend: K,
        onTyping: h,
        mode: c.mode,
        disabled: e.loading,
        placeholder: d ? "Type a message..." : "Leave a message..."
      }
    )
  ] });
}
function Re({ article: e, onClick: t }) {
  return /* @__PURE__ */ i(
    "button",
    {
      onClick: () => t(e),
      className: "acx-w-full acx-flex acx-items-center acx-justify-between acx-p-3 acx-rounded-lg acx-text-left hover:acx-bg-gray-50 acx-transition-colors acx-group",
      children: [
        /* @__PURE__ */ i("div", { className: "acx-flex-1 acx-min-w-0", children: [
          /* @__PURE__ */ a("h4", { className: "acx-text-sm acx-font-medium acx-text-gray-900 acx-truncate group-hover:acx-text-primary-600 acx-transition-colors", children: e.title }),
          e.summary && /* @__PURE__ */ a("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5 acx-line-clamp-2", children: e.summary })
        ] }),
        /* @__PURE__ */ a(j, { className: "acx-w-4 acx-h-4 acx-text-gray-400 acx-flex-shrink-0 acx-ml-2" })
      ]
    }
  );
}
function Me() {
  var y;
  const { state: e, dispatch: t, config: c } = C(), r = e.kbTopics, [n, o] = v(null), [l, x] = v([]), [f, h] = v(!1), p = S();
  p.current || (p.current = new A({ baseUrl: c.apiUrl, token: c.token })), w(() => {
    var s;
    ((s = e.kbTopics) == null ? void 0 : s.length) > 0 || p.current.getKBTopics().then((u) => t({ type: "SET_KB_TOPICS", payload: Array.isArray(u) ? u : [] })).catch(() => {
    });
  }, [(y = e.kbTopics) == null ? void 0 : y.length, t]);
  const d = N(async (s) => {
    o(s), h(!0);
    try {
      const u = await p.current.getKBTopicArticles(s.slug);
      x(u);
    } catch {
      x([]);
    } finally {
      h(!1);
    }
  }, []), b = N((s) => {
    s.url && window.open(s.url, "_blank", "noopener,noreferrer");
  }, []), g = N(() => {
    o(null), x([]);
  }, []);
  return n ? /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ i("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ i(
        "button",
        {
          onClick: g,
          className: "acx-flex acx-items-center acx-gap-1 acx-text-sm acx-text-primary-600 acx-mb-2 hover:acx-text-primary-700",
          children: [
            /* @__PURE__ */ a(xe, { className: "acx-w-4 acx-h-4" }),
            "Back"
          ]
        }
      ),
      /* @__PURE__ */ a("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: n.name }),
      /* @__PURE__ */ i("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: [
        n.article_count,
        " article",
        n.article_count !== 1 ? "s" : ""
      ] })
    ] }),
    /* @__PURE__ */ a("div", { className: "acx-p-4 acx-space-y-1", children: f ? /* @__PURE__ */ a("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "Loading..." }) : l.length === 0 ? /* @__PURE__ */ a("div", { className: "acx-py-4 acx-text-center acx-text-sm acx-text-gray-400", children: "No articles found" }) : l.map((s) => /* @__PURE__ */ a(Re, { article: s, onClick: b }, s.id)) })
  ] }) : /* @__PURE__ */ i("div", { className: "acx-flex acx-flex-col acx-h-full acx-overflow-y-auto", children: [
    /* @__PURE__ */ i("div", { className: "acx-px-5 acx-py-4 acx-border-b acx-border-gray-100", children: [
      /* @__PURE__ */ a("h2", { className: "acx-text-base acx-font-semibold acx-text-gray-900", children: "Help Centre" }),
      /* @__PURE__ */ a("p", { className: "acx-text-xs acx-text-gray-500 acx-mt-0.5", children: "Browse help topics" })
    ] }),
    /* @__PURE__ */ a("div", { className: "acx-p-4 acx-space-y-1", children: r.length === 0 ? /* @__PURE__ */ a("div", { className: "acx-py-8 acx-text-center", children: /* @__PURE__ */ a("p", { className: "acx-text-sm acx-text-gray-400", children: "No help topics available" }) }) : r.map((s) => /* @__PURE__ */ i(
      "button",
      {
        onClick: () => d(s),
        className: "acx-w-full acx-flex acx-items-center acx-justify-between acx-p-3 acx-rounded-lg acx-text-left hover:acx-bg-gray-50 acx-transition-colors",
        children: [
          /* @__PURE__ */ i("div", { children: [
            /* @__PURE__ */ a("h4", { className: "acx-text-sm acx-font-medium acx-text-gray-900", children: s.name }),
            /* @__PURE__ */ i("p", { className: "acx-text-xs acx-text-gray-500", children: [
              s.article_count,
              " article",
              s.article_count !== 1 ? "s" : ""
            ] })
          ] }),
          /* @__PURE__ */ a(j, { className: "acx-w-4 acx-h-4 acx-text-gray-400" })
        ]
      },
      s.id
    )) })
  ] });
}
function Ue(e) {
  return /* @__PURE__ */ a(ae, { ...e, children: /* @__PURE__ */ a(Le, { position: e.position ?? Z.POSITION }) });
}
function Le({ position: e }) {
  const { state: t, dispatch: c } = C(), [r, n] = v(!1);
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
          /* @__PURE__ */ i("div", { className: "acx-flex-1 acx-overflow-hidden", children: [
            t.activeTab === "messages" && /* @__PURE__ */ a(Oe, {}),
            t.activeTab === "help" && /* @__PURE__ */ a(Me, {})
          ] }),
          /* @__PURE__ */ a(
            he,
            {
              activeTab: t.activeTab,
              onTabChange: (l) => c({ type: "SET_TAB", payload: l })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ a(
      ue,
      {
        isOpen: r,
        onClick: () => n(!r),
        position: e
      }
    )
  ] });
}
export {
  Ue as ChatWidget
};
//# sourceMappingURL=acrux-chat.es.js.map
