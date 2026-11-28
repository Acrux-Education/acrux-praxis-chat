import { createContext as e, useCallback as t, useContext as n, useEffect as r, useId as i, useMemo as a, useReducer as o, useRef as s, useState as c } from "react";
import { Fragment as l, jsx as u, jsxs as d } from "react/jsx-runtime";
// src/constants.ts
var f = "0x4AAAAAADHbxC4Cc2tAgr_N", p = {
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
}, m = (e) => `/ws/chat/${e}/`, h = {
	POSITION: "bottom-right",
	GREETING: "Hi there! How can we help?",
	WIDGET_WIDTH: 380,
	WIDGET_HEIGHT: 600,
	LAUNCHER_SIZE: 60
}, g = {
	AVAILABILITY_POLL: 6e4,
	AVAILABILITY_BOUNDARY_SKEW: 250,
	MAX_TIMER_DELAY: 2147483647,
	WS_RECONNECT_BASE: 1e3,
	WS_RECONNECT_MAX: 3e4,
	WS_HEARTBEAT_INTERVAL: 3e4,
	MESSAGE_ACK_TIMEOUT: 5e3,
	SEARCH_DEBOUNCE: 300,
	TYPING_DEBOUNCE: 1e3,
	TYPING_TIMEOUT: 3e3
}, _ = {
	MAX_FILE_SIZE_MB: 5,
	MAX_FILES_PER_MESSAGE: 3,
	MAX_MESSAGE_LENGTH: 5e3,
	ALLOWED_FILE_TYPES: [
		"image/png",
		"image/jpeg",
		"image/jpg",
		"image/gif",
		"image/webp",
		"application/pdf"
	]
}, v = {
	label: "AI-generated answer",
	line: "Answers are written by AI. Please don't type personal or student information here."
}, y = {
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
function b(e, t) {
	switch (t.type) {
		case "SET_SESSION": return {
			...e,
			session: t.payload
		};
		case "SET_MESSAGES": {
			let n = e.messages.filter((e) => e.temp_id && e.status !== "sent"), r = new Set(t.payload.map((e) => e.id)), i = n.filter((e) => !r.has(e.id));
			return {
				...e,
				messages: [...t.payload, ...i]
			};
		}
		case "ADD_MESSAGE": return {
			...e,
			messages: [...e.messages, t.payload]
		};
		case "ACK_MESSAGE": return {
			...e,
			messages: e.messages.map((e) => e.temp_id === t.payload.temp_id ? {
				...e,
				id: t.payload.real_id,
				status: "sent",
				temp_id: void 0
			} : e)
		};
		case "FAIL_MESSAGE": return {
			...e,
			messages: e.messages.map((e) => e.temp_id === t.payload.temp_id ? {
				...e,
				status: "failed"
			} : e)
		};
		case "SET_AGENT_TYPING": return {
			...e,
			agentTyping: t.payload
		};
		case "AGENT_JOINED": return {
			...e,
			currentAgent: t.payload
		};
		case "SET_CONNECTED": return {
			...e,
			isConnected: t.payload
		};
		case "SET_TAB": return {
			...e,
			activeTab: t.payload
		};
		case "SET_OPEN": return {
			...e,
			isOpen: t.payload
		};
		case "INCREMENT_UNREAD": return {
			...e,
			unreadCount: e.unreadCount + 1
		};
		case "RESET_UNREAD": return {
			...e,
			unreadCount: 0
		};
		case "SET_ANNOUNCEMENTS": return {
			...e,
			announcements: t.payload
		};
		case "SET_ROADMAP_ITEMS": return {
			...e,
			roadmapItems: t.payload
		};
		case "SET_KB_TOPICS": return {
			...e,
			kbTopics: t.payload
		};
		case "SET_KB_RESULTS": return {
			...e,
			kbResults: t.payload,
			kbLoading: !1
		};
		case "SET_KB_LOADING": return {
			...e,
			kbLoading: t.payload
		};
		case "SET_OPERATING_HOURS": return {
			...e,
			operatingHours: t.payload
		};
		case "SET_VISITOR_INFO": return {
			...e,
			visitorName: t.payload.name ?? e.visitorName,
			visitorEmail: t.payload.email ?? e.visitorEmail
		};
		case "SET_LOADING": return {
			...e,
			loading: t.payload
		};
		case "SET_ERROR": return {
			...e,
			error: t.payload
		};
		case "SET_WS_RETRY_COUNT": return {
			...e,
			wsRetryCount: t.payload
		};
		default: return e;
	}
}
// src/services/api.ts
var x = class {
	baseUrl;
	token;
	chatToken;
	region;
	constructor(e) {
		this.baseUrl = e.baseUrl.replace(/\/$/, ""), this.token = e.token, this.region = e.region;
	}
	setToken(e) {
		this.token = e;
	}
	setChatToken(e) {
		this.chatToken = e;
	}
	getChatToken() {
		return this.chatToken;
	}
	async request(e, t = {}) {
		let n = {
			"Content-Type": "application/json",
			...t.headers
		};
		this.token && (n.Authorization = `Bearer ${this.token}`), this.chatToken && (n["X-Chat-Token"] = this.chatToken);
		let r = await fetch(`${this.baseUrl}${e}`, {
			...t,
			headers: n
		});
		if (!r.ok) {
			let e = await r.text().catch(() => "");
			throw new S(r.status, r.statusText, e);
		}
		if (r.status !== 204) return r.json();
	}
	async createSession(e) {
		return this.request(p.SESSIONS, {
			method: "POST",
			body: JSON.stringify({
				...e,
				...this.region ? { region: this.region } : {}
			})
		});
	}
	async getSession(e) {
		return this.request(p.SESSION(e));
	}
	async sendMessage(e, t) {
		return this.request(p.SESSION_MESSAGES(e), {
			method: "POST",
			body: JSON.stringify(t)
		});
	}
	async updateVisitor(e, t) {
		return this.request(p.SESSION_VISITOR(e), {
			method: "PATCH",
			body: JSON.stringify(t)
		});
	}
	async getAnnouncements() {
		return this.request(p.ANNOUNCEMENTS);
	}
	async getRoadmapItems() {
		return this.request(p.ROADMAP);
	}
	async searchKB(e) {
		let t = new URLSearchParams({ q: e });
		return this.request(`${p.KB_SEARCH}?${t}`);
	}
	async askKB(e, t) {
		return this.request(p.KB_ANSWER, {
			method: "POST",
			body: JSON.stringify({
				question: e,
				session_id: t ?? ""
			})
		});
	}
	async getKBTopics() {
		return this.request(p.KB_TOPICS);
	}
	async getKBTopicArticles(e) {
		return this.request(p.KB_TOPIC_ARTICLES(e));
	}
	async getOperatingHoursStatus() {
		let e = this.region ? `?${new URLSearchParams({ region: this.region })}` : "";
		return this.request(`${p.OPERATING_HOURS}${e}`);
	}
}, S = class extends Error {
	status;
	statusText;
	body;
	constructor(e, t, n) {
		super(`API Error ${e}: ${t}`), this.status = e, this.statusText = t, this.body = n, this.name = "ApiError";
	}
};
// src/utils/toArray.ts
function C(e) {
	return Array.isArray(e) ? e : e && typeof e == "object" && "results" in e ? e.results : [];
}
// src/hooks/useOperatingHours.ts
var w = { is_online: !1 };
function T(e, t = Date.now()) {
	if (!e) return null;
	let n = Date.parse(e);
	return Number.isFinite(n) ? Math.min(Math.max(n - t + g.AVAILABILITY_BOUNDARY_SKEW, g.AVAILABILITY_BOUNDARY_SKEW), g.MAX_TIMER_DELAY) : null;
}
function E() {
	let { state: e, dispatch: t, config: n } = j();
	return r(() => {
		let e = new x({
			baseUrl: n.apiUrl,
			token: n.token,
			region: n.region
		}), r = null, i = !1, a = !1, o = async () => {
			if (!(i || a)) {
				a = !0;
				try {
					let n = await e.getOperatingHoursStatus();
					if (i) return;
					t({
						type: "SET_OPERATING_HOURS",
						payload: n
					}), r && clearTimeout(r);
					let a = T(n.next_status_change_at);
					a !== null && (r = setTimeout(o, a));
				} catch {
					i || t({
						type: "SET_OPERATING_HOURS",
						payload: w
					});
				} finally {
					a = !1;
				}
			}
		};
		o();
		let s = setInterval(o, g.AVAILABILITY_POLL);
		return () => {
			i = !0, clearInterval(s), r && clearTimeout(r);
		};
	}, [
		n.apiUrl,
		n.token,
		n.region,
		t
	]), {
		isOnline: e.operatingHours?.is_online ?? !1,
		offlineMessage: e.operatingHours?.offline_message,
		responseTime: e.operatingHours?.response_time
	};
}
// src/context/ChatContext.tsx
var D = e(null);
function O({ children: e, ...t }) {
	let [n, r] = o(b, {
		...y,
		activeTab: t.defaultTab ?? y.activeTab,
		visitorName: t.userName ?? "",
		visitorEmail: t.userEmail ?? ""
	}), i = a(() => ({
		state: n,
		dispatch: r,
		config: t
	}), [n, t]);
	return /* @__PURE__ */ d(D.Provider, {
		value: i,
		children: [
			/* @__PURE__ */ u(k, {}),
			/* @__PURE__ */ u(A, {}),
			e
		]
	});
}
function k() {
	let { dispatch: e, config: t } = j(), n = s(!1);
	return r(() => {
		if (n.current) return;
		n.current = !0;
		let r = new x({
			baseUrl: t.apiUrl,
			token: t.token,
			region: t.region
		});
		r.getAnnouncements().then((t) => e({
			type: "SET_ANNOUNCEMENTS",
			payload: C(t)
		})).catch(() => {}), r.getRoadmapItems().then((t) => e({
			type: "SET_ROADMAP_ITEMS",
			payload: C(t)
		})).catch(() => {}), r.getKBTopics().then((t) => e({
			type: "SET_KB_TOPICS",
			payload: C(t)
		})).catch(() => {});
	}, [
		t.apiUrl,
		t.token,
		t.region,
		e
	]), null;
}
function A() {
	return E(), null;
}
function j() {
	let e = n(D);
	if (!e) throw Error("useChatContext must be used within a ChatProvider");
	return e;
}
// src/components/Badge.tsx
function M({ count: e }) {
	return e <= 0 ? null : /* @__PURE__ */ u("span", {
		className: "acx:absolute acx:-top-1.5 acx:-right-1.5 acx:min-w-[18px] acx:h-[18px] acx:flex acx:items-center acx:justify-center acx:bg-red-600 acx:text-white acx:text-[10px] acx:font-bold acx:rounded-full acx:px-1 acx:leading-none",
		children: e > 99 ? "99+" : String(e)
	});
}
// src/icons/index.tsx
function N({ className: e }) {
	return /* @__PURE__ */ u("svg", {
		className: e,
		"aria-hidden": "true",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: /* @__PURE__ */ u("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
	});
}
function P({ className: e }) {
	return /* @__PURE__ */ u("svg", {
		className: e,
		"aria-hidden": "true",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "currentColor",
		stroke: "none",
		children: /* @__PURE__ */ u("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
	});
}
function ee({ className: e }) {
	return /* @__PURE__ */ d("svg", {
		className: e,
		"aria-hidden": "true",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [/* @__PURE__ */ u("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }), /* @__PURE__ */ u("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })]
	});
}
function te({ className: e }) {
	return /* @__PURE__ */ d("svg", {
		className: e,
		"aria-hidden": "true",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [
			/* @__PURE__ */ u("circle", {
				cx: "12",
				cy: "12",
				r: "10"
			}),
			/* @__PURE__ */ u("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
			/* @__PURE__ */ u("line", {
				x1: "12",
				y1: "17",
				x2: "12.01",
				y2: "17"
			})
		]
	});
}
function F({ className: e }) {
	return /* @__PURE__ */ d("svg", {
		className: e,
		"aria-hidden": "true",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [/* @__PURE__ */ u("circle", {
			cx: "11",
			cy: "11",
			r: "8"
		}), /* @__PURE__ */ u("line", {
			x1: "21",
			y1: "21",
			x2: "16.65",
			y2: "16.65"
		})]
	});
}
function I({ className: e }) {
	return /* @__PURE__ */ d("svg", {
		className: e,
		"aria-hidden": "true",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [/* @__PURE__ */ u("line", {
			x1: "22",
			y1: "2",
			x2: "11",
			y2: "13"
		}), /* @__PURE__ */ u("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })]
	});
}
function ne({ className: e }) {
	return /* @__PURE__ */ d("svg", {
		className: e,
		"aria-hidden": "true",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [/* @__PURE__ */ u("line", {
			x1: "18",
			y1: "6",
			x2: "6",
			y2: "18"
		}), /* @__PURE__ */ u("line", {
			x1: "6",
			y1: "6",
			x2: "18",
			y2: "18"
		})]
	});
}
function re({ className: e }) {
	return /* @__PURE__ */ u("svg", {
		className: e,
		"aria-hidden": "true",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: /* @__PURE__ */ u("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" })
	});
}
function L({ className: e }) {
	return /* @__PURE__ */ u("svg", {
		className: e,
		"aria-hidden": "true",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: /* @__PURE__ */ u("polyline", { points: "9 18 15 12 9 6" })
	});
}
function ie({ className: e }) {
	return /* @__PURE__ */ u("svg", {
		className: e,
		"aria-hidden": "true",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: /* @__PURE__ */ u("polyline", { points: "15 18 9 12 15 6" })
	});
}
// src/ChatLauncher.tsx
function ae({ isOpen: e, onClick: t, position: n, buttonRef: r }) {
	let { state: i } = j();
	return /* @__PURE__ */ u("div", {
		className: `acx:fixed acx:bottom-4 acx:sm:bottom-6 ${n === "bottom-right" ? "acx:right-4 acx:sm:right-6" : "acx:left-4 acx:sm:left-6"} acx:z-[9999]`,
		children: /* @__PURE__ */ u("button", {
			ref: r,
			type: "button",
			onClick: t,
			className: "acx-launcher-btn acx:relative acx:w-14 acx:h-14 acx:rounded-full acx:shadow-lg acx:transition-all acx:hover:scale-105 acx:flex acx:items-center acx:justify-center",
			"aria-label": e ? "Close chat" : oe(i.unreadCount),
			children: e ? /* @__PURE__ */ u("span", {
				className: "acx-launcher-icon-stroke",
				children: /* @__PURE__ */ u(ne, { className: "acx:w-6 acx:h-6" })
			}) : /* @__PURE__ */ d(l, { children: [/* @__PURE__ */ u(P, { className: "acx:w-7 acx:h-7" }), i.unreadCount > 0 && /* @__PURE__ */ u(M, { count: i.unreadCount })] })
		})
	});
}
function oe(e) {
	return e <= 0 ? "Open chat" : `Open chat, ${e} unread ${e === 1 ? "message" : "messages"}`;
}
// src/utils/a11y.ts
function se(e, t, n) {
	if (n <= 0) return null;
	switch (e) {
		case "ArrowRight": return (t + 1) % n;
		case "ArrowLeft": return (t - 1 + n) % n;
		case "Home": return 0;
		case "End": return n - 1;
		default: return null;
	}
}
function R(e) {
	return e.sender_type === "visitor" || e.sender_type === "user";
}
function z(e) {
	return e.sender_type === "system" && e.content_type !== "auto_response" ? e.content : e.sender_name ? `${e.sender_name}: ${e.content}` : e.content;
}
function B(e, t) {
	if (e.length === 0) return null;
	let n = new Map(e.map((e) => [e.id, e])), r = [];
	t.some((e) => R(e) && e.status === "failed" && n.get(e.id)?.status !== "failed") && r.push("Message failed to send");
	for (let e of t) !R(e) && !n.has(e.id) && r.push(z(e));
	return r.length > 0 ? r.join(". ") : null;
}
// src/components/TabBar.tsx
var V = {
	id: "messages",
	label: "Messages",
	Icon: N
}, H = {
	id: "news",
	label: "What's new",
	Icon: ee
}, U = {
	id: "help",
	label: "Help",
	Icon: te
};
function W({ activeTab: e, onTabChange: t, idBase: n, panelId: r }) {
	let { state: i, config: a } = j(), o = s([]), c = (a.whatsNew?.length ?? 0) > 0 ? [
		V,
		H,
		U
	] : [V, U], l = c.findIndex((t) => t.id === e), f = l === -1 ? 0 : l;
	return /* @__PURE__ */ u("nav", {
		className: "acx:flex acx:border-t acx:border-gray-200 acx:bg-white",
		role: "tablist",
		"aria-label": "Chat sections",
		onKeyDown: (e) => {
			let n = se(e.key, f, c.length);
			n !== null && (e.preventDefault(), t(c[n].id), o.current[n]?.focus());
		},
		children: c.map(({ id: a, label: s, Icon: c }, l) => /* @__PURE__ */ d("button", {
			ref: (e) => {
				o.current[l] = e;
			},
			type: "button",
			role: "tab",
			id: `${n}-tab-${a}`,
			"aria-selected": e === a,
			"aria-controls": e === a ? r : void 0,
			"aria-label": a === "messages" && i.unreadCount > 0 ? `${s}, ${i.unreadCount} unread` : void 0,
			tabIndex: l === f ? 0 : -1,
			onClick: () => t(a),
			className: `acx:flex-1 acx:flex acx:flex-col acx:items-center acx:py-2 acx:gap-0.5 acx:relative acx:transition-colors acx:border-b-2 ${e === a ? "acx:text-primary-600 acx:border-primary-600" : "acx:text-gray-500 acx:border-transparent acx:hover:text-primary-600"}`,
			children: [/* @__PURE__ */ d("div", {
				className: "acx:relative",
				children: [/* @__PURE__ */ u(c, { className: "acx:w-5 acx:h-5" }), a === "messages" && i.unreadCount > 0 && /* @__PURE__ */ u(M, { count: i.unreadCount })]
			}), /* @__PURE__ */ u("span", {
				className: `acx:text-[10px] ${e === a ? "acx:font-semibold" : "acx:font-medium"}`,
				children: s
			})]
		}, a))
	});
}
// src/hooks/useLocalStorage.ts
var G = "acrux_chat_";
function K(e, n) {
	let r = `${G}${e}`, [i, a] = c(() => {
		try {
			let e = window.localStorage.getItem(r);
			return e ? JSON.parse(e) : n;
		} catch {
			return n;
		}
	});
	return [i, t((e) => {
		a(e);
		try {
			window.localStorage.setItem(r, JSON.stringify(e));
		} catch {}
	}, [r])];
}
// src/utils/url.ts
function ce() {
	let e = new URLSearchParams(window.location.search), t = "";
	if (document.referrer) try {
		let e = new URL(document.referrer);
		t = e.origin + e.pathname;
	} catch {}
	return {
		page_url: window.location.origin + window.location.pathname,
		referrer: t,
		utm_source: e.get("utm_source") ?? void 0,
		utm_medium: e.get("utm_medium") ?? void 0,
		utm_campaign: e.get("utm_campaign") ?? void 0
	};
}
function le(e) {
	try {
		let t = new URL(e);
		return t.protocol === "http:" || t.protocol === "https:";
	} catch {
		return !1;
	}
}
// src/hooks/useChatSession.ts
var q = "acrux_chat_chat_access_token", ue = "https://challenges.cloudflare.com/turnstile/v0/api.js", de = 5e3;
function fe() {
	return new Promise((e) => {
		let t = !1, n, r = document.createElement("div");
		r.style.display = "none", document.body.appendChild(r);
		let i = (i) => {
			t || (t = !0, clearTimeout(a), n !== void 0 && clearInterval(n), r.remove(), e(i));
		}, a = setTimeout(() => i(null), de), o = () => {
			if (!t) try {
				let e = window.turnstile;
				if (!e) {
					i(null);
					return;
				}
				e.render(r, {
					sitekey: f,
					callback: (e) => i(e),
					"error-callback": () => i(null),
					"expired-callback": () => i(null)
				});
			} catch {
				i(null);
			}
		};
		try {
			if (!document.getElementById("cf-turnstile-script")) {
				let e = document.createElement("script");
				e.id = "cf-turnstile-script", e.src = ue, e.async = !0, e.onerror = () => i(null), document.head.appendChild(e);
			}
			window.turnstile ? o() : n = window.setInterval(() => {
				window.turnstile && (n !== void 0 && clearInterval(n), o());
			}, 100);
		} catch {
			i(null);
		}
	});
}
async function pe(e) {
	if (e) try {
		let t = await e();
		return typeof t == "string" && t !== "" ? t : void 0;
	} catch {
		return;
	}
}
function me() {
	try {
		return window.sessionStorage.getItem(q);
	} catch {
		return null;
	}
}
function he(e) {
	try {
		e === null ? window.sessionStorage.removeItem(q) : window.sessionStorage.setItem(q, e);
	} catch {}
}
function ge() {
	let { state: e, dispatch: n, config: i } = j(), [a, o] = K("session_key", null), [l, u] = c(() => (localStorage.removeItem(q), me())), d = s(void 0), f = s(null), p = t((e) => {
		he(e), u(e);
	}, []);
	d.current || (d.current = new x({
		baseUrl: i.apiUrl,
		token: i.token,
		region: i.region
	}), l && d.current.setChatToken(l));
	let m = d.current, h = t(async (t) => {
		let r = i.mode === "lead" ? ce() : void 0, a = await fe(), s = await pe(i.getIdentityToken);
		try {
			n({
				type: "SET_LOADING",
				payload: !0
			});
			let c = await m.createSession({
				source: i.mode === "lead" ? "lead_bot" : "user_bot",
				visitor_name: t?.name || e.visitorName || i.userName,
				visitor_email: t?.email || e.visitorEmail || i.userEmail,
				visitor_metadata: r,
				turnstile_token: a ?? void 0,
				identity_token: s
			});
			return c.access_token && (m.setChatToken(c.access_token), p(c.access_token)), f.current = c.session_key, n({
				type: "SET_SESSION",
				payload: c
			}), o(c.session_key), i.onSessionCreated?.(c.session_key), n({
				type: "SET_LOADING",
				payload: !1
			}), c;
		} catch (e) {
			throw n({
				type: "SET_ERROR",
				payload: "Failed to create chat session"
			}), n({
				type: "SET_LOADING",
				payload: !1
			}), e;
		}
	}, [
		m,
		i,
		e.visitorName,
		e.visitorEmail,
		n,
		o,
		p
	]), g = t(async (e) => {
		try {
			n({
				type: "SET_LOADING",
				payload: !0
			});
			let t = await m.getSession(e);
			if (f.current && f.current !== e) return n({
				type: "SET_LOADING",
				payload: !1
			}), null;
			let { messages: r, ...i } = t;
			return f.current = i.session_key, n({
				type: "SET_SESSION",
				payload: i
			}), n({
				type: "SET_MESSAGES",
				payload: r
			}), n({
				type: "SET_LOADING",
				payload: !1
			}), i;
		} catch {
			return o(null), p(null), m.setChatToken(""), n({
				type: "SET_LOADING",
				payload: !1
			}), null;
		}
	}, [
		m,
		n,
		o,
		p
	]), _ = t(async (t, r) => {
		if (e.session) {
			n({
				type: "SET_VISITOR_INFO",
				payload: {
					name: t,
					email: r
				}
			});
			try {
				await m.updateVisitor(e.session.session_key, {
					visitor_name: t,
					visitor_email: r
				});
			} catch {}
		}
	}, [
		m,
		e.session,
		n
	]);
	return r(() => {
		a && !e.session && g(a);
	}, []), {
		session: e.session,
		sessionKey: e.session?.session_key ?? a,
		accessToken: m.getChatToken() ?? l,
		createSession: h,
		restoreSession: g,
		updateVisitorInfo: _,
		api: m
	};
}
// src/services/websocket.ts
var _e = [
	"history",
	"message",
	"message_ack",
	"agent_joined",
	"agent_typing",
	"heartbeat_ack",
	"error"
];
function ve(e) {
	return typeof e == "object" && !!e && typeof e.type == "string" && _e.includes(e.type);
}
var ye = class {
	ws = null;
	url;
	token;
	onMessage;
	onStatusChange;
	retryCount = 0;
	reconnectTimer = null;
	heartbeatTimer = null;
	messageQueue = [];
	intentionallyClosed = !1;
	constructor(e) {
		this.url = e.url, this.token = e.token, this.onMessage = e.onMessage, this.onStatusChange = e.onStatusChange;
	}
	connect() {
		if (this.ws?.readyState !== WebSocket.OPEN) {
			this.intentionallyClosed = !1;
			try {
				let e = this.token ? ["acrux-chat", `acrux-chat-token.${this.token}`] : ["acrux-chat"];
				this.ws = new WebSocket(this.url, e);
			} catch {
				this.scheduleReconnect();
				return;
			}
			this.ws.onopen = () => {
				this.retryCount = 0, this.onStatusChange(!0, 0), this.startHeartbeat(), this.flushQueue();
			}, this.ws.onclose = () => {
				this.onStatusChange(!1, this.retryCount), this.stopHeartbeat(), this.intentionallyClosed || this.scheduleReconnect();
			}, this.ws.onerror = () => {}, this.ws.onmessage = (e) => {
				try {
					let t = JSON.parse(e.data);
					ve(t) && this.onMessage(t);
				} catch {}
			};
		}
	}
	send(e) {
		this.ws?.readyState === WebSocket.OPEN ? this.ws.send(JSON.stringify(e)) : this.messageQueue.push(e);
	}
	disconnect() {
		this.intentionallyClosed = !0, this.stopHeartbeat(), this.reconnectTimer &&= (clearTimeout(this.reconnectTimer), null), this.ws &&= (this.ws.close(), null);
	}
	flushQueue() {
		for (; this.messageQueue.length > 0;) {
			let e = this.messageQueue.shift();
			e && this.send(e);
		}
	}
	scheduleReconnect() {
		if (this.reconnectTimer) return;
		let e = Math.min(g.WS_RECONNECT_BASE * 2 ** this.retryCount, g.WS_RECONNECT_MAX);
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null, this.retryCount++, this.connect();
		}, e);
	}
	startHeartbeat() {
		this.stopHeartbeat(), this.heartbeatTimer = setInterval(() => {
			this.send({ type: "heartbeat" });
		}, g.WS_HEARTBEAT_INTERVAL);
	}
	stopHeartbeat() {
		this.heartbeatTimer &&= (clearInterval(this.heartbeatTimer), null);
	}
};
// src/utils/uuid.ts
function be() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
		let t = Math.random() * 16 | 0;
		return (e === "x" ? t : t & 3 | 8).toString(16);
	});
}
// src/hooks/useChatWebSocket.ts
function xe(e, n) {
	let { state: i, dispatch: a, config: o } = j(), c = s(null), l = s(/* @__PURE__ */ new Map()), u = s(null);
	r(() => {
		if (!e) return;
		let t = new ye({
			url: `${o.apiUrl.startsWith("https") ? "wss" : "ws"}://${o.apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}${m(e)}`,
			token: n ?? void 0,
			onStatusChange: (e, t) => {
				a({
					type: "SET_CONNECTED",
					payload: e
				}), a({
					type: "SET_WS_RETRY_COUNT",
					payload: t
				});
			},
			onMessage: (e) => {
				switch (e.type) {
					case "history":
						Array.isArray(e.messages) && a({
							type: "SET_MESSAGES",
							payload: e.messages
						});
						break;
					case "message":
						e.message && typeof e.message == "object" && (a({
							type: "ADD_MESSAGE",
							payload: e.message
						}), i.isOpen && i.activeTab === "messages" || a({ type: "INCREMENT_UNREAD" }));
						break;
					case "message_ack":
						if (typeof e.temp_id == "string" && typeof e.real_id == "number") {
							a({
								type: "ACK_MESSAGE",
								payload: {
									temp_id: e.temp_id,
									real_id: e.real_id
								}
							});
							let t = l.current.get(e.temp_id);
							t && (clearTimeout(t), l.current.delete(e.temp_id));
						}
						break;
					case "agent_joined":
						e.agent && a({
							type: "AGENT_JOINED",
							payload: e.agent
						});
						break;
					case "agent_typing":
						a({
							type: "SET_AGENT_TYPING",
							payload: {
								is_typing: e.is_typing ?? !1,
								agent_name: e.agent_name
							}
						}), u.current && clearTimeout(u.current), e.is_typing && (u.current = setTimeout(() => {
							a({
								type: "SET_AGENT_TYPING",
								payload: { is_typing: !1 }
							}), u.current = null;
						}, g.TYPING_TIMEOUT));
						break;
					case "heartbeat_ack": break;
					case "error": a({
						type: "SET_ERROR",
						payload: e.error ?? "WebSocket error"
					});
				}
			}
		});
		t.connect(), c.current = t;
		let r = l.current;
		return () => {
			t.disconnect(), c.current = null, r.forEach((e) => clearTimeout(e)), r.clear(), u.current &&= (clearTimeout(u.current), null);
		};
	}, [
		e,
		n,
		o.apiUrl
	]);
	let d = t((e) => {
		if (!e || e.length > _.MAX_MESSAGE_LENGTH || !c.current) return;
		let t = be(), n = {
			id: t,
			session: 0,
			sender_type: o.mode === "lead" ? "visitor" : "user",
			sender_name: i.visitorName || "You",
			content: e,
			content_type: "text",
			attachments: [],
			is_read: !0,
			created_at: (/* @__PURE__ */ new Date()).toISOString(),
			temp_id: t,
			status: "sending"
		};
		a({
			type: "ADD_MESSAGE",
			payload: n
		}), c.current.send({
			type: "message",
			text: e,
			temp_id: t
		});
		let r = setTimeout(() => {
			a({
				type: "FAIL_MESSAGE",
				payload: { temp_id: t }
			}), l.current.delete(t);
		}, g.MESSAGE_ACK_TIMEOUT);
		l.current.set(t, r);
	}, [
		o.mode,
		i.visitorName,
		a
	]), f = t((e) => {
		c.current?.send({
			type: "typing",
			is_typing: e
		});
	}, []);
	return {
		isConnected: i.isConnected,
		sendMessage: d,
		sendTyping: f
	};
}
// src/components/AgentAvatar.tsx
function Se(e) {
	return e.split(" ").slice(0, 2).map((e) => e[0] ?? "").join("").toUpperCase();
}
var J = [
	"acx:bg-blue-600",
	"acx:bg-green-700",
	"acx:bg-purple-600",
	"acx:bg-orange-700",
	"acx:bg-pink-600",
	"acx:bg-teal-700"
];
function Ce(e) {
	let t = 0;
	for (let n = 0; n < e.length; n++) t = e.charCodeAt(n) + ((t << 5) - t);
	return J[Math.abs(t) % J.length];
}
function Y({ name: e, avatarUrl: t }) {
	return t ? /* @__PURE__ */ u("img", {
		src: t,
		alt: "",
		className: "acx:w-8 acx:h-8 acx:rounded-full acx:object-cover acx:flex-shrink-0"
	}) : /* @__PURE__ */ u("div", {
		"aria-hidden": "true",
		className: `acx:w-8 acx:h-8 acx:rounded-full acx:flex acx:items-center acx:justify-center acx:text-white acx:text-xs acx:font-semibold acx:flex-shrink-0 ${Ce(e)}`,
		children: Se(e)
	});
}
// src/utils/time.ts
function X(e) {
	let t = new Date(e), n = (/* @__PURE__ */ new Date()).getTime() - t.getTime(), r = Math.floor(n / 1e3), i = Math.floor(r / 60), a = Math.floor(i / 60), o = Math.floor(a / 24);
	return r < 60 ? "Just now" : i < 60 ? `${i}m ago` : a < 24 ? `${a}h ago` : o < 7 ? `${o}d ago` : t.toLocaleDateString(void 0, {
		month: "short",
		day: "numeric"
	});
}
function we(e) {
	let t = new Date(e), n = /* @__PURE__ */ new Date(), r = new Date(n.getFullYear(), n.getMonth(), n.getDate()), i = new Date(t.getFullYear(), t.getMonth(), t.getDate()), a = Math.floor((r.getTime() - i.getTime()) / 864e5);
	return a === 0 ? "Today" : a === 1 ? "Yesterday" : t.toLocaleDateString(void 0, {
		weekday: "long",
		month: "short",
		day: "numeric"
	});
}
function Te(e, t) {
	let n = new Date(e), r = new Date(t);
	return n.getFullYear() === r.getFullYear() && n.getMonth() === r.getMonth() && n.getDate() === r.getDate();
}
// src/utils/sanitize.ts
function Ee(e) {
	let t = De(e);
	return t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"), t = t.replace(/__(.+?)__/g, "<strong>$1</strong>"), t = t.replace(/\*(.+?)\*/g, "<em>$1</em>"), t = t.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>"), t = t.replace(/`(.+?)`/g, "<code>$1</code>"), t = t.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, "<a href=\"$2\" target=\"_blank\" rel=\"noopener noreferrer\">$1</a>"), t = t.replace(/\n/g, "<br />"), t;
}
function De(e) {
	let t = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#039;"
	};
	return e.replace(/[&<>"']/g, (e) => t[e] ?? e);
}
// src/components/MessageBubble.tsx
function Oe({ message: e }) {
	let t = e.sender_type === "visitor" || e.sender_type === "user", n = e.sender_type === "system";
	return n && e.content_type === "auto_response" ? /* @__PURE__ */ d("div", {
		className: "acx:flex acx:gap-2 acx:mb-3 acx:justify-start",
		children: [/* @__PURE__ */ u(Y, { name: e.sender_name }), /* @__PURE__ */ d("div", {
			className: "acx:max-w-[75%]",
			children: [
				e.sender_name && /* @__PURE__ */ u("span", {
					className: "acx:text-xs acx:text-gray-500 acx:ml-1 acx:mb-0.5 acx:block",
					children: e.sender_name
				}),
				/* @__PURE__ */ d("div", {
					className: "acx:px-3.5 acx:py-2.5 acx:rounded-2xl acx:text-sm acx:leading-relaxed acx:bg-amber-50 acx:text-gray-800 acx:rounded-bl-md acx:border acx:border-amber-200",
					children: [!e.sender_name && /* @__PURE__ */ u("span", {
						className: "acx:sr-only",
						children: "Acrux: "
					}), /* @__PURE__ */ u("p", {
						className: "acx:whitespace-pre-wrap",
						children: e.content
					})]
				}),
				/* @__PURE__ */ u("span", {
					className: "acx:text-[10px] acx:text-gray-500 acx:mt-0.5 acx:block",
					children: X(e.created_at)
				})
			]
		})]
	}) : n ? /* @__PURE__ */ u("div", {
		className: "acx:flex acx:justify-center acx:py-2",
		children: /* @__PURE__ */ u("span", {
			className: "acx:text-xs acx:text-gray-500 acx:italic",
			children: e.content
		})
	}) : /* @__PURE__ */ d("div", {
		className: `acx:flex acx:gap-2 acx:mb-3 ${t ? "acx:justify-end" : "acx:justify-start"}`,
		children: [!t && /* @__PURE__ */ u(Y, { name: e.sender_name }), /* @__PURE__ */ d("div", {
			className: `acx:max-w-[75%] ${t ? "acx:order-1" : ""}`,
			children: [
				!t && e.sender_name && /* @__PURE__ */ u("span", {
					className: "acx:text-xs acx:text-gray-500 acx:ml-1 acx:mb-0.5 acx:block",
					children: e.sender_name
				}),
				/* @__PURE__ */ d("div", {
					className: `acx:px-3.5 acx:py-2.5 acx:rounded-2xl acx:text-sm acx:leading-relaxed ${t ? "acx:bg-primary-600 acx:text-white acx:rounded-br-md" : (e.sender_type, "acx:bg-gray-100 acx:text-gray-800 acx:rounded-bl-md")}`,
					children: [t ? /* @__PURE__ */ u("span", {
						className: "acx:sr-only",
						children: "You: "
					}) : !e.sender_name && /* @__PURE__ */ u("span", {
						className: "acx:sr-only",
						children: "Acrux: "
					}), e.content_type === "markdown" ? /* @__PURE__ */ u("div", {
						className: "acx:prose acx:prose-sm",
						dangerouslySetInnerHTML: { __html: Ee(e.content) }
					}) : /* @__PURE__ */ u("p", {
						className: "acx:whitespace-pre-wrap",
						children: e.content
					})]
				}),
				e.attachments?.length > 0 && /* @__PURE__ */ u("div", {
					className: "acx:mt-1 acx:space-y-1",
					children: e.attachments.map((e, t) => /* @__PURE__ */ u("a", {
						href: e.url,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "acx:block acx:leading-6 acx:text-xs acx:text-primary-600 acx:hover:underline acx:truncate",
						children: e.name
					}, t))
				}),
				/* @__PURE__ */ d("div", {
					className: `acx:flex acx:items-center acx:gap-1 acx:mt-0.5 ${t ? "acx:justify-end" : ""}`,
					children: [
						/* @__PURE__ */ u("span", {
							className: "acx:text-[10px] acx:text-gray-500",
							children: X(e.created_at)
						}),
						t && e.status === "sending" && /* @__PURE__ */ u("span", {
							className: "acx:text-[10px] acx:text-gray-500",
							children: "Sending..."
						}),
						t && e.status === "failed" && /* @__PURE__ */ u("span", {
							className: "acx:text-[10px] acx:text-red-600",
							children: "Failed"
						})
					]
				})
			]
		})]
	});
}
// src/components/TypingIndicator.tsx
function ke({ agentName: e }) {
	return /* @__PURE__ */ d("div", {
		className: "acx:flex acx:items-center acx:gap-2 acx:mb-3",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ u(Y, { name: e ?? "Agent" }), /* @__PURE__ */ u("div", {
			className: "acx:bg-gray-100 acx:rounded-2xl acx:rounded-bl-md acx:px-4 acx:py-3",
			children: /* @__PURE__ */ d("div", {
				className: "acx:flex acx:gap-1",
				children: [
					/* @__PURE__ */ u("span", { className: "acx:w-1.5 acx:h-1.5 acx:bg-gray-500 acx:rounded-full acx-typing-dot" }),
					/* @__PURE__ */ u("span", { className: "acx:w-1.5 acx:h-1.5 acx:bg-gray-500 acx:rounded-full acx-typing-dot" }),
					/* @__PURE__ */ u("span", { className: "acx:w-1.5 acx:h-1.5 acx:bg-gray-500 acx:rounded-full acx-typing-dot" })
				]
			})
		})]
	});
}
// src/components/MessageList.tsx
function Ae({ messages: e, agentTyping: t }) {
	let n = s(null), i = s(null), a = s(e), [o, f] = c({
		text: "",
		count: 0
	});
	return r(() => {
		let t = B(a.current, e);
		a.current = e, t && f((e) => ({
			text: t,
			count: e.count + 1
		}));
	}, [e]), r(() => {
		n.current?.scrollIntoView({ behavior: "smooth" });
	}, [e.length, t.is_typing]), /* @__PURE__ */ d(l, { children: [/* @__PURE__ */ u("div", {
		className: "acx:sr-only",
		"aria-live": "polite",
		"aria-atomic": "true",
		children: /* @__PURE__ */ u("span", { children: o.text }, o.count)
	}), /* @__PURE__ */ d("div", {
		ref: i,
		className: "acx:flex-1 acx:overflow-y-auto acx:px-4 acx:py-3 acx:space-y-1",
		role: "log",
		"aria-live": "off",
		"aria-label": "Conversation",
		children: [
			e.map((t, n) => {
				let r = e[n - 1], i = !r || !Te(r.created_at, t.created_at);
				return /* @__PURE__ */ d("div", { children: [i && /* @__PURE__ */ u("div", {
					className: "acx:flex acx:items-center acx:justify-center acx:py-3",
					children: /* @__PURE__ */ u("span", {
						className: "acx:text-xs acx:text-gray-500 acx:bg-gray-50 acx:px-3 acx:py-1 acx:rounded-full",
						children: we(t.created_at)
					})
				}), /* @__PURE__ */ u(Oe, { message: t })] }, t.temp_id ?? t.id);
			}),
			t.is_typing && /* @__PURE__ */ u(ke, { agentName: t.agent_name }),
			/* @__PURE__ */ u("div", { ref: n })
		]
	})] });
}
// src/components/MessageInput.tsx
function je({ onSend: e, onTyping: n, onFileUpload: r, mode: a, disabled: o, placeholder: f }) {
	let [p, m] = c(""), h = i(), g = s(null), v = s(null), y = s(void 0), b = t(() => {
		let t = p.trim();
		t && !o && (e(t), m(""), n?.(!1), g.current?.focus());
	}, [
		p,
		o,
		e,
		n
	]);
	return /* @__PURE__ */ d("div", {
		className: "acx:border-t acx:border-gray-200 acx:bg-white acx:px-3 acx:py-2",
		children: [/* @__PURE__ */ u("label", {
			htmlFor: h,
			className: "acx:block acx:text-xs acx:font-medium acx:text-gray-600",
			children: "Message"
		}), /* @__PURE__ */ d("div", {
			className: "acx:flex acx:items-end acx:gap-2 acx:rounded-lg acx:has-[textarea:focus-visible]:ring-2 acx:has-[textarea:focus-visible]:ring-[#006383] acx:has-[textarea:focus-visible]:ring-offset-2",
			children: [
				a === "user" && r && /* @__PURE__ */ d(l, { children: [/* @__PURE__ */ u("button", {
					onClick: () => {
						v.current?.click();
					},
					className: "acx:p-1.5 acx:text-gray-500 acx:hover:text-gray-600 acx:transition-colors acx:flex-shrink-0",
					"aria-label": "Attach file",
					type: "button",
					children: /* @__PURE__ */ u(re, { className: "acx:w-5 acx:h-5" })
				}), /* @__PURE__ */ u("input", {
					ref: v,
					type: "file",
					className: "acx:hidden",
					accept: _.ALLOWED_FILE_TYPES.join(","),
					multiple: !0,
					onChange: (e) => {
						e.target.files && e.target.files.length > 0 && (r?.(e.target.files), e.target.value = "");
					}
				})] }),
				/* @__PURE__ */ u("textarea", {
					ref: g,
					value: p,
					onChange: (e) => {
						let t = e.target.value;
						t.length > _.MAX_MESSAGE_LENGTH || (m(t), n?.(!0), y.current && clearTimeout(y.current), y.current = setTimeout(() => n?.(!1), 2e3));
					},
					onKeyDown: (e) => {
						e.key === "Enter" && !e.shiftKey && (e.preventDefault(), b());
					},
					id: h,
					placeholder: f ?? "Type a message...",
					readOnly: o,
					"aria-disabled": o || void 0,
					rows: 1,
					className: "acx:flex-1 acx:resize-none acx:border-0 acx:outline-none acx:text-sm acx:py-2 acx:max-h-24 acx:bg-transparent acx:placeholder:text-gray-500",
					style: { fieldSizing: "content" }
				}),
				/* @__PURE__ */ u("button", {
					onClick: b,
					disabled: !p.trim() || o,
					className: "acx:p-1.5 acx:text-primary-600 acx:transition-colors acx:flex-shrink-0 acx:enabled:hover:text-primary-700 acx:disabled:text-gray-300 acx:disabled:cursor-not-allowed",
					"aria-label": "Send message",
					type: "button",
					children: /* @__PURE__ */ u(I, { className: "acx:w-5 acx:h-5" })
				})
			]
		})]
	});
}
// src/components/StatusBanner.tsx
function Me({ isOnline: e, offlineMessage: t, responseTime: n }) {
	return e ? null : /* @__PURE__ */ u("div", {
		className: "acx:bg-amber-50 acx:border-b acx:border-amber-200 acx:px-4 acx:py-2.5",
		children: /* @__PURE__ */ d("div", {
			className: "acx:flex acx:items-center acx:gap-2",
			children: [/* @__PURE__ */ u("div", { className: "acx:w-2 acx:h-2 acx:rounded-full acx:bg-amber-400 acx:flex-shrink-0" }), /* @__PURE__ */ d("p", {
				className: "acx:text-xs acx:text-amber-800",
				children: [t ?? "We're currently offline.", n && /* @__PURE__ */ d("span", {
					className: "acx:font-medium",
					children: [
						" We typically respond ",
						n,
						"."
					]
				})]
			})]
		})
	});
}
// src/components/ConnectionBanner.tsx
function Ne({ isConnected: e, retryCount: t }) {
	return e || t === 0 ? null : t >= 5 ? /* @__PURE__ */ u("div", {
		className: "acx:bg-red-50 acx:border-b acx:border-red-200 acx:px-4 acx:py-2.5",
		children: /* @__PURE__ */ d("div", {
			className: "acx:flex acx:items-center acx:justify-between acx:gap-2",
			children: [/* @__PURE__ */ d("div", {
				className: "acx:flex acx:items-center acx:gap-2",
				children: [/* @__PURE__ */ u("div", { className: "acx:w-2 acx:h-2 acx:rounded-full acx:bg-red-400 acx:flex-shrink-0" }), /* @__PURE__ */ u("p", {
					className: "acx:text-xs acx:text-red-800",
					children: "Connection lost. Please refresh."
				})]
			}), /* @__PURE__ */ u("button", {
				type: "button",
				onClick: () => window.location.reload(),
				className: "acx:text-xs acx:font-medium acx:text-red-700 acx:bg-red-100 acx:px-2 acx:py-0.5 acx:rounded acx:hover:bg-red-200 acx:flex-shrink-0",
				children: "Refresh"
			})]
		})
	}) : /* @__PURE__ */ u("div", {
		className: "acx:bg-amber-50 acx:border-b acx:border-amber-200 acx:px-4 acx:py-2.5",
		children: /* @__PURE__ */ d("div", {
			className: "acx:flex acx:items-center acx:gap-2",
			children: [/* @__PURE__ */ d("svg", {
				className: "acx:w-3 acx:h-3 acx:text-amber-500 acx:animate-spin acx:flex-shrink-0",
				viewBox: "0 0 24 24",
				fill: "none",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ u("circle", {
					className: "acx:opacity-25",
					cx: "12",
					cy: "12",
					r: "10",
					stroke: "currentColor",
					strokeWidth: "4"
				}), /* @__PURE__ */ u("path", {
					className: "acx:opacity-75",
					fill: "currentColor",
					d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
				})]
			}), /* @__PURE__ */ u("p", {
				className: "acx:text-xs acx:text-amber-800",
				children: "Reconnecting..."
			})]
		})
	});
}
// src/components/LeadCaptureForm.tsx
function Pe({ onSubmit: e, loading: t }) {
	let [n, r] = c(""), [a, o] = c(""), s = i(), l = i();
	return /* @__PURE__ */ d("form", {
		onSubmit: (t) => {
			t.preventDefault(), a.trim() && e({
				name: n.trim(),
				email: a.trim()
			});
		},
		className: "acx:p-4 acx:space-y-3",
		children: [
			/* @__PURE__ */ u("p", {
				className: "acx:text-sm acx:text-gray-600 acx:mb-1",
				children: "Before we start, could you share your details?"
			}),
			/* @__PURE__ */ d("div", { children: [/* @__PURE__ */ u("label", {
				htmlFor: s,
				className: "acx:block acx:mb-1 acx:text-xs acx:font-medium acx:text-gray-600",
				children: "Your name"
			}), /* @__PURE__ */ u("input", {
				id: s,
				type: "text",
				value: n,
				onChange: (e) => r(e.target.value),
				autoComplete: "name",
				className: "acx:w-full acx:px-3 acx:py-2 acx:border acx:border-[#6B8299] acx:rounded-lg acx:text-sm acx:outline-none acx:focus:border-primary-500 acx:focus:ring-1 acx:focus:ring-primary-500"
			})] }),
			/* @__PURE__ */ d("div", { children: [/* @__PURE__ */ u("label", {
				htmlFor: l,
				className: "acx:block acx:mb-1 acx:text-xs acx:font-medium acx:text-gray-600",
				children: "Your email (required)"
			}), /* @__PURE__ */ u("input", {
				id: l,
				type: "email",
				value: a,
				onChange: (e) => o(e.target.value),
				autoComplete: "email",
				required: !0,
				className: "acx:w-full acx:px-3 acx:py-2 acx:border acx:border-[#6B8299] acx:rounded-lg acx:text-sm acx:outline-none acx:focus:border-primary-500 acx:focus:ring-1 acx:focus:ring-primary-500"
			})] }),
			/* @__PURE__ */ d("p", {
				className: "acx:text-xs acx:text-gray-500 acx:leading-snug",
				children: [
					"By starting a chat, your details, messages, and the page you're on are shared with Acrux to respond to your enquiry — see our",
					" ",
					/* @__PURE__ */ u("a", {
						href: "https://www.acrux.education/legal/privacy-policy",
						target: "_blank",
						rel: "noopener noreferrer",
						className: "acx:underline acx:hover:text-gray-600",
						children: "Privacy Policy"
					}),
					"."
				]
			}),
			/* @__PURE__ */ u("button", {
				type: "submit",
				disabled: !a.trim() || t,
				className: "acx:w-full acx:bg-primary-600 acx:text-white acx:py-2.5 acx:rounded-lg acx:text-sm acx:font-medium acx:transition-colors acx:enabled:hover:bg-primary-700 acx:disabled:bg-gray-200 acx:disabled:text-gray-500 acx:disabled:cursor-not-allowed",
				children: t ? "Starting..." : "Start conversation"
			})
		]
	});
}
// src/tabs/MessagesTab.tsx
function Fe() {
	let { state: e, dispatch: n, config: i } = j(), { session: a, sessionKey: o, accessToken: f, createSession: p } = ge(), { sendMessage: m, sendTyping: h, isConnected: g } = xe(o, f), _ = e.operatingHours?.is_online ?? !1, v = e.operatingHours?.offline_message, y = e.operatingHours?.response_time, [b, x] = c(!1), S = s(null);
	r(() => {
		g && S.current && (m(S.current), S.current = null);
	}, [g, m]);
	let C = t(async (t) => {
		if (a) m(t);
		else {
			if (i.mode === "lead" && !e.visitorEmail) {
				S.current = t, x(!0);
				return;
			}
			try {
				S.current = t, await p();
			} catch {
				S.current = null;
			}
		}
	}, [
		a,
		i.mode,
		e.visitorEmail,
		p,
		m
	]), w = t(async (e) => {
		n({
			type: "SET_VISITOR_INFO",
			payload: e
		}), x(!1);
		try {
			await p({
				name: e.name,
				email: e.email
			});
		} catch {
			S.current = null;
		}
	}, [p, n]);
	return r(() => {
		e.unreadCount > 0 && e.activeTab === "messages" && n({ type: "RESET_UNREAD" });
	}, [
		e.unreadCount,
		e.activeTab,
		n
	]), b && !a ? /* @__PURE__ */ d("div", {
		className: "acx:flex acx:flex-col acx:h-full",
		children: [/* @__PURE__ */ u(Z, {
			isConnected: g,
			retryCount: e.wsRetryCount,
			isOnline: _,
			offlineMessage: v,
			responseTime: y
		}), /* @__PURE__ */ u(Pe, {
			onSubmit: w,
			loading: e.loading
		})]
	}) : /* @__PURE__ */ d("div", {
		className: "acx:flex acx:flex-col acx:h-full",
		children: [
			/* @__PURE__ */ u(Z, {
				isConnected: g,
				retryCount: e.wsRetryCount,
				isOnline: _,
				offlineMessage: v,
				responseTime: y
			}),
			e.messages.length === 0 && !a ? /* @__PURE__ */ u("div", {
				className: "acx:flex-1 acx:flex acx:flex-col acx:items-center acx:justify-center acx:px-6 acx:text-center",
				children: _ ? /* @__PURE__ */ d(l, { children: [/* @__PURE__ */ u("p", {
					className: "acx:text-lg acx:font-semibold acx:text-gray-800 acx:mb-1",
					children: i.greeting || "Hi there! How can we help?"
				}), /* @__PURE__ */ u("p", {
					className: "acx:text-sm acx:text-gray-500",
					children: "Send a message to start a conversation"
				})] }) : /* @__PURE__ */ d(l, { children: [
					/* @__PURE__ */ u("div", {
						className: "acx:w-12 acx:h-12 acx:bg-amber-100 acx:rounded-full acx:flex acx:items-center acx:justify-center acx:mb-3",
						children: /* @__PURE__ */ d("svg", {
							className: "acx:w-6 acx:h-6 acx:text-amber-600",
							viewBox: "0 0 24 24",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "2",
							"aria-hidden": "true",
							children: [
								/* @__PURE__ */ u("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6l-4 4V6c0-1.1.9-2 2-2z" }),
								/* @__PURE__ */ u("path", { d: "M12 11v1" }),
								/* @__PURE__ */ u("path", { d: "M12 8h.01" })
							]
						})
					}),
					/* @__PURE__ */ u("p", {
						className: "acx:text-sm acx:text-gray-600 acx:font-medium",
						children: "Leave us a message"
					}),
					/* @__PURE__ */ d("p", {
						className: "acx:text-xs acx:text-gray-500 acx:mt-1",
						children: [
							"Our team is currently away. Leave a message and we'll get back to you",
							y ? ` ${y}` : " as soon as possible",
							"."
						]
					})
				] })
			}) : /* @__PURE__ */ u(Ae, {
				messages: e.messages,
				agentTyping: e.agentTyping
			}),
			/* @__PURE__ */ u(je, {
				onSend: C,
				onTyping: h,
				mode: i.mode,
				disabled: e.loading,
				placeholder: _ ? "Type a message..." : "Leave a message..."
			})
		]
	});
}
function Z({ isConnected: e, retryCount: t, isOnline: n, offlineMessage: r, responseTime: i }) {
	return /* @__PURE__ */ d("div", {
		role: "status",
		children: [/* @__PURE__ */ u(Ne, {
			isConnected: e,
			retryCount: t
		}), /* @__PURE__ */ u(Me, {
			isOnline: n,
			offlineMessage: r,
			responseTime: i
		})]
	});
}
// src/components/WhatsNewCard.tsx
var Q = {
	update: "acx:bg-green-100 acx:text-green-800",
	notice: "acx:bg-orange-100 acx:text-orange-700",
	digest: "acx:bg-blue-100 acx:text-blue-700"
}, Ie = {
	update: "New",
	notice: "Service notice",
	digest: "Round-up"
};
function Le({ entry: e }) {
	let t = e.read_more_url && le(e.read_more_url) ? e.read_more_url : null;
	return /* @__PURE__ */ d("article", {
		className: "acx:p-4 acx:border acx:border-gray-200 acx:rounded-xl",
		children: [
			/* @__PURE__ */ d("div", {
				className: "acx:flex acx:items-center acx:gap-2 acx:mb-2",
				children: [/* @__PURE__ */ u("span", {
					className: `acx:text-[10px] acx:font-semibold acx:px-2 acx:py-0.5 acx:rounded-full ${Q[e.category] ?? "acx:bg-gray-100 acx:text-gray-700"}`,
					children: Ie[e.category] ?? e.category
				}), /* @__PURE__ */ u("span", {
					className: "acx:text-[10px] acx:text-gray-500",
					children: X(e.sent_at)
				})]
			}),
			/* @__PURE__ */ u("h4", {
				className: "acx:text-sm acx:font-semibold acx:text-gray-900 acx:mb-1",
				children: e.title
			}),
			/* @__PURE__ */ u("p", {
				className: "acx:text-xs acx:text-gray-500",
				children: e.summary
			}),
			t && /* @__PURE__ */ u("a", {
				href: t,
				target: "_blank",
				rel: "noopener noreferrer",
				className: "acx:inline-block acx:mt-2 acx:text-xs acx:font-medium acx:text-primary-600 acx:hover:underline",
				children: "Read how it works"
			})
		]
	});
}
// src/tabs/NewsTab.tsx
function Re() {
	let { config: e } = j(), t = e.whatsNew ?? [];
	return /* @__PURE__ */ d("div", {
		className: "acx:flex acx:flex-col acx:h-full acx:overflow-y-auto",
		children: [/* @__PURE__ */ d("div", {
			className: "acx:px-5 acx:py-4 acx:border-b acx:border-gray-100",
			children: [/* @__PURE__ */ u("h2", {
				className: "acx:text-base acx:font-semibold acx:text-gray-900",
				children: "What’s new"
			}), /* @__PURE__ */ u("p", {
				className: "acx:text-xs acx:text-gray-500 acx:mt-0.5",
				children: "Recent updates from the team"
			})]
		}), /* @__PURE__ */ u("div", {
			className: "acx:p-4 acx:space-y-3",
			children: t.length === 0 ? /* @__PURE__ */ u("div", {
				className: "acx:py-8 acx:text-center",
				children: /* @__PURE__ */ u("p", {
					className: "acx:text-sm acx:text-gray-500",
					children: "Nothing new right now"
				})
			}) : t.map((e) => /* @__PURE__ */ u(Le, { entry: e }, e.id))
		})]
	});
}
// src/hooks/useKBSearch.ts
function ze() {
	let { dispatch: e, config: n } = j(), i = s(void 0), a = s(void 0);
	i.current ||= new x({
		baseUrl: n.apiUrl,
		token: n.token
	});
	let o = t((t) => {
		a.current && clearTimeout(a.current), t.trim() ? (e({
			type: "SET_KB_LOADING",
			payload: !0
		}), a.current = setTimeout(async () => {
			try {
				let n = await i.current.searchKB(t);
				e({
					type: "SET_KB_RESULTS",
					payload: n
				});
			} catch {
				e({
					type: "SET_KB_RESULTS",
					payload: []
				});
			}
		}, g.SEARCH_DEBOUNCE)) : e({
			type: "SET_KB_RESULTS",
			payload: []
		});
	}, [e]);
	return r(() => () => {
		a.current && clearTimeout(a.current);
	}, []), { search: o };
}
// src/components/SearchInput.tsx
function Be({ onSearch: e, onSubmit: t, placeholder: n = "Search for help...", label: a }) {
	let [o, f] = c(""), p = i(), m = s(void 0);
	return r(() => (m.current && clearTimeout(m.current), m.current = setTimeout(() => {
		e(o.trim());
	}, g.SEARCH_DEBOUNCE), () => {
		m.current && clearTimeout(m.current);
	}), [o, e]), /* @__PURE__ */ d(l, { children: [a && /* @__PURE__ */ u("label", {
		htmlFor: p,
		className: "acx:block acx:mb-1 acx:text-xs acx:font-medium acx:text-gray-600",
		children: a
	}), /* @__PURE__ */ d("div", {
		className: "acx:relative",
		children: [/* @__PURE__ */ u(F, { className: "acx:absolute acx:left-3 acx:top-1/2 acx:-translate-y-1/2 acx:w-4 acx:h-4 acx:text-gray-400" }), /* @__PURE__ */ u("input", {
			type: "text",
			value: o,
			onChange: (e) => f(e.target.value),
			onKeyDown: (e) => {
				e.key === "Enter" && t && o.trim() && (e.preventDefault(), t(o.trim()));
			},
			id: p,
			placeholder: n,
			"aria-label": a ? void 0 : n.replace(/\.+$/, ""),
			className: "acx:w-full acx:pl-9 acx:pr-4 acx:py-2.5 acx:border acx:border-[#6B8299] acx:rounded-lg acx:text-sm acx:outline-none acx:focus:border-primary-500 acx:focus:ring-1 acx:focus:ring-primary-500 acx:transition-colors acx:bg-white"
		})]
	})] });
}
// src/components/ArticleCard.tsx
function $({ article: e, onClick: t }) {
	return /* @__PURE__ */ d("button", {
		onClick: () => t(e),
		className: "acx:w-full acx:flex acx:items-center acx:justify-between acx:p-3 acx:rounded-lg acx:text-left acx:hover:bg-gray-50 acx:transition-colors acx:group",
		children: [/* @__PURE__ */ d("div", {
			className: "acx:flex-1 acx:min-w-0",
			children: [/* @__PURE__ */ u("h4", {
				className: "acx:text-sm acx:font-medium acx:text-gray-900 acx:truncate acx:group-hover:text-primary-600 acx:transition-colors",
				children: e.title
			}), e.summary && /* @__PURE__ */ u("p", {
				className: "acx:text-xs acx:text-gray-500 acx:mt-0.5 acx:line-clamp-2",
				children: e.summary
			})]
		}), /* @__PURE__ */ u(L, { className: "acx:w-4 acx:h-4 acx:text-gray-400 acx:flex-shrink-0 acx:ml-2" })]
	});
}
// src/components/LiveStatus.tsx
function Ve({ text: e, className: t }) {
	let [n, i] = c(!1);
	r(() => {
		i(!0);
	}, []);
	let a = n ? e : "";
	return /* @__PURE__ */ u("div", {
		"aria-live": "polite",
		className: a ? t : "acx:sr-only",
		children: a
	});
}
// src/tabs/HelpTab.tsx
function He() {
	let { state: e, dispatch: n, config: i } = j(), { search: a } = ze(), o = e.kbTopics, [l, f] = c(null), [p, m] = c([]), [h, g] = c(!1), [_, y] = c(null), [b, S] = c(!1), C = s(void 0);
	C.current ||= new x({
		baseUrl: i.apiUrl,
		token: i.token
	});
	let w = t((e) => {
		e || y(null), a(e);
	}, [a]), T = t(async (t) => {
		S(!0), y(null);
		try {
			let r = await C.current.askKB(t, e.session?.session_key);
			y(r), r.fallback && r.results.length > 0 && n({
				type: "SET_KB_RESULTS",
				payload: r.results
			});
		} catch {
			y(null);
		} finally {
			S(!1);
		}
	}, [n, e.session?.session_key]);
	r(() => {
		e.kbTopics?.length > 0 || C.current.getKBTopics().then((e) => n({
			type: "SET_KB_TOPICS",
			payload: Array.isArray(e) ? e : []
		})).catch(() => {});
	}, [e.kbTopics?.length, n]);
	let E = t(async (e) => {
		f(e), g(!0);
		try {
			let t = await C.current.getKBTopicArticles(e.slug);
			m(t);
		} catch {
			m([]);
		} finally {
			g(!1);
		}
	}, []), D = t((e) => {
		e.url && window.open(e.url, "_blank", "noopener,noreferrer");
	}, []), O = s(null), k = s(null), A = s(/* @__PURE__ */ new Map()), M = s(null), N = t(() => {
		M.current = l?.id ?? null, f(null), m([]);
	}, [l]);
	if (r(() => {
		if (l) {
			O.current?.focus();
			return;
		}
		let e = M.current;
		e !== null && (M.current = null, (A.current.get(e) ?? k.current)?.focus());
	}, [l]), l) {
		let e = h ? "Loading..." : p.length === 0 ? "No articles found" : "";
		return /* @__PURE__ */ d("div", {
			className: "acx:flex acx:flex-col acx:h-full acx:overflow-y-auto",
			children: [/* @__PURE__ */ d("div", {
				className: "acx:px-5 acx:py-4 acx:border-b acx:border-gray-100",
				children: [
					/* @__PURE__ */ d("button", {
						onClick: N,
						className: "acx:flex acx:items-center acx:gap-1 acx:text-sm acx:text-primary-600 acx:mb-2 acx:hover:text-primary-700",
						children: [/* @__PURE__ */ u(ie, { className: "acx:w-4 acx:h-4" }), "Back"]
					}),
					/* @__PURE__ */ u("h2", {
						ref: O,
						tabIndex: -1,
						className: "acx:text-base acx:font-semibold acx:text-gray-900 acx:outline-none",
						children: l.name
					}),
					/* @__PURE__ */ d("p", {
						className: "acx:text-xs acx:text-gray-500 acx:mt-0.5",
						children: [
							l.article_count,
							" article",
							l.article_count === 1 ? "" : "s"
						]
					})
				]
			}), /* @__PURE__ */ d("div", {
				className: "acx:p-4 acx:space-y-1",
				children: [/* @__PURE__ */ u(Ve, {
					text: e,
					className: "acx:py-4 acx:text-center acx:text-sm acx:text-gray-500"
				}), !e && p.map((e) => /* @__PURE__ */ u($, {
					article: e,
					onClick: D
				}, e.id))]
			})]
		});
	}
	let P = e.kbLoading || e.kbResults.length > 0;
	return /* @__PURE__ */ d("div", {
		className: "acx:flex acx:flex-col acx:h-full acx:overflow-y-auto",
		children: [/* @__PURE__ */ d("div", {
			className: "acx:px-5 acx:py-4 acx:border-b acx:border-gray-100",
			children: [
				/* @__PURE__ */ u("h2", {
					ref: k,
					tabIndex: -1,
					className: "acx:text-base acx:font-semibold acx:text-gray-900 acx:outline-none",
					children: "Help Centre"
				}),
				/* @__PURE__ */ u("p", {
					className: "acx:text-xs acx:text-gray-500 acx:mt-0.5",
					children: "Ask a question or browse topics"
				}),
				/* @__PURE__ */ d("div", {
					className: "acx:mt-3",
					children: [/* @__PURE__ */ u(Be, {
						onSearch: w,
						onSubmit: T,
						placeholder: "Ask a question or search...",
						label: "Search help"
					}), /* @__PURE__ */ u("p", {
						className: "acx:mt-2 acx:text-xs acx:text-gray-500",
						children: v.line
					})]
				}),
				/* @__PURE__ */ d("div", {
					"aria-live": "polite",
					children: [
						b && /* @__PURE__ */ u("div", {
							className: "acx:mt-3 acx:py-3 acx:text-center acx:text-sm acx:text-gray-500",
							children: "Finding an answer..."
						}),
						!b && _?.answer && /* @__PURE__ */ d("div", {
							className: "acx:mt-3 acx:rounded-lg acx:bg-primary-50 acx:border acx:border-primary-100 acx:p-3",
							children: [
								/* @__PURE__ */ u("span", {
									className: "acx:inline-block acx:mb-2 acx:rounded-full acx:bg-primary-600 acx:px-2.5 acx:py-0.5 acx:text-xs acx:font-semibold acx:text-white",
									children: v.label
								}),
								/* @__PURE__ */ u("p", {
									className: "acx:text-sm acx:text-gray-800 acx:whitespace-pre-line",
									children: _.answer
								}),
								_.sources.length > 0 && /* @__PURE__ */ u("div", {
									className: "acx:mt-2 acx:pt-2 acx:border-t acx:border-primary-100 acx:space-y-1",
									children: _.sources.map((e) => /* @__PURE__ */ d("button", {
										onClick: () => D(e),
										className: "acx:block acx:min-h-6 acx:text-xs acx:text-primary-600 acx:hover:text-primary-700 acx:text-left",
										children: [
											e.title,
											" ",
											/* @__PURE__ */ u("span", {
												"aria-hidden": "true",
												children: "→"
											})
										]
									}, e.id))
								})
							]
						}),
						!b && _?.fallback && /* @__PURE__ */ u("p", {
							className: "acx:mt-3 acx:text-xs acx:text-gray-500",
							children: "We couldn't find a direct answer — try these articles, or send us a message."
						})
					]
				})
			]
		}), /* @__PURE__ */ d("div", {
			className: "acx:p-4 acx:space-y-1",
			children: [/* @__PURE__ */ u("div", {
				"aria-live": "polite",
				className: e.kbLoading ? "acx:py-4 acx:text-center acx:text-sm acx:text-gray-500" : "acx:sr-only",
				children: e.kbLoading ? "Searching..." : ""
			}), P ? !e.kbLoading && e.kbResults.slice(0, 5).map((e) => /* @__PURE__ */ u($, {
				article: e,
				onClick: D
			}, e.id)) : o.length === 0 ? /* @__PURE__ */ u("div", {
				className: "acx:py-8 acx:text-center",
				children: /* @__PURE__ */ u("p", {
					className: "acx:text-sm acx:text-gray-500",
					children: "No help topics available"
				})
			}) : o.map((e) => /* @__PURE__ */ d("button", {
				ref: (t) => {
					t ? A.current.set(e.id, t) : A.current.delete(e.id);
				},
				onClick: () => E(e),
				className: "acx:w-full acx:flex acx:items-center acx:justify-between acx:p-3 acx:rounded-lg acx:text-left acx:hover:bg-gray-50 acx:transition-colors",
				children: [/* @__PURE__ */ d("div", { children: [/* @__PURE__ */ u("h4", {
					className: "acx:text-sm acx:font-medium acx:text-gray-900",
					children: e.name
				}), /* @__PURE__ */ d("p", {
					className: "acx:text-xs acx:text-gray-500",
					children: [
						e.article_count,
						" article",
						e.article_count === 1 ? "" : "s"
					]
				})] }), /* @__PURE__ */ u(L, { className: "acx:w-4 acx:h-4 acx:text-gray-400" })]
			}, e.id))]
		})]
	});
}
// src/components/panelLayout.ts
var Ue = "acx:[@media(max-height:500px)]:inset-0! acx:[@media(max-height:500px)]:w-auto! acx:[@media(max-height:500px)]:max-w-none! acx:[@media(max-height:500px)]:h-dvh! acx:[@media(max-height:500px)]:max-h-none! acx:[@media(max-height:500px)]:rounded-none! acx:[@media(max-height:500px)]:overflow-y-auto!", We = "acx:[@media(max-height:500px)]:flex-none! acx:[@media(max-height:500px)]:min-h-[16rem]!";
function Ge(e) {
	return `acx:fixed acx:bottom-20 ${e === "bottom-right" ? "acx:right-4 acx:sm:right-6" : "acx:left-4 acx:sm:left-6"} acx:z-[9999] acx:w-[380px] acx:max-w-[calc(100vw-2rem)] acx:h-[600px] acx:max-h-[calc(100vh-6rem)] acx:bg-white acx:rounded-2xl acx:shadow-2xl acx:flex acx:flex-col acx:overflow-hidden acx:animate-slide-up acx:outline-none ${Ue}`;
}
`${We}`;
// src/ChatWidget.tsx
function Ke(e) {
	return /* @__PURE__ */ u(O, {
		...e,
		children: /* @__PURE__ */ u(qe, { position: e.position ?? h.POSITION })
	});
}
function qe({ position: e }) {
	let { state: t, dispatch: n } = j(), [a, o] = c(!1), l = s(null), f = s(null), p = i(), m = `${p}-panel`;
	r(() => {
		a && l.current?.focus({ preventScroll: !0 });
	}, [a]);
	let h = () => {
		o(!1), f.current?.focus({ preventScroll: !0 });
	};
	return /* @__PURE__ */ d("div", {
		className: "acrux-chat-widget",
		children: [a && /* @__PURE__ */ d("div", {
			className: Ge(e),
			role: "dialog",
			"aria-label": "Chat widget",
			ref: l,
			tabIndex: -1,
			onKeyDown: (e) => {
				e.key === "Escape" && !e.nativeEvent.isComposing && (e.stopPropagation(), h());
			},
			children: [
				/* @__PURE__ */ d("div", {
					className: "acx:flex acx:items-center acx:justify-between acx:px-5 acx:py-4 acx:bg-primary-600 acx:text-white",
					children: [/* @__PURE__ */ d("div", {
						className: "acx:flex acx:items-center acx:gap-2.5",
						children: [/* @__PURE__ */ u("svg", {
							xmlns: "http://www.w3.org/2000/svg",
							width: "24",
							height: "24",
							viewBox: "0 0 375 375",
							className: "acx:flex-shrink-0",
							"aria-hidden": "true",
							children: /* @__PURE__ */ u("path", {
								fill: "#ffde5a",
								d: "M 366.039062 86.546875 L 209.414062 117.519531 L 156.304688 4.511719 L 132.847656 127.152344 L 8.957031 142.746094 L 120.160156 174.398438 L 91.242188 158.484375 L 154.742188 150.492188 L 166.765625 87.632812 L 193.984375 145.554688 L 282.449219 125.828125 L 210.808594 181.351562 L 238.035156 239.269531 L 181.964844 208.414062 L 14 374.972656 L 185.960938 240.164062 L 295.355469 300.371094 L 242.242188 187.359375 L 366.039062 86.546875",
								fillRule: "nonzero"
							})
						}), /* @__PURE__ */ u("h2", {
							className: "acx:text-lg acx:font-semibold",
							children: "Acrux Chat"
						})]
					}), /* @__PURE__ */ u("button", {
						type: "button",
						onClick: h,
						className: "acx:p-1 acx:rounded-md acx:bg-white acx:transition-colors acx:hover:bg-gray-100",
						"aria-label": "Close chat",
						children: /* @__PURE__ */ u("svg", {
							width: "20",
							height: "20",
							viewBox: "0 0 20 20",
							fill: "none",
							stroke: "#006383",
							strokeWidth: "2",
							strokeLinecap: "round",
							"aria-hidden": "true",
							children: /* @__PURE__ */ u("path", { d: "M15 5L5 15M5 5l10 10" })
						})
					})]
				}),
				/* @__PURE__ */ d("div", {
					className: "acx:flex-1 acx:overflow-hidden acx:[@media(max-height:500px)]:flex-none! acx:[@media(max-height:500px)]:min-h-[16rem]!",
					role: "tabpanel",
					id: m,
					"aria-labelledby": `${p}-tab-${t.activeTab}`,
					children: [
						t.activeTab === "messages" && /* @__PURE__ */ u(Fe, {}),
						t.activeTab === "news" && /* @__PURE__ */ u(Re, {}),
						t.activeTab === "help" && /* @__PURE__ */ u(He, {})
					]
				}),
				/* @__PURE__ */ u(W, {
					activeTab: t.activeTab,
					idBase: p,
					panelId: m,
					onTabChange: (e) => n({
						type: "SET_TAB",
						payload: e
					})
				})
			]
		}), /* @__PURE__ */ u(ae, {
			isOpen: a,
			onClick: () => o(!a),
			position: e,
			buttonRef: f
		})]
	});
}
export { Ke as ChatWidget };
