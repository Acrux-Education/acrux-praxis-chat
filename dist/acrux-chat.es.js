import { createContext as e, useCallback as t, useContext as n, useEffect as r, useMemo as i, useReducer as a, useRef as o, useState as s } from "react";
import { Fragment as c, jsx as l, jsxs as u } from "react/jsx-runtime";
//#region src/constants.ts
var d = "0x4AAAAAADHbxC4Cc2tAgr_N", f = {
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
}, p = (e) => `/ws/chat/${e}/`, m = {
	POSITION: "bottom-right",
	GREETING: "Hi there! How can we help?",
	WIDGET_WIDTH: 380,
	WIDGET_HEIGHT: 600,
	LAUNCHER_SIZE: 60
}, h = {
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
}, g = {
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
}, _ = {
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
function v(e, t) {
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
//#endregion
//#region src/services/api.ts
var y = class {
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
			throw new b(r.status, r.statusText, e);
		}
		if (r.status !== 204) return r.json();
	}
	async createSession(e) {
		return this.request(f.SESSIONS, {
			method: "POST",
			body: JSON.stringify({
				...e,
				...this.region ? { region: this.region } : {}
			})
		});
	}
	async getSession(e) {
		return this.request(f.SESSION(e));
	}
	async sendMessage(e, t) {
		return this.request(f.SESSION_MESSAGES(e), {
			method: "POST",
			body: JSON.stringify(t)
		});
	}
	async updateVisitor(e, t) {
		return this.request(f.SESSION_VISITOR(e), {
			method: "PATCH",
			body: JSON.stringify(t)
		});
	}
	async getAnnouncements() {
		return this.request(f.ANNOUNCEMENTS);
	}
	async getRoadmapItems() {
		return this.request(f.ROADMAP);
	}
	async searchKB(e) {
		let t = new URLSearchParams({ q: e });
		return this.request(`${f.KB_SEARCH}?${t}`);
	}
	async askKB(e, t) {
		return this.request(f.KB_ANSWER, {
			method: "POST",
			body: JSON.stringify({
				question: e,
				session_id: t ?? ""
			})
		});
	}
	async getKBTopics() {
		return this.request(f.KB_TOPICS);
	}
	async getKBTopicArticles(e) {
		return this.request(f.KB_TOPIC_ARTICLES(e));
	}
	async getOperatingHoursStatus() {
		let e = this.region ? `?${new URLSearchParams({ region: this.region })}` : "";
		return this.request(`${f.OPERATING_HOURS}${e}`);
	}
}, b = class extends Error {
	status;
	statusText;
	body;
	constructor(e, t, n) {
		super(`API Error ${e}: ${t}`), this.status = e, this.statusText = t, this.body = n, this.name = "ApiError";
	}
};
//#endregion
//#region src/utils/toArray.ts
function x(e) {
	return Array.isArray(e) ? e : e && typeof e == "object" && "results" in e ? e.results : [];
}
//#endregion
//#region src/hooks/useOperatingHours.ts
var S = { is_online: !1 };
function C(e, t = Date.now()) {
	if (!e) return null;
	let n = Date.parse(e);
	return Number.isFinite(n) ? Math.min(Math.max(n - t + h.AVAILABILITY_BOUNDARY_SKEW, h.AVAILABILITY_BOUNDARY_SKEW), h.MAX_TIMER_DELAY) : null;
}
function w() {
	let { state: e, dispatch: t, config: n } = k();
	return r(() => {
		let e = new y({
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
					let a = C(n.next_status_change_at);
					a !== null && (r = setTimeout(o, a));
				} catch {
					i || t({
						type: "SET_OPERATING_HOURS",
						payload: S
					});
				} finally {
					a = !1;
				}
			}
		};
		o();
		let s = setInterval(o, h.AVAILABILITY_POLL);
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
//#endregion
//#region src/context/ChatContext.tsx
var T = e(null);
function E({ children: e, ...t }) {
	let [n, r] = a(v, {
		..._,
		activeTab: t.defaultTab ?? _.activeTab,
		visitorName: t.userName ?? "",
		visitorEmail: t.userEmail ?? ""
	}), o = i(() => ({
		state: n,
		dispatch: r,
		config: t
	}), [n, t]);
	return /* @__PURE__ */ u(T.Provider, {
		value: o,
		children: [
			/* @__PURE__ */ l(D, {}),
			/* @__PURE__ */ l(O, {}),
			e
		]
	});
}
function D() {
	let { dispatch: e, config: t } = k(), n = o(!1);
	return r(() => {
		if (n.current) return;
		n.current = !0;
		let r = new y({
			baseUrl: t.apiUrl,
			token: t.token,
			region: t.region
		});
		r.getAnnouncements().then((t) => e({
			type: "SET_ANNOUNCEMENTS",
			payload: x(t)
		})).catch(() => {}), r.getRoadmapItems().then((t) => e({
			type: "SET_ROADMAP_ITEMS",
			payload: x(t)
		})).catch(() => {}), r.getKBTopics().then((t) => e({
			type: "SET_KB_TOPICS",
			payload: x(t)
		})).catch(() => {});
	}, [
		t.apiUrl,
		t.token,
		t.region,
		e
	]), null;
}
function O() {
	return w(), null;
}
function k() {
	let e = n(T);
	if (!e) throw Error("useChatContext must be used within a ChatProvider");
	return e;
}
//#endregion
//#region src/components/Badge.tsx
function A({ count: e }) {
	return e <= 0 ? null : /* @__PURE__ */ l("span", {
		className: "acx:absolute -acx-top-1.5 -acx-right-1.5 acx:min-w-[18px] acx:h-[18px] acx:flex acx:items-center acx:justify-center acx:bg-red-500 acx:text-white acx:text-[10px] acx:font-bold acx:rounded-full acx:px-1 acx:leading-none",
		children: e > 99 ? "99+" : String(e)
	});
}
//#endregion
//#region src/icons/index.tsx
function ee({ className: e }) {
	return /* @__PURE__ */ l("svg", {
		className: e,
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: /* @__PURE__ */ l("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
	});
}
function j({ className: e }) {
	return /* @__PURE__ */ l("svg", {
		className: e,
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "currentColor",
		stroke: "none",
		children: /* @__PURE__ */ l("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
	});
}
function te({ className: e }) {
	return /* @__PURE__ */ u("svg", {
		className: e,
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [
			/* @__PURE__ */ l("circle", {
				cx: "12",
				cy: "12",
				r: "10"
			}),
			/* @__PURE__ */ l("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
			/* @__PURE__ */ l("line", {
				x1: "12",
				y1: "17",
				x2: "12.01",
				y2: "17"
			})
		]
	});
}
function ne({ className: e }) {
	return /* @__PURE__ */ u("svg", {
		className: e,
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [/* @__PURE__ */ l("circle", {
			cx: "11",
			cy: "11",
			r: "8"
		}), /* @__PURE__ */ l("line", {
			x1: "21",
			y1: "21",
			x2: "16.65",
			y2: "16.65"
		})]
	});
}
function re({ className: e }) {
	return /* @__PURE__ */ u("svg", {
		className: e,
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [/* @__PURE__ */ l("line", {
			x1: "22",
			y1: "2",
			x2: "11",
			y2: "13"
		}), /* @__PURE__ */ l("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })]
	});
}
function ie({ className: e }) {
	return /* @__PURE__ */ u("svg", {
		className: e,
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [/* @__PURE__ */ l("line", {
			x1: "18",
			y1: "6",
			x2: "6",
			y2: "18"
		}), /* @__PURE__ */ l("line", {
			x1: "6",
			y1: "6",
			x2: "18",
			y2: "18"
		})]
	});
}
function ae({ className: e }) {
	return /* @__PURE__ */ l("svg", {
		className: e,
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: /* @__PURE__ */ l("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" })
	});
}
function M({ className: e }) {
	return /* @__PURE__ */ l("svg", {
		className: e,
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: /* @__PURE__ */ l("polyline", { points: "9 18 15 12 9 6" })
	});
}
function oe({ className: e }) {
	return /* @__PURE__ */ l("svg", {
		className: e,
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: /* @__PURE__ */ l("polyline", { points: "15 18 9 12 15 6" })
	});
}
//#endregion
//#region src/ChatLauncher.tsx
function se({ isOpen: e, onClick: t, position: n }) {
	let { state: r } = k();
	return /* @__PURE__ */ l("div", {
		className: `acx:fixed acx:bottom-4 acx:sm:bottom-6 ${n === "bottom-right" ? "acx:right-4 acx:sm:right-6" : "acx:left-4 acx:sm:left-6"} acx:z-[9999]`,
		children: /* @__PURE__ */ l("button", {
			onClick: t,
			className: "acx-launcher-btn acx:relative acx:w-14 acx:h-14 acx:rounded-full acx:shadow-lg acx:transition-all acx:hover:scale-105 acx:flex acx:items-center acx:justify-center",
			"aria-label": e ? "Close chat" : "Open chat",
			children: e ? /* @__PURE__ */ l("span", {
				className: "acx-launcher-icon-stroke",
				children: /* @__PURE__ */ l(ie, { className: "acx:w-6 acx:h-6" })
			}) : /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l(j, { className: "acx:w-7 acx:h-7" }), r.unreadCount > 0 && /* @__PURE__ */ l(A, { count: r.unreadCount })] })
		})
	});
}
//#endregion
//#region src/components/TabBar.tsx
var N = [{
	id: "messages",
	label: "Messages",
	Icon: ee
}, {
	id: "help",
	label: "Help",
	Icon: te
}];
function P({ activeTab: e, onTabChange: t }) {
	let { state: n } = k();
	return /* @__PURE__ */ l("nav", {
		className: "acx:flex acx:border-t acx:border-gray-200 acx:bg-white",
		role: "tablist",
		children: N.map(({ id: r, label: i, Icon: a }) => /* @__PURE__ */ u("button", {
			role: "tab",
			"aria-selected": e === r,
			onClick: () => t(r),
			className: `acx:flex-1 acx:flex acx:flex-col acx:items-center acx:py-2 acx:gap-0.5 acx:relative acx:transition-colors ${e === r ? "acx:text-primary-600" : "acx:text-gray-400 acx:hover:text-primary-600"}`,
			children: [/* @__PURE__ */ u("div", {
				className: "acx:relative",
				children: [/* @__PURE__ */ l(a, { className: "acx:w-5 acx:h-5" }), r === "messages" && n.unreadCount > 0 && /* @__PURE__ */ l(A, { count: n.unreadCount })]
			}), /* @__PURE__ */ l("span", {
				className: "acx:text-[10px] acx:font-medium",
				children: i
			})]
		}, r))
	});
}
//#endregion
//#region src/hooks/useLocalStorage.ts
var F = "acrux_chat_";
function I(e, n) {
	let r = `${F}${e}`, [i, a] = s(() => {
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
//#endregion
//#region src/utils/url.ts
function L() {
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
//#endregion
//#region src/hooks/useChatSession.ts
var R = "acrux_chat_chat_access_token", z = "https://challenges.cloudflare.com/turnstile/v0/api.js", B = 5e3;
function V() {
	return new Promise((e) => {
		let t = !1, n, r = document.createElement("div");
		r.style.display = "none", document.body.appendChild(r);
		let i = (i) => {
			t || (t = !0, clearTimeout(a), n !== void 0 && clearInterval(n), r.remove(), e(i));
		}, a = setTimeout(() => i(null), B), o = () => {
			if (!t) try {
				let e = window.turnstile;
				if (!e) {
					i(null);
					return;
				}
				e.render(r, {
					sitekey: d,
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
				e.id = "cf-turnstile-script", e.src = z, e.async = !0, e.onerror = () => i(null), document.head.appendChild(e);
			}
			window.turnstile ? o() : n = window.setInterval(() => {
				window.turnstile && (n !== void 0 && clearInterval(n), o());
			}, 100);
		} catch {
			i(null);
		}
	});
}
function H() {
	try {
		return window.sessionStorage.getItem(R);
	} catch {
		return null;
	}
}
function U(e) {
	try {
		e === null ? window.sessionStorage.removeItem(R) : window.sessionStorage.setItem(R, e);
	} catch {}
}
function W() {
	let { state: e, dispatch: n, config: i } = k(), [a, c] = I("session_key", null), [l, u] = s(() => (localStorage.removeItem(R), H())), d = o(), f = o(null), p = t((e) => {
		U(e), u(e);
	}, []);
	d.current || (d.current = new y({
		baseUrl: i.apiUrl,
		token: i.token,
		region: i.region
	}), l && d.current.setChatToken(l));
	let m = d.current, h = t(async (t) => {
		let r = i.mode === "lead" ? L() : void 0, a = await V();
		try {
			n({
				type: "SET_LOADING",
				payload: !0
			});
			let o = await m.createSession({
				source: i.mode === "lead" ? "lead_bot" : "user_bot",
				visitor_name: t?.name || e.visitorName || i.userName,
				visitor_email: t?.email || e.visitorEmail || i.userEmail,
				visitor_metadata: r,
				turnstile_token: a ?? void 0
			});
			return o.access_token && (m.setChatToken(o.access_token), p(o.access_token)), f.current = o.session_key, n({
				type: "SET_SESSION",
				payload: o
			}), c(o.session_key), i.onSessionCreated?.(o.session_key), n({
				type: "SET_LOADING",
				payload: !1
			}), o;
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
		c,
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
			return c(null), p(null), m.setChatToken(""), n({
				type: "SET_LOADING",
				payload: !1
			}), null;
		}
	}, [
		m,
		n,
		c,
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
//#endregion
//#region src/services/websocket.ts
var G = [
	"history",
	"message",
	"message_ack",
	"agent_joined",
	"agent_typing",
	"heartbeat_ack",
	"error"
];
function K(e) {
	return typeof e == "object" && !!e && typeof e.type == "string" && G.includes(e.type);
}
var ce = class {
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
					K(t) && this.onMessage(t);
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
		let e = Math.min(h.WS_RECONNECT_BASE * 2 ** this.retryCount, h.WS_RECONNECT_MAX);
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null, this.retryCount++, this.connect();
		}, e);
	}
	startHeartbeat() {
		this.stopHeartbeat(), this.heartbeatTimer = setInterval(() => {
			this.send({ type: "heartbeat" });
		}, h.WS_HEARTBEAT_INTERVAL);
	}
	stopHeartbeat() {
		this.heartbeatTimer &&= (clearInterval(this.heartbeatTimer), null);
	}
};
//#endregion
//#region src/utils/uuid.ts
function le() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
		let t = Math.random() * 16 | 0;
		return (e === "x" ? t : t & 3 | 8).toString(16);
	});
}
//#endregion
//#region src/hooks/useChatWebSocket.ts
function ue(e, n) {
	let { state: i, dispatch: a, config: s } = k(), c = o(null), l = o(/* @__PURE__ */ new Map()), u = o(null);
	r(() => {
		if (!e) return;
		let t = new ce({
			url: `${s.apiUrl.startsWith("https") ? "wss" : "ws"}://${s.apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}${p(e)}`,
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
						}), (!i.isOpen || i.activeTab !== "messages") && a({ type: "INCREMENT_UNREAD" }));
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
						}, h.TYPING_TIMEOUT));
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
		s.apiUrl
	]);
	let d = t((e) => {
		if (!e || e.length > g.MAX_MESSAGE_LENGTH || !c.current) return;
		let t = le(), n = {
			id: t,
			session: 0,
			sender_type: s.mode === "lead" ? "visitor" : "user",
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
		}, h.MESSAGE_ACK_TIMEOUT);
		l.current.set(t, r);
	}, [
		s.mode,
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
//#endregion
//#region src/components/AgentAvatar.tsx
function de(e) {
	return e.split(" ").slice(0, 2).map((e) => e[0] ?? "").join("").toUpperCase();
}
var q = [
	"acx:bg-blue-500",
	"acx:bg-green-500",
	"acx:bg-purple-500",
	"acx:bg-orange-500",
	"acx:bg-pink-500",
	"acx:bg-teal-500"
];
function fe(e) {
	let t = 0;
	for (let n = 0; n < e.length; n++) t = e.charCodeAt(n) + ((t << 5) - t);
	return q[Math.abs(t) % q.length];
}
function J({ name: e, avatarUrl: t }) {
	return t ? /* @__PURE__ */ l("img", {
		src: t,
		alt: e,
		className: "acx:w-8 acx:h-8 acx:rounded-full acx:object-cover acx:flex-shrink-0"
	}) : /* @__PURE__ */ l("div", {
		className: `acx:w-8 acx:h-8 acx:rounded-full acx:flex acx:items-center acx:justify-center acx:text-white acx:text-xs acx:font-semibold acx:flex-shrink-0 ${fe(e)}`,
		children: de(e)
	});
}
//#endregion
//#region src/utils/time.ts
function Y(e) {
	let t = new Date(e), n = (/* @__PURE__ */ new Date()).getTime() - t.getTime(), r = Math.floor(n / 1e3), i = Math.floor(r / 60), a = Math.floor(i / 60), o = Math.floor(a / 24);
	return r < 60 ? "Just now" : i < 60 ? `${i}m ago` : a < 24 ? `${a}h ago` : o < 7 ? `${o}d ago` : t.toLocaleDateString(void 0, {
		month: "short",
		day: "numeric"
	});
}
function pe(e) {
	let t = new Date(e), n = /* @__PURE__ */ new Date(), r = new Date(n.getFullYear(), n.getMonth(), n.getDate()), i = new Date(t.getFullYear(), t.getMonth(), t.getDate()), a = Math.floor((r.getTime() - i.getTime()) / 864e5);
	return a === 0 ? "Today" : a === 1 ? "Yesterday" : t.toLocaleDateString(void 0, {
		weekday: "long",
		month: "short",
		day: "numeric"
	});
}
function me(e, t) {
	let n = new Date(e), r = new Date(t);
	return n.getFullYear() === r.getFullYear() && n.getMonth() === r.getMonth() && n.getDate() === r.getDate();
}
//#endregion
//#region src/utils/sanitize.ts
function he(e) {
	let t = ge(e);
	return t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"), t = t.replace(/__(.+?)__/g, "<strong>$1</strong>"), t = t.replace(/\*(.+?)\*/g, "<em>$1</em>"), t = t.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>"), t = t.replace(/`(.+?)`/g, "<code>$1</code>"), t = t.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, "<a href=\"$2\" target=\"_blank\" rel=\"noopener noreferrer\">$1</a>"), t = t.replace(/\n/g, "<br />"), t;
}
function ge(e) {
	let t = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#039;"
	};
	return e.replace(/[&<>"']/g, (e) => t[e] ?? e);
}
//#endregion
//#region src/components/MessageBubble.tsx
function _e({ message: e }) {
	let t = e.sender_type === "visitor" || e.sender_type === "user", n = e.sender_type === "system";
	return n && e.content_type === "auto_response" ? /* @__PURE__ */ u("div", {
		className: "acx:flex acx:gap-2 acx:mb-3 acx:justify-start",
		children: [/* @__PURE__ */ l(J, { name: e.sender_name }), /* @__PURE__ */ u("div", {
			className: "acx:max-w-[75%]",
			children: [
				e.sender_name && /* @__PURE__ */ l("span", {
					className: "acx:text-xs acx:text-gray-500 acx:ml-1 acx:mb-0.5 acx:block",
					children: e.sender_name
				}),
				/* @__PURE__ */ l("div", {
					className: "acx:px-3.5 acx:py-2.5 acx:rounded-2xl acx:text-sm acx:leading-relaxed acx:bg-amber-50 acx:text-gray-800 acx:rounded-bl-md acx:border acx:border-amber-200",
					children: /* @__PURE__ */ l("p", {
						className: "acx:whitespace-pre-wrap",
						children: e.content
					})
				}),
				/* @__PURE__ */ l("span", {
					className: "acx:text-[10px] acx:text-gray-400 acx:mt-0.5 acx:block",
					children: Y(e.created_at)
				})
			]
		})]
	}) : n ? /* @__PURE__ */ l("div", {
		className: "acx:flex acx:justify-center acx:py-2",
		children: /* @__PURE__ */ l("span", {
			className: "acx:text-xs acx:text-gray-400 acx:italic",
			children: e.content
		})
	}) : /* @__PURE__ */ u("div", {
		className: `acx:flex acx:gap-2 acx:mb-3 ${t ? "acx:justify-end" : "acx:justify-start"}`,
		children: [!t && /* @__PURE__ */ l(J, { name: e.sender_name }), /* @__PURE__ */ u("div", {
			className: `acx:max-w-[75%] ${t ? "acx:order-1" : ""}`,
			children: [
				!t && e.sender_name && /* @__PURE__ */ l("span", {
					className: "acx:text-xs acx:text-gray-500 acx:ml-1 acx:mb-0.5 acx:block",
					children: e.sender_name
				}),
				/* @__PURE__ */ l("div", {
					className: `acx:px-3.5 acx:py-2.5 acx:rounded-2xl acx:text-sm acx:leading-relaxed ${t ? "acx:bg-primary-600 acx:text-white acx:rounded-br-md" : (e.sender_type, "acx:bg-gray-100 acx:text-gray-800 acx:rounded-bl-md")}`,
					children: e.content_type === "markdown" ? /* @__PURE__ */ l("div", {
						className: "acx:prose acx:prose-sm",
						dangerouslySetInnerHTML: { __html: he(e.content) }
					}) : /* @__PURE__ */ l("p", {
						className: "acx:whitespace-pre-wrap",
						children: e.content
					})
				}),
				e.attachments?.length > 0 && /* @__PURE__ */ l("div", {
					className: "acx:mt-1 acx:space-y-1",
					children: e.attachments.map((e, t) => /* @__PURE__ */ l("a", {
						href: e.url,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "acx:block acx:text-xs acx:text-primary-600 acx:hover:underline acx:truncate",
						children: e.name
					}, t))
				}),
				/* @__PURE__ */ u("div", {
					className: `acx:flex acx:items-center acx:gap-1 acx:mt-0.5 ${t ? "acx:justify-end" : ""}`,
					children: [
						/* @__PURE__ */ l("span", {
							className: "acx:text-[10px] acx:text-gray-400",
							children: Y(e.created_at)
						}),
						t && e.status === "sending" && /* @__PURE__ */ l("span", {
							className: "acx:text-[10px] acx:text-gray-400",
							children: "Sending..."
						}),
						t && e.status === "failed" && /* @__PURE__ */ l("span", {
							className: "acx:text-[10px] acx:text-red-500",
							children: "Failed"
						})
					]
				})
			]
		})]
	});
}
//#endregion
//#region src/components/TypingIndicator.tsx
function ve({ agentName: e }) {
	return /* @__PURE__ */ u("div", {
		className: "acx:flex acx:items-center acx:gap-2 acx:mb-3",
		children: [/* @__PURE__ */ l(J, { name: e ?? "Agent" }), /* @__PURE__ */ l("div", {
			className: "acx:bg-gray-100 acx:rounded-2xl acx:rounded-bl-md acx:px-4 acx:py-3",
			children: /* @__PURE__ */ u("div", {
				className: "acx:flex acx:gap-1",
				children: [
					/* @__PURE__ */ l("span", { className: "acx:w-1.5 acx:h-1.5 acx:bg-gray-400 acx:rounded-full acx-typing-dot" }),
					/* @__PURE__ */ l("span", { className: "acx:w-1.5 acx:h-1.5 acx:bg-gray-400 acx:rounded-full acx-typing-dot" }),
					/* @__PURE__ */ l("span", { className: "acx:w-1.5 acx:h-1.5 acx:bg-gray-400 acx:rounded-full acx-typing-dot" })
				]
			})
		})]
	});
}
//#endregion
//#region src/components/MessageList.tsx
function ye({ messages: e, agentTyping: t }) {
	let n = o(null), i = o(null);
	return r(() => {
		n.current?.scrollIntoView({ behavior: "smooth" });
	}, [e.length, t.is_typing]), /* @__PURE__ */ u("div", {
		ref: i,
		className: "acx:flex-1 acx:overflow-y-auto acx:px-4 acx:py-3 acx:space-y-1",
		children: [
			e.map((t, n) => {
				let r = e[n - 1], i = !r || !me(r.created_at, t.created_at);
				return /* @__PURE__ */ u("div", { children: [i && /* @__PURE__ */ l("div", {
					className: "acx:flex acx:items-center acx:justify-center acx:py-3",
					children: /* @__PURE__ */ l("span", {
						className: "acx:text-xs acx:text-gray-400 acx:bg-gray-50 acx:px-3 acx:py-1 acx:rounded-full",
						children: pe(t.created_at)
					})
				}), /* @__PURE__ */ l(_e, { message: t })] }, t.temp_id ?? t.id);
			}),
			t.is_typing && /* @__PURE__ */ l(ve, { agentName: t.agent_name }),
			/* @__PURE__ */ l("div", { ref: n })
		]
	});
}
//#endregion
//#region src/components/MessageInput.tsx
function be({ onSend: e, onTyping: n, onFileUpload: r, mode: i, disabled: a, placeholder: d }) {
	let [f, p] = s(""), m = o(null), h = o(), _ = t(() => {
		let t = f.trim();
		!t || a || (e(t), p(""), n?.(!1));
	}, [
		f,
		a,
		e,
		n
	]);
	return /* @__PURE__ */ l("div", {
		className: "acx:border-t acx:border-gray-200 acx:bg-white acx:px-3 acx:py-2",
		children: /* @__PURE__ */ u("div", {
			className: "acx:flex acx:items-end acx:gap-2",
			children: [
				i === "user" && r && /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("button", {
					onClick: () => {
						m.current?.click();
					},
					className: "acx:p-1.5 acx:text-gray-400 acx:hover:text-gray-600 acx:transition-colors acx:flex-shrink-0",
					"aria-label": "Attach file",
					type: "button",
					children: /* @__PURE__ */ l(ae, { className: "acx:w-5 acx:h-5" })
				}), /* @__PURE__ */ l("input", {
					ref: m,
					type: "file",
					className: "acx:hidden",
					accept: g.ALLOWED_FILE_TYPES.join(","),
					multiple: !0,
					onChange: (e) => {
						e.target.files && e.target.files.length > 0 && (r?.(e.target.files), e.target.value = "");
					}
				})] }),
				/* @__PURE__ */ l("textarea", {
					value: f,
					onChange: (e) => {
						let t = e.target.value;
						t.length > g.MAX_MESSAGE_LENGTH || (p(t), n?.(!0), h.current && clearTimeout(h.current), h.current = setTimeout(() => n?.(!1), 2e3));
					},
					onKeyDown: (e) => {
						e.key === "Enter" && !e.shiftKey && (e.preventDefault(), _());
					},
					placeholder: d ?? "Type a message...",
					disabled: a,
					rows: 1,
					className: "acx:flex-1 acx:resize-none acx:border-0 acx:outline-none acx:text-sm acx:py-2 acx:max-h-24 acx:bg-transparent acx:placeholder:text-gray-400",
					style: { fieldSizing: "content" }
				}),
				/* @__PURE__ */ l("button", {
					onClick: _,
					disabled: !f.trim() || a,
					className: "acx:p-1.5 acx:text-primary-600 acx:transition-colors acx:flex-shrink-0 acx:enabled:hover:text-primary-700 acx:disabled:text-gray-300 acx:disabled:cursor-not-allowed",
					"aria-label": "Send message",
					type: "button",
					children: /* @__PURE__ */ l(re, { className: "acx:w-5 acx:h-5" })
				})
			]
		})
	});
}
//#endregion
//#region src/components/StatusBanner.tsx
function X({ isOnline: e, offlineMessage: t, responseTime: n }) {
	return e ? null : /* @__PURE__ */ l("div", {
		className: "acx:bg-amber-50 acx:border-b acx:border-amber-200 acx:px-4 acx:py-2.5",
		children: /* @__PURE__ */ u("div", {
			className: "acx:flex acx:items-center acx:gap-2",
			children: [/* @__PURE__ */ l("div", { className: "acx:w-2 acx:h-2 acx:rounded-full acx:bg-amber-400 acx:flex-shrink-0" }), /* @__PURE__ */ u("p", {
				className: "acx:text-xs acx:text-amber-800",
				children: [t ?? "We're currently offline.", n && /* @__PURE__ */ u("span", {
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
//#endregion
//#region src/components/ConnectionBanner.tsx
function Z({ isConnected: e, retryCount: t }) {
	return e || t === 0 ? null : t >= 5 ? /* @__PURE__ */ l("div", {
		className: "acx:bg-red-50 acx:border-b acx:border-red-200 acx:px-4 acx:py-2.5",
		children: /* @__PURE__ */ u("div", {
			className: "acx:flex acx:items-center acx:justify-between acx:gap-2",
			children: [/* @__PURE__ */ u("div", {
				className: "acx:flex acx:items-center acx:gap-2",
				children: [/* @__PURE__ */ l("div", { className: "acx:w-2 acx:h-2 acx:rounded-full acx:bg-red-400 acx:flex-shrink-0" }), /* @__PURE__ */ l("p", {
					className: "acx:text-xs acx:text-red-800",
					children: "Connection lost. Please refresh."
				})]
			}), /* @__PURE__ */ l("button", {
				type: "button",
				onClick: () => window.location.reload(),
				className: "acx:text-xs acx:font-medium acx:text-red-700 acx:bg-red-100 acx:px-2 acx:py-0.5 acx:rounded acx:hover:bg-red-200 acx:flex-shrink-0",
				children: "Refresh"
			})]
		})
	}) : /* @__PURE__ */ l("div", {
		className: "acx:bg-amber-50 acx:border-b acx:border-amber-200 acx:px-4 acx:py-2.5",
		children: /* @__PURE__ */ u("div", {
			className: "acx:flex acx:items-center acx:gap-2",
			children: [/* @__PURE__ */ u("svg", {
				className: "acx:w-3 acx:h-3 acx:text-amber-500 acx:animate-spin acx:flex-shrink-0",
				viewBox: "0 0 24 24",
				fill: "none",
				children: [/* @__PURE__ */ l("circle", {
					className: "acx:opacity-25",
					cx: "12",
					cy: "12",
					r: "10",
					stroke: "currentColor",
					strokeWidth: "4"
				}), /* @__PURE__ */ l("path", {
					className: "acx:opacity-75",
					fill: "currentColor",
					d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
				})]
			}), /* @__PURE__ */ l("p", {
				className: "acx:text-xs acx:text-amber-800",
				children: "Reconnecting..."
			})]
		})
	});
}
//#endregion
//#region src/components/LeadCaptureForm.tsx
function xe({ onSubmit: e, loading: t }) {
	let [n, r] = s(""), [i, a] = s("");
	return /* @__PURE__ */ u("form", {
		onSubmit: (t) => {
			t.preventDefault(), i.trim() && e({
				name: n.trim(),
				email: i.trim()
			});
		},
		className: "acx:p-4 acx:space-y-3",
		children: [
			/* @__PURE__ */ l("p", {
				className: "acx:text-sm acx:text-gray-600 acx:mb-1",
				children: "Before we start, could you share your details?"
			}),
			/* @__PURE__ */ l("input", {
				type: "text",
				value: n,
				onChange: (e) => r(e.target.value),
				placeholder: "Your name",
				className: "acx:w-full acx:px-3 acx:py-2 acx:border acx:border-gray-200 acx:rounded-lg acx:text-sm acx:outline-none acx:focus:border-primary-500 acx:focus:ring-1 acx:focus:ring-primary-500"
			}),
			/* @__PURE__ */ l("input", {
				type: "email",
				value: i,
				onChange: (e) => a(e.target.value),
				placeholder: "Your email *",
				required: !0,
				className: "acx:w-full acx:px-3 acx:py-2 acx:border acx:border-gray-200 acx:rounded-lg acx:text-sm acx:outline-none acx:focus:border-primary-500 acx:focus:ring-1 acx:focus:ring-primary-500"
			}),
			/* @__PURE__ */ u("p", {
				className: "acx:text-xs acx:text-gray-400 acx:leading-snug",
				children: [
					"By starting a chat, your details, messages, and the page you're on are shared with Acrux to respond to your enquiry — see our",
					" ",
					/* @__PURE__ */ l("a", {
						href: "https://www.acrux.education/legal/privacy-policy",
						target: "_blank",
						rel: "noopener noreferrer",
						className: "acx:underline acx:hover:text-gray-600",
						children: "Privacy Policy"
					}),
					"."
				]
			}),
			/* @__PURE__ */ l("button", {
				type: "submit",
				disabled: !i.trim() || t,
				className: "acx:w-full acx:bg-primary-600 acx:text-white acx:py-2.5 acx:rounded-lg acx:text-sm acx:font-medium acx:transition-colors acx:enabled:hover:bg-primary-700 acx:disabled:bg-gray-200 acx:disabled:text-gray-500 acx:disabled:cursor-not-allowed",
				children: t ? "Starting..." : "Start conversation"
			})
		]
	});
}
//#endregion
//#region src/tabs/MessagesTab.tsx
function Q() {
	let { state: e, dispatch: n, config: i } = k(), { session: a, sessionKey: d, accessToken: f, createSession: p } = W(), { sendMessage: m, sendTyping: h, isConnected: g } = ue(d, f), _ = e.operatingHours?.is_online ?? !1, v = e.operatingHours?.offline_message, y = e.operatingHours?.response_time, [b, x] = s(!1), S = o(null);
	r(() => {
		g && S.current && (m(S.current), S.current = null);
	}, [g, m]);
	let C = t(async (t) => {
		if (!a) {
			if (i.mode === "lead" && !e.visitorEmail) {
				S.current = t, x(!0);
				return;
			}
			try {
				S.current = t, await p();
			} catch {
				S.current = null;
			}
			return;
		}
		m(t);
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
	]), b && !a ? /* @__PURE__ */ u("div", {
		className: "acx:flex acx:flex-col acx:h-full",
		children: [
			/* @__PURE__ */ l(Z, {
				isConnected: g,
				retryCount: e.wsRetryCount
			}),
			/* @__PURE__ */ l(X, {
				isOnline: _,
				offlineMessage: v,
				responseTime: y
			}),
			/* @__PURE__ */ l(xe, {
				onSubmit: w,
				loading: e.loading
			})
		]
	}) : /* @__PURE__ */ u("div", {
		className: "acx:flex acx:flex-col acx:h-full",
		children: [
			/* @__PURE__ */ l(Z, {
				isConnected: g,
				retryCount: e.wsRetryCount
			}),
			/* @__PURE__ */ l(X, {
				isOnline: _,
				offlineMessage: v,
				responseTime: y
			}),
			e.messages.length === 0 && !a ? /* @__PURE__ */ l("div", {
				className: "acx:flex-1 acx:flex acx:flex-col acx:items-center acx:justify-center acx:px-6 acx:text-center",
				children: _ ? /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("p", {
					className: "acx:text-lg acx:font-semibold acx:text-gray-800 acx:mb-1",
					children: i.greeting || "Hi there! How can we help?"
				}), /* @__PURE__ */ l("p", {
					className: "acx:text-sm acx:text-gray-500",
					children: "Send a message to start a conversation"
				})] }) : /* @__PURE__ */ u(c, { children: [
					/* @__PURE__ */ l("div", {
						className: "acx:w-12 acx:h-12 acx:bg-amber-100 acx:rounded-full acx:flex acx:items-center acx:justify-center acx:mb-3",
						children: /* @__PURE__ */ u("svg", {
							className: "acx:w-6 acx:h-6 acx:text-amber-600",
							viewBox: "0 0 24 24",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "2",
							children: [
								/* @__PURE__ */ l("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6l-4 4V6c0-1.1.9-2 2-2z" }),
								/* @__PURE__ */ l("path", { d: "M12 11v1" }),
								/* @__PURE__ */ l("path", { d: "M12 8h.01" })
							]
						})
					}),
					/* @__PURE__ */ l("p", {
						className: "acx:text-sm acx:text-gray-600 acx:font-medium",
						children: "Leave us a message"
					}),
					/* @__PURE__ */ u("p", {
						className: "acx:text-xs acx:text-gray-400 acx:mt-1",
						children: [
							"Our team is currently away. Leave a message and we'll get back to you",
							y ? ` ${y}` : " as soon as possible",
							"."
						]
					})
				] })
			}) : /* @__PURE__ */ l(ye, {
				messages: e.messages,
				agentTyping: e.agentTyping
			}),
			/* @__PURE__ */ l(be, {
				onSend: C,
				onTyping: h,
				mode: i.mode,
				disabled: e.loading,
				placeholder: _ ? "Type a message..." : "Leave a message..."
			})
		]
	});
}
//#endregion
//#region src/hooks/useKBSearch.ts
function Se() {
	let { dispatch: e, config: n } = k(), i = o(), a = o();
	i.current ||= new y({
		baseUrl: n.apiUrl,
		token: n.token
	});
	let s = t((t) => {
		if (a.current && clearTimeout(a.current), !t.trim()) {
			e({
				type: "SET_KB_RESULTS",
				payload: []
			});
			return;
		}
		e({
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
		}, h.SEARCH_DEBOUNCE);
	}, [e]);
	return r(() => () => {
		a.current && clearTimeout(a.current);
	}, []), { search: s };
}
//#endregion
//#region src/components/SearchInput.tsx
function Ce({ onSearch: e, onSubmit: t, placeholder: n = "Search for help..." }) {
	let [i, a] = s(""), c = o();
	return r(() => (c.current && clearTimeout(c.current), c.current = setTimeout(() => {
		e(i.trim());
	}, h.SEARCH_DEBOUNCE), () => {
		c.current && clearTimeout(c.current);
	}), [i, e]), /* @__PURE__ */ u("div", {
		className: "acx:relative",
		children: [/* @__PURE__ */ l(ne, { className: "acx:absolute acx:left-3 acx:top-1/2 -acx-translate-y-1/2 acx:w-4 acx:h-4 acx:text-gray-400" }), /* @__PURE__ */ l("input", {
			type: "text",
			value: i,
			onChange: (e) => a(e.target.value),
			onKeyDown: (e) => {
				e.key === "Enter" && t && i.trim() && (e.preventDefault(), t(i.trim()));
			},
			placeholder: n,
			className: "acx:w-full acx:pl-9 acx:pr-4 acx:py-2.5 acx:border acx:border-gray-200 acx:rounded-lg acx:text-sm acx:outline-none acx:focus:border-primary-500 acx:focus:ring-1 acx:focus:ring-primary-500 acx:transition-colors acx:bg-white"
		})]
	});
}
//#endregion
//#region src/components/ArticleCard.tsx
function $({ article: e, onClick: t }) {
	return /* @__PURE__ */ u("button", {
		onClick: () => t(e),
		className: "acx:w-full acx:flex acx:items-center acx:justify-between acx:p-3 acx:rounded-lg acx:text-left acx:hover:bg-gray-50 acx:transition-colors acx:group",
		children: [/* @__PURE__ */ u("div", {
			className: "acx:flex-1 acx:min-w-0",
			children: [/* @__PURE__ */ l("h4", {
				className: "acx:text-sm acx:font-medium acx:text-gray-900 acx:truncate acx:group-hover:text-primary-600 acx:transition-colors",
				children: e.title
			}), e.summary && /* @__PURE__ */ l("p", {
				className: "acx:text-xs acx:text-gray-500 acx:mt-0.5 acx:line-clamp-2",
				children: e.summary
			})]
		}), /* @__PURE__ */ l(M, { className: "acx:w-4 acx:h-4 acx:text-gray-400 acx:flex-shrink-0 acx:ml-2" })]
	});
}
//#endregion
//#region src/tabs/HelpTab.tsx
function we() {
	let { state: e, dispatch: n, config: i } = k(), { search: a } = Se(), c = e.kbTopics, [d, f] = s(null), [p, m] = s([]), [h, g] = s(!1), [_, v] = s(null), [b, x] = s(!1), S = o();
	S.current ||= new y({
		baseUrl: i.apiUrl,
		token: i.token
	});
	let C = t((e) => {
		e || v(null), a(e);
	}, [a]), w = t(async (t) => {
		x(!0), v(null);
		try {
			let r = await S.current.askKB(t, e.session?.session_key);
			v(r), r.fallback && r.results.length > 0 && n({
				type: "SET_KB_RESULTS",
				payload: r.results
			});
		} catch {
			v(null);
		} finally {
			x(!1);
		}
	}, [n, e.session?.session_key]);
	r(() => {
		e.kbTopics?.length > 0 || S.current.getKBTopics().then((e) => n({
			type: "SET_KB_TOPICS",
			payload: Array.isArray(e) ? e : []
		})).catch(() => {});
	}, [e.kbTopics?.length, n]);
	let T = t(async (e) => {
		f(e), g(!0);
		try {
			let t = await S.current.getKBTopicArticles(e.slug);
			m(t);
		} catch {
			m([]);
		} finally {
			g(!1);
		}
	}, []), E = t((e) => {
		e.url && window.open(e.url, "_blank", "noopener,noreferrer");
	}, []), D = t(() => {
		f(null), m([]);
	}, []);
	if (d) return /* @__PURE__ */ u("div", {
		className: "acx:flex acx:flex-col acx:h-full acx:overflow-y-auto",
		children: [/* @__PURE__ */ u("div", {
			className: "acx:px-5 acx:py-4 acx:border-b acx:border-gray-100",
			children: [
				/* @__PURE__ */ u("button", {
					onClick: D,
					className: "acx:flex acx:items-center acx:gap-1 acx:text-sm acx:text-primary-600 acx:mb-2 acx:hover:text-primary-700",
					children: [/* @__PURE__ */ l(oe, { className: "acx:w-4 acx:h-4" }), "Back"]
				}),
				/* @__PURE__ */ l("h2", {
					className: "acx:text-base acx:font-semibold acx:text-gray-900",
					children: d.name
				}),
				/* @__PURE__ */ u("p", {
					className: "acx:text-xs acx:text-gray-500 acx:mt-0.5",
					children: [
						d.article_count,
						" article",
						d.article_count === 1 ? "" : "s"
					]
				})
			]
		}), /* @__PURE__ */ l("div", {
			className: "acx:p-4 acx:space-y-1",
			children: h ? /* @__PURE__ */ l("div", {
				className: "acx:py-4 acx:text-center acx:text-sm acx:text-gray-400",
				children: "Loading..."
			}) : p.length === 0 ? /* @__PURE__ */ l("div", {
				className: "acx:py-4 acx:text-center acx:text-sm acx:text-gray-400",
				children: "No articles found"
			}) : p.map((e) => /* @__PURE__ */ l($, {
				article: e,
				onClick: E
			}, e.id))
		})]
	});
	let O = e.kbLoading || e.kbResults.length > 0;
	return /* @__PURE__ */ u("div", {
		className: "acx:flex acx:flex-col acx:h-full acx:overflow-y-auto",
		children: [/* @__PURE__ */ u("div", {
			className: "acx:px-5 acx:py-4 acx:border-b acx:border-gray-100",
			children: [
				/* @__PURE__ */ l("h2", {
					className: "acx:text-base acx:font-semibold acx:text-gray-900",
					children: "Help Centre"
				}),
				/* @__PURE__ */ l("p", {
					className: "acx:text-xs acx:text-gray-500 acx:mt-0.5",
					children: "Ask a question or browse topics"
				}),
				/* @__PURE__ */ l("div", {
					className: "acx:mt-3",
					children: /* @__PURE__ */ l(Ce, {
						onSearch: C,
						onSubmit: w,
						placeholder: "Ask a question or search..."
					})
				}),
				b && /* @__PURE__ */ l("div", {
					className: "acx:mt-3 acx:py-3 acx:text-center acx:text-sm acx:text-gray-400",
					children: "Finding an answer..."
				}),
				!b && _?.answer && /* @__PURE__ */ u("div", {
					className: "acx:mt-3 acx:rounded-lg acx:bg-primary-50 acx:border acx:border-primary-100 acx:p-3",
					children: [/* @__PURE__ */ l("p", {
						className: "acx:text-sm acx:text-gray-800 acx:whitespace-pre-line",
						children: _.answer
					}), _.sources.length > 0 && /* @__PURE__ */ l("div", {
						className: "acx:mt-2 acx:pt-2 acx:border-t acx:border-primary-100 acx:space-y-1",
						children: _.sources.map((e) => /* @__PURE__ */ u("button", {
							onClick: () => E(e),
							className: "acx:block acx:text-xs acx:text-primary-600 acx:hover:text-primary-700 acx:text-left",
							children: [e.title, " →"]
						}, e.id))
					})]
				}),
				!b && _?.fallback && /* @__PURE__ */ l("p", {
					className: "acx:mt-3 acx:text-xs acx:text-gray-500",
					children: "We couldn't find a direct answer — try these articles, or send us a message."
				})
			]
		}), O ? /* @__PURE__ */ l("div", {
			className: "acx:p-4 acx:space-y-1",
			children: e.kbLoading ? /* @__PURE__ */ l("div", {
				className: "acx:py-4 acx:text-center acx:text-sm acx:text-gray-400",
				children: "Searching..."
			}) : e.kbResults.slice(0, 5).map((e) => /* @__PURE__ */ l($, {
				article: e,
				onClick: E
			}, e.id))
		}) : /* @__PURE__ */ l("div", {
			className: "acx:p-4 acx:space-y-1",
			children: c.length === 0 ? /* @__PURE__ */ l("div", {
				className: "acx:py-8 acx:text-center",
				children: /* @__PURE__ */ l("p", {
					className: "acx:text-sm acx:text-gray-400",
					children: "No help topics available"
				})
			}) : c.map((e) => /* @__PURE__ */ u("button", {
				onClick: () => T(e),
				className: "acx:w-full acx:flex acx:items-center acx:justify-between acx:p-3 acx:rounded-lg acx:text-left acx:hover:bg-gray-50 acx:transition-colors",
				children: [/* @__PURE__ */ u("div", { children: [/* @__PURE__ */ l("h4", {
					className: "acx:text-sm acx:font-medium acx:text-gray-900",
					children: e.name
				}), /* @__PURE__ */ u("p", {
					className: "acx:text-xs acx:text-gray-500",
					children: [
						e.article_count,
						" article",
						e.article_count === 1 ? "" : "s"
					]
				})] }), /* @__PURE__ */ l(M, { className: "acx:w-4 acx:h-4 acx:text-gray-400" })]
			}, e.id))
		})]
	});
}
//#endregion
//#region src/ChatWidget.tsx
function Te(e) {
	return /* @__PURE__ */ l(E, {
		...e,
		children: /* @__PURE__ */ l(Ee, { position: e.position ?? m.POSITION })
	});
}
function Ee({ position: e }) {
	let { state: t, dispatch: n } = k(), [r, i] = s(!1);
	return /* @__PURE__ */ u("div", {
		className: "acrux-chat-widget",
		children: [r && /* @__PURE__ */ u("div", {
			className: `acx:fixed acx:bottom-20 ${e === "bottom-right" ? "acx:right-4 acx:sm:right-6" : "acx:left-4 acx:sm:left-6"} acx:z-[9999] acx:w-[380px] acx:max-w-[calc(100vw-2rem)] acx:h-[600px] acx:max-h-[calc(100vh-6rem)] acx:bg-white acx:rounded-2xl acx:shadow-2xl acx:flex acx:flex-col acx:overflow-hidden acx:animate-slide-up`,
			role: "dialog",
			"aria-label": "Chat widget",
			children: [
				/* @__PURE__ */ u("div", {
					className: "acx:flex acx:items-center acx:justify-between acx:px-5 acx:py-4 acx:bg-primary-600 acx:text-white",
					children: [/* @__PURE__ */ u("div", {
						className: "acx:flex acx:items-center acx:gap-2.5",
						children: [/* @__PURE__ */ l("svg", {
							xmlns: "http://www.w3.org/2000/svg",
							width: "24",
							height: "24",
							viewBox: "0 0 375 375",
							className: "acx:flex-shrink-0",
							children: /* @__PURE__ */ l("path", {
								fill: "#ffde5a",
								d: "M 366.039062 86.546875 L 209.414062 117.519531 L 156.304688 4.511719 L 132.847656 127.152344 L 8.957031 142.746094 L 120.160156 174.398438 L 91.242188 158.484375 L 154.742188 150.492188 L 166.765625 87.632812 L 193.984375 145.554688 L 282.449219 125.828125 L 210.808594 181.351562 L 238.035156 239.269531 L 181.964844 208.414062 L 14 374.972656 L 185.960938 240.164062 L 295.355469 300.371094 L 242.242188 187.359375 L 366.039062 86.546875",
								fillRule: "nonzero"
							})
						}), /* @__PURE__ */ l("h2", {
							className: "acx:text-lg acx:font-semibold",
							children: "Acrux Chat"
						})]
					}), /* @__PURE__ */ l("button", {
						onClick: () => i(!1),
						className: "acx:p-1 acx:rounded-md acx:bg-white acx:transition-colors acx:hover:bg-gray-100",
						"aria-label": "Close chat",
						children: /* @__PURE__ */ l("svg", {
							width: "20",
							height: "20",
							viewBox: "0 0 20 20",
							fill: "none",
							stroke: "#006383",
							strokeWidth: "2",
							strokeLinecap: "round",
							children: /* @__PURE__ */ l("path", { d: "M15 5L5 15M5 5l10 10" })
						})
					})]
				}),
				/* @__PURE__ */ u("div", {
					className: "acx:flex-1 acx:overflow-hidden",
					children: [t.activeTab === "messages" && /* @__PURE__ */ l(Q, {}), t.activeTab === "help" && /* @__PURE__ */ l(we, {})]
				}),
				/* @__PURE__ */ l(P, {
					activeTab: t.activeTab,
					onTabChange: (e) => n({
						type: "SET_TAB",
						payload: e
					})
				})
			]
		}), /* @__PURE__ */ l(se, {
			isOpen: r,
			onClick: () => i(!r),
			position: e
		})]
	});
}
//#endregion
export { Te as ChatWidget };
