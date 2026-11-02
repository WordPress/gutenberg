import{n as e}from"./rolldown-runtime-Db01ssZC.js";var t,i,n,r,o,a,u,s,d,l,v,y,f,p,m,h,g,_;function init_dist(){return(init_dist=e((()=>{t={APPLY:`apply`,CALLBACK:`callback`,PING:`ping`,PONG:`pong`},i={PROVIDER:`provider`,INJECTOR:`injector`},n=e=>{let o=!!e?.type&&Object.values(t).includes(e.type),u=!!e?.id&&typeof e.id==`string`,d=!!e?.path&&Array.isArray(e.path)&&e.path.every(e=>typeof e==`string`),v=!!e?.sender&&Object.values(i).includes(e.sender),y=e?.callbackIds===void 0||Array.isArray(e.callbackIds)&&e.callbackIds.every(e=>typeof e==`string`),b=e?.args===void 0||Array.isArray(e.args),x=e?.error===void 0||typeof e.error==`string`,S=!!e?.meta&&e.meta!==null&&typeof e.meta==`object`,C=!!e?.namespace&&typeof e.namespace==`string`,w=!!e?.timeStamp&&typeof e.timeStamp==`number`;return o&&u&&d&&v&&y&&b&&x&&S&&C&&w},r=()=>[...[,,,,]].map(()=>Math.floor(Math.random()*(2**53-1)).toString(16)).join(`-`),o=r,a=(e,t,...i)=>{let o=setTimeout(()=>{clearTimeout(o),e(...i),o=setInterval(e,t,...i)},0);return()=>clearInterval(o)},u=a,s=(e,t)=>t!==void 0&&e instanceof t,d=s,l=e=>{let t=new WeakSet,n=e=>!e||typeof e!=`object`||t.has(e)?[]:(t.add(e),d(e,globalThis.ArrayBuffer)||d(e,globalThis.MessagePort)||d(e,globalThis.ImageBitmap)||d(e,globalThis.OffscreenCanvas)||d(e,globalThis.AudioData)||d(e,globalThis.VideoFrame)||d(e,globalThis.RTCDataChannel)||d(e,globalThis.MediaSourceHandle)||d(e,globalThis.MIDIAccess)||d(e,globalThis.MediaStreamTrack)||d(e,globalThis.ReadableStream)||d(e,globalThis.WritableStream)||d(e,globalThis.TransformStream)?[e]:Array.isArray(e)?e.flatMap(n):Object.values(e).flatMap(n));return n(e)},v=l,y=Symbol(`PROXY_MARKER`),f=async(e,d)=>{let y,c,b=new Set,x=new Promise((x,S)=>{y=u(async()=>{try{let u=o(),y=await e.onMessage(e=>{if(!n(e))return;let o=e;o.namespace===d.namespace&&o.sender===i.PROVIDER&&o.type===t.PONG&&o.id===u&&x()});y&&b.add(y);let S={type:t.PING,sender:i.INJECTOR,id:u,path:[],meta:{},namespace:d.namespace,timeStamp:Date.now()};e.sendMessage(S,d.transfer?v(S):[])}catch(e){S(e)}},d.heartbeatInterval)}),S=new Promise((e,t)=>{let i=setTimeout(()=>t(Error(`Provider unavailable: heartbeat check timeout ${d.heartbeatTimeout}ms.`)),d.heartbeatTimeout);c=()=>clearTimeout(i)});await Promise.race([x,S]).finally(()=>{y(),c(),b.forEach(e=>e()),b.clear()})},p=(e,o,u)=>(o.onMessage(async d=>{if(!n(d))return;let y=d;if(y.namespace===u.namespace&&y.sender===i.INJECTOR)switch(y.type){case t.PING:{let e={type:t.PONG,sender:i.PROVIDER,id:y.id,path:y.path,meta:y.meta,namespace:u.namespace,timeStamp:Date.now()};o.sendMessage(e,u.transfer?v(e):[]);break}case t.APPLY:{try{let d=y.args?.map(e=>y.callbackIds?.includes(e)?(...d)=>{let b={type:t.CALLBACK,sender:i.PROVIDER,id:e,path:y.path,meta:y.meta,data:d,namespace:u.namespace,timeStamp:Date.now()};o.sendMessage(b,u.transfer?v(b):[])}:e);y.data=await(y.path?.reduce((e,t)=>e[t],e)).apply(e,d||[])}catch(e){y.error=e.message}let d={type:t.APPLY,sender:i.PROVIDER,id:y.id,path:y.path,data:y.data,error:y.error,meta:y.meta,namespace:u.namespace,timeStamp:Date.now()};o.sendMessage(d,u.transfer?v(d):[]);break}}}),e),m=(e,u,d)=>{let s=(e,b)=>new Proxy(e,{get(e,t,i){if(e[y])return Reflect.get(e,t,i);let r=()=>{};return r[y]=!0,s(r,[...b,t])},apply(e,y,x){return new Promise(async(e,y)=>{try{d.heartbeatCheck&&await f(u,d);let S=[],C=x.map(e=>{if(typeof e==`function`){let v=o();return S.push(v),u.onMessage(o=>{if(!n(o))return;let u=o;u.namespace===d.namespace&&u.sender===i.PROVIDER&&u.type===t.CALLBACK&&u.id===v&&e(...u.data)}),v}return e}),w=o(),T=await u.onMessage(o=>{if(!n(o))return;let u=o;u.namespace===d.namespace&&u.sender===i.PROVIDER&&u.type===t.APPLY&&u.id===w&&(u.error?y(Error(u.error)):e(u.data),T?.())}),E={type:t.APPLY,sender:i.INJECTOR,id:w,path:b,args:C,meta:{},callbackIds:S,timeStamp:Date.now(),namespace:d.namespace};u.sendMessage(E,d.transfer?v(E):[])}catch(e){y(e)}})}});return s(e,[])},h=(e,t)=>{let i;return(o,...u)=>i??=p(e(...u),o,t)},g=(e,t)=>{let i;return o=>i??=m(t.backup?Object.freeze(e()):{},o,t)},_=(e,t)=>{let i={namespace:t?.namespace??`__comctx__`,heartbeatCheck:t?.heartbeatCheck??!0,heartbeatInterval:t?.heartbeatInterval??300,heartbeatTimeout:t?.heartbeatTimeout??1e3,transfer:t?.transfer??!1,backup:t?.backup??!1};if(i.heartbeatTimeout<=i.heartbeatInterval)throw Error(`Invalid heartbeat config: timeout (${i.heartbeatTimeout}ms) must exceed interval (${i.heartbeatInterval}ms).`);return[h(e,i),g(e,i)]}})))()}var b;function init_types(){return(init_types=e((()=>{b=Symbol(`worker`)})))()}function failWorker(e,t){e.failure??=t;for(let t of e.pendingRejects)t(e.failure);e.pendingRejects.clear()}function wrap(e){let[,t]=_(()=>({}),{namespace:`__wordpress_worker__`,heartbeatCheck:!1,transfer:!0}),i=t(new WorkerInjectAdapter(e)),onError=e=>{let t=e.message;failWorker(o,Error(t?`Worker error: ${t}`:`Worker error: the worker crashed or failed to load.`))},onMessageError=()=>{failWorker(o,Error(`Worker error: a message could not be deserialized.`))};e.addEventListener(`error`,onError),e.addEventListener(`messageerror`,onMessageError);let o={worker:e,pendingRejects:new Set,removeListeners:()=>{e.removeEventListener(`error`,onError),e.removeEventListener(`messageerror`,onMessageError)}},u=new Proxy(i,{get(t,i){if(i===b)return e;let u=Reflect.get(t,i);return typeof u==`function`?(...e)=>o.failure?Promise.reject(o.failure):new Promise((t,i)=>{o.pendingRejects.add(i),Promise.resolve().then(()=>u(...e)).then(e=>{o.pendingRejects.delete(i),t(e)},e=>{o.pendingRejects.delete(i),i(e)})}):u}});return x.set(u,o),u}function terminate(e){let t=x.get(e);t&&(failWorker(t,Error(`Worker was terminated.`)),t.removeListeners(),x.delete(e),t.worker.terminate())}var WorkerInjectAdapter,x;function init_main_thread(){return(init_main_thread=e((()=>{init_dist(),init_types(),WorkerInjectAdapter=class{worker;constructor(e){this.worker=e}sendMessage=(e,t)=>{this.worker.postMessage(e,t)};onMessage=e=>{let handler=t=>e(t.data);return this.worker.addEventListener(`message`,handler),()=>this.worker.removeEventListener(`message`,handler)}},x=new WeakMap})))()}var S;function init_worker_code(){return(init_worker_code=e((()=>{S=`// node_modules/.store/comctx@1.4.3-NST-Oqps_RN8o63jsp8Qxg/node_modules/comctx/core/dist/index.js
const e = {
	APPLY: \`apply\`,
	CALLBACK: \`callback\`,
	PING: \`ping\`,
	PONG: \`pong\`
};
const t = {
	PROVIDER: \`provider\`,
	INJECTOR: \`injector\`
};
const n = (n) => {
	let r = !!n?.type && Object.values(e).includes(n.type), i = !!n?.id && typeof n.id == \`string\`, a = !!n?.path && Array.isArray(n.path) && n.path.every((e) => typeof e == \`string\`), o = !!n?.sender && Object.values(t).includes(n.sender), s = n?.callbackIds === void 0 || Array.isArray(n.callbackIds) && n.callbackIds.every((e) => typeof e == \`string\`), c = n?.args === void 0 || Array.isArray(n.args), l = n?.error === void 0 || typeof n.error == \`string\`, u = !!n?.meta && n.meta !== null && typeof n.meta == \`object\`, d = !!n?.namespace && typeof n.namespace == \`string\`, f = !!n?.timeStamp && typeof n.timeStamp == \`number\`;
	return r && i && a && o && s && c && l && u && d && f;
};
const r = () => [...[
	,
	,
	,
	,
]].map(() => Math.floor(Math.random() * (2 ** 53 - 1)).toString(16)).join(\`-\`);
var i = r;
const a = (e, t, ...n) => {
	let r = setTimeout(() => {
		clearTimeout(r), e(...n), r = setInterval(e, t, ...n);
	}, 0);
	return () => clearInterval(r);
};
var o = a;
const s = (e, t) => t !== void 0 && e instanceof t;
var c = s;
const l = (e) => {
	let t = /* @__PURE__ */ new WeakSet(), n = (e) => !e || typeof e != \`object\` || t.has(e) ? [] : (t.add(e), c(e, globalThis.ArrayBuffer) || c(e, globalThis.MessagePort) || c(e, globalThis.ImageBitmap) || c(e, globalThis.OffscreenCanvas) || c(e, globalThis.AudioData) || c(e, globalThis.VideoFrame) || c(e, globalThis.RTCDataChannel) || c(e, globalThis.MediaSourceHandle) || c(e, globalThis.MIDIAccess) || c(e, globalThis.MediaStreamTrack) || c(e, globalThis.ReadableStream) || c(e, globalThis.WritableStream) || c(e, globalThis.TransformStream) ? [e] : Array.isArray(e) ? e.flatMap(n) : Object.values(e).flatMap(n));
	return n(e);
};
var u = l;
const d = Symbol(\`PROXY_MARKER\`);
const f = async (r, a) => {
	let s, c, l = /* @__PURE__ */ new Set(), d = new Promise((c, d) => {
		s = o(async () => {
			try {
				let o = i(), s = await r.onMessage((r) => {
					if (!n(r)) return;
					let i = r;
					i.namespace === a.namespace && i.sender === t.PROVIDER && i.type === e.PONG && i.id === o && c();
				});
				s && l.add(s);
				let d = {
					type: e.PING,
					sender: t.INJECTOR,
					id: o,
					path: [],
					meta: {},
					namespace: a.namespace,
					timeStamp: Date.now()
				};
				r.sendMessage(d, a.transfer ? u(d) : []);
			} catch (e) {
				d(e);
			}
		}, a.heartbeatInterval);
	}), f = new Promise((e, t) => {
		let n = setTimeout(() => t(Error(\`Provider unavailable: heartbeat check timeout \${a.heartbeatTimeout}ms.\`)), a.heartbeatTimeout);
		c = () => clearTimeout(n);
	});
	await Promise.race([d, f]).finally(() => {
		s(), c(), l.forEach((e) => e()), l.clear();
	});
};
const p = (r, i, a) => (i.onMessage(async (o) => {
	if (!n(o)) return;
	let s = o;
	if (s.namespace === a.namespace && s.sender === t.INJECTOR) switch (s.type) {
		case e.PING: {
			let n = {
				type: e.PONG,
				sender: t.PROVIDER,
				id: s.id,
				path: s.path,
				meta: s.meta,
				namespace: a.namespace,
				timeStamp: Date.now()
			};
			i.sendMessage(n, a.transfer ? u(n) : []);
			break;
		}
		case e.APPLY: {
			try {
				let n = s.args?.map((n) => s.callbackIds?.includes(n) ? (...r) => {
					let o = {
						type: e.CALLBACK,
						sender: t.PROVIDER,
						id: n,
						path: s.path,
						meta: s.meta,
						data: r,
						namespace: a.namespace,
						timeStamp: Date.now()
					};
					i.sendMessage(o, a.transfer ? u(o) : []);
				} : n);
				s.data = await (s.path?.reduce((e, t) => e[t], r)).apply(r, n || []);
			} catch (e) {
				s.error = e.message;
			}
			let n = {
				type: e.APPLY,
				sender: t.PROVIDER,
				id: s.id,
				path: s.path,
				data: s.data,
				error: s.error,
				meta: s.meta,
				namespace: a.namespace,
				timeStamp: Date.now()
			};
			i.sendMessage(n, a.transfer ? u(n) : []);
			break;
		}
	}
}), r);
const m = (r, a, o) => {
	let s = (r, c) => {
		return new Proxy(r, {
			get(e, t, n) {
				if (e[d]) return Reflect.get(e, t, n);
				let r = () => {};
				return r[d] = !0, s(r, [...c, t]);
			},
			apply(r, s, l) {
				return new Promise(async (r, s) => {
					try {
						o.heartbeatCheck && await f(a, o);
						let d = [], p = l.map((r) => {
							if (typeof r == \`function\`) {
								let s = i();
								return d.push(s), a.onMessage((i) => {
									if (!n(i)) return;
									let a = i;
									a.namespace === o.namespace && a.sender === t.PROVIDER && a.type === e.CALLBACK && a.id === s && r(...a.data);
								}), s;
							} else return r;
						}), m = i(), h = await a.onMessage((i) => {
							if (!n(i)) return;
							let a = i;
							a.namespace === o.namespace && a.sender === t.PROVIDER && a.type === e.APPLY && a.id === m && (a.error ? s(Error(a.error)) : r(a.data), h?.());
						}), g = {
							type: e.APPLY,
							sender: t.INJECTOR,
							id: m,
							path: c,
							args: p,
							meta: {},
							callbackIds: d,
							timeStamp: Date.now(),
							namespace: o.namespace
						};
						a.sendMessage(g, o.transfer ? u(g) : []);
					} catch (e) {
						s(e);
					}
				});
			}
		});
	};
	return s(r, []);
};
const h = (e, t) => {
	let n;
	return (r, ...i) => n ??= p(e(...i), r, t);
};
const g = (e, t) => {
	let n;
	return (r) => n ??= m(t.backup ? Object.freeze(e()) : {}, r, t);
};
const _ = (e, t) => {
	let n = {
		namespace: t?.namespace ?? \`__comctx__\`,
		heartbeatCheck: t?.heartbeatCheck ?? !0,
		heartbeatInterval: t?.heartbeatInterval ?? 300,
		heartbeatTimeout: t?.heartbeatTimeout ?? 1e3,
		transfer: t?.transfer ?? !1,
		backup: t?.backup ?? !1
	};
	if (n.heartbeatTimeout <= n.heartbeatInterval) throw Error(\`Invalid heartbeat config: timeout (\${n.heartbeatTimeout}ms) must exceed interval (\${n.heartbeatInterval}ms).\`);
	return [h(e, n), g(e, n)];
};

// packages/worker-threads/build-module/worker-thread.mjs
/**
* Adapter for providing (worker exposing methods to main thread).
*/
var WorkerProvideAdapter = class {
	sendMessage = (message, transfer) => {
		self.postMessage(message, { transfer });
	};
	onMessage = (callback) => {
		const handler = (event) => callback(event.data);
		self.addEventListener("message", handler);
		return () => self.removeEventListener("message", handler);
	};
};
/**
* Normalizes an arbitrary thrown value into an \`Error\` with a non-empty
* message.
*
* The RPC reply sent back to the main thread only carries the error
* *message*. Thrown values without one - e.g. a \`WebAssembly.Exception\`
* escaping a wasm module, a thrown string, or an \`Error\` with an empty
* message - would otherwise be indistinguishable from a successful
* \`undefined\` result on the main thread, so the caller's promise would
* resolve instead of reject. See
* https://github.com/WordPress/gutenberg/issues/80259.
*
* @param error - Thrown value.
* @return An \`Error\` with a non-empty message.
*/
function normalizeThrowable(error) {
	if (error instanceof Error && error.message) return error;
	let message = "";
	try {
		message = String(error);
	} catch {}
	return new Error(message || "Unknown error in worker thread");
}
/**
* Wraps all methods of a target object so that any thrown value is
* normalized into an \`Error\` with a non-empty message before it reaches
* the RPC layer.
*
* @param target - Object containing methods to wrap.
* @return A copy of the object with all methods wrapped.
*/
function withNormalizedErrors(target) {
	const wrapped = {};
	for (const key of Object.keys(target)) {
		const value = target[key];
		if (typeof value !== "function") {
			wrapped[key] = value;
			continue;
		}
		wrapped[key] = async (...args) => {
			try {
				return await value.apply(target, args);
			} catch (error) {
				throw normalizeThrowable(error);
			}
		};
	}
	return wrapped;
}
/**
* Exposes an object's methods to be called from the main thread.
*
* This function should be called in the worker script to make methods
* available for RPC calls. Only methods (functions) on the object will
* be exposed; other properties are ignored.
*
* @example
* \`\`\`typescript
* // worker.ts
* import { expose } from '@wordpress/worker-threads/worker';
*
* const api = {
*   async processImage(buffer: ArrayBuffer): Promise<ArrayBuffer> {
*     // ... processing logic
*     return resultBuffer;
*   },
*
*   async calculateSum(a: number, b: number): Promise<number> {
*     return a + b;
*   }
* };
*
* expose(api);
*
* // Export the type for use with wrap() on main thread
* export type WorkerAPI = typeof api;
* \`\`\`
*
* @param target - Object containing methods to expose to the main thread.
*/
function expose(target) {
	const [provide] = _(() => withNormalizedErrors(target), {
		namespace: "__wordpress_worker__",
		heartbeatCheck: false,
		transfer: true
	});
	provide(new WorkerProvideAdapter());
}

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/misc.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
function assert(x) {
	if (!x) throw new Error("Assertion failed.");
}
const normalizeRotation = (rotation) => {
	const mappedRotation = (rotation % 360 + 360) % 360;
	if (mappedRotation === 0 || mappedRotation === 90 || mappedRotation === 180 || mappedRotation === 270) return mappedRotation;
	else throw new Error(\`Invalid rotation \${rotation}.\`);
};
const last = (arr) => {
	return arr && arr[arr.length - 1];
};
const isU32 = (value) => {
	return value >= 0 && value < 2 ** 32;
};
/** Reads an exponential-Golomb universal code from a Bitstream.  */
const readExpGolomb = (bitstream) => {
	let leadingZeroBits = 0;
	while (bitstream.readBits(1) === 0 && leadingZeroBits < 32) leadingZeroBits++;
	if (leadingZeroBits >= 32) throw new Error("Invalid exponential-Golomb code.");
	return (1 << leadingZeroBits) - 1 + bitstream.readBits(leadingZeroBits);
};
/** Reads a signed exponential-Golomb universal code from a Bitstream. */
const readSignedExpGolomb = (bitstream) => {
	const codeNum = readExpGolomb(bitstream);
	return (codeNum & 1) === 0 ? -(codeNum >> 1) : codeNum + 1 >> 1;
};
const writeBits = (bytes, start, end, value) => {
	for (let i = start; i < end; i++) {
		const byteIndex = Math.floor(i / 8);
		let byte = bytes[byteIndex];
		const bitIndex = 7 - (i & 7);
		byte &= ~(1 << bitIndex);
		byte |= (value & 1 << end - i - 1) >> end - i - 1 << bitIndex;
		bytes[byteIndex] = byte;
	}
};
const toUint8Array = (source) => {
	if (source.constructor === Uint8Array) return source;
	else if (ArrayBuffer.isView(source)) return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
	else return new Uint8Array(source);
};
const toDataView = (source) => {
	if (source.constructor === DataView) return source;
	else if (ArrayBuffer.isView(source)) return new DataView(source.buffer, source.byteOffset, source.byteLength);
	else return new DataView(source);
};
const textEncoder = /* #__PURE__ */ new TextEncoder();
const COLOR_PRIMARIES_MAP = {
	bt709: 1,
	bt470bg: 5,
	smpte170m: 6,
	bt2020: 9,
	smpte432: 12
};
const TRANSFER_CHARACTERISTICS_MAP = {
	"bt709": 1,
	"smpte170m": 6,
	"linear": 8,
	"iec61966-2-1": 13,
	"pq": 16,
	"hlg": 18
};
const MATRIX_COEFFICIENTS_MAP = {
	"rgb": 0,
	"bt709": 1,
	"bt470bg": 5,
	"smpte170m": 6,
	"bt2020-ncl": 9
};
const colorSpaceIsComplete = (colorSpace) => {
	return !!colorSpace && !!colorSpace.primaries && !!colorSpace.transfer && !!colorSpace.matrix && colorSpace.fullRange !== void 0;
};
const isAllowSharedBufferSource = (x) => {
	return x instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && x instanceof SharedArrayBuffer || ArrayBuffer.isView(x);
};
var AsyncMutex = class {
	constructor() {
		this.currentPromise = Promise.resolve();
		this.pending = 0;
	}
	async acquire() {
		let resolver;
		const nextPromise = new Promise((resolve) => {
			let resolved = false;
			resolver = () => {
				if (resolved) return;
				resolve();
				this.pending--;
				resolved = true;
			};
		});
		const currentPromiseAlias = this.currentPromise;
		this.currentPromise = nextPromise;
		this.pending++;
		await currentPromiseAlias;
		return resolver;
	}
};
/** Returns the largest index i such that val[i] <= key, or -1 if no such index exists. */
const binarySearchLessOrEqual = (arr, key, valueGetter) => {
	let low = 0;
	let high = arr.length - 1;
	let ans = -1;
	while (low <= high) {
		const mid = low + (high - low + 1) / 2 | 0;
		if (valueGetter(arr[mid]) <= key) {
			ans = mid;
			low = mid + 1;
		} else high = mid - 1;
	}
	return ans;
};
const promiseWithResolvers = () => {
	let resolve;
	let reject;
	return {
		promise: new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		}),
		resolve,
		reject
	};
};
const assertNever = (x) => {
	throw new Error(\`Unexpected value: \${x}\`);
};
const getUint24 = (view, byteOffset, littleEndian) => {
	const byte1 = view.getUint8(byteOffset);
	const byte2 = view.getUint8(byteOffset + 1);
	const byte3 = view.getUint8(byteOffset + 2);
	if (littleEndian) return byte1 | byte2 << 8 | byte3 << 16;
	else return byte1 << 16 | byte2 << 8 | byte3;
};
const setUint24 = (view, byteOffset, value, littleEndian) => {
	value = value >>> 0;
	value = value & 16777215;
	if (littleEndian) {
		view.setUint8(byteOffset, value & 255);
		view.setUint8(byteOffset + 1, value >>> 8 & 255);
		view.setUint8(byteOffset + 2, value >>> 16 & 255);
	} else {
		view.setUint8(byteOffset, value >>> 16 & 255);
		view.setUint8(byteOffset + 1, value >>> 8 & 255);
		view.setUint8(byteOffset + 2, value & 255);
	}
};
const roundToMultiple = (value, multiple) => {
	return Math.round(value / multiple) * multiple;
};
const roundToDivisor = (value, multiple) => {
	return Math.round(value * multiple) / multiple;
};
const floorToDivisor = (value, multiple) => {
	return Math.floor(value * multiple) / multiple;
};
const ISO_639_2_REGEX = /^[a-z]{3}$/;
const isIso639Dash2LanguageCode = (x) => {
	return ISO_639_2_REGEX.test(x);
};
const SECOND_TO_MICROSECOND_FACTOR = 1e6 * (1 + Number.EPSILON);
const computeRationalApproximation = (x, maxDenominator) => {
	const sign = x < 0 ? -1 : 1;
	x = Math.abs(x);
	let prevNumerator = 0, prevDenominator = 1;
	let currNumerator = 1, currDenominator = 0;
	let remainder = x;
	while (true) {
		const integer = Math.floor(remainder);
		const nextNumerator = integer * currNumerator + prevNumerator;
		const nextDenominator = integer * currDenominator + prevDenominator;
		if (nextDenominator > maxDenominator) return {
			num: sign * currNumerator,
			den: currDenominator
		};
		prevNumerator = currNumerator;
		prevDenominator = currDenominator;
		currNumerator = nextNumerator;
		currDenominator = nextDenominator;
		remainder = 1 / (remainder - integer);
		if (!isFinite(remainder)) break;
	}
	return {
		num: sign * currNumerator,
		den: currDenominator
	};
};
var CallSerializer = class {
	constructor() {
		this.currentPromise = Promise.resolve();
	}
	call(fn) {
		return this.currentPromise = this.currentPromise.then(fn);
	}
};
let isFirefoxCache = null;
const isFirefox = () => {
	if (isFirefoxCache !== null) return isFirefoxCache;
	return isFirefoxCache = typeof navigator !== "undefined" && navigator.userAgent?.includes("Firefox");
};
let isChromiumCache = null;
const isChromium = () => {
	if (isChromiumCache !== null) return isChromiumCache;
	return isChromiumCache = !!(typeof navigator !== "undefined" && (navigator.vendor?.includes("Google Inc") || /Chrome/.test(navigator.userAgent)));
};
let chromiumVersionCache = null;
const getChromiumVersion = () => {
	if (chromiumVersionCache !== null) return chromiumVersionCache;
	if (typeof navigator === "undefined") return null;
	const match = /\\bChrome\\/(\\d+)/.exec(navigator.userAgent);
	if (!match) return null;
	return chromiumVersionCache = Number(match[1]);
};
const keyValueIterator = function* (object) {
	for (const key in object) {
		const value = object[key];
		if (value === void 0) continue;
		yield {
			key,
			value
		};
	}
};
const imageMimeTypeToExtension = (mimeType) => {
	switch (mimeType.toLowerCase()) {
		case "image/jpeg":
		case "image/jpg": return ".jpg";
		case "image/png": return ".png";
		case "image/gif": return ".gif";
		case "image/webp": return ".webp";
		case "image/bmp": return ".bmp";
		case "image/svg+xml": return ".svg";
		case "image/tiff": return ".tiff";
		case "image/avif": return ".avif";
		case "image/x-icon":
		case "image/vnd.microsoft.icon": return ".ico";
		default: return null;
	}
};
const uint8ArraysAreEqual = (a, b) => {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
};
const polyfillSymbolDispose = () => {
	Symbol.dispose ??= Symbol("Symbol.dispose");
};
const arrayArgmin = (array, getValue) => {
	let minIndex = -1;
	let minValue = Infinity;
	for (let i = 0; i < array.length; i++) {
		const value = getValue(array[i]);
		if (value < minValue) {
			minValue = value;
			minIndex = i;
		}
	}
	return minIndex;
};
const simplifyRational = (rational) => {
	assert(Number.isInteger(rational.num));
	assert(Number.isInteger(rational.den));
	assert(rational.den !== 0);
	let a = Math.abs(rational.num);
	let b = Math.abs(rational.den);
	while (b !== 0) {
		const t = a % b;
		a = b;
		b = t;
	}
	const gcd = a || 1;
	return {
		num: rational.num / gcd,
		den: rational.den / gcd
	};
};
const validateRectangle = (rect, propertyPath) => {
	if (typeof rect !== "object" || !rect) throw new TypeError(\`\${propertyPath} must be an object.\`);
	if (!Number.isInteger(rect.left) || rect.left < 0) throw new TypeError(\`\${propertyPath}.left must be a non-negative integer.\`);
	if (!Number.isInteger(rect.top) || rect.top < 0) throw new TypeError(\`\${propertyPath}.top must be a non-negative integer.\`);
	if (!Number.isInteger(rect.width) || rect.width < 0) throw new TypeError(\`\${propertyPath}.width must be a non-negative integer.\`);
	if (!Number.isInteger(rect.height) || rect.height < 0) throw new TypeError(\`\${propertyPath}.height must be a non-negative integer.\`);
};
const toArray = (x) => {
	if (Array.isArray(x)) return x;
	else return [x];
};
/**
* A class that manages event listeners and dispatches events to them.
*
* @group Miscellaneous
* @public
*/
var EventEmitter = class {
	constructor() {
		/** @internal */
		this._listeners = /* @__PURE__ */ new Map();
	}
	/** Registers a listener for the given event. Returns a function that, when called, removes the listener again. */
	on(event, listener, options) {
		if (!this._listeners.has(event)) this._listeners.set(event, /* @__PURE__ */ new Set());
		const entry = {
			fn: listener,
			once: options?.once ?? false
		};
		this._listeners.get(event).add(entry);
		return () => {
			this._listeners.get(event)?.delete(entry);
		};
	}
	/** @internal */
	_emit(...args) {
		const [event, data] = args;
		const listeners = this._listeners.get(event);
		if (!listeners) return;
		for (const entry of listeners) {
			try {
				entry.fn(data);
			} catch (error) {
				console.error(error);
			}
			if (entry.once) listeners.delete(entry);
		}
	}
};
const isRecordStringString = (value) => {
	return value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype && Object.values(value).every((x) => typeof x === "string");
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/logging.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* Controls how much information Mediabunny prints to the console. Higher levels include all lower levels.
*
* @group Logging
* @public
*/
var LogLevel;
(function(LogLevel) {
	/** Nothing is printed to the console. */
	LogLevel[LogLevel["Silent"] = 0] = "Silent";
	/** Only errors are printed. */
	LogLevel[LogLevel["Errors"] = 1] = "Errors";
	/** Errors and warnings are printed. */
	LogLevel[LogLevel["Warnings"] = 2] = "Warnings";
	/** Errors, warnings, and informational messages are printed. */
	LogLevel[LogLevel["Info"] = 3] = "Info";
})(LogLevel || (LogLevel = {}));
/**
* Mediabunny's central logging singleton. Use {@link Logging.level} to control how much is printed to the console,
* and subscribe to log events using {@link Logging.on}.
*
* Having manual control over logging is useful for command-line applications where you want full say over the output.
*
* @group Logging
* @public
*/
var Logging = class Logging {
	constructor() {}
	/** The current log level. Defaults to {@link LogLevel.Info}. */
	static get level() {
		return Logging._level;
	}
	static set level(value) {
		if (value !== LogLevel.Silent && value !== LogLevel.Errors && value !== LogLevel.Warnings && value !== LogLevel.Info) throw new TypeError("Invalid log level. Use one of the values of the LogLevel enum.");
		Logging._level = value;
	}
	/** @internal */
	static get _emitter() {
		return Logging._emitterInstance ??= new EventEmitter();
	}
	/** Registers a listener for a log event. Returns a function that, when called, removes the listener again. */
	static on(event, listener, options) {
		return Logging._emitter.on(event, listener, options);
	}
	/** @internal */
	static _error(...args) {
		Logging._emitter._emit("error", args);
		if (Logging._level >= LogLevel.Errors) console.error(...args);
	}
	/** @internal */
	static _warn(...args) {
		Logging._emitter._emit("warn", args);
		if (Logging._level >= LogLevel.Warnings) console.warn(...args);
	}
	/** @internal */
	static _info(...args) {
		Logging._emitter._emit("info", args);
		if (Logging._level >= LogLevel.Info) console.info(...args);
	}
};
/** @internal */
Logging._level = LogLevel.Info;
/** @internal */
Logging._emitterInstance = null;

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/metadata.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* Image data with additional metadata.
*
* @group Metadata tags
* @public
*/
var RichImageData = class {
	/** Creates a new {@link RichImageData}. */
	constructor(data, mimeType) {
		this.data = data;
		this.mimeType = mimeType;
		if (!(data instanceof Uint8Array)) throw new TypeError("data must be a Uint8Array.");
		if (typeof mimeType !== "string") throw new TypeError("mimeType must be a string.");
	}
};
/**
* A file attached to a media file.
*
* @group Metadata tags
* @public
*/
var AttachedFile = class {
	/** Creates a new {@link AttachedFile}. */
	constructor(data, mimeType, name, description) {
		this.data = data;
		this.mimeType = mimeType;
		this.name = name;
		this.description = description;
		if (!(data instanceof Uint8Array)) throw new TypeError("data must be a Uint8Array.");
		if (mimeType !== void 0 && typeof mimeType !== "string") throw new TypeError("mimeType, when provided, must be a string.");
		if (name !== void 0 && typeof name !== "string") throw new TypeError("name, when provided, must be a string.");
		if (description !== void 0 && typeof description !== "string") throw new TypeError("description, when provided, must be a string.");
	}
};
const validateMetadataTags = (tags) => {
	if (!tags || typeof tags !== "object") throw new TypeError("tags must be an object.");
	if (tags.title !== void 0 && typeof tags.title !== "string") throw new TypeError("tags.title, when provided, must be a string.");
	if (tags.description !== void 0 && typeof tags.description !== "string") throw new TypeError("tags.description, when provided, must be a string.");
	if (tags.artist !== void 0 && typeof tags.artist !== "string") throw new TypeError("tags.artist, when provided, must be a string.");
	if (tags.album !== void 0 && typeof tags.album !== "string") throw new TypeError("tags.album, when provided, must be a string.");
	if (tags.albumArtist !== void 0 && typeof tags.albumArtist !== "string") throw new TypeError("tags.albumArtist, when provided, must be a string.");
	if (tags.trackNumber !== void 0 && (!Number.isInteger(tags.trackNumber) || tags.trackNumber <= 0)) throw new TypeError("tags.trackNumber, when provided, must be a positive integer.");
	if (tags.tracksTotal !== void 0 && (!Number.isInteger(tags.tracksTotal) || tags.tracksTotal <= 0)) throw new TypeError("tags.tracksTotal, when provided, must be a positive integer.");
	if (tags.discNumber !== void 0 && (!Number.isInteger(tags.discNumber) || tags.discNumber <= 0)) throw new TypeError("tags.discNumber, when provided, must be a positive integer.");
	if (tags.discsTotal !== void 0 && (!Number.isInteger(tags.discsTotal) || tags.discsTotal <= 0)) throw new TypeError("tags.discsTotal, when provided, must be a positive integer.");
	if (tags.genre !== void 0 && typeof tags.genre !== "string") throw new TypeError("tags.genre, when provided, must be a string.");
	if (tags.date !== void 0 && (!(tags.date instanceof Date) || Number.isNaN(tags.date.getTime()))) throw new TypeError("tags.date, when provided, must be a valid Date.");
	if (tags.lyrics !== void 0 && typeof tags.lyrics !== "string") throw new TypeError("tags.lyrics, when provided, must be a string.");
	if (tags.images !== void 0) {
		if (!Array.isArray(tags.images)) throw new TypeError("tags.images, when provided, must be an array.");
		for (const image of tags.images) {
			if (!image || typeof image !== "object") throw new TypeError("Each image in tags.images must be an object.");
			if (!(image.data instanceof Uint8Array)) throw new TypeError("Each image.data must be a Uint8Array.");
			if (typeof image.mimeType !== "string") throw new TypeError("Each image.mimeType must be a string.");
			if (![
				"coverFront",
				"coverBack",
				"unknown"
			].includes(image.kind)) throw new TypeError("Each image.kind must be 'coverFront', 'coverBack', or 'unknown'.");
		}
	}
	if (tags.comment !== void 0 && typeof tags.comment !== "string") throw new TypeError("tags.comment, when provided, must be a string.");
	if (tags.raw !== void 0) {
		if (!tags.raw || typeof tags.raw !== "object") throw new TypeError("tags.raw, when provided, must be an object.");
		for (const value of Object.values(tags.raw)) if (value !== null && typeof value !== "string" && !(value instanceof Uint8Array) && !(value instanceof RichImageData) && !(value instanceof AttachedFile) && !isRecordStringString(value)) throw new TypeError("Each value in tags.raw must be a string, Uint8Array, RichImageData, AttachedFile, Record<string, string>, or null.");
	}
};
const validateTrackDisposition = (disposition) => {
	if (!disposition || typeof disposition !== "object") throw new TypeError("disposition must be an object.");
	if (disposition.default !== void 0 && typeof disposition.default !== "boolean") throw new TypeError("disposition.default must be a boolean.");
	if (disposition.primary !== void 0 && typeof disposition.primary !== "boolean") throw new TypeError("disposition.primary must be a boolean.");
	if (disposition.forced !== void 0 && typeof disposition.forced !== "boolean") throw new TypeError("disposition.forced must be a boolean.");
	if (disposition.original !== void 0 && typeof disposition.original !== "boolean") throw new TypeError("disposition.original must be a boolean.");
	if (disposition.commentary !== void 0 && typeof disposition.commentary !== "boolean") throw new TypeError("disposition.commentary must be a boolean.");
	if (disposition.hearingImpaired !== void 0 && typeof disposition.hearingImpaired !== "boolean") throw new TypeError("disposition.hearingImpaired must be a boolean.");
	if (disposition.visuallyImpaired !== void 0 && typeof disposition.visuallyImpaired !== "boolean") throw new TypeError("disposition.visuallyImpaired must be a boolean.");
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/shared/bitstream.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var Bitstream = class Bitstream {
	constructor(bytes) {
		this.bytes = bytes;
		/** Current offset in bits. */
		this.pos = 0;
	}
	seekToByte(byteOffset) {
		this.pos = 8 * byteOffset;
	}
	readBit() {
		const byteIndex = Math.floor(this.pos / 8);
		const byte = this.bytes[byteIndex] ?? 0;
		const bitIndex = 7 - (this.pos & 7);
		const bit = (byte & 1 << bitIndex) >> bitIndex;
		this.pos++;
		return bit;
	}
	readBits(n) {
		if (n === 1) return this.readBit();
		let result = 0;
		for (let i = 0; i < n; i++) {
			result <<= 1;
			result |= this.readBit();
		}
		return result;
	}
	writeBits(n, value) {
		const end = this.pos + n;
		for (let i = this.pos; i < end; i++) {
			const byteIndex = Math.floor(i / 8);
			let byte = this.bytes[byteIndex];
			const bitIndex = 7 - (i & 7);
			byte &= ~(1 << bitIndex);
			byte |= (value & 1 << end - i - 1) >> end - i - 1 << bitIndex;
			this.bytes[byteIndex] = byte;
		}
		this.pos = end;
	}
	readAlignedByte() {
		if (this.pos % 8 !== 0) throw new Error("Bitstream is not byte-aligned.");
		const byteIndex = this.pos / 8;
		const byte = this.bytes[byteIndex] ?? 0;
		this.pos += 8;
		return byte;
	}
	skipBits(n) {
		this.pos += n;
	}
	getBitsLeft() {
		return this.bytes.length * 8 - this.pos;
	}
	clone() {
		const clone = new Bitstream(this.bytes);
		clone.pos = this.pos;
		return clone;
	}
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/shared/aac-misc.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
const aacFrequencyTable = [
	96e3,
	88200,
	64e3,
	48e3,
	44100,
	32e3,
	24e3,
	22050,
	16e3,
	12e3,
	11025,
	8e3,
	7350
];
const aacChannelMap = [
	-1,
	1,
	2,
	3,
	4,
	5,
	6,
	8
];
const buildAacAudioSpecificConfig = (config) => {
	let frequencyIndex = aacFrequencyTable.indexOf(config.sampleRate);
	let customSampleRate = null;
	if (frequencyIndex === -1) {
		frequencyIndex = 15;
		customSampleRate = config.sampleRate;
	}
	const channelConfiguration = aacChannelMap.indexOf(config.numberOfChannels);
	if (channelConfiguration === -1) throw new TypeError(\`Unsupported number of channels: \${config.numberOfChannels}\`);
	let bitCount = 13;
	if (config.objectType >= 32) bitCount += 6;
	if (frequencyIndex === 15) bitCount += 24;
	const byteCount = Math.ceil(bitCount / 8);
	const bytes = new Uint8Array(byteCount);
	const bitstream = new Bitstream(bytes);
	if (config.objectType < 32) bitstream.writeBits(5, config.objectType);
	else {
		bitstream.writeBits(5, 31);
		bitstream.writeBits(6, config.objectType - 32);
	}
	bitstream.writeBits(4, frequencyIndex);
	if (frequencyIndex === 15) bitstream.writeBits(24, customSampleRate);
	bitstream.writeBits(4, channelConfiguration);
	return bytes;
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/codec.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* List of known video codecs, ordered by encoding preference.
* @group Codecs
* @public
*/
const VIDEO_CODECS = [
	"avc",
	"hevc",
	"vp9",
	"av1",
	"vp8"
];
/**
* List of known PCM (uncompressed) audio codecs, ordered by encoding preference.
* @group Codecs
* @public
*/
const PCM_AUDIO_CODECS = [
	"pcm-s16",
	"pcm-s16be",
	"pcm-s24",
	"pcm-s24be",
	"pcm-s32",
	"pcm-s32be",
	"pcm-f32",
	"pcm-f32be",
	"pcm-f64",
	"pcm-f64be",
	"pcm-u8",
	"pcm-s8",
	"ulaw",
	"alaw"
];
/**
* List of known compressed audio codecs, ordered by encoding preference.
* @group Codecs
* @public
*/
const NON_PCM_AUDIO_CODECS = [
	"aac",
	"opus",
	"mp3",
	"vorbis",
	"flac",
	"ac3",
	"eac3"
];
/**
* List of known audio codecs, ordered by encoding preference.
* @group Codecs
* @public
*/
const AUDIO_CODECS = [...NON_PCM_AUDIO_CODECS, ...PCM_AUDIO_CODECS];
/**
* List of known subtitle codecs, ordered by encoding preference.
* @group Codecs
* @public
*/
const SUBTITLE_CODECS = ["webvtt"];
const AVC_LEVEL_TABLE = [
	{
		maxMacroblocks: 99,
		maxBitrate: 64e3,
		maxDpbMbs: 396,
		level: 10
	},
	{
		maxMacroblocks: 396,
		maxBitrate: 192e3,
		maxDpbMbs: 900,
		level: 11
	},
	{
		maxMacroblocks: 396,
		maxBitrate: 384e3,
		maxDpbMbs: 2376,
		level: 12
	},
	{
		maxMacroblocks: 396,
		maxBitrate: 768e3,
		maxDpbMbs: 2376,
		level: 13
	},
	{
		maxMacroblocks: 396,
		maxBitrate: 2e6,
		maxDpbMbs: 2376,
		level: 20
	},
	{
		maxMacroblocks: 792,
		maxBitrate: 4e6,
		maxDpbMbs: 4752,
		level: 21
	},
	{
		maxMacroblocks: 1620,
		maxBitrate: 4e6,
		maxDpbMbs: 8100,
		level: 22
	},
	{
		maxMacroblocks: 1620,
		maxBitrate: 1e7,
		maxDpbMbs: 8100,
		level: 30
	},
	{
		maxMacroblocks: 3600,
		maxBitrate: 14e6,
		maxDpbMbs: 18e3,
		level: 31
	},
	{
		maxMacroblocks: 5120,
		maxBitrate: 2e7,
		maxDpbMbs: 20480,
		level: 32
	},
	{
		maxMacroblocks: 8192,
		maxBitrate: 2e7,
		maxDpbMbs: 32768,
		level: 40
	},
	{
		maxMacroblocks: 8192,
		maxBitrate: 5e7,
		maxDpbMbs: 32768,
		level: 41
	},
	{
		maxMacroblocks: 8704,
		maxBitrate: 5e7,
		maxDpbMbs: 34816,
		level: 42
	},
	{
		maxMacroblocks: 22080,
		maxBitrate: 135e6,
		maxDpbMbs: 110400,
		level: 50
	},
	{
		maxMacroblocks: 36864,
		maxBitrate: 24e7,
		maxDpbMbs: 184320,
		level: 51
	},
	{
		maxMacroblocks: 36864,
		maxBitrate: 24e7,
		maxDpbMbs: 184320,
		level: 52
	},
	{
		maxMacroblocks: 139264,
		maxBitrate: 24e7,
		maxDpbMbs: 696320,
		level: 60
	},
	{
		maxMacroblocks: 139264,
		maxBitrate: 48e7,
		maxDpbMbs: 696320,
		level: 61
	},
	{
		maxMacroblocks: 139264,
		maxBitrate: 8e8,
		maxDpbMbs: 696320,
		level: 62
	}
];
const HEVC_LEVEL_TABLE = [
	{
		maxPictureSize: 36864,
		maxBitrate: 128e3,
		tier: "L",
		level: 30
	},
	{
		maxPictureSize: 122880,
		maxBitrate: 15e5,
		tier: "L",
		level: 60
	},
	{
		maxPictureSize: 245760,
		maxBitrate: 3e6,
		tier: "L",
		level: 63
	},
	{
		maxPictureSize: 552960,
		maxBitrate: 6e6,
		tier: "L",
		level: 90
	},
	{
		maxPictureSize: 983040,
		maxBitrate: 1e7,
		tier: "L",
		level: 93
	},
	{
		maxPictureSize: 2228224,
		maxBitrate: 12e6,
		tier: "L",
		level: 120
	},
	{
		maxPictureSize: 2228224,
		maxBitrate: 3e7,
		tier: "H",
		level: 120
	},
	{
		maxPictureSize: 2228224,
		maxBitrate: 2e7,
		tier: "L",
		level: 123
	},
	{
		maxPictureSize: 2228224,
		maxBitrate: 5e7,
		tier: "H",
		level: 123
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 25e6,
		tier: "L",
		level: 150
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 1e8,
		tier: "H",
		level: 150
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 4e7,
		tier: "L",
		level: 153
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 16e7,
		tier: "H",
		level: 153
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 6e7,
		tier: "L",
		level: 156
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 24e7,
		tier: "H",
		level: 156
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 6e7,
		tier: "L",
		level: 180
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 24e7,
		tier: "H",
		level: 180
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 12e7,
		tier: "L",
		level: 183
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 48e7,
		tier: "H",
		level: 183
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 24e7,
		tier: "L",
		level: 186
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 8e8,
		tier: "H",
		level: 186
	}
];
const VP9_LEVEL_TABLE = [
	{
		maxPictureSize: 36864,
		maxBitrate: 2e5,
		level: 10
	},
	{
		maxPictureSize: 73728,
		maxBitrate: 8e5,
		level: 11
	},
	{
		maxPictureSize: 122880,
		maxBitrate: 18e5,
		level: 20
	},
	{
		maxPictureSize: 245760,
		maxBitrate: 36e5,
		level: 21
	},
	{
		maxPictureSize: 552960,
		maxBitrate: 72e5,
		level: 30
	},
	{
		maxPictureSize: 983040,
		maxBitrate: 12e6,
		level: 31
	},
	{
		maxPictureSize: 2228224,
		maxBitrate: 18e6,
		level: 40
	},
	{
		maxPictureSize: 2228224,
		maxBitrate: 3e7,
		level: 41
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 6e7,
		level: 50
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 12e7,
		level: 51
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 18e7,
		level: 52
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 18e7,
		level: 60
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 24e7,
		level: 61
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 48e7,
		level: 62
	}
];
const AV1_LEVEL_TABLE = [
	{
		maxPictureSize: 147456,
		maxBitrate: 15e5,
		tier: "M",
		level: 0
	},
	{
		maxPictureSize: 278784,
		maxBitrate: 3e6,
		tier: "M",
		level: 1
	},
	{
		maxPictureSize: 665856,
		maxBitrate: 6e6,
		tier: "M",
		level: 4
	},
	{
		maxPictureSize: 1065024,
		maxBitrate: 1e7,
		tier: "M",
		level: 5
	},
	{
		maxPictureSize: 2359296,
		maxBitrate: 12e6,
		tier: "M",
		level: 8
	},
	{
		maxPictureSize: 2359296,
		maxBitrate: 3e7,
		tier: "H",
		level: 8
	},
	{
		maxPictureSize: 2359296,
		maxBitrate: 2e7,
		tier: "M",
		level: 9
	},
	{
		maxPictureSize: 2359296,
		maxBitrate: 5e7,
		tier: "H",
		level: 9
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 3e7,
		tier: "M",
		level: 12
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 1e8,
		tier: "H",
		level: 12
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 4e7,
		tier: "M",
		level: 13
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 16e7,
		tier: "H",
		level: 13
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 6e7,
		tier: "M",
		level: 14
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 24e7,
		tier: "H",
		level: 14
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 6e7,
		tier: "M",
		level: 15
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 24e7,
		tier: "H",
		level: 15
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 6e7,
		tier: "M",
		level: 16
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 24e7,
		tier: "H",
		level: 16
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 1e8,
		tier: "M",
		level: 17
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 48e7,
		tier: "H",
		level: 17
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 16e7,
		tier: "M",
		level: 18
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 8e8,
		tier: "H",
		level: 18
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 16e7,
		tier: "M",
		level: 19
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 8e8,
		tier: "H",
		level: 19
	}
];
const buildVideoCodecString = (codec, width, height, bitrate) => {
	if (codec === "avc") {
		const profileIndication = 100;
		const totalMacroblocks = Math.ceil(width / 16) * Math.ceil(height / 16);
		const levelInfo = AVC_LEVEL_TABLE.find((level) => totalMacroblocks <= level.maxMacroblocks && bitrate <= level.maxBitrate) ?? last(AVC_LEVEL_TABLE);
		const levelIndication = levelInfo ? levelInfo.level : 0;
		return \`avc1.\${profileIndication.toString(16).padStart(2, "0")}00\${levelIndication.toString(16).padStart(2, "0")}\`;
	} else if (codec === "hevc") {
		const profilePrefix = "";
		const profileIdc = 1;
		const compatibilityFlags = "6";
		const pictureSize = width * height;
		const levelInfo = HEVC_LEVEL_TABLE.find((level) => pictureSize <= level.maxPictureSize && bitrate <= level.maxBitrate) ?? last(HEVC_LEVEL_TABLE);
		return \`hev1.\${profilePrefix}\${profileIdc}.\${compatibilityFlags}.\${levelInfo.tier}\${levelInfo.level}.B0\`;
	} else if (codec === "vp8") return "vp8";
	else if (codec === "vp9") {
		const profile = "00";
		const pictureSize = width * height;
		return \`vp09.\${profile}.\${(VP9_LEVEL_TABLE.find((level) => pictureSize <= level.maxPictureSize && bitrate <= level.maxBitrate) ?? last(VP9_LEVEL_TABLE)).level.toString().padStart(2, "0")}.08\`;
	} else if (codec === "av1") {
		const profile = 0;
		const pictureSize = width * height;
		const levelInfo = AV1_LEVEL_TABLE.find((level) => pictureSize <= level.maxPictureSize && bitrate <= level.maxBitrate) ?? last(AV1_LEVEL_TABLE);
		return \`av01.\${profile}.\${levelInfo.level.toString().padStart(2, "0")}\${levelInfo.tier}.08\`;
	}
	throw new TypeError(\`Unhandled codec '\${codec}'.\`);
};
const generateVp9CodecConfigurationFromCodecString = (codecString) => {
	const parts = codecString.split(".");
	return [
		1,
		1,
		Number(parts[1]),
		2,
		1,
		Number(parts[2]),
		3,
		1,
		Number(parts[3]),
		4,
		1,
		parts[4] ? Number(parts[4]) : 1
	];
};
const generateAv1CodecConfigurationFromCodecString = (codecString) => {
	const parts = codecString.split(".");
	const firstByte = 129;
	const profile = Number(parts[1]);
	const levelAndTier = parts[2];
	const level = Number(levelAndTier.slice(0, -1));
	const secondByte = (profile << 5) + level;
	const tier = levelAndTier.slice(-1) === "H" ? 1 : 0;
	const highBitDepth = Number(parts[3]) === 8 ? 0 : 1;
	const monochrome = parts[4] ? Number(parts[4]) : 0;
	const chromaSubsamplingX = parts[5] ? Number(parts[5][0]) : 1;
	const chromaSubsamplingY = parts[5] ? Number(parts[5][1]) : 1;
	const chromaSamplePosition = parts[5] ? Number(parts[5][2]) : 0;
	return [
		firstByte,
		secondByte,
		(tier << 7) + (highBitDepth << 6) + 0 + (monochrome << 4) + (chromaSubsamplingX << 3) + (chromaSubsamplingY << 2) + chromaSamplePosition,
		0
	];
};
const OPUS_SAMPLE_RATE = 48e3;
const PCM_CODEC_REGEX = /^pcm-([usf])(\\d+)(be)?$/;
const parsePcmCodec = (codec) => {
	assert(PCM_AUDIO_CODECS.includes(codec));
	if (codec === "ulaw") return {
		dataType: "ulaw",
		sampleSize: 1,
		littleEndian: true,
		silentValue: 255
	};
	else if (codec === "alaw") return {
		dataType: "alaw",
		sampleSize: 1,
		littleEndian: true,
		silentValue: 213
	};
	const match = PCM_CODEC_REGEX.exec(codec);
	assert(match);
	let dataType;
	if (match[1] === "u") dataType = "unsigned";
	else if (match[1] === "s") dataType = "signed";
	else dataType = "float";
	const sampleSize = Number(match[2]) / 8;
	const littleEndian = match[3] !== "be";
	return {
		dataType,
		sampleSize,
		littleEndian,
		silentValue: codec === "pcm-u8" ? 128 : 0
	};
};
const inferCodecFromCodecString = (codecString) => {
	if (codecString.startsWith("avc1") || codecString.startsWith("avc3")) return "avc";
	else if (codecString.startsWith("hev1") || codecString.startsWith("hvc1")) return "hevc";
	else if (codecString === "vp8") return "vp8";
	else if (codecString.startsWith("vp09")) return "vp9";
	else if (codecString.startsWith("av01")) return "av1";
	if (codecString === "mp3" || codecString === "mp4a.69" || codecString === "mp4a.6B" || codecString === "mp4a.6b" || codecString === "mp4a.40.34") return "mp3";
	else if (codecString.startsWith("mp4a.40.") || codecString === "mp4a.67") return "aac";
	else if (codecString === "opus") return "opus";
	else if (codecString === "vorbis") return "vorbis";
	else if (codecString === "flac") return "flac";
	else if (codecString === "ac-3" || codecString === "ac3") return "ac3";
	else if (codecString === "ec-3" || codecString === "eac3") return "eac3";
	else if (codecString === "ulaw") return "ulaw";
	else if (codecString === "alaw") return "alaw";
	else if (PCM_CODEC_REGEX.test(codecString)) return codecString;
	if (codecString === "webvtt") return "webvtt";
	return null;
};
const getVideoEncoderConfigExtension = (codec) => {
	if (codec === "avc") return { avc: { format: "avc" } };
	else if (codec === "hevc") return { hevc: { format: "hevc" } };
	return {};
};
const VALID_VIDEO_CODEC_STRING_PREFIXES = [
	"avc1",
	"avc3",
	"hev1",
	"hvc1",
	"vp8",
	"vp09",
	"av01"
];
const AVC_CODEC_STRING_REGEX = /^(avc1|avc3)\\.[0-9a-fA-F]{6}$/;
const HEVC_CODEC_STRING_REGEX = /^(hev1|hvc1)\\.(?:[ABC]?\\d+)\\.[0-9a-fA-F]{1,8}\\.[LH]\\d+(?:\\.[0-9a-fA-F]{1,2}){0,6}$/;
const VP9_CODEC_STRING_REGEX = /^vp09(?:\\.\\d{2}){3}(?:(?:\\.\\d{2}){5})?$/;
const AV1_CODEC_STRING_REGEX = /^av01\\.\\d\\.\\d{2}[MH]\\.\\d{2}(?:\\.\\d\\.\\d{3}\\.\\d{2}\\.\\d{2}\\.\\d{2}\\.\\d)?$/;
const validateVideoChunkMetadata = (metadata) => {
	if (!metadata) throw new TypeError("Video chunk metadata must be provided.");
	if (typeof metadata !== "object") throw new TypeError("Video chunk metadata must be an object.");
	if (!metadata.decoderConfig) throw new TypeError("Video chunk metadata must include a decoder configuration.");
	if (typeof metadata.decoderConfig !== "object") throw new TypeError("Video chunk metadata decoder configuration must be an object.");
	if (typeof metadata.decoderConfig.codec !== "string") throw new TypeError("Video chunk metadata decoder configuration must specify a codec string.");
	if (!VALID_VIDEO_CODEC_STRING_PREFIXES.some((prefix) => metadata.decoderConfig.codec.startsWith(prefix))) throw new TypeError("Video chunk metadata decoder configuration codec string must be a valid video codec string as specified in the Mediabunny Codec Registry.");
	if (!Number.isInteger(metadata.decoderConfig.codedWidth) || metadata.decoderConfig.codedWidth <= 0) throw new TypeError("Video chunk metadata decoder configuration must specify a valid codedWidth (positive integer).");
	if (!Number.isInteger(metadata.decoderConfig.codedHeight) || metadata.decoderConfig.codedHeight <= 0) throw new TypeError("Video chunk metadata decoder configuration must specify a valid codedHeight (positive integer).");
	if (metadata.decoderConfig.displayAspectWidth !== void 0 && (!Number.isInteger(metadata.decoderConfig.displayAspectWidth) || metadata.decoderConfig.displayAspectWidth <= 0)) throw new TypeError("Video chunk metadata decoder configuration displayAspectWidth, when defined, must be a positive integer.");
	if (metadata.decoderConfig.displayAspectHeight !== void 0 && (!Number.isInteger(metadata.decoderConfig.displayAspectHeight) || metadata.decoderConfig.displayAspectHeight <= 0)) throw new TypeError("Video chunk metadata decoder configuration displayAspectHeight, when defined, must be a positive integer.");
	if (metadata.decoderConfig.displayAspectWidth !== void 0 !== (metadata.decoderConfig.displayAspectHeight !== void 0)) throw new TypeError("Video chunk metadata decoder configuration must specify both displayAspectWidth and displayAspectHeight, or neither.");
	if (metadata.decoderConfig.description !== void 0) {
		if (!isAllowSharedBufferSource(metadata.decoderConfig.description)) throw new TypeError("Video chunk metadata decoder configuration description, when defined, must be an ArrayBuffer or an ArrayBuffer view.");
	}
	if (metadata.decoderConfig.colorSpace !== void 0) {
		const { colorSpace } = metadata.decoderConfig;
		if (typeof colorSpace !== "object") throw new TypeError("Video chunk metadata decoder configuration colorSpace, when provided, must be an object.");
		const primariesValues = Object.keys(COLOR_PRIMARIES_MAP);
		if (colorSpace.primaries != null && !primariesValues.includes(colorSpace.primaries)) throw new TypeError(\`Video chunk metadata decoder configuration colorSpace primaries, when defined, must be one of \${primariesValues.join(", ")}.\`);
		const transferValues = Object.keys(TRANSFER_CHARACTERISTICS_MAP);
		if (colorSpace.transfer != null && !transferValues.includes(colorSpace.transfer)) throw new TypeError(\`Video chunk metadata decoder configuration colorSpace transfer, when defined, must be one of \${transferValues.join(", ")}.\`);
		const matrixValues = Object.keys(MATRIX_COEFFICIENTS_MAP);
		if (colorSpace.matrix != null && !matrixValues.includes(colorSpace.matrix)) throw new TypeError(\`Video chunk metadata decoder configuration colorSpace matrix, when defined, must be one of \${matrixValues.join(", ")}.\`);
		if (colorSpace.fullRange != null && typeof colorSpace.fullRange !== "boolean") throw new TypeError("Video chunk metadata decoder configuration colorSpace fullRange, when defined, must be a boolean.");
	}
	if (metadata.decoderConfig.codec.startsWith("avc1") || metadata.decoderConfig.codec.startsWith("avc3")) {
		if (!AVC_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) throw new TypeError("Video chunk metadata decoder configuration codec string for AVC must be a valid AVC codec string as specified in Section 3.4 of RFC 6381.");
	} else if (metadata.decoderConfig.codec.startsWith("hev1") || metadata.decoderConfig.codec.startsWith("hvc1")) {
		if (!HEVC_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) throw new TypeError("Video chunk metadata decoder configuration codec string for HEVC must be a valid HEVC codec string as specified in Section E.3 of ISO 14496-15.");
	} else if (metadata.decoderConfig.codec.startsWith("vp8")) {
		if (metadata.decoderConfig.codec !== "vp8") throw new TypeError("Video chunk metadata decoder configuration codec string for VP8 must be \\"vp8\\".");
	} else if (metadata.decoderConfig.codec.startsWith("vp09")) {
		if (!VP9_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) throw new TypeError("Video chunk metadata decoder configuration codec string for VP9 must be a valid VP9 codec string as specified in Section \\"Codecs Parameter String\\" of https://www.webmproject.org/vp9/mp4/.");
	} else if (metadata.decoderConfig.codec.startsWith("av01")) {
		if (!AV1_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) throw new TypeError("Video chunk metadata decoder configuration codec string for AV1 must be a valid AV1 codec string as specified in Section \\"Codecs Parameter String\\" of https://aomediacodec.github.io/av1-isobmff/.");
	}
};
const VALID_AUDIO_CODEC_STRING_PREFIXES = [
	"mp4a",
	"mp3",
	"opus",
	"vorbis",
	"flac",
	"ulaw",
	"alaw",
	"pcm",
	"ac-3",
	"ec-3"
];
const validateAudioChunkMetadata = (metadata) => {
	if (!metadata) throw new TypeError("Audio chunk metadata must be provided.");
	if (typeof metadata !== "object") throw new TypeError("Audio chunk metadata must be an object.");
	if (!metadata.decoderConfig) throw new TypeError("Audio chunk metadata must include a decoder configuration.");
	if (typeof metadata.decoderConfig !== "object") throw new TypeError("Audio chunk metadata decoder configuration must be an object.");
	if (typeof metadata.decoderConfig.codec !== "string") throw new TypeError("Audio chunk metadata decoder configuration must specify a codec string.");
	if (!VALID_AUDIO_CODEC_STRING_PREFIXES.some((prefix) => metadata.decoderConfig.codec.startsWith(prefix))) throw new TypeError("Audio chunk metadata decoder configuration codec string must be a valid audio codec string as specified in the Mediabunny Codec Registry.");
	if (!Number.isInteger(metadata.decoderConfig.sampleRate) || metadata.decoderConfig.sampleRate <= 0) throw new TypeError("Audio chunk metadata decoder configuration must specify a valid sampleRate (positive integer).");
	if (!Number.isInteger(metadata.decoderConfig.numberOfChannels) || metadata.decoderConfig.numberOfChannels <= 0) throw new TypeError("Audio chunk metadata decoder configuration must specify a valid numberOfChannels (positive integer).");
	if (metadata.decoderConfig.description !== void 0) {
		if (!isAllowSharedBufferSource(metadata.decoderConfig.description)) throw new TypeError("Audio chunk metadata decoder configuration description, when defined, must be an ArrayBuffer or an ArrayBuffer view.");
	}
	if (metadata.decoderConfig.codec.startsWith("mp4a") && metadata.decoderConfig.codec !== "mp4a.69" && metadata.decoderConfig.codec !== "mp4a.6B" && metadata.decoderConfig.codec !== "mp4a.6b") {
		if (![
			"mp4a.40.2",
			"mp4a.40.02",
			"mp4a.40.5",
			"mp4a.40.05",
			"mp4a.40.29",
			"mp4a.67"
		].includes(metadata.decoderConfig.codec)) throw new TypeError("Audio chunk metadata decoder configuration codec string for AAC must be a valid AAC codec string as specified in https://www.w3.org/TR/webcodecs-aac-codec-registration/.");
	} else if (metadata.decoderConfig.codec.startsWith("mp3") || metadata.decoderConfig.codec.startsWith("mp4a")) {
		if (metadata.decoderConfig.codec !== "mp3" && metadata.decoderConfig.codec !== "mp4a.69" && metadata.decoderConfig.codec !== "mp4a.6B" && metadata.decoderConfig.codec !== "mp4a.6b") throw new TypeError("Audio chunk metadata decoder configuration codec string for MP3 must be \\"mp3\\", \\"mp4a.69\\" or \\"mp4a.6B\\".");
	} else if (metadata.decoderConfig.codec.startsWith("opus")) {
		if (metadata.decoderConfig.codec !== "opus") throw new TypeError("Audio chunk metadata decoder configuration codec string for Opus must be \\"opus\\".");
		if (metadata.decoderConfig.description && metadata.decoderConfig.description.byteLength < 18) throw new TypeError("Audio chunk metadata decoder configuration description, when specified, is expected to be an Identification Header as specified in Section 5.1 of RFC 7845.");
	} else if (metadata.decoderConfig.codec.startsWith("vorbis")) {
		if (metadata.decoderConfig.codec !== "vorbis") throw new TypeError("Audio chunk metadata decoder configuration codec string for Vorbis must be \\"vorbis\\".");
		if (!metadata.decoderConfig.description) throw new TypeError("Audio chunk metadata decoder configuration for Vorbis must include a description, which is expected to adhere to the format described in https://www.w3.org/TR/webcodecs-vorbis-codec-registration/.");
	} else if (metadata.decoderConfig.codec.startsWith("flac")) {
		if (metadata.decoderConfig.codec !== "flac") throw new TypeError("Audio chunk metadata decoder configuration codec string for FLAC must be \\"flac\\".");
		if (!metadata.decoderConfig.description || metadata.decoderConfig.description.byteLength < 42) throw new TypeError("Audio chunk metadata decoder configuration for FLAC must include a description, which is expected to adhere to the format described in https://www.w3.org/TR/webcodecs-flac-codec-registration/.");
	} else if (metadata.decoderConfig.codec.startsWith("ac-3") || metadata.decoderConfig.codec.startsWith("ac3")) {
		if (metadata.decoderConfig.codec !== "ac-3") throw new TypeError("Audio chunk metadata decoder configuration codec string for AC-3 must be \\"ac-3\\".");
	} else if (metadata.decoderConfig.codec.startsWith("ec-3") || metadata.decoderConfig.codec.startsWith("eac3")) {
		if (metadata.decoderConfig.codec !== "ec-3") throw new TypeError("Audio chunk metadata decoder configuration codec string for EC-3 must be \\"ec-3\\".");
	} else if (metadata.decoderConfig.codec.startsWith("pcm") || metadata.decoderConfig.codec.startsWith("ulaw") || metadata.decoderConfig.codec.startsWith("alaw")) {
		if (!PCM_AUDIO_CODECS.includes(metadata.decoderConfig.codec)) throw new TypeError(\`Audio chunk metadata decoder configuration codec string for PCM must be one of the supported PCM codecs (\${PCM_AUDIO_CODECS.join(", ")}).\`);
	}
};
const validateSubtitleMetadata = (metadata) => {
	if (!metadata) throw new TypeError("Subtitle metadata must be provided.");
	if (typeof metadata !== "object") throw new TypeError("Subtitle metadata must be an object.");
	if (!metadata.config) throw new TypeError("Subtitle metadata must include a config object.");
	if (typeof metadata.config !== "object") throw new TypeError("Subtitle metadata config must be an object.");
	if (typeof metadata.config.description !== "string") throw new TypeError("Subtitle metadata config description must be a string.");
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/shared/ac3-misc.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/** Sample rates indexed by fscod (Table 4.1) */
const AC3_SAMPLE_RATES = [
	48e3,
	44100,
	32e3
];
/** E-AC-3 reduced sample rates for fscod2 per ATSC A/52:2018 */
const EAC3_REDUCED_SAMPLE_RATES = [
	24e3,
	22050,
	16e3
];

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/codec-data.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var AvcNalUnitType;
(function(AvcNalUnitType) {
	AvcNalUnitType[AvcNalUnitType["NON_IDR_SLICE"] = 1] = "NON_IDR_SLICE";
	AvcNalUnitType[AvcNalUnitType["SLICE_DPA"] = 2] = "SLICE_DPA";
	AvcNalUnitType[AvcNalUnitType["SLICE_DPB"] = 3] = "SLICE_DPB";
	AvcNalUnitType[AvcNalUnitType["SLICE_DPC"] = 4] = "SLICE_DPC";
	AvcNalUnitType[AvcNalUnitType["IDR"] = 5] = "IDR";
	AvcNalUnitType[AvcNalUnitType["SEI"] = 6] = "SEI";
	AvcNalUnitType[AvcNalUnitType["SPS"] = 7] = "SPS";
	AvcNalUnitType[AvcNalUnitType["PPS"] = 8] = "PPS";
	AvcNalUnitType[AvcNalUnitType["AUD"] = 9] = "AUD";
	AvcNalUnitType[AvcNalUnitType["SPS_EXT"] = 13] = "SPS_EXT";
})(AvcNalUnitType || (AvcNalUnitType = {}));
var HevcNalUnitType;
(function(HevcNalUnitType) {
	HevcNalUnitType[HevcNalUnitType["RASL_N"] = 8] = "RASL_N";
	HevcNalUnitType[HevcNalUnitType["RASL_R"] = 9] = "RASL_R";
	HevcNalUnitType[HevcNalUnitType["BLA_W_LP"] = 16] = "BLA_W_LP";
	HevcNalUnitType[HevcNalUnitType["RSV_IRAP_VCL23"] = 23] = "RSV_IRAP_VCL23";
	HevcNalUnitType[HevcNalUnitType["VPS_NUT"] = 32] = "VPS_NUT";
	HevcNalUnitType[HevcNalUnitType["SPS_NUT"] = 33] = "SPS_NUT";
	HevcNalUnitType[HevcNalUnitType["PPS_NUT"] = 34] = "PPS_NUT";
	HevcNalUnitType[HevcNalUnitType["AUD_NUT"] = 35] = "AUD_NUT";
	HevcNalUnitType[HevcNalUnitType["PREFIX_SEI_NUT"] = 39] = "PREFIX_SEI_NUT";
	HevcNalUnitType[HevcNalUnitType["SUFFIX_SEI_NUT"] = 40] = "SUFFIX_SEI_NUT";
})(HevcNalUnitType || (HevcNalUnitType = {}));
const iterateNalUnitsInAnnexB = function* (packetData) {
	let i = 0;
	let nalStart = -1;
	while (i < packetData.length - 2) {
		const zeroIndex = packetData.indexOf(0, i);
		if (zeroIndex === -1 || zeroIndex >= packetData.length - 2) break;
		i = zeroIndex;
		let startCodeLength = 0;
		if (i + 3 < packetData.length && packetData[i + 1] === 0 && packetData[i + 2] === 0 && packetData[i + 3] === 1) startCodeLength = 4;
		else if (packetData[i + 1] === 0 && packetData[i + 2] === 1) startCodeLength = 3;
		if (startCodeLength === 0) {
			i++;
			continue;
		}
		if (nalStart !== -1 && i > nalStart) yield {
			offset: nalStart,
			length: i - nalStart
		};
		nalStart = i + startCodeLength;
		i = nalStart;
	}
	if (nalStart !== -1 && nalStart < packetData.length) yield {
		offset: nalStart,
		length: packetData.length - nalStart
	};
};
const iterateNalUnitsInLengthPrefixed = function* (packetData, lengthSize) {
	let offset = 0;
	const dataView = new DataView(packetData.buffer, packetData.byteOffset, packetData.byteLength);
	while (offset + lengthSize <= packetData.length) {
		let nalUnitLength;
		if (lengthSize === 1) nalUnitLength = dataView.getUint8(offset);
		else if (lengthSize === 2) nalUnitLength = dataView.getUint16(offset, false);
		else if (lengthSize === 3) nalUnitLength = getUint24(dataView, offset, false);
		else {
			assert(lengthSize === 4);
			nalUnitLength = dataView.getUint32(offset, false);
		}
		offset += lengthSize;
		yield {
			offset,
			length: nalUnitLength
		};
		offset += nalUnitLength;
	}
};
const iterateAvcNalUnits = (packetData, decoderConfig) => {
	if (decoderConfig.description) {
		const lengthSize = (toUint8Array(decoderConfig.description)[4] & 3) + 1;
		return iterateNalUnitsInLengthPrefixed(packetData, lengthSize);
	} else return iterateNalUnitsInAnnexB(packetData);
};
const extractNalUnitTypeForAvc = (byte) => {
	return byte & 31;
};
const removeEmulationPreventionBytes = (data) => {
	const result = [];
	const len = data.length;
	for (let i = 0; i < len; i++) if (i + 2 < len && data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 3) {
		result.push(0, 0);
		i += 2;
	} else result.push(data[i]);
	return new Uint8Array(result);
};
const ANNEX_B_START_CODE = new Uint8Array([
	0,
	0,
	0,
	1
]);
const concatNalUnitsInLengthPrefixed = (nalUnits, lengthSize) => {
	const totalLength = nalUnits.reduce((a, b) => a + lengthSize + b.byteLength, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const nalUnit of nalUnits) {
		const dataView = new DataView(result.buffer, result.byteOffset, result.byteLength);
		switch (lengthSize) {
			case 1:
				dataView.setUint8(offset, nalUnit.byteLength);
				break;
			case 2:
				dataView.setUint16(offset, nalUnit.byteLength, false);
				break;
			case 3:
				setUint24(dataView, offset, nalUnit.byteLength, false);
				break;
			case 4: dataView.setUint32(offset, nalUnit.byteLength, false);
		}
		offset += lengthSize;
		result.set(nalUnit, offset);
		offset += nalUnit.byteLength;
	}
	return result;
};
/** Builds an AvcDecoderConfigurationRecord from an AVC packet in Annex B format. */
const extractAvcDecoderConfigurationRecord = (packetData) => {
	try {
		const spsUnits = [];
		const ppsUnits = [];
		const spsExtUnits = [];
		for (const loc of iterateNalUnitsInAnnexB(packetData)) {
			const nalUnit = packetData.subarray(loc.offset, loc.offset + loc.length);
			const type = extractNalUnitTypeForAvc(nalUnit[0]);
			if (type === AvcNalUnitType.SPS) spsUnits.push(nalUnit);
			else if (type === AvcNalUnitType.PPS) ppsUnits.push(nalUnit);
			else if (type === AvcNalUnitType.SPS_EXT) spsExtUnits.push(nalUnit);
		}
		if (spsUnits.length === 0) return null;
		if (ppsUnits.length === 0) return null;
		const spsData = spsUnits[0];
		const spsInfo = parseAvcSps(spsData);
		assert(spsInfo !== null);
		const hasExtendedData = spsInfo.profileIdc === 100 || spsInfo.profileIdc === 110 || spsInfo.profileIdc === 122 || spsInfo.profileIdc === 144;
		return {
			configurationVersion: 1,
			avcProfileIndication: spsInfo.profileIdc,
			profileCompatibility: spsInfo.constraintFlags,
			avcLevelIndication: spsInfo.levelIdc,
			lengthSizeMinusOne: 3,
			sequenceParameterSets: spsUnits,
			pictureParameterSets: ppsUnits,
			chromaFormat: hasExtendedData ? spsInfo.chromaFormatIdc : null,
			bitDepthLumaMinus8: hasExtendedData ? spsInfo.bitDepthLumaMinus8 : null,
			bitDepthChromaMinus8: hasExtendedData ? spsInfo.bitDepthChromaMinus8 : null,
			sequenceParameterSetExt: hasExtendedData ? spsExtUnits : null
		};
	} catch (error) {
		Logging._error("Error building AVC Decoder Configuration Record:", error);
		return null;
	}
};
/** Serializes an AvcDecoderConfigurationRecord into the format specified in Section 5.3.3.1 of ISO 14496-15. */
const serializeAvcDecoderConfigurationRecord = (record) => {
	const bytes = [];
	bytes.push(record.configurationVersion);
	bytes.push(record.avcProfileIndication);
	bytes.push(record.profileCompatibility);
	bytes.push(record.avcLevelIndication);
	bytes.push(252 | record.lengthSizeMinusOne & 3);
	bytes.push(224 | record.sequenceParameterSets.length & 31);
	for (const sps of record.sequenceParameterSets) {
		const length = sps.byteLength;
		bytes.push(length >> 8);
		bytes.push(length & 255);
		for (let i = 0; i < length; i++) bytes.push(sps[i]);
	}
	bytes.push(record.pictureParameterSets.length);
	for (const pps of record.pictureParameterSets) {
		const length = pps.byteLength;
		bytes.push(length >> 8);
		bytes.push(length & 255);
		for (let i = 0; i < length; i++) bytes.push(pps[i]);
	}
	if (record.avcProfileIndication === 100 || record.avcProfileIndication === 110 || record.avcProfileIndication === 122 || record.avcProfileIndication === 144) {
		assert(record.chromaFormat !== null);
		assert(record.bitDepthLumaMinus8 !== null);
		assert(record.bitDepthChromaMinus8 !== null);
		assert(record.sequenceParameterSetExt !== null);
		bytes.push(252 | record.chromaFormat & 3);
		bytes.push(248 | record.bitDepthLumaMinus8 & 7);
		bytes.push(248 | record.bitDepthChromaMinus8 & 7);
		bytes.push(record.sequenceParameterSetExt.length);
		for (const spsExt of record.sequenceParameterSetExt) {
			const length = spsExt.byteLength;
			bytes.push(length >> 8);
			bytes.push(length & 255);
			for (let i = 0; i < length; i++) bytes.push(spsExt[i]);
		}
	}
	return new Uint8Array(bytes);
};
const AVC_HEVC_ASPECT_RATIO_IDC_TABLE = {
	1: {
		num: 1,
		den: 1
	},
	2: {
		num: 12,
		den: 11
	},
	3: {
		num: 10,
		den: 11
	},
	4: {
		num: 16,
		den: 11
	},
	5: {
		num: 40,
		den: 33
	},
	6: {
		num: 24,
		den: 11
	},
	7: {
		num: 20,
		den: 11
	},
	8: {
		num: 32,
		den: 11
	},
	9: {
		num: 80,
		den: 33
	},
	10: {
		num: 18,
		den: 11
	},
	11: {
		num: 15,
		den: 11
	},
	12: {
		num: 64,
		den: 33
	},
	13: {
		num: 160,
		den: 99
	},
	14: {
		num: 4,
		den: 3
	},
	15: {
		num: 3,
		den: 2
	},
	16: {
		num: 2,
		den: 1
	}
};
/** Parses an AVC SPS (Sequence Parameter Set) to extract basic information. */
const parseAvcSps = (sps) => {
	try {
		const bitstream = new Bitstream(removeEmulationPreventionBytes(sps));
		bitstream.skipBits(1);
		bitstream.skipBits(2);
		if (bitstream.readBits(5) !== 7) return null;
		const profileIdc = bitstream.readAlignedByte();
		const constraintFlags = bitstream.readAlignedByte();
		const levelIdc = bitstream.readAlignedByte();
		readExpGolomb(bitstream);
		let chromaFormatIdc = 1;
		let bitDepthLumaMinus8 = 0;
		let bitDepthChromaMinus8 = 0;
		let separateColourPlaneFlag = 0;
		if (profileIdc === 100 || profileIdc === 110 || profileIdc === 122 || profileIdc === 244 || profileIdc === 44 || profileIdc === 83 || profileIdc === 86 || profileIdc === 118 || profileIdc === 128) {
			chromaFormatIdc = readExpGolomb(bitstream);
			if (chromaFormatIdc === 3) separateColourPlaneFlag = bitstream.readBits(1);
			bitDepthLumaMinus8 = readExpGolomb(bitstream);
			bitDepthChromaMinus8 = readExpGolomb(bitstream);
			bitstream.skipBits(1);
			if (bitstream.readBits(1)) {
				for (let i = 0; i < (chromaFormatIdc !== 3 ? 8 : 12); i++) if (bitstream.readBits(1)) {
					const sizeOfScalingList = i < 6 ? 16 : 64;
					let lastScale = 8;
					let nextScale = 8;
					for (let j = 0; j < sizeOfScalingList; j++) {
						if (nextScale !== 0) {
							const deltaScale = readSignedExpGolomb(bitstream);
							nextScale = (lastScale + deltaScale + 256) % 256;
						}
						lastScale = nextScale === 0 ? lastScale : nextScale;
					}
				}
			}
		}
		readExpGolomb(bitstream);
		const picOrderCntType = readExpGolomb(bitstream);
		if (picOrderCntType === 0) readExpGolomb(bitstream);
		else if (picOrderCntType === 1) {
			bitstream.skipBits(1);
			readSignedExpGolomb(bitstream);
			readSignedExpGolomb(bitstream);
			const numRefFramesInPicOrderCntCycle = readExpGolomb(bitstream);
			for (let i = 0; i < numRefFramesInPicOrderCntCycle; i++) readSignedExpGolomb(bitstream);
		}
		readExpGolomb(bitstream);
		bitstream.skipBits(1);
		const picWidthInMbsMinus1 = readExpGolomb(bitstream);
		const picHeightInMapUnitsMinus1 = readExpGolomb(bitstream);
		const codedWidth = 16 * (picWidthInMbsMinus1 + 1);
		const codedHeight = 16 * (picHeightInMapUnitsMinus1 + 1);
		let displayWidth = codedWidth;
		let displayHeight = codedHeight;
		const frameMbsOnlyFlag = bitstream.readBits(1);
		if (!frameMbsOnlyFlag) bitstream.skipBits(1);
		bitstream.skipBits(1);
		if (bitstream.readBits(1)) {
			const frameCropLeftOffset = readExpGolomb(bitstream);
			const frameCropRightOffset = readExpGolomb(bitstream);
			const frameCropTopOffset = readExpGolomb(bitstream);
			const frameCropBottomOffset = readExpGolomb(bitstream);
			let cropUnitX;
			let cropUnitY;
			if ((separateColourPlaneFlag === 0 ? chromaFormatIdc : 0) === 0) {
				cropUnitX = 1;
				cropUnitY = 2 - frameMbsOnlyFlag;
			} else {
				const subWidthC = chromaFormatIdc === 3 ? 1 : 2;
				const subHeightC = chromaFormatIdc === 1 ? 2 : 1;
				cropUnitX = subWidthC;
				cropUnitY = subHeightC * (2 - frameMbsOnlyFlag);
			}
			displayWidth -= cropUnitX * (frameCropLeftOffset + frameCropRightOffset);
			displayHeight -= cropUnitY * (frameCropTopOffset + frameCropBottomOffset);
		}
		let colourPrimaries = 2;
		let transferCharacteristics = 2;
		let matrixCoefficients = 2;
		let fullRangeFlag = 0;
		let pixelAspectRatio = {
			num: 1,
			den: 1
		};
		let numReorderFrames = null;
		let maxDecFrameBuffering = null;
		if (bitstream.readBits(1)) {
			if (bitstream.readBits(1)) {
				const aspectRatioIdc = bitstream.readBits(8);
				if (aspectRatioIdc === 255) pixelAspectRatio = {
					num: bitstream.readBits(16),
					den: bitstream.readBits(16)
				};
				else {
					const aspectRatio = AVC_HEVC_ASPECT_RATIO_IDC_TABLE[aspectRatioIdc];
					if (aspectRatio) pixelAspectRatio = aspectRatio;
				}
			}
			if (bitstream.readBits(1)) bitstream.skipBits(1);
			if (bitstream.readBits(1)) {
				bitstream.skipBits(3);
				fullRangeFlag = bitstream.readBits(1);
				if (bitstream.readBits(1)) {
					colourPrimaries = bitstream.readBits(8);
					transferCharacteristics = bitstream.readBits(8);
					matrixCoefficients = bitstream.readBits(8);
				}
			}
			if (bitstream.readBits(1)) {
				readExpGolomb(bitstream);
				readExpGolomb(bitstream);
			}
			if (bitstream.readBits(1)) {
				bitstream.skipBits(32);
				bitstream.skipBits(32);
				bitstream.skipBits(1);
			}
			const nalHrdParametersPresentFlag = bitstream.readBits(1);
			if (nalHrdParametersPresentFlag) skipAvcHrdParameters(bitstream);
			const vclHrdParametersPresentFlag = bitstream.readBits(1);
			if (vclHrdParametersPresentFlag) skipAvcHrdParameters(bitstream);
			if (nalHrdParametersPresentFlag || vclHrdParametersPresentFlag) bitstream.skipBits(1);
			bitstream.skipBits(1);
			if (bitstream.readBits(1)) {
				bitstream.skipBits(1);
				readExpGolomb(bitstream);
				readExpGolomb(bitstream);
				readExpGolomb(bitstream);
				readExpGolomb(bitstream);
				numReorderFrames = readExpGolomb(bitstream);
				maxDecFrameBuffering = readExpGolomb(bitstream);
			}
		}
		if (numReorderFrames === null) {
			assert(maxDecFrameBuffering === null);
			const constraintSet3Flag = constraintFlags & 16;
			if ((profileIdc === 44 || profileIdc === 86 || profileIdc === 100 || profileIdc === 110 || profileIdc === 122 || profileIdc === 244) && constraintSet3Flag) {
				numReorderFrames = 0;
				maxDecFrameBuffering = 0;
			} else {
				const picWidthInMbs = picWidthInMbsMinus1 + 1;
				const picHeightInMapUnits = picHeightInMapUnitsMinus1 + 1;
				const frameHeightInMbs = (2 - frameMbsOnlyFlag) * picHeightInMapUnits;
				const levelInfo = AVC_LEVEL_TABLE.find((x) => x.level >= levelIdc) ?? last(AVC_LEVEL_TABLE);
				const maxDpbFrames = Math.min(Math.floor(levelInfo.maxDpbMbs / (picWidthInMbs * frameHeightInMbs)), 16);
				numReorderFrames = maxDpbFrames;
				maxDecFrameBuffering = maxDpbFrames;
			}
		}
		assert(maxDecFrameBuffering !== null);
		return {
			profileIdc,
			constraintFlags,
			levelIdc,
			frameMbsOnlyFlag,
			chromaFormatIdc,
			bitDepthLumaMinus8,
			bitDepthChromaMinus8,
			codedWidth,
			codedHeight,
			displayWidth,
			displayHeight,
			pixelAspectRatio,
			colourPrimaries,
			matrixCoefficients,
			transferCharacteristics,
			fullRangeFlag,
			numReorderFrames,
			maxDecFrameBuffering
		};
	} catch (error) {
		Logging._error("Error parsing AVC SPS:", error);
		return null;
	}
};
const skipAvcHrdParameters = (bitstream) => {
	const cpb_cnt_minus1 = readExpGolomb(bitstream);
	bitstream.skipBits(4);
	bitstream.skipBits(4);
	for (let i = 0; i <= cpb_cnt_minus1; i++) {
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		bitstream.skipBits(1);
	}
	bitstream.skipBits(5);
	bitstream.skipBits(5);
	bitstream.skipBits(5);
	bitstream.skipBits(5);
};
const iterateHevcNalUnits = (packetData, decoderConfig) => {
	if (decoderConfig.description) {
		const lengthSize = (toUint8Array(decoderConfig.description)[21] & 3) + 1;
		return iterateNalUnitsInLengthPrefixed(packetData, lengthSize);
	} else return iterateNalUnitsInAnnexB(packetData);
};
const extractNalUnitTypeForHevc = (byte) => {
	return byte >> 1 & 63;
};
/** Parses an HEVC SPS (Sequence Parameter Set) to extract video information. */
const parseHevcSps = (sps) => {
	try {
		const bitstream = new Bitstream(removeEmulationPreventionBytes(sps));
		bitstream.skipBits(16);
		bitstream.readBits(4);
		const spsMaxSubLayersMinus1 = bitstream.readBits(3);
		const spsTemporalIdNestingFlag = bitstream.readBits(1);
		const { general_profile_space, general_tier_flag, general_profile_idc, general_profile_compatibility_flags, general_constraint_indicator_flags, general_level_idc } = parseProfileTierLevel(bitstream, spsMaxSubLayersMinus1);
		readExpGolomb(bitstream);
		const chromaFormatIdc = readExpGolomb(bitstream);
		let separateColourPlaneFlag = 0;
		if (chromaFormatIdc === 3) separateColourPlaneFlag = bitstream.readBits(1);
		const picWidthInLumaSamples = readExpGolomb(bitstream);
		const picHeightInLumaSamples = readExpGolomb(bitstream);
		let displayWidth = picWidthInLumaSamples;
		let displayHeight = picHeightInLumaSamples;
		if (bitstream.readBits(1)) {
			const confWinLeftOffset = readExpGolomb(bitstream);
			const confWinRightOffset = readExpGolomb(bitstream);
			const confWinTopOffset = readExpGolomb(bitstream);
			const confWinBottomOffset = readExpGolomb(bitstream);
			let subWidthC = 1;
			let subHeightC = 1;
			const chromaArrayType = separateColourPlaneFlag === 0 ? chromaFormatIdc : 0;
			if (chromaArrayType === 1) {
				subWidthC = 2;
				subHeightC = 2;
			} else if (chromaArrayType === 2) {
				subWidthC = 2;
				subHeightC = 1;
			}
			displayWidth -= (confWinLeftOffset + confWinRightOffset) * subWidthC;
			displayHeight -= (confWinTopOffset + confWinBottomOffset) * subHeightC;
		}
		const bitDepthLumaMinus8 = readExpGolomb(bitstream);
		const bitDepthChromaMinus8 = readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		const startI = bitstream.readBits(1) ? 0 : spsMaxSubLayersMinus1;
		let spsMaxNumReorderPics = 0;
		for (let i = startI; i <= spsMaxSubLayersMinus1; i++) {
			readExpGolomb(bitstream);
			spsMaxNumReorderPics = readExpGolomb(bitstream);
			readExpGolomb(bitstream);
		}
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		if (bitstream.readBits(1)) {
			if (bitstream.readBits(1)) skipScalingListData(bitstream);
		}
		bitstream.skipBits(1);
		bitstream.skipBits(1);
		if (bitstream.readBits(1)) {
			bitstream.skipBits(4);
			bitstream.skipBits(4);
			readExpGolomb(bitstream);
			readExpGolomb(bitstream);
			bitstream.skipBits(1);
		}
		const numShortTermRefPicSets = readExpGolomb(bitstream);
		skipAllStRefPicSets(bitstream, numShortTermRefPicSets);
		if (bitstream.readBits(1)) {
			const numLongTermRefPicsSps = readExpGolomb(bitstream);
			for (let i = 0; i < numLongTermRefPicsSps; i++) {
				readExpGolomb(bitstream);
				bitstream.skipBits(1);
			}
		}
		bitstream.skipBits(1);
		bitstream.skipBits(1);
		let colourPrimaries = 2;
		let transferCharacteristics = 2;
		let matrixCoefficients = 2;
		let fullRangeFlag = 0;
		let minSpatialSegmentationIdc = 0;
		let pixelAspectRatio = {
			num: 1,
			den: 1
		};
		if (bitstream.readBits(1)) {
			const vui = parseHevcVui(bitstream, spsMaxSubLayersMinus1);
			pixelAspectRatio = vui.pixelAspectRatio;
			colourPrimaries = vui.colourPrimaries;
			transferCharacteristics = vui.transferCharacteristics;
			matrixCoefficients = vui.matrixCoefficients;
			fullRangeFlag = vui.fullRangeFlag;
			minSpatialSegmentationIdc = vui.minSpatialSegmentationIdc;
		}
		return {
			displayWidth,
			displayHeight,
			pixelAspectRatio,
			colourPrimaries,
			transferCharacteristics,
			matrixCoefficients,
			fullRangeFlag,
			maxDecFrameBuffering: spsMaxNumReorderPics + 1,
			spsMaxSubLayersMinus1,
			spsTemporalIdNestingFlag,
			generalProfileSpace: general_profile_space,
			generalTierFlag: general_tier_flag,
			generalProfileIdc: general_profile_idc,
			generalProfileCompatibilityFlags: general_profile_compatibility_flags,
			generalConstraintIndicatorFlags: general_constraint_indicator_flags,
			generalLevelIdc: general_level_idc,
			chromaFormatIdc,
			bitDepthLumaMinus8,
			bitDepthChromaMinus8,
			minSpatialSegmentationIdc
		};
	} catch (error) {
		Logging._error("Error parsing HEVC SPS:", error);
		return null;
	}
};
/** Builds a HevcDecoderConfigurationRecord from an HEVC packet in Annex B format. */
const extractHevcDecoderConfigurationRecord = (packetData) => {
	try {
		const vpsUnits = [];
		const spsUnits = [];
		const ppsUnits = [];
		const seiUnits = [];
		for (const loc of iterateNalUnitsInAnnexB(packetData)) {
			const nalUnit = packetData.subarray(loc.offset, loc.offset + loc.length);
			const type = extractNalUnitTypeForHevc(nalUnit[0]);
			if (type === HevcNalUnitType.VPS_NUT) vpsUnits.push(nalUnit);
			else if (type === HevcNalUnitType.SPS_NUT) spsUnits.push(nalUnit);
			else if (type === HevcNalUnitType.PPS_NUT) ppsUnits.push(nalUnit);
			else if (type === HevcNalUnitType.PREFIX_SEI_NUT || type === HevcNalUnitType.SUFFIX_SEI_NUT) seiUnits.push(nalUnit);
		}
		if (spsUnits.length === 0 || ppsUnits.length === 0) return null;
		const spsInfo = parseHevcSps(spsUnits[0]);
		if (!spsInfo) return null;
		let parallelismType = 0;
		if (ppsUnits.length > 0) {
			const pps = ppsUnits[0];
			const ppsBitstream = new Bitstream(removeEmulationPreventionBytes(pps));
			ppsBitstream.skipBits(16);
			readExpGolomb(ppsBitstream);
			readExpGolomb(ppsBitstream);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(3);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(1);
			readExpGolomb(ppsBitstream);
			readExpGolomb(ppsBitstream);
			readSignedExpGolomb(ppsBitstream);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(1);
			if (ppsBitstream.readBits(1)) readExpGolomb(ppsBitstream);
			readSignedExpGolomb(ppsBitstream);
			readSignedExpGolomb(ppsBitstream);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(1);
			const tiles_enabled_flag = ppsBitstream.readBits(1);
			const entropy_coding_sync_enabled_flag = ppsBitstream.readBits(1);
			if (!tiles_enabled_flag && !entropy_coding_sync_enabled_flag) parallelismType = 0;
			else if (tiles_enabled_flag && !entropy_coding_sync_enabled_flag) parallelismType = 2;
			else if (!tiles_enabled_flag && entropy_coding_sync_enabled_flag) parallelismType = 3;
			else parallelismType = 0;
		}
		const arrays = [
			...vpsUnits.length ? [{
				arrayCompleteness: 1,
				nalUnitType: HevcNalUnitType.VPS_NUT,
				nalUnits: vpsUnits
			}] : [],
			...spsUnits.length ? [{
				arrayCompleteness: 1,
				nalUnitType: HevcNalUnitType.SPS_NUT,
				nalUnits: spsUnits
			}] : [],
			...ppsUnits.length ? [{
				arrayCompleteness: 1,
				nalUnitType: HevcNalUnitType.PPS_NUT,
				nalUnits: ppsUnits
			}] : [],
			...seiUnits.length ? [{
				arrayCompleteness: 1,
				nalUnitType: extractNalUnitTypeForHevc(seiUnits[0][0]),
				nalUnits: seiUnits
			}] : []
		];
		return {
			configurationVersion: 1,
			generalProfileSpace: spsInfo.generalProfileSpace,
			generalTierFlag: spsInfo.generalTierFlag,
			generalProfileIdc: spsInfo.generalProfileIdc,
			generalProfileCompatibilityFlags: spsInfo.generalProfileCompatibilityFlags,
			generalConstraintIndicatorFlags: spsInfo.generalConstraintIndicatorFlags,
			generalLevelIdc: spsInfo.generalLevelIdc,
			minSpatialSegmentationIdc: spsInfo.minSpatialSegmentationIdc,
			parallelismType,
			chromaFormatIdc: spsInfo.chromaFormatIdc,
			bitDepthLumaMinus8: spsInfo.bitDepthLumaMinus8,
			bitDepthChromaMinus8: spsInfo.bitDepthChromaMinus8,
			avgFrameRate: 0,
			constantFrameRate: 0,
			numTemporalLayers: spsInfo.spsMaxSubLayersMinus1 + 1,
			temporalIdNested: spsInfo.spsTemporalIdNestingFlag,
			lengthSizeMinusOne: 3,
			arrays
		};
	} catch (error) {
		Logging._error("Error building HEVC Decoder Configuration Record:", error);
		return null;
	}
};
const parseProfileTierLevel = (bitstream, maxNumSubLayersMinus1) => {
	const general_profile_space = bitstream.readBits(2);
	const general_tier_flag = bitstream.readBits(1);
	const general_profile_idc = bitstream.readBits(5);
	let general_profile_compatibility_flags = 0;
	for (let i = 0; i < 32; i++) general_profile_compatibility_flags = general_profile_compatibility_flags << 1 | bitstream.readBits(1);
	const general_constraint_indicator_flags = /* @__PURE__ */ new Uint8Array(6);
	for (let i = 0; i < 6; i++) general_constraint_indicator_flags[i] = bitstream.readBits(8);
	const general_level_idc = bitstream.readBits(8);
	const sub_layer_profile_present_flag = [];
	const sub_layer_level_present_flag = [];
	for (let i = 0; i < maxNumSubLayersMinus1; i++) {
		sub_layer_profile_present_flag.push(bitstream.readBits(1));
		sub_layer_level_present_flag.push(bitstream.readBits(1));
	}
	if (maxNumSubLayersMinus1 > 0) for (let i = maxNumSubLayersMinus1; i < 8; i++) bitstream.skipBits(2);
	for (let i = 0; i < maxNumSubLayersMinus1; i++) {
		if (sub_layer_profile_present_flag[i]) bitstream.skipBits(88);
		if (sub_layer_level_present_flag[i]) bitstream.skipBits(8);
	}
	return {
		general_profile_space,
		general_tier_flag,
		general_profile_idc,
		general_profile_compatibility_flags,
		general_constraint_indicator_flags,
		general_level_idc
	};
};
const skipScalingListData = (bitstream) => {
	for (let sizeId = 0; sizeId < 4; sizeId++) for (let matrixId = 0; matrixId < (sizeId === 3 ? 2 : 6); matrixId++) if (!bitstream.readBits(1)) readExpGolomb(bitstream);
	else {
		const coefNum = Math.min(64, 1 << 4 + (sizeId << 1));
		if (sizeId > 1) readSignedExpGolomb(bitstream);
		for (let i = 0; i < coefNum; i++) readSignedExpGolomb(bitstream);
	}
};
const skipAllStRefPicSets = (bitstream, num_short_term_ref_pic_sets) => {
	const NumDeltaPocs = [];
	for (let stRpsIdx = 0; stRpsIdx < num_short_term_ref_pic_sets; stRpsIdx++) NumDeltaPocs[stRpsIdx] = skipStRefPicSet(bitstream, stRpsIdx, num_short_term_ref_pic_sets, NumDeltaPocs);
};
const skipStRefPicSet = (bitstream, stRpsIdx, num_short_term_ref_pic_sets, NumDeltaPocs) => {
	let NumDeltaPocsThis = 0;
	let inter_ref_pic_set_prediction_flag = 0;
	let RefRpsIdx = 0;
	if (stRpsIdx !== 0) inter_ref_pic_set_prediction_flag = bitstream.readBits(1);
	if (inter_ref_pic_set_prediction_flag) {
		if (stRpsIdx === num_short_term_ref_pic_sets) RefRpsIdx = stRpsIdx - (readExpGolomb(bitstream) + 1);
		else RefRpsIdx = stRpsIdx - 1;
		bitstream.readBits(1);
		readExpGolomb(bitstream);
		const numDelta = NumDeltaPocs[RefRpsIdx] ?? 0;
		for (let j = 0; j <= numDelta; j++) if (!bitstream.readBits(1)) bitstream.readBits(1);
		NumDeltaPocsThis = NumDeltaPocs[RefRpsIdx];
	} else {
		const num_negative_pics = readExpGolomb(bitstream);
		const num_positive_pics = readExpGolomb(bitstream);
		for (let i = 0; i < num_negative_pics; i++) {
			readExpGolomb(bitstream);
			bitstream.readBits(1);
		}
		for (let i = 0; i < num_positive_pics; i++) {
			readExpGolomb(bitstream);
			bitstream.readBits(1);
		}
		NumDeltaPocsThis = num_negative_pics + num_positive_pics;
	}
	return NumDeltaPocsThis;
};
const parseHevcVui = (bitstream, sps_max_sub_layers_minus1) => {
	let colourPrimaries = 2;
	let transferCharacteristics = 2;
	let matrixCoefficients = 2;
	let fullRangeFlag = 0;
	let minSpatialSegmentationIdc = 0;
	let pixelAspectRatio = {
		num: 1,
		den: 1
	};
	if (bitstream.readBits(1)) {
		const aspect_ratio_idc = bitstream.readBits(8);
		if (aspect_ratio_idc === 255) pixelAspectRatio = {
			num: bitstream.readBits(16),
			den: bitstream.readBits(16)
		};
		else {
			const aspectRatio = AVC_HEVC_ASPECT_RATIO_IDC_TABLE[aspect_ratio_idc];
			if (aspectRatio) pixelAspectRatio = aspectRatio;
		}
	}
	if (bitstream.readBits(1)) bitstream.readBits(1);
	if (bitstream.readBits(1)) {
		bitstream.readBits(3);
		fullRangeFlag = bitstream.readBits(1);
		if (bitstream.readBits(1)) {
			colourPrimaries = bitstream.readBits(8);
			transferCharacteristics = bitstream.readBits(8);
			matrixCoefficients = bitstream.readBits(8);
		}
	}
	if (bitstream.readBits(1)) {
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
	}
	bitstream.readBits(1);
	bitstream.readBits(1);
	bitstream.readBits(1);
	if (bitstream.readBits(1)) {
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
	}
	if (bitstream.readBits(1)) {
		bitstream.readBits(32);
		bitstream.readBits(32);
		if (bitstream.readBits(1)) readExpGolomb(bitstream);
		if (bitstream.readBits(1)) skipHevcHrdParameters(bitstream, true, sps_max_sub_layers_minus1);
	}
	if (bitstream.readBits(1)) {
		bitstream.readBits(1);
		bitstream.readBits(1);
		bitstream.readBits(1);
		minSpatialSegmentationIdc = readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
	}
	return {
		pixelAspectRatio,
		colourPrimaries,
		transferCharacteristics,
		matrixCoefficients,
		fullRangeFlag,
		minSpatialSegmentationIdc
	};
};
const skipHevcHrdParameters = (bitstream, commonInfPresentFlag, maxNumSubLayersMinus1) => {
	let nal_hrd_parameters_present_flag = false;
	let vcl_hrd_parameters_present_flag = false;
	let sub_pic_hrd_params_present_flag = false;
	if (commonInfPresentFlag) {
		nal_hrd_parameters_present_flag = bitstream.readBits(1) === 1;
		vcl_hrd_parameters_present_flag = bitstream.readBits(1) === 1;
		if (nal_hrd_parameters_present_flag || vcl_hrd_parameters_present_flag) {
			sub_pic_hrd_params_present_flag = bitstream.readBits(1) === 1;
			if (sub_pic_hrd_params_present_flag) {
				bitstream.readBits(8);
				bitstream.readBits(5);
				bitstream.readBits(1);
				bitstream.readBits(5);
			}
			bitstream.readBits(4);
			bitstream.readBits(4);
			if (sub_pic_hrd_params_present_flag) bitstream.readBits(4);
			bitstream.readBits(5);
			bitstream.readBits(5);
			bitstream.readBits(5);
		}
	}
	for (let i = 0; i <= maxNumSubLayersMinus1; i++) {
		const fixed_pic_rate_general_flag = bitstream.readBits(1) === 1;
		let fixed_pic_rate_within_cvs_flag = true;
		if (!fixed_pic_rate_general_flag) fixed_pic_rate_within_cvs_flag = bitstream.readBits(1) === 1;
		let low_delay_hrd_flag = false;
		if (fixed_pic_rate_within_cvs_flag) readExpGolomb(bitstream);
		else low_delay_hrd_flag = bitstream.readBits(1) === 1;
		let CpbCnt = 1;
		if (!low_delay_hrd_flag) CpbCnt = readExpGolomb(bitstream) + 1;
		if (nal_hrd_parameters_present_flag) skipSubLayerHrdParameters(bitstream, CpbCnt, sub_pic_hrd_params_present_flag);
		if (vcl_hrd_parameters_present_flag) skipSubLayerHrdParameters(bitstream, CpbCnt, sub_pic_hrd_params_present_flag);
	}
};
const skipSubLayerHrdParameters = (bitstream, CpbCnt, sub_pic_hrd_params_present_flag) => {
	for (let i = 0; i < CpbCnt; i++) {
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		if (sub_pic_hrd_params_present_flag) {
			readExpGolomb(bitstream);
			readExpGolomb(bitstream);
		}
		bitstream.readBits(1);
	}
};
/** Serializes an HevcDecoderConfigurationRecord into the format specified in Section 8.3.3.1 of ISO 14496-15. */
const serializeHevcDecoderConfigurationRecord = (record) => {
	const bytes = [];
	bytes.push(record.configurationVersion);
	bytes.push((record.generalProfileSpace & 3) << 6 | (record.generalTierFlag & 1) << 5 | record.generalProfileIdc & 31);
	bytes.push(record.generalProfileCompatibilityFlags >>> 24 & 255);
	bytes.push(record.generalProfileCompatibilityFlags >>> 16 & 255);
	bytes.push(record.generalProfileCompatibilityFlags >>> 8 & 255);
	bytes.push(record.generalProfileCompatibilityFlags & 255);
	bytes.push(...record.generalConstraintIndicatorFlags);
	bytes.push(record.generalLevelIdc & 255);
	bytes.push(240 | record.minSpatialSegmentationIdc >> 8 & 15);
	bytes.push(record.minSpatialSegmentationIdc & 255);
	bytes.push(252 | record.parallelismType & 3);
	bytes.push(252 | record.chromaFormatIdc & 3);
	bytes.push(248 | record.bitDepthLumaMinus8 & 7);
	bytes.push(248 | record.bitDepthChromaMinus8 & 7);
	bytes.push(record.avgFrameRate >> 8 & 255);
	bytes.push(record.avgFrameRate & 255);
	bytes.push((record.constantFrameRate & 3) << 6 | (record.numTemporalLayers & 7) << 3 | (record.temporalIdNested & 1) << 2 | record.lengthSizeMinusOne & 3);
	bytes.push(record.arrays.length & 255);
	for (const arr of record.arrays) {
		bytes.push((arr.arrayCompleteness & 1) << 7 | 0 | arr.nalUnitType & 63);
		bytes.push(arr.nalUnits.length >> 8 & 255);
		bytes.push(arr.nalUnits.length & 255);
		for (const nal of arr.nalUnits) {
			bytes.push(nal.length >> 8 & 255);
			bytes.push(nal.length & 255);
			for (let i = 0; i < nal.length; i++) bytes.push(nal[i]);
		}
	}
	return new Uint8Array(bytes);
};
var HevcNaluOrderState;
(function(HevcNaluOrderState) {
	HevcNaluOrderState[HevcNaluOrderState["audAllowed"] = 0] = "audAllowed";
	HevcNaluOrderState[HevcNaluOrderState["beforeFirstVcl"] = 1] = "beforeFirstVcl";
	HevcNaluOrderState[HevcNaluOrderState["afterFirstVcl"] = 2] = "afterFirstVcl";
	HevcNaluOrderState[HevcNaluOrderState["eoBitstreamAllowed"] = 3] = "eoBitstreamAllowed";
	HevcNaluOrderState[HevcNaluOrderState["noMoreDataAllowed"] = 4] = "noMoreDataAllowed";
})(HevcNaluOrderState || (HevcNaluOrderState = {}));
/** Iterates over all OBUs in an AV1 packet bistream. */
const iterateAv1PacketObus = function* (packet) {
	const bitstream = new Bitstream(packet);
	const readLeb128 = () => {
		let value = 0;
		for (let i = 0; i < 8; i++) {
			const byte = bitstream.readAlignedByte();
			value |= (byte & 127) << i * 7;
			if (!(byte & 128)) break;
			if (i === 7 && byte & 128) return null;
		}
		if (value >= 2 ** 32 - 1) return null;
		return value;
	};
	while (bitstream.getBitsLeft() >= 8) {
		bitstream.skipBits(1);
		const obuType = bitstream.readBits(4);
		const obuExtension = bitstream.readBits(1);
		const obuHasSizeField = bitstream.readBits(1);
		bitstream.skipBits(1);
		if (obuExtension) bitstream.skipBits(8);
		let obuSize;
		if (obuHasSizeField) {
			const obuSizeValue = readLeb128();
			if (obuSizeValue === null) return;
			obuSize = obuSizeValue;
		} else obuSize = Math.floor(bitstream.getBitsLeft() / 8);
		assert(bitstream.pos % 8 === 0);
		yield {
			type: obuType,
			data: packet.subarray(bitstream.pos / 8, bitstream.pos / 8 + obuSize)
		};
		bitstream.skipBits(obuSize * 8);
	}
};
const parseOpusIdentificationHeader = (bytes) => {
	const view = toDataView(bytes);
	const outputChannelCount = view.getUint8(9);
	const preSkip = view.getUint16(10, true);
	const inputSampleRate = view.getUint32(12, true);
	const outputGain = view.getInt16(16, true);
	const channelMappingFamily = view.getUint8(18);
	let channelMappingTable = null;
	if (channelMappingFamily) channelMappingTable = bytes.subarray(19, 21 + outputChannelCount);
	return {
		outputChannelCount,
		preSkip,
		inputSampleRate,
		outputGain,
		channelMappingFamily,
		channelMappingTable
	};
};
/** Determines a packet's type (key or delta) by digging into the packet bitstream. */
const determineVideoPacketType = (codec, decoderConfig, packetData) => {
	switch (codec) {
		case "avc":
			for (const loc of iterateAvcNalUnits(packetData, decoderConfig)) {
				const nalTypeByte = packetData[loc.offset];
				const type = extractNalUnitTypeForAvc(nalTypeByte);
				if (type >= AvcNalUnitType.NON_IDR_SLICE && type <= AvcNalUnitType.SLICE_DPC) return "delta";
				if (type === AvcNalUnitType.IDR) return "key";
				if (type === AvcNalUnitType.SEI && (!isChromium() || getChromiumVersion() >= 144)) {
					const nalUnit = packetData.subarray(loc.offset, loc.offset + loc.length);
					const bytes = removeEmulationPreventionBytes(nalUnit);
					let pos = 1;
					do {
						let payloadType = 0;
						while (true) {
							const nextByte = bytes[pos++];
							if (nextByte === void 0) break;
							payloadType += nextByte;
							if (nextByte < 255) break;
						}
						let payloadSize = 0;
						while (true) {
							const nextByte = bytes[pos++];
							if (nextByte === void 0) break;
							payloadSize += nextByte;
							if (nextByte < 255) break;
						}
						if (payloadType === 6) {
							const bitstream = new Bitstream(bytes);
							bitstream.pos = 8 * pos;
							const recoveryFrameCount = readExpGolomb(bitstream);
							const exactMatchFlag = bitstream.readBits(1);
							if (recoveryFrameCount === 0 && exactMatchFlag === 1) return "key";
						}
						pos += payloadSize;
					} while (pos < bytes.length - 1);
				}
			}
			return "delta";
		case "hevc":
			for (const loc of iterateHevcNalUnits(packetData, decoderConfig)) {
				const type = extractNalUnitTypeForHevc(packetData[loc.offset]);
				if (type < HevcNalUnitType.BLA_W_LP) return "delta";
				if (type <= HevcNalUnitType.RSV_IRAP_VCL23) return "key";
			}
			return "delta";
		case "vp8": return (packetData[0] & 1) === 0 ? "key" : "delta";
		case "vp9": {
			const bitstream = new Bitstream(packetData);
			if (bitstream.readBits(2) !== 2) return null;
			const profileLowBit = bitstream.readBits(1);
			if ((bitstream.readBits(1) << 1) + profileLowBit === 3) bitstream.skipBits(1);
			if (bitstream.readBits(1)) return null;
			return bitstream.readBits(1) === 0 ? "key" : "delta";
		}
		case "av1": {
			let reducedStillPictureHeader = false;
			for (const { type, data } of iterateAv1PacketObus(packetData)) if (type === 1) {
				const bitstream = new Bitstream(data);
				bitstream.skipBits(4);
				reducedStillPictureHeader = !!bitstream.readBits(1);
			} else if (type === 3 || type === 6 || type === 7) {
				if (reducedStillPictureHeader) return "key";
				const bitstream = new Bitstream(data);
				if (bitstream.readBits(1)) return null;
				return bitstream.readBits(2) === 0 ? "key" : "delta";
			}
			return null;
		}
		default:
			assertNever(codec);
			assert(false);
	}
};
var FlacBlockType;
(function(FlacBlockType) {
	FlacBlockType[FlacBlockType["STREAMINFO"] = 0] = "STREAMINFO";
	FlacBlockType[FlacBlockType["VORBIS_COMMENT"] = 4] = "VORBIS_COMMENT";
	FlacBlockType[FlacBlockType["PICTURE"] = 6] = "PICTURE";
})(FlacBlockType || (FlacBlockType = {}));
/**
* Parse an AC-3 syncframe to extract BSI (Bit Stream Information) fields.
* Section 4.3
*/
const parseAc3SyncFrame = (data) => {
	if (data.length < 7) return null;
	if (data[0] !== 11 || data[1] !== 119) return null;
	const bitstream = new Bitstream(data);
	bitstream.skipBits(16);
	bitstream.skipBits(16);
	const fscod = bitstream.readBits(2);
	if (fscod === 3) return null;
	const frmsizecod = bitstream.readBits(6);
	const bsid = bitstream.readBits(5);
	if (bsid > 8) return null;
	const bsmod = bitstream.readBits(3);
	const acmod = bitstream.readBits(3);
	if ((acmod & 1) !== 0 && acmod !== 1) bitstream.skipBits(2);
	if ((acmod & 4) !== 0) bitstream.skipBits(2);
	if (acmod === 2) bitstream.skipBits(2);
	return {
		fscod,
		bsid,
		bsmod,
		acmod,
		lfeon: bitstream.readBits(1),
		bitRateCode: Math.floor(frmsizecod / 2)
	};
};
/**
* AC-3 registration_descriptor for MPEG-TS.
* Section A.2.3
*/
const AC3_REGISTRATION_DESCRIPTOR = new Uint8Array([
	5,
	4,
	65,
	67,
	45,
	51
]);
/** E-AC-3 registration_descriptor for MPEG-TS/ */
const EAC3_REGISTRATION_DESCRIPTOR = new Uint8Array([
	5,
	4,
	69,
	65,
	67,
	51
]);
/** Number of audio blocks per syncframe, indexed by numblkscod */
const EAC3_NUMBLKS_TABLE = [
	1,
	2,
	3,
	6
];
/**
* Parse an E-AC-3 syncframe to extract BSI fields.
* Section E.1.2
*/
const parseEac3SyncFrame = (data) => {
	if (data.length < 6) return null;
	if (data[0] !== 11 || data[1] !== 119) return null;
	const bitstream = new Bitstream(data);
	bitstream.skipBits(16);
	const strmtyp = bitstream.readBits(2);
	bitstream.skipBits(3);
	if (strmtyp !== 0 && strmtyp !== 2) return null;
	const frmsiz = bitstream.readBits(11);
	const fscod = bitstream.readBits(2);
	let fscod2 = 0;
	let numblkscod;
	if (fscod === 3) {
		fscod2 = bitstream.readBits(2);
		numblkscod = 3;
	} else numblkscod = bitstream.readBits(2);
	const acmod = bitstream.readBits(3);
	const lfeon = bitstream.readBits(1);
	const bsid = bitstream.readBits(5);
	if (bsid < 11 || bsid > 16) return null;
	const numblks = EAC3_NUMBLKS_TABLE[numblkscod];
	let fs;
	if (fscod < 3) fs = AC3_SAMPLE_RATES[fscod] / 1e3;
	else fs = EAC3_REDUCED_SAMPLE_RATES[fscod2] / 1e3;
	return {
		dataRate: Math.round((frmsiz + 1) * fs / (numblks * 16)),
		substreams: [{
			fscod,
			fscod2,
			bsid,
			bsmod: 0,
			acmod,
			lfeon,
			numDepSub: 0,
			chanLoc: 0
		}]
	};
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/packet.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
const PLACEHOLDER_DATA = /* #__PURE__ */ new Uint8Array(0);
/**
* Represents an encoded chunk of media. Mainly used as an expressive wrapper around WebCodecs API's
* [\`EncodedVideoChunk\`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedVideoChunk) and
* [\`EncodedAudioChunk\`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedAudioChunk), but can also be used
* standalone.
* @group Packets
* @public
*/
var EncodedPacket = class EncodedPacket {
	/** Creates a new {@link EncodedPacket} from raw bytes and timing information. */
	constructor(data, type, timestamp, duration, sequenceNumber = -1, byteLength, sideData) {
		this.data = data;
		this.type = type;
		this.timestamp = timestamp;
		this.duration = duration;
		this.sequenceNumber = sequenceNumber;
		if (data === PLACEHOLDER_DATA && byteLength === void 0) throw new Error("Internal error: byteLength must be explicitly provided when constructing metadata-only packets.");
		if (byteLength === void 0) byteLength = data.byteLength;
		if (!(data instanceof Uint8Array)) throw new TypeError("data must be a Uint8Array.");
		if (type !== "key" && type !== "delta") throw new TypeError("type must be either \\"key\\" or \\"delta\\".");
		if (!Number.isFinite(timestamp)) throw new TypeError("timestamp must be a number.");
		if (!Number.isFinite(duration) || duration < 0) throw new TypeError("duration must be a non-negative number.");
		if (!Number.isFinite(sequenceNumber)) throw new TypeError("sequenceNumber must be a number.");
		if (!Number.isInteger(byteLength) || byteLength < 0) throw new TypeError("byteLength must be a non-negative integer.");
		if (sideData !== void 0 && (typeof sideData !== "object" || !sideData)) throw new TypeError("sideData, when provided, must be an object.");
		if (sideData?.alpha !== void 0 && !(sideData.alpha instanceof Uint8Array)) throw new TypeError("sideData.alpha, when provided, must be a Uint8Array.");
		if (sideData?.alphaByteLength !== void 0 && (!Number.isInteger(sideData.alphaByteLength) || sideData.alphaByteLength < 0)) throw new TypeError("sideData.alphaByteLength, when provided, must be a non-negative integer.");
		this.byteLength = byteLength;
		this.sideData = sideData ?? {};
		if (this.sideData.alpha && this.sideData.alphaByteLength === void 0) this.sideData.alphaByteLength = this.sideData.alpha.byteLength;
	}
	/**
	* If this packet is a metadata-only packet. Metadata-only packets don't contain their packet data. They are the
	* result of retrieving packets with {@link PacketRetrievalOptions.metadataOnly} set to \`true\`.
	*/
	get isMetadataOnly() {
		return this.data === PLACEHOLDER_DATA;
	}
	/** The timestamp of this packet in microseconds. */
	get microsecondTimestamp() {
		return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.timestamp);
	}
	/** The duration of this packet in microseconds. */
	get microsecondDuration() {
		return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.duration);
	}
	/** Converts this packet to an
	* [\`EncodedVideoChunk\`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedVideoChunk) for use with the
	* WebCodecs API. */
	toEncodedVideoChunk() {
		if (this.isMetadataOnly) throw new TypeError("Metadata-only packets cannot be converted to a video chunk.");
		if (typeof EncodedVideoChunk === "undefined") throw new Error("Your browser does not support EncodedVideoChunk.");
		return new EncodedVideoChunk({
			data: this.data,
			type: this.type,
			timestamp: this.microsecondTimestamp,
			duration: this.microsecondDuration
		});
	}
	/**
	* Converts this packet to an
	* [\`EncodedVideoChunk\`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedVideoChunk) for use with the
	* WebCodecs API, using the alpha side data instead of the color data. Throws if no alpha side data is defined.
	*/
	alphaToEncodedVideoChunk(type = this.type) {
		if (!this.sideData.alpha) throw new TypeError("This packet does not contain alpha side data.");
		if (this.isMetadataOnly) throw new TypeError("Metadata-only packets cannot be converted to a video chunk.");
		if (typeof EncodedVideoChunk === "undefined") throw new Error("Your browser does not support EncodedVideoChunk.");
		return new EncodedVideoChunk({
			data: this.sideData.alpha,
			type,
			timestamp: this.microsecondTimestamp,
			duration: this.microsecondDuration
		});
	}
	/** Converts this packet to an
	* [\`EncodedAudioChunk\`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedAudioChunk) for use with the
	* WebCodecs API. */
	toEncodedAudioChunk() {
		if (this.isMetadataOnly) throw new TypeError("Metadata-only packets cannot be converted to an audio chunk.");
		if (typeof EncodedAudioChunk === "undefined") throw new Error("Your browser does not support EncodedAudioChunk.");
		return new EncodedAudioChunk({
			data: this.data,
			type: this.type,
			timestamp: this.microsecondTimestamp,
			duration: this.microsecondDuration
		});
	}
	/**
	* Creates an {@link EncodedPacket} from an
	* [\`EncodedVideoChunk\`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedVideoChunk) or
	* [\`EncodedAudioChunk\`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedAudioChunk). This method is useful
	* for converting chunks from the WebCodecs API to \`EncodedPacket\` instances.
	*/
	static fromEncodedChunk(chunk, sideData) {
		if (!(chunk instanceof EncodedVideoChunk || chunk instanceof EncodedAudioChunk)) throw new TypeError("chunk must be an EncodedVideoChunk or EncodedAudioChunk.");
		const data = new Uint8Array(chunk.byteLength);
		chunk.copyTo(data);
		return new EncodedPacket(data, chunk.type, chunk.timestamp / 1e6, (chunk.duration ?? 0) / 1e6, void 0, void 0, sideData);
	}
	/** Clones this packet while optionally modifying the new packet's data. */
	clone(options) {
		if (options !== void 0 && (typeof options !== "object" || options === null)) throw new TypeError("options, when provided, must be an object.");
		if (options?.data !== void 0 && !(options.data instanceof Uint8Array)) throw new TypeError("options.data, when provided, must be a Uint8Array.");
		if (options?.type !== void 0 && options.type !== "key" && options.type !== "delta") throw new TypeError("options.type, when provided, must be either \\"key\\" or \\"delta\\".");
		if (options?.timestamp !== void 0 && !Number.isFinite(options.timestamp)) throw new TypeError("options.timestamp, when provided, must be a number.");
		if (options?.duration !== void 0 && !Number.isFinite(options.duration)) throw new TypeError("options.duration, when provided, must be a number.");
		if (options?.sequenceNumber !== void 0 && !Number.isFinite(options.sequenceNumber)) throw new TypeError("options.sequenceNumber, when provided, must be a number.");
		if (options?.sideData !== void 0 && (typeof options.sideData !== "object" || options.sideData === null)) throw new TypeError("options.sideData, when provided, must be an object.");
		return new EncodedPacket(options?.data ?? this.data, options?.type ?? this.type, options?.timestamp ?? this.timestamp, options?.duration ?? this.duration, options?.sequenceNumber ?? this.sequenceNumber, this.byteLength, options?.sideData ?? this.sideData);
	}
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/isobmff/isobmff-misc.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
const buildIsobmffMimeType = (info) => {
	let string = (info.hasVideo ? "video/" : info.hasAudio ? "audio/" : "application/") + (info.isQuickTime ? "quicktime" : "mp4");
	if (info.codecStrings.length > 0) {
		const uniqueCodecMimeTypes = [...new Set(info.codecStrings)];
		string += \`; codecs="\${uniqueCodecMimeTypes.join(", ")}"\`;
	}
	return string;
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/matroska/ebml.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/** Wrapper around a number to be able to differentiate it in the writer. */
var EBMLFloat32 = class {
	constructor(value) {
		this.value = value;
	}
};
/** Wrapper around a number to be able to differentiate it in the writer. */
var EBMLFloat64 = class {
	constructor(value) {
		this.value = value;
	}
};
/** Wrapper around a number to be able to differentiate it in the writer. */
var EBMLSignedInt = class {
	constructor(value) {
		this.value = value;
	}
};
var EBMLUnicodeString = class {
	constructor(value) {
		this.value = value;
	}
};
/** Defines some of the EBML IDs used by Matroska files. */
var EBMLId;
(function(EBMLId) {
	EBMLId[EBMLId["EBML"] = 440786851] = "EBML";
	EBMLId[EBMLId["EBMLVersion"] = 17030] = "EBMLVersion";
	EBMLId[EBMLId["EBMLReadVersion"] = 17143] = "EBMLReadVersion";
	EBMLId[EBMLId["EBMLMaxIDLength"] = 17138] = "EBMLMaxIDLength";
	EBMLId[EBMLId["EBMLMaxSizeLength"] = 17139] = "EBMLMaxSizeLength";
	EBMLId[EBMLId["DocType"] = 17026] = "DocType";
	EBMLId[EBMLId["DocTypeVersion"] = 17031] = "DocTypeVersion";
	EBMLId[EBMLId["DocTypeReadVersion"] = 17029] = "DocTypeReadVersion";
	EBMLId[EBMLId["Void"] = 236] = "Void";
	EBMLId[EBMLId["Segment"] = 408125543] = "Segment";
	EBMLId[EBMLId["SeekHead"] = 290298740] = "SeekHead";
	EBMLId[EBMLId["Seek"] = 19899] = "Seek";
	EBMLId[EBMLId["SeekID"] = 21419] = "SeekID";
	EBMLId[EBMLId["SeekPosition"] = 21420] = "SeekPosition";
	EBMLId[EBMLId["Duration"] = 17545] = "Duration";
	EBMLId[EBMLId["Info"] = 357149030] = "Info";
	EBMLId[EBMLId["TimestampScale"] = 2807729] = "TimestampScale";
	EBMLId[EBMLId["MuxingApp"] = 19840] = "MuxingApp";
	EBMLId[EBMLId["WritingApp"] = 22337] = "WritingApp";
	EBMLId[EBMLId["Tracks"] = 374648427] = "Tracks";
	EBMLId[EBMLId["TrackEntry"] = 174] = "TrackEntry";
	EBMLId[EBMLId["TrackNumber"] = 215] = "TrackNumber";
	EBMLId[EBMLId["TrackUID"] = 29637] = "TrackUID";
	EBMLId[EBMLId["TrackType"] = 131] = "TrackType";
	EBMLId[EBMLId["FlagEnabled"] = 185] = "FlagEnabled";
	EBMLId[EBMLId["FlagDefault"] = 136] = "FlagDefault";
	EBMLId[EBMLId["FlagForced"] = 21930] = "FlagForced";
	EBMLId[EBMLId["FlagOriginal"] = 21934] = "FlagOriginal";
	EBMLId[EBMLId["FlagHearingImpaired"] = 21931] = "FlagHearingImpaired";
	EBMLId[EBMLId["FlagVisualImpaired"] = 21932] = "FlagVisualImpaired";
	EBMLId[EBMLId["FlagCommentary"] = 21935] = "FlagCommentary";
	EBMLId[EBMLId["FlagLacing"] = 156] = "FlagLacing";
	EBMLId[EBMLId["Name"] = 21358] = "Name";
	EBMLId[EBMLId["Language"] = 2274716] = "Language";
	EBMLId[EBMLId["LanguageBCP47"] = 2274717] = "LanguageBCP47";
	EBMLId[EBMLId["CodecID"] = 134] = "CodecID";
	EBMLId[EBMLId["CodecPrivate"] = 25506] = "CodecPrivate";
	EBMLId[EBMLId["CodecDelay"] = 22186] = "CodecDelay";
	EBMLId[EBMLId["SeekPreRoll"] = 22203] = "SeekPreRoll";
	EBMLId[EBMLId["DefaultDuration"] = 2352003] = "DefaultDuration";
	EBMLId[EBMLId["Video"] = 224] = "Video";
	EBMLId[EBMLId["PixelWidth"] = 176] = "PixelWidth";
	EBMLId[EBMLId["PixelHeight"] = 186] = "PixelHeight";
	EBMLId[EBMLId["DisplayWidth"] = 21680] = "DisplayWidth";
	EBMLId[EBMLId["DisplayHeight"] = 21690] = "DisplayHeight";
	EBMLId[EBMLId["DisplayUnit"] = 21682] = "DisplayUnit";
	EBMLId[EBMLId["AlphaMode"] = 21440] = "AlphaMode";
	EBMLId[EBMLId["Audio"] = 225] = "Audio";
	EBMLId[EBMLId["SamplingFrequency"] = 181] = "SamplingFrequency";
	EBMLId[EBMLId["Channels"] = 159] = "Channels";
	EBMLId[EBMLId["BitDepth"] = 25188] = "BitDepth";
	EBMLId[EBMLId["SimpleBlock"] = 163] = "SimpleBlock";
	EBMLId[EBMLId["BlockGroup"] = 160] = "BlockGroup";
	EBMLId[EBMLId["Block"] = 161] = "Block";
	EBMLId[EBMLId["BlockAdditions"] = 30113] = "BlockAdditions";
	EBMLId[EBMLId["BlockMore"] = 166] = "BlockMore";
	EBMLId[EBMLId["BlockAdditional"] = 165] = "BlockAdditional";
	EBMLId[EBMLId["BlockAddID"] = 238] = "BlockAddID";
	EBMLId[EBMLId["BlockDuration"] = 155] = "BlockDuration";
	EBMLId[EBMLId["ReferenceBlock"] = 251] = "ReferenceBlock";
	EBMLId[EBMLId["Cluster"] = 524531317] = "Cluster";
	EBMLId[EBMLId["Timestamp"] = 231] = "Timestamp";
	EBMLId[EBMLId["Cues"] = 475249515] = "Cues";
	EBMLId[EBMLId["CuePoint"] = 187] = "CuePoint";
	EBMLId[EBMLId["CueTime"] = 179] = "CueTime";
	EBMLId[EBMLId["CueTrackPositions"] = 183] = "CueTrackPositions";
	EBMLId[EBMLId["CueTrack"] = 247] = "CueTrack";
	EBMLId[EBMLId["CueClusterPosition"] = 241] = "CueClusterPosition";
	EBMLId[EBMLId["Colour"] = 21936] = "Colour";
	EBMLId[EBMLId["MatrixCoefficients"] = 21937] = "MatrixCoefficients";
	EBMLId[EBMLId["TransferCharacteristics"] = 21946] = "TransferCharacteristics";
	EBMLId[EBMLId["Primaries"] = 21947] = "Primaries";
	EBMLId[EBMLId["Range"] = 21945] = "Range";
	EBMLId[EBMLId["Projection"] = 30320] = "Projection";
	EBMLId[EBMLId["ProjectionType"] = 30321] = "ProjectionType";
	EBMLId[EBMLId["ProjectionPoseRoll"] = 30325] = "ProjectionPoseRoll";
	EBMLId[EBMLId["Attachments"] = 423732329] = "Attachments";
	EBMLId[EBMLId["AttachedFile"] = 24999] = "AttachedFile";
	EBMLId[EBMLId["FileDescription"] = 18046] = "FileDescription";
	EBMLId[EBMLId["FileName"] = 18030] = "FileName";
	EBMLId[EBMLId["FileMediaType"] = 18016] = "FileMediaType";
	EBMLId[EBMLId["FileData"] = 18012] = "FileData";
	EBMLId[EBMLId["FileUID"] = 18094] = "FileUID";
	EBMLId[EBMLId["Chapters"] = 272869232] = "Chapters";
	EBMLId[EBMLId["Tags"] = 307544935] = "Tags";
	EBMLId[EBMLId["Tag"] = 29555] = "Tag";
	EBMLId[EBMLId["Targets"] = 25536] = "Targets";
	EBMLId[EBMLId["TargetTypeValue"] = 26826] = "TargetTypeValue";
	EBMLId[EBMLId["TargetType"] = 25546] = "TargetType";
	EBMLId[EBMLId["TagTrackUID"] = 25541] = "TagTrackUID";
	EBMLId[EBMLId["TagEditionUID"] = 25545] = "TagEditionUID";
	EBMLId[EBMLId["TagChapterUID"] = 25540] = "TagChapterUID";
	EBMLId[EBMLId["TagAttachmentUID"] = 25542] = "TagAttachmentUID";
	EBMLId[EBMLId["SimpleTag"] = 26568] = "SimpleTag";
	EBMLId[EBMLId["TagName"] = 17827] = "TagName";
	EBMLId[EBMLId["TagLanguage"] = 17530] = "TagLanguage";
	EBMLId[EBMLId["TagString"] = 17543] = "TagString";
	EBMLId[EBMLId["TagBinary"] = 17541] = "TagBinary";
	EBMLId[EBMLId["ContentEncodings"] = 28032] = "ContentEncodings";
	EBMLId[EBMLId["ContentEncoding"] = 25152] = "ContentEncoding";
	EBMLId[EBMLId["ContentEncodingOrder"] = 20529] = "ContentEncodingOrder";
	EBMLId[EBMLId["ContentEncodingScope"] = 20530] = "ContentEncodingScope";
	EBMLId[EBMLId["ContentCompression"] = 20532] = "ContentCompression";
	EBMLId[EBMLId["ContentCompAlgo"] = 16980] = "ContentCompAlgo";
	EBMLId[EBMLId["ContentCompSettings"] = 16981] = "ContentCompSettings";
	EBMLId[EBMLId["ContentEncryption"] = 20533] = "ContentEncryption";
})(EBMLId || (EBMLId = {}));
const LEVEL_0_EBML_IDS = [EBMLId.EBML, EBMLId.Segment];
const LEVEL_1_EBML_IDS = [
	EBMLId.SeekHead,
	EBMLId.Info,
	EBMLId.Cluster,
	EBMLId.Tracks,
	EBMLId.Cues,
	EBMLId.Attachments,
	EBMLId.Chapters,
	EBMLId.Tags
];
const LEVEL_0_AND_1_EBML_IDS = [...LEVEL_0_EBML_IDS, ...LEVEL_1_EBML_IDS];
const measureUnsignedInt = (value) => {
	if (value < 256) return 1;
	else if (value < 65536) return 2;
	else if (value < 1 << 24) return 3;
	else if (value < 2 ** 32) return 4;
	else if (value < 2 ** 40) return 5;
	else return 6;
};
const measureUnsignedBigInt = (value) => {
	if (value < 1n << 8n) return 1;
	else if (value < 1n << 16n) return 2;
	else if (value < 1n << 24n) return 3;
	else if (value < 1n << 32n) return 4;
	else if (value < 1n << 40n) return 5;
	else if (value < 1n << 48n) return 6;
	else if (value < 1n << 56n) return 7;
	else return 8;
};
const measureSignedInt = (value) => {
	if (value >= -64 && value < 64) return 1;
	else if (value >= -8192 && value < 8192) return 2;
	else if (value >= -1048576 && value < 1 << 20) return 3;
	else if (value >= -134217728 && value < 1 << 27) return 4;
	else if (value >= -(2 ** 34) && value < 2 ** 34) return 5;
	else return 6;
};
const measureVarInt = (value) => {
	if (value < 127)
 /** Top bit is set, leaving 7 bits to hold the integer, but we can't store
	* 127 because "all bits set to one" is a reserved value. Same thing for the
	* other cases below:
	*/
	return 1;
	else if (value < 16383) return 2;
	else if (value < (1 << 21) - 1) return 3;
	else if (value < (1 << 28) - 1) return 4;
	else if (value < 2 ** 35 - 1) return 5;
	else if (value < 2 ** 42 - 1) return 6;
	else throw new Error("EBML varint size not supported " + value);
};
var EBMLWriter = class {
	constructor(writer) {
		this.writer = writer;
		this.helper = /* @__PURE__ */ new Uint8Array(8);
		this.helperView = new DataView(this.helper.buffer);
		/**
		* Stores the position from the start of the file to where EBML elements have been written. This is used to
		* rewrite/edit elements that were already added before, and to measure sizes of things.
		*/
		this.offsets = /* @__PURE__ */ new WeakMap();
		/** Same as offsets, but stores position where the element's data starts (after ID and size fields). */
		this.dataOffsets = /* @__PURE__ */ new WeakMap();
	}
	writeByte(value) {
		this.helperView.setUint8(0, value);
		this.writer.write(this.helper.subarray(0, 1));
	}
	writeFloat32(value) {
		this.helperView.setFloat32(0, value, false);
		this.writer.write(this.helper.subarray(0, 4));
	}
	writeFloat64(value) {
		this.helperView.setFloat64(0, value, false);
		this.writer.write(this.helper);
	}
	writeUnsignedInt(value, width = measureUnsignedInt(value)) {
		let pos = 0;
		switch (width) {
			case 6: this.helperView.setUint8(pos++, value / 2 ** 40 | 0);
			case 5: this.helperView.setUint8(pos++, value / 2 ** 32 | 0);
			case 4: this.helperView.setUint8(pos++, value >> 24);
			case 3: this.helperView.setUint8(pos++, value >> 16);
			case 2: this.helperView.setUint8(pos++, value >> 8);
			case 1:
				this.helperView.setUint8(pos++, value);
				break;
			default: throw new Error("Bad unsigned int size " + width);
		}
		this.writer.write(this.helper.subarray(0, pos));
	}
	writeUnsignedBigInt(value, width = measureUnsignedBigInt(value)) {
		let pos = 0;
		for (let i = width - 1; i >= 0; i--) this.helperView.setUint8(pos++, Number(value >> BigInt(i * 8) & 255n));
		this.writer.write(this.helper.subarray(0, pos));
	}
	writeSignedInt(value, width = measureSignedInt(value)) {
		if (value < 0) value += 2 ** (width * 8);
		this.writeUnsignedInt(value, width);
	}
	writeVarInt(value, width = measureVarInt(value)) {
		let pos = 0;
		switch (width) {
			case 1:
				this.helperView.setUint8(pos++, 128 | value);
				break;
			case 2:
				this.helperView.setUint8(pos++, 64 | value >> 8);
				this.helperView.setUint8(pos++, value);
				break;
			case 3:
				this.helperView.setUint8(pos++, 32 | value >> 16);
				this.helperView.setUint8(pos++, value >> 8);
				this.helperView.setUint8(pos++, value);
				break;
			case 4:
				this.helperView.setUint8(pos++, 16 | value >> 24);
				this.helperView.setUint8(pos++, value >> 16);
				this.helperView.setUint8(pos++, value >> 8);
				this.helperView.setUint8(pos++, value);
				break;
			case 5:
				/**
				* JavaScript converts its doubles to 32-bit integers for bitwise
				* operations, so we need to do a division by 2^32 instead of a
				* right-shift of 32 to retain those top 3 bits
				*/
				this.helperView.setUint8(pos++, 8 | value / 2 ** 32 & 7);
				this.helperView.setUint8(pos++, value >> 24);
				this.helperView.setUint8(pos++, value >> 16);
				this.helperView.setUint8(pos++, value >> 8);
				this.helperView.setUint8(pos++, value);
				break;
			case 6:
				this.helperView.setUint8(pos++, 4 | value / 2 ** 40 & 3);
				this.helperView.setUint8(pos++, value / 2 ** 32 | 0);
				this.helperView.setUint8(pos++, value >> 24);
				this.helperView.setUint8(pos++, value >> 16);
				this.helperView.setUint8(pos++, value >> 8);
				this.helperView.setUint8(pos++, value);
				break;
			default: throw new Error("Bad EBML varint size " + width);
		}
		this.writer.write(this.helper.subarray(0, pos));
	}
	writeAsciiString(str) {
		this.writer.write(new Uint8Array(str.split("").map((x) => x.charCodeAt(0))));
	}
	writeEBML(data) {
		if (data === null) return;
		if (data instanceof Uint8Array) this.writer.write(data);
		else if (Array.isArray(data)) for (const elem of data) this.writeEBML(elem);
		else {
			this.offsets.set(data, this.writer.getPos());
			this.writeUnsignedInt(data.id);
			if (Array.isArray(data.data)) {
				const sizePos = this.writer.getPos();
				const sizeSize = data.size === -1 ? 1 : data.size ?? 4;
				if (data.size === -1) this.writeByte(255);
				else this.writer.seek(this.writer.getPos() + sizeSize);
				const startPos = this.writer.getPos();
				this.dataOffsets.set(data, startPos);
				this.writeEBML(data.data);
				if (data.size !== -1) {
					const size = this.writer.getPos() - startPos;
					const endPos = this.writer.getPos();
					this.writer.seek(sizePos);
					this.writeVarInt(size, sizeSize);
					this.writer.seek(endPos);
				}
			} else if (typeof data.data === "number") {
				const size = data.size ?? measureUnsignedInt(data.data);
				this.writeVarInt(size);
				this.writeUnsignedInt(data.data, size);
			} else if (typeof data.data === "bigint") {
				const size = data.size ?? measureUnsignedBigInt(data.data);
				this.writeVarInt(size);
				this.writeUnsignedBigInt(data.data, size);
			} else if (typeof data.data === "string") {
				this.writeVarInt(data.data.length);
				this.writeAsciiString(data.data);
			} else if (data.data instanceof Uint8Array) {
				this.writeVarInt(data.data.byteLength, data.size);
				this.writer.write(data.data);
			} else if (data.data instanceof EBMLFloat32) {
				this.writeVarInt(4);
				this.writeFloat32(data.data.value);
			} else if (data.data instanceof EBMLFloat64) {
				this.writeVarInt(8);
				this.writeFloat64(data.data.value);
			} else if (data.data instanceof EBMLSignedInt) {
				const size = data.size ?? measureSignedInt(data.data.value);
				this.writeVarInt(size);
				this.writeSignedInt(data.data.value, size);
			} else if (data.data instanceof EBMLUnicodeString) {
				const bytes = textEncoder.encode(data.data.value);
				this.writeVarInt(bytes.length);
				this.writer.write(bytes);
			} else assertNever(data.data);
		}
	}
};
const CODEC_STRING_MAP = {
	"avc": "V_MPEG4/ISO/AVC",
	"hevc": "V_MPEGH/ISO/HEVC",
	"vp8": "V_VP8",
	"vp9": "V_VP9",
	"av1": "V_AV1",
	"aac": "A_AAC",
	"mp3": "A_MPEG/L3",
	"opus": "A_OPUS",
	"vorbis": "A_VORBIS",
	"flac": "A_FLAC",
	"ac3": "A_AC3",
	"eac3": "A_EAC3",
	"pcm-u8": "A_PCM/INT/LIT",
	"pcm-s16": "A_PCM/INT/LIT",
	"pcm-s16be": "A_PCM/INT/BIG",
	"pcm-s24": "A_PCM/INT/LIT",
	"pcm-s24be": "A_PCM/INT/BIG",
	"pcm-s32": "A_PCM/INT/LIT",
	"pcm-s32be": "A_PCM/INT/BIG",
	"pcm-f32": "A_PCM/FLOAT/IEEE",
	"pcm-f64": "A_PCM/FLOAT/IEEE",
	"webvtt": "S_TEXT/WEBVTT"
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/matroska/matroska-misc.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
const buildMatroskaMimeType = (info) => {
	let string = (info.hasVideo ? "video/" : info.hasAudio ? "audio/" : "application/") + (info.isWebM ? "webm" : "x-matroska");
	if (info.codecStrings.length > 0) {
		const uniqueCodecMimeTypes = [...new Set(info.codecStrings.filter(Boolean))];
		string += \`; codecs="\${uniqueCodecMimeTypes.join(", ")}"\`;
	}
	return string;
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/adts/adts-reader.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
const readAdtsFrameHeader = (slice) => {
	const startPos = slice.filePos;
	const bytes = readBytes(slice, 9);
	const bitstream = new Bitstream(bytes);
	if (bitstream.readBits(12) !== 4095) return null;
	bitstream.skipBits(1);
	if (bitstream.readBits(2) !== 0) return null;
	const protectionAbsence = bitstream.readBits(1);
	const objectType = bitstream.readBits(2) + 1;
	const samplingFrequencyIndex = bitstream.readBits(4);
	if (samplingFrequencyIndex === 15) return null;
	bitstream.skipBits(1);
	const channelConfiguration = bitstream.readBits(3);
	if (channelConfiguration === 0) throw new Error("ADTS frames with channel configuration 0 are not supported.");
	bitstream.skipBits(1);
	bitstream.skipBits(1);
	bitstream.skipBits(1);
	bitstream.skipBits(1);
	const frameLength = bitstream.readBits(13);
	bitstream.skipBits(11);
	const numberOfAacFrames = bitstream.readBits(2) + 1;
	if (numberOfAacFrames !== 1) throw new Error("ADTS frames with more than one AAC frame are not supported.");
	let crcCheck = null;
	if (protectionAbsence === 1) slice.filePos -= 2;
	else crcCheck = bitstream.readBits(16);
	return {
		objectType,
		samplingFrequencyIndex,
		channelConfiguration,
		frameLength,
		numberOfAacFrames,
		crcCheck,
		startPos
	};
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/sample.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var __addDisposableResource = void 0 && (void 0).__addDisposableResource || function(env, value, async) {
	if (value !== null && value !== void 0) {
		if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
		var dispose, inner;
		if (async) {
			if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
			dispose = value[Symbol.asyncDispose];
		}
		if (dispose === void 0) {
			if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
			dispose = value[Symbol.dispose];
			if (async) inner = dispose;
		}
		if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
		if (inner) dispose = function() {
			try {
				inner.call(this);
			} catch (e) {
				return Promise.reject(e);
			}
		};
		env.stack.push({
			value,
			dispose,
			async
		});
	} else if (async) env.stack.push({ async: true });
	return value;
};
var __disposeResources = void 0 && (void 0).__disposeResources || (function(SuppressedError) {
	return function(env) {
		function fail(e) {
			env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
			env.hasError = true;
		}
		var r, s = 0;
		function next() {
			while (r = env.stack.pop()) try {
				if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
				if (r.dispose) {
					var result = r.dispose.call(r.value);
					if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
						fail(e);
						return next();
					});
				} else s |= 1;
			} catch (e) {
				fail(e);
			}
			if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
			if (env.hasError) throw env.error;
		}
		return next();
	};
})(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
	var e = new Error(message);
	return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
polyfillSymbolDispose();
let lastVideoGcErrorLog = -Infinity;
let lastAudioGcErrorLog = -Infinity;
let finalizationRegistry = null;
if (typeof FinalizationRegistry !== "undefined") finalizationRegistry = new FinalizationRegistry((value) => {
	const now = performance.now();
	if (value.type === "video") {
		if (now - lastVideoGcErrorLog >= 1e3) {
			Logging._error("A VideoSample was garbage collected without first being closed. For proper resource management, make sure to call close() on all your VideoSamples as soon as you're done using them.");
			lastVideoGcErrorLog = now;
		}
		if (typeof VideoFrame !== "undefined" && value.data instanceof VideoFrame) value.data.close();
	} else {
		if (now - lastAudioGcErrorLog >= 1e3) {
			Logging._error("An AudioSample was garbage collected without first being closed. For proper resource management, make sure to call close() on all your AudioSamples as soon as you're done using them.");
			lastAudioGcErrorLog = now;
		}
		if (typeof AudioData !== "undefined" && value.data instanceof AudioData) value.data.close();
	}
});
/**
* Abstract base class for custom video sample resources. Implement this class to provide custom backing
* for VideoSample instances.
* @group Samples
* @public
*/
var VideoSampleResource = class {
	constructor() {
		/** @internal */
		this._referenceCount = 0;
		/** @internal */
		this._lastAllocationBuffer = null;
	}
};
/**
* The list of {@link VideoSample} pixel formats.
* @group Samples
* @public
*/
const VIDEO_SAMPLE_PIXEL_FORMATS = [
	"I420",
	"I420P10",
	"I420P12",
	"I420A",
	"I420AP10",
	"I420AP12",
	"I422",
	"I422P10",
	"I422P12",
	"I422A",
	"I422AP10",
	"I422AP12",
	"I444",
	"I444P10",
	"I444P12",
	"I444A",
	"I444AP10",
	"I444AP12",
	"NV12",
	"RGBA",
	"RGBX",
	"BGRA",
	"BGRX"
];
const VIDEO_SAMPLE_PIXEL_FORMATS_SET = new Set(VIDEO_SAMPLE_PIXEL_FORMATS);
/**
* Represents a raw, unencoded video sample (frame). Mainly used as an expressive wrapper around WebCodecs API's
* [\`VideoFrame\`](https://developer.mozilla.org/en-US/docs/Web/API/VideoFrame), but can also be used standalone.
* @group Samples
* @public
*/
var VideoSample = class VideoSample {
	/** The width of the frame in pixels. */
	get codedWidth() {
		return this.visibleRect.width;
	}
	/** The height of the frame in pixels. */
	get codedHeight() {
		return this.visibleRect.height;
	}
	/** The display width of the frame in pixels, after aspect ratio adjustment and rotation. */
	get displayWidth() {
		return this.rotation % 180 === 0 ? this.squarePixelWidth : this.squarePixelHeight;
	}
	/** The display height of the frame in pixels, after aspect ratio adjustment and rotation. */
	get displayHeight() {
		return this.rotation % 180 === 0 ? this.squarePixelHeight : this.squarePixelWidth;
	}
	/** The presentation timestamp of the frame in microseconds. */
	get microsecondTimestamp() {
		return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.timestamp);
	}
	/** The duration of the frame in microseconds. */
	get microsecondDuration() {
		return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.duration);
	}
	/**
	* Whether this sample uses a pixel format that can hold transparency data. Note that this doesn't necessarily mean
	* that the sample is transparent.
	*/
	get hasAlpha() {
		return this.format && this.format.includes("A");
	}
	constructor(data, init) {
		/** @internal */
		this._closed = false;
		if (data instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && data instanceof SharedArrayBuffer || ArrayBuffer.isView(data)) {
			if (!init || typeof init !== "object") throw new TypeError("init must be an object.");
			if (init.format === void 0 || !VIDEO_SAMPLE_PIXEL_FORMATS_SET.has(init.format)) throw new TypeError("init.format must be one of: " + VIDEO_SAMPLE_PIXEL_FORMATS.join(", "));
			if (!Number.isInteger(init.codedWidth) || init.codedWidth <= 0) throw new TypeError("init.codedWidth must be a positive integer.");
			if (!Number.isInteger(init.codedHeight) || init.codedHeight <= 0) throw new TypeError("init.codedHeight must be a positive integer.");
			if (init.rotation !== void 0 && ![
				0,
				90,
				180,
				270
			].includes(init.rotation)) throw new TypeError("init.rotation, when provided, must be 0, 90, 180, or 270.");
			if (!Number.isFinite(init.timestamp)) throw new TypeError("init.timestamp must be a number.");
			if (init.duration !== void 0 && (!Number.isFinite(init.duration) || init.duration < 0)) throw new TypeError("init.duration, when provided, must be a non-negative number.");
			if (init.layout !== void 0) {
				if (!Array.isArray(init.layout)) throw new TypeError("init.layout, when provided, must be an array.");
				for (const plane of init.layout) {
					if (!plane || typeof plane !== "object" || Array.isArray(plane)) throw new TypeError("Each entry in init.layout must be an object.");
					if (!Number.isInteger(plane.offset) || plane.offset < 0) throw new TypeError("plane.offset must be a non-negative integer.");
					if (!Number.isInteger(plane.stride) || plane.stride < 0) throw new TypeError("plane.stride must be a non-negative integer.");
				}
			}
			if (init.visibleRect !== void 0) validateRectangle(init.visibleRect, "init.visibleRect");
			if (init.displayWidth !== void 0 && (!Number.isInteger(init.displayWidth) || init.displayWidth <= 0)) throw new TypeError("init.displayWidth, when provided, must be a positive integer.");
			if (init.displayHeight !== void 0 && (!Number.isInteger(init.displayHeight) || init.displayHeight <= 0)) throw new TypeError("init.displayHeight, when provided, must be a positive integer.");
			if (init.displayWidth !== void 0 !== (init.displayHeight !== void 0)) throw new TypeError("init.displayWidth and init.displayHeight must be either both provided or both omitted.");
			this._data = init._doNotCopy ? toUint8Array(data) : toUint8Array(data).slice();
			this._layout = init.layout ?? createDefaultPlaneLayout(init.format, init.codedWidth, init.codedHeight);
			this.format = init.format;
			this.rotation = init.rotation ?? 0;
			this.timestamp = init.timestamp;
			this.duration = init.duration ?? 0;
			let colorSpaceInit = init.colorSpace ?? null;
			if (colorSpaceInit === null) {
				if (this.format === "RGBA" || this.format === "RGBX" || this.format === "BGRA" || this.format === "BGRX") colorSpaceInit = {
					primaries: "bt709",
					transfer: "iec61966-2-1",
					matrix: "rgb",
					fullRange: true
				};
				else colorSpaceInit = {
					primaries: "bt709",
					transfer: "bt709",
					matrix: "bt709",
					fullRange: false
				};
			}
			this.colorSpace = new VideoSampleColorSpace(colorSpaceInit);
			this.visibleRect = {
				left: init.visibleRect?.left ?? 0,
				top: init.visibleRect?.top ?? 0,
				width: init.visibleRect?.width ?? init.codedWidth,
				height: init.visibleRect?.height ?? init.codedHeight
			};
			if (init.displayWidth !== void 0) {
				this.squarePixelWidth = this.rotation % 180 === 0 ? init.displayWidth : init.displayHeight;
				this.squarePixelHeight = this.rotation % 180 === 0 ? init.displayHeight : init.displayWidth;
			} else {
				this.squarePixelWidth = this.visibleRect.width;
				this.squarePixelHeight = this.visibleRect.height;
			}
		} else if (typeof VideoFrame !== "undefined" && data instanceof VideoFrame) {
			if (init?.rotation !== void 0 && ![
				0,
				90,
				180,
				270
			].includes(init.rotation)) throw new TypeError("init.rotation, when provided, must be 0, 90, 180, or 270.");
			if (init?.timestamp !== void 0 && !Number.isFinite(init?.timestamp)) throw new TypeError("init.timestamp, when provided, must be a number.");
			if (init?.duration !== void 0 && (!Number.isFinite(init.duration) || init.duration < 0)) throw new TypeError("init.duration, when provided, must be a non-negative number.");
			if (init?.visibleRect !== void 0) validateRectangle(init.visibleRect, "init.visibleRect");
			this._data = data;
			this._layout = null;
			this.format = data.format;
			this.visibleRect = {
				left: data.visibleRect?.x ?? 0,
				top: data.visibleRect?.y ?? 0,
				width: data.visibleRect?.width ?? data.codedWidth,
				height: data.visibleRect?.height ?? data.codedHeight
			};
			this.rotation = init?.rotation ?? 0;
			this.squarePixelWidth = data.displayWidth;
			this.squarePixelHeight = data.displayHeight;
			this.timestamp = init?.timestamp ?? data.timestamp / 1e6;
			this.duration = init?.duration ?? (data.duration ?? 0) / 1e6;
			this.colorSpace = new VideoSampleColorSpace(data.colorSpace);
		} else if (typeof HTMLImageElement !== "undefined" && data instanceof HTMLImageElement || typeof SVGImageElement !== "undefined" && data instanceof SVGImageElement || typeof ImageBitmap !== "undefined" && data instanceof ImageBitmap || typeof HTMLVideoElement !== "undefined" && data instanceof HTMLVideoElement || typeof HTMLCanvasElement !== "undefined" && data instanceof HTMLCanvasElement || typeof OffscreenCanvas !== "undefined" && data instanceof OffscreenCanvas) {
			if (!init || typeof init !== "object") throw new TypeError("init must be an object.");
			if (init.rotation !== void 0 && ![
				0,
				90,
				180,
				270
			].includes(init.rotation)) throw new TypeError("init.rotation, when provided, must be 0, 90, 180, or 270.");
			if (!Number.isFinite(init.timestamp)) throw new TypeError("init.timestamp must be a number.");
			if (init.duration !== void 0 && (!Number.isFinite(init.duration) || init.duration < 0)) throw new TypeError("init.duration, when provided, must be a non-negative number.");
			if (typeof VideoFrame !== "undefined") return new VideoSample(new VideoFrame(data, {
				timestamp: Math.trunc(init.timestamp * SECOND_TO_MICROSECOND_FACTOR),
				duration: Math.trunc((init.duration ?? 0) * SECOND_TO_MICROSECOND_FACTOR) || void 0
			}), init);
			let width = 0;
			let height = 0;
			if ("naturalWidth" in data) {
				width = data.naturalWidth;
				height = data.naturalHeight;
			} else if ("videoWidth" in data) {
				width = data.videoWidth;
				height = data.videoHeight;
			} else if ("width" in data) {
				width = Number(data.width);
				height = Number(data.height);
			}
			if (!width || !height) throw new TypeError("Could not determine dimensions.");
			const canvas = new OffscreenCanvas(width, height);
			const context = canvas.getContext("2d", {
				alpha: isFirefox(),
				willReadFrequently: true
			});
			if (!context) throw new Error("OffscreenCanvas must have support for the '2d' context in order to create a VideoSample from this data.");
			context.drawImage(data, 0, 0);
			this._data = canvas;
			this._layout = null;
			this.format = "RGBX";
			this.visibleRect = {
				left: 0,
				top: 0,
				width,
				height
			};
			this.squarePixelWidth = width;
			this.squarePixelHeight = height;
			this.rotation = init.rotation ?? 0;
			this.timestamp = init.timestamp;
			this.duration = init.duration ?? 0;
			this.colorSpace = new VideoSampleColorSpace({
				matrix: "rgb",
				primaries: "bt709",
				transfer: "iec61966-2-1",
				fullRange: true
			});
		} else if (data instanceof VideoSampleResource) {
			if (!init || typeof init !== "object") throw new TypeError("init must be an object.");
			if (init.rotation !== void 0 && ![
				0,
				90,
				180,
				270
			].includes(init.rotation)) throw new TypeError("init.rotation, when provided, must be 0, 90, 180, or 270.");
			if (!Number.isFinite(init.timestamp)) throw new TypeError("init.timestamp must be a number.");
			if (init.duration !== void 0 && (!Number.isFinite(init.duration) || init.duration < 0)) throw new TypeError("init.duration, when provided, must be a non-negative number.");
			this._data = data;
			data._referenceCount++;
			this.format = data.getFormat();
			if (this.format !== null && !VIDEO_SAMPLE_PIXEL_FORMATS.includes(this.format)) throw new TypeError("getFormat() must return a VideoSamplePixelFormat or null.");
			this.visibleRect = {
				left: 0,
				top: 0,
				width: data.getCodedWidth(),
				height: data.getCodedHeight()
			};
			if (!Number.isInteger(this.visibleRect.width) || this.visibleRect.width <= 0) throw new TypeError("getCodedWidth() must return a positive integer.");
			if (!Number.isInteger(this.visibleRect.height) || this.visibleRect.height <= 0) throw new TypeError("getCodedHeight() must return a positive integer.");
			this.squarePixelWidth = data.getSquarePixelWidth();
			if (!Number.isInteger(this.squarePixelWidth) || this.squarePixelWidth <= 0) throw new TypeError("getSquarePixelWidth() must return a positive integer.");
			this.squarePixelHeight = data.getSquarePixelHeight();
			if (!Number.isInteger(this.squarePixelHeight) || this.squarePixelHeight <= 0) throw new TypeError("getSquarePixelHeight() must return a positive integer.");
			this.rotation = init.rotation ?? 0;
			this.timestamp = init.timestamp;
			this.duration = init.duration ?? 0;
			this.colorSpace = data.getColorSpace();
		} else throw new TypeError("Invalid data type: Must be a BufferSource, CanvasImageSource, or VideoSampleResource.");
		this.encodeOptions = init?.encodeOptions ?? {};
		this.pixelAspectRatio = simplifyRational({
			num: this.squarePixelWidth * this.codedHeight,
			den: this.squarePixelHeight * this.codedWidth
		});
		finalizationRegistry?.register(this, {
			type: "video",
			data: this._data
		}, this);
	}
	/** Clones this video sample. */
	clone() {
		if (this._closed) throw new Error("VideoSample is closed.");
		assert(this._data !== null);
		if (this._data instanceof VideoSampleResource) return new VideoSample(this._data, {
			timestamp: this.timestamp,
			duration: this.duration,
			rotation: this.rotation,
			encodeOptions: this.encodeOptions
		});
		else if (isVideoFrame(this._data)) return new VideoSample(this._data.clone(), {
			timestamp: this.timestamp,
			duration: this.duration,
			rotation: this.rotation,
			encodeOptions: this.encodeOptions
		});
		else if (this._data instanceof Uint8Array) {
			assert(this._layout);
			return new VideoSample(this._data, {
				format: this.format,
				layout: this._layout,
				codedWidth: this.codedWidth,
				codedHeight: this.codedHeight,
				timestamp: this.timestamp,
				duration: this.duration,
				colorSpace: this.colorSpace,
				rotation: this.rotation,
				visibleRect: this.visibleRect,
				displayWidth: this.displayWidth,
				displayHeight: this.displayHeight,
				encodeOptions: this.encodeOptions,
				_doNotCopy: true
			});
		} else return new VideoSample(this._data, {
			format: this.format,
			codedWidth: this.codedWidth,
			codedHeight: this.codedHeight,
			timestamp: this.timestamp,
			duration: this.duration,
			colorSpace: this.colorSpace,
			rotation: this.rotation,
			visibleRect: this.visibleRect,
			displayWidth: this.displayWidth,
			displayHeight: this.displayHeight,
			encodeOptions: this.encodeOptions
		});
	}
	/**
	* Closes this video sample, releasing held resources. Video samples should be closed as soon as they are not
	* needed anymore.
	*/
	close() {
		if (this._closed) return;
		finalizationRegistry?.unregister(this);
		if (this._data instanceof VideoSampleResource) {
			this._data._referenceCount--;
			if (this._data._referenceCount === 0) this._data.close();
		} else if (isVideoFrame(this._data)) this._data.close();
		else this._data = null;
		this._closed = true;
	}
	/**
	* Returns the number of bytes required to hold this video sample's pixel data.
	*/
	allocationSize(options = {}) {
		validateVideoFrameCopyToOptions(options);
		if (this._closed) throw new Error("VideoSample is closed.");
		if ((options.format ?? this.format) == null) throw new Error("Cannot get allocation size when format is null.");
		if (isVideoFrame(this._data)) return this._data.allocationSize(options);
		return ParseVideoFrameCopyToOptions(this, options).allocationSize;
	}
	/**
	* Copies this video sample's pixel data to an ArrayBuffer or ArrayBufferView.
	* @returns The byte layout of the planes of the copied data.
	*/
	async copyTo(destination, options = {}) {
		if (!isAllowSharedBufferSource(destination)) throw new TypeError("destination must be an ArrayBuffer or an ArrayBuffer view.");
		validateVideoFrameCopyToOptions(options);
		if (this._closed) throw new Error("VideoSample is closed.");
		if ((options.format ?? this.format) == null) throw new Error("Cannot copy video sample data when format is null.");
		assert(this._data !== null);
		if (isVideoFrame(this._data)) return this._data.copyTo(destination, options);
		if (options.format && ![
			"RGBA",
			"RGBX",
			"BGRA",
			"BGRX"
		].includes(this.format) && [
			"RGBA",
			"RGBX",
			"BGRA",
			"BGRX"
		].includes(options.format)) {
			if (this._data instanceof VideoSampleResource) {
				const env_1 = {
					stack: [],
					error: void 0,
					hasError: false
				};
				try {
					const rgbSample = __addDisposableResource(env_1, await this._data.toRgbSample({
						timestamp: this.timestamp,
						duration: this.duration,
						rotation: this.rotation
					}, options.colorSpace ?? "srgb"), false);
					if (!(rgbSample instanceof VideoSample)) throw new TypeError("toRgbSample() must return a VideoSample.");
					if (![
						"RGBA",
						"RGBX",
						"BGRA",
						"BGRX"
					].includes(rgbSample.format)) throw new Error(\`Sample returned by toRgbSample was expected to have an RGB format, got '\${rgbSample.format}' instead.\`);
					return await rgbSample.copyTo(destination, options);
				} catch (e_1) {
					env_1.error = e_1;
					env_1.hasError = true;
				} finally {
					__disposeResources(env_1);
				}
			} else {
				if (typeof VideoFrame === "undefined") throw new Error("For this sample, converting from a non-RGB to an RGB format requires VideoFrame to be defined.");
				const tempFrame = this.toVideoFrame();
				const result = await tempFrame.copyTo(destination, options);
				tempFrame.close();
				return result;
			}
		}
		const combinedLayout = ParseVideoFrameCopyToOptions(this, options);
		assert(this.format);
		const destBytes = toUint8Array(destination);
		if (destBytes.byteLength < combinedLayout.allocationSize) throw new TypeError(\`Destination buffer too small. Required: \${combinedLayout.allocationSize}, Available: \${destBytes.byteLength}\`);
		const planeConfigs = getPlaneConfigs(this.format);
		let dataPlanes;
		if (this._data instanceof VideoSampleResource) {
			let result = this._data.getDataPlanes();
			if (result instanceof Promise) result = await result;
			if (!Array.isArray(result) || result.some((x) => !(x.data instanceof Uint8Array) || !Number.isInteger(x.stride) || x.stride < 0)) throw new TypeError("getDataPlanes() must return an array of objects with a Uint8Array \\"data\\" property and a non-negative integer \\"stride\\" property.");
			dataPlanes = result;
		} else if (this._data instanceof Uint8Array) {
			assert(this._layout);
			assert(this._layout.length === planeConfigs.length);
			dataPlanes = this._layout.map((planeLayout, i) => {
				const height = Math.ceil(this.codedHeight / planeConfigs[i].heightDivisor);
				return {
					data: this._data.subarray(planeLayout.offset, planeLayout.offset + planeLayout.stride * height),
					stride: planeLayout.stride
				};
			});
		} else {
			const context = this._data.getContext("2d");
			assert(context);
			const imageData = context.getImageData(0, 0, this.codedWidth, this.codedHeight);
			dataPlanes = [{
				data: toUint8Array(imageData.data),
				stride: 4 * this.codedWidth
			}];
		}
		const planeLayouts = [];
		const numPlanes = planeConfigs.length;
		for (let planeIndex = 0; planeIndex < numPlanes; planeIndex++) {
			const computedLayout = combinedLayout.computedLayouts[planeIndex];
			const sourceStride = dataPlanes[planeIndex].stride;
			const sourceData = dataPlanes[planeIndex].data;
			let sourceOffset = computedLayout.sourceTop * sourceStride;
			sourceOffset += computedLayout.sourceLeftBytes;
			let destinationOffset = computedLayout.destinationOffset;
			const rowBytes = computedLayout.sourceWidthBytes;
			const layout = {
				offset: destinationOffset,
				stride: computedLayout.destinationStride
			};
			for (let row = 0; row < computedLayout.sourceHeight; row++) {
				if (sourceOffset + rowBytes > sourceData.byteLength) throw new Error(\`Source buffer OOB read.\`);
				if (destinationOffset + rowBytes > destBytes.byteLength) throw new Error(\`Destination buffer OOB write.\`);
				const srcSub = sourceData.subarray(sourceOffset, sourceOffset + rowBytes);
				destBytes.set(srcSub, destinationOffset);
				sourceOffset += sourceStride;
				destinationOffset += computedLayout.destinationStride;
			}
			planeLayouts.push(layout);
		}
		if (options.format !== void 0) {
			const needsRgbConversion = this.format.startsWith("RGB") !== options.format.startsWith("RGB");
			const needsAlphaConversion = this.format.includes("X") && options.format.includes("A");
			if (needsRgbConversion || needsAlphaConversion) for (let i = 0; i < combinedLayout.allocationSize; i += 4) {
				if (needsRgbConversion) {
					const r = destBytes[i];
					const b = destBytes[i + 2];
					destBytes[i] = b;
					destBytes[i + 2] = r;
				}
				if (needsAlphaConversion) destBytes[i + 3] = 255;
			}
		}
		return planeLayouts;
	}
	/**
	* Converts this video sample to a VideoFrame for use with the WebCodecs API. The VideoFrame returned by this
	* method *must* be closed separately from this video sample.
	*/
	toVideoFrame() {
		if (this._closed) throw new Error("VideoSample is closed.");
		assert(this._data !== null);
		if (this._data instanceof VideoSampleResource) {
			if (this.format === null) throw new Error("Cannot convert a VideoSampleResource-backed VideoSample to VideoFrame if format is null.");
			const planes = this._data.getDataPlanes();
			if (planes instanceof Promise) throw new Error("Cannot convert a VideoSampleResource-backed VideoSample to VideoFrame if getDataPlanes() returns a promise.");
			const size = planes.reduce((a, b) => a + b.data.byteLength, 0);
			const buffer = new Uint8Array(size);
			let offset = 0;
			const offsets = [];
			for (const plane of planes) {
				buffer.set(plane.data, offset);
				offsets.push(offset);
				offset += plane.data.byteLength;
			}
			return new VideoFrame(buffer, {
				format: this.format,
				layout: planes.map((x, i) => ({
					offset: offsets[i],
					stride: x.stride
				})),
				codedWidth: this.codedWidth,
				codedHeight: this.codedHeight,
				timestamp: this.microsecondTimestamp,
				duration: this.microsecondDuration,
				colorSpace: this.colorSpace,
				displayWidth: this.squarePixelWidth,
				displayHeight: this.squarePixelHeight
			});
		} else if (isVideoFrame(this._data)) return new VideoFrame(this._data, {
			timestamp: this.microsecondTimestamp,
			duration: this.microsecondDuration || void 0
		});
		else if (this._data instanceof Uint8Array) return new VideoFrame(this._data, {
			format: this.format,
			codedWidth: this.codedWidth,
			codedHeight: this.codedHeight,
			timestamp: this.microsecondTimestamp,
			duration: this.microsecondDuration || void 0,
			colorSpace: this.colorSpace,
			displayWidth: this.squarePixelWidth,
			displayHeight: this.squarePixelHeight
		});
		else return new VideoFrame(this._data, {
			timestamp: this.microsecondTimestamp,
			duration: this.microsecondDuration || void 0
		});
	}
	draw(context, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
		let sx = 0;
		let sy = 0;
		let sWidth = this.displayWidth;
		let sHeight = this.displayHeight;
		let dx = 0;
		let dy = 0;
		let dWidth = this.displayWidth;
		let dHeight = this.displayHeight;
		if (arg5 !== void 0) {
			sx = arg1;
			sy = arg2;
			sWidth = arg3;
			sHeight = arg4;
			dx = arg5;
			dy = arg6;
			if (arg7 !== void 0) {
				dWidth = arg7;
				dHeight = arg8;
			} else {
				dWidth = sWidth;
				dHeight = sHeight;
			}
		} else {
			dx = arg1;
			dy = arg2;
			if (arg3 !== void 0) {
				dWidth = arg3;
				dHeight = arg4;
			}
		}
		if (!(typeof CanvasRenderingContext2D !== "undefined" && context instanceof CanvasRenderingContext2D || typeof OffscreenCanvasRenderingContext2D !== "undefined" && context instanceof OffscreenCanvasRenderingContext2D)) throw new TypeError("context must be a CanvasRenderingContext2D or OffscreenCanvasRenderingContext2D.");
		if (!Number.isFinite(sx)) throw new TypeError("sx must be a number.");
		if (!Number.isFinite(sy)) throw new TypeError("sy must be a number.");
		if (!Number.isFinite(sWidth) || sWidth < 0) throw new TypeError("sWidth must be a non-negative number.");
		if (!Number.isFinite(sHeight) || sHeight < 0) throw new TypeError("sHeight must be a non-negative number.");
		if (!Number.isFinite(dx)) throw new TypeError("dx must be a number.");
		if (!Number.isFinite(dy)) throw new TypeError("dy must be a number.");
		if (!Number.isFinite(dWidth) || dWidth < 0) throw new TypeError("dWidth must be a non-negative number.");
		if (!Number.isFinite(dHeight) || dHeight < 0) throw new TypeError("dHeight must be a non-negative number.");
		if (this._closed) throw new Error("VideoSample is closed.");
		({sx, sy, sWidth, sHeight} = this._rotateSourceRegion(sx, sy, sWidth, sHeight, this.rotation));
		const source = this.toCanvasImageSource();
		context.save();
		const centerX = dx + dWidth / 2;
		const centerY = dy + dHeight / 2;
		context.translate(centerX, centerY);
		context.rotate(this.rotation * Math.PI / 180);
		const aspectRatioChange = this.rotation % 180 === 0 ? 1 : dWidth / dHeight;
		context.scale(1 / aspectRatioChange, aspectRatioChange);
		context.drawImage(source, sx, sy, sWidth, sHeight, -dWidth / 2, -dHeight / 2, dWidth, dHeight);
		context.restore();
	}
	/**
	* Draws the sample in the middle of the canvas corresponding to the context with the specified fit behavior.
	*/
	drawWithFit(context, options) {
		if (!(typeof CanvasRenderingContext2D !== "undefined" && context instanceof CanvasRenderingContext2D || typeof OffscreenCanvasRenderingContext2D !== "undefined" && context instanceof OffscreenCanvasRenderingContext2D)) throw new TypeError("context must be a CanvasRenderingContext2D or OffscreenCanvasRenderingContext2D.");
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (![
			"fill",
			"contain",
			"cover"
		].includes(options.fit)) throw new TypeError("options.fit must be 'fill', 'contain', or 'cover'.");
		if (options.rotation !== void 0 && ![
			0,
			90,
			180,
			270
		].includes(options.rotation)) throw new TypeError("options.rotation, when provided, must be 0, 90, 180, or 270.");
		if (options.crop !== void 0) validateCropRectangle(options.crop, "options.");
		const canvasWidth = context.canvas.width;
		const canvasHeight = context.canvas.height;
		const rotation = options.rotation ?? this.rotation;
		const [rotatedWidth, rotatedHeight] = rotation % 180 === 0 ? [this.squarePixelWidth, this.squarePixelHeight] : [this.squarePixelHeight, this.squarePixelWidth];
		let finalCrop = options.crop;
		if (finalCrop) finalCrop = clampCropRectangle(finalCrop, rotatedWidth, rotatedHeight);
		let dx;
		let dy;
		let newWidth;
		let newHeight;
		const { sx, sy, sWidth, sHeight } = this._rotateSourceRegion(options.crop?.left ?? 0, options.crop?.top ?? 0, options.crop?.width ?? rotatedWidth, options.crop?.height ?? rotatedHeight, rotation);
		if (options.fit === "fill") {
			dx = 0;
			dy = 0;
			newWidth = canvasWidth;
			newHeight = canvasHeight;
		} else {
			const [sampleWidth, sampleHeight] = options.crop ? [options.crop.width, options.crop.height] : [rotatedWidth, rotatedHeight];
			const scale = options.fit === "contain" ? Math.min(canvasWidth / sampleWidth, canvasHeight / sampleHeight) : Math.max(canvasWidth / sampleWidth, canvasHeight / sampleHeight);
			newWidth = sampleWidth * scale;
			newHeight = sampleHeight * scale;
			dx = (canvasWidth - newWidth) / 2;
			dy = (canvasHeight - newHeight) / 2;
		}
		context.save();
		const aspectRatioChange = rotation % 180 === 0 ? 1 : newWidth / newHeight;
		context.translate(canvasWidth / 2, canvasHeight / 2);
		context.rotate(rotation * Math.PI / 180);
		context.scale(1 / aspectRatioChange, aspectRatioChange);
		context.translate(-canvasWidth / 2, -canvasHeight / 2);
		context.drawImage(this.toCanvasImageSource(), sx, sy, sWidth, sHeight, dx, dy, newWidth, newHeight);
		context.restore();
	}
	/** @internal */
	_rotateSourceRegion(sx, sy, sWidth, sHeight, rotation) {
		if (rotation === 90) [sx, sy, sWidth, sHeight] = [
			sy,
			this.squarePixelHeight - sx - sWidth,
			sHeight,
			sWidth
		];
		else if (rotation === 180) [sx, sy] = [this.squarePixelWidth - sx - sWidth, this.squarePixelHeight - sy - sHeight];
		else if (rotation === 270) [sx, sy, sWidth, sHeight] = [
			this.squarePixelWidth - sy - sHeight,
			sx,
			sHeight,
			sWidth
		];
		return {
			sx,
			sy,
			sWidth,
			sHeight
		};
	}
	/**
	* Converts this video sample to a
	* [\`CanvasImageSource\`](https://udn.realityripple.com/docs/Web/API/CanvasImageSource) for drawing to a canvas.
	*
	* You must use the value returned by this method immediately, as any VideoFrame created internally may
	* automatically be closed in the next microtask.
	*/
	toCanvasImageSource() {
		if (this._closed) throw new Error("VideoSample is closed.");
		assert(this._data !== null);
		if (this._data instanceof VideoSampleResource || this._data instanceof Uint8Array) {
			const videoFrame = this.toVideoFrame();
			queueMicrotask(() => videoFrame.close());
			return videoFrame;
		} else return this._data;
	}
	/**
	* Transform this video sample to a new video sample given the options. Can be used to resize, rotate, and crop
	* the sample.
	*
	* In non-browser environments, this method will not work by default. To make it work, register a custom
	* transformer function via {@link registerVideoSampleTransformer}.
	*/
	async transform(options) {
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (options.width !== void 0 && (!Number.isInteger(options.width) || options.width <= 0)) throw new TypeError("options.width, when provided, must be a positive integer.");
		if (options.height !== void 0 && (!Number.isInteger(options.height) || options.height <= 0)) throw new TypeError("options.height, when provided, must be a positive integer.");
		if (options.roundDimensionsTo !== void 0 && (!Number.isInteger(options.roundDimensionsTo) || options.roundDimensionsTo <= 0)) throw new TypeError("options.roundDimensionsTo, when provided, must be a positive integer.");
		if (options.fit !== void 0 && ![
			"fill",
			"contain",
			"cover"
		].includes(options.fit)) throw new TypeError("options.fit, when provided, must be one of \\"fill\\", \\"contain\\", or \\"cover\\".");
		if (options.width !== void 0 && options.height !== void 0 && options.fit === void 0) throw new TypeError("When both options.width and options.height are provided, options.fit must also be provided.");
		if (options.rotate !== void 0 && ![
			0,
			90,
			180,
			270
		].includes(options.rotate)) throw new TypeError("options.rotate, when provided, must be 0, 90, 180 or 270.");
		if (options.crop !== void 0) validateCropRectangle(options.crop, "options.");
		if (options.alpha !== void 0 && !["keep", "discard"].includes(options.alpha)) throw new TypeError("options.alpha, when provided, must be 'keep' or 'discard'.");
		const rotation = normalizeRotation(this.rotation + (options.rotate ?? 0));
		const [rotatedWidth, rotatedHeight] = rotation % 180 === 0 ? [this.squarePixelWidth, this.squarePixelHeight] : [this.squarePixelHeight, this.squarePixelWidth];
		let finalCrop = options.crop;
		if (finalCrop) finalCrop = clampCropRectangle(finalCrop, rotatedWidth, rotatedHeight);
		const cropWidth = finalCrop ? finalCrop.width : rotatedWidth;
		const cropHeight = finalCrop ? finalCrop.height : rotatedHeight;
		const originalAspectRatio = cropWidth / cropHeight;
		let targetWidth;
		let targetHeight;
		if (options.width !== void 0 && options.height === void 0) {
			targetWidth = options.width;
			targetHeight = targetWidth / originalAspectRatio;
		} else if (options.width === void 0 && options.height !== void 0) {
			targetHeight = options.height;
			targetWidth = targetHeight * originalAspectRatio;
		} else if (options.width !== void 0 && options.height !== void 0) {
			targetWidth = options.width;
			targetHeight = options.height;
		} else {
			targetWidth = cropWidth;
			targetHeight = cropHeight;
		}
		targetWidth = roundToMultiple(targetWidth, options.roundDimensionsTo ?? 1);
		targetHeight = roundToMultiple(targetHeight, options.roundDimensionsTo ?? 1);
		const description = {
			width: targetWidth,
			height: targetHeight,
			fit: options.fit ?? "fill",
			rotation,
			crop: finalCrop ?? {
				left: 0,
				top: 0,
				width: rotatedWidth,
				height: rotatedHeight
			},
			alpha: options.alpha ?? "keep"
		};
		for (const transformer of registeredVideoSampleTransformers) {
			let result = transformer(this, description);
			if (result instanceof Promise) result = await result;
			if (result !== null) return result;
		}
		let canvas = null;
		let canvasIsNew = false;
		for (const entry of transformationCanvasCache) if (entry.canvas.width === description.width && entry.canvas.height === description.height) {
			canvas = entry.canvas;
			entry.age = transformationCanvasCacheNextAge++;
			break;
		}
		if (canvas === null) {
			if (typeof OffscreenCanvas !== "undefined") canvas = new OffscreenCanvas(description.width, description.height);
			else {
				if (typeof window === "undefined" || typeof document === "undefined") throw new Error("Cannot transform VideoSamples in this environment. Either run in an environment with OffscreenCanvas or HTMLCanvasElement, or supply a custom VideoSample transformer using registerVideoSampleTransformer().");
				canvas = document.createElement("canvas");
				canvas.width = description.width;
				canvas.height = description.height;
			}
			canvasIsNew = true;
			if (transformationCanvasCache.length >= TRANSFORMATION_CANVAS_CACHE_MAX_SIZE) transformationCanvasCache.splice(arrayArgmin(transformationCanvasCache, (x) => x.age), 1);
			transformationCanvasCache.push({
				canvas,
				age: transformationCanvasCacheNextAge++
			});
		}
		const context = canvas.getContext("2d", { alpha: true });
		if (!context) throw new Error("The '2d' canvas context is required to transform VideoSamples. Register a custom transformer using registerVideoSampleTransformer to work around this limitation.");
		if (description.alpha === "discard") {
			context.fillStyle = "black";
			context.fillRect(0, 0, description.width, description.height);
		} else if (!canvasIsNew) context.clearRect(0, 0, description.width, description.height);
		this.drawWithFit(context, {
			fit: description.fit,
			rotation: description.rotation,
			crop: description.crop
		});
		return new VideoSample(canvas, {
			timestamp: this.timestamp,
			duration: this.duration,
			rotation: 0
		});
	}
	/** Sets the rotation metadata of this video sample. */
	setRotation(newRotation) {
		if (![
			0,
			90,
			180,
			270
		].includes(newRotation)) throw new TypeError("newRotation must be 0, 90, 180, or 270.");
		this.rotation = newRotation;
	}
	/** Sets the presentation timestamp of this video sample, in seconds. */
	setTimestamp(newTimestamp) {
		if (!Number.isFinite(newTimestamp)) throw new TypeError("newTimestamp must be a number.");
		this.timestamp = newTimestamp;
	}
	/** Sets the duration of this video sample, in seconds. */
	setDuration(newDuration) {
		if (!Number.isFinite(newDuration) || newDuration < 0) throw new TypeError("newDuration must be a non-negative number.");
		this.duration = newDuration;
	}
	/** Sets the encode options used when this sample is passed to an encoder. */
	setEncodeOptions(newEncodeOptions) {
		if (!newEncodeOptions || typeof newEncodeOptions !== "object") throw new TypeError("newEncodeOptions must be an object.");
		this.encodeOptions = newEncodeOptions;
	}
	/** Calls \`.close()\`. */
	[Symbol.dispose]() {
		this.close();
	}
};
const registeredVideoSampleTransformers = [];
const TRANSFORMATION_CANVAS_CACHE_MAX_SIZE = 3;
const transformationCanvasCache = [];
let transformationCanvasCacheNextAge = 0;
/**
* Describes the color space of a {@link VideoSample}. Corresponds to the WebCodecs API's VideoColorSpace.
* @group Samples
* @public
*/
var VideoSampleColorSpace = class {
	/** Creates a new VideoSampleColorSpace. */
	constructor(init) {
		if (init !== void 0) {
			if (!init || typeof init !== "object") throw new TypeError("init.colorSpace, when provided, must be an object.");
			const primariesValues = Object.keys(COLOR_PRIMARIES_MAP);
			if (init.primaries != null && !primariesValues.includes(init.primaries)) throw new TypeError(\`init.colorSpace.primaries, when provided, must be one of \${primariesValues.join(", ")}.\`);
			const transferValues = Object.keys(TRANSFER_CHARACTERISTICS_MAP);
			if (init.transfer != null && !transferValues.includes(init.transfer)) throw new TypeError(\`init.colorSpace.transfer, when provided, must be one of \${transferValues.join(", ")}.\`);
			const matrixValues = Object.keys(MATRIX_COEFFICIENTS_MAP);
			if (init.matrix != null && !matrixValues.includes(init.matrix)) throw new TypeError(\`init.colorSpace.matrix, when provided, must be one of \${matrixValues.join(", ")}.\`);
			if (init.fullRange != null && typeof init.fullRange !== "boolean") throw new TypeError("init.colorSpace.fullRange, when provided, must be a boolean.");
		}
		this.primaries = init?.primaries ?? null;
		this.transfer = init?.transfer ?? null;
		this.matrix = init?.matrix ?? null;
		this.fullRange = init?.fullRange ?? null;
	}
	/** Serializes the color space to a JSON object. */
	toJSON() {
		return {
			primaries: this.primaries,
			transfer: this.transfer,
			matrix: this.matrix,
			fullRange: this.fullRange
		};
	}
};
const isVideoFrame = (x) => {
	return typeof VideoFrame !== "undefined" && x instanceof VideoFrame;
};
const clampCropRectangle = (crop, outerWidth, outerHeight) => {
	const left = Math.min(crop.left, outerWidth);
	const top = Math.min(crop.top, outerHeight);
	const width = Math.min(crop.width, outerWidth - left);
	const height = Math.min(crop.height, outerHeight - top);
	assert(width >= 0);
	assert(height >= 0);
	return {
		left,
		top,
		width,
		height
	};
};
const validateCropRectangle = (crop, prefix) => {
	if (!crop || typeof crop !== "object") throw new TypeError(prefix + "crop, when provided, must be an object.");
	if (!Number.isInteger(crop.left) || crop.left < 0) throw new TypeError(prefix + "crop.left must be a non-negative integer.");
	if (!Number.isInteger(crop.top) || crop.top < 0) throw new TypeError(prefix + "crop.top must be a non-negative integer.");
	if (!Number.isInteger(crop.width) || crop.width < 0) throw new TypeError(prefix + "crop.width must be a non-negative integer.");
	if (!Number.isInteger(crop.height) || crop.height < 0) throw new TypeError(prefix + "crop.height must be a non-negative integer.");
};
const validateVideoFrameCopyToOptions = (options) => {
	if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
	if (options.colorSpace !== void 0 && !["display-p3", "srgb"].includes(options.colorSpace)) throw new TypeError("options.colorSpace, when provided, must be 'display-p3' or 'srgb'.");
	if (options.format !== void 0 && typeof options.format !== "string") throw new TypeError("options.format, when provided, must be a string.");
	if (options.layout !== void 0) {
		if (!Array.isArray(options.layout)) throw new TypeError("options.layout, when provided, must be an array.");
		for (const plane of options.layout) {
			if (!plane || typeof plane !== "object") throw new TypeError("Each entry in options.layout must be an object.");
			if (!Number.isInteger(plane.offset) || plane.offset < 0) throw new TypeError("plane.offset must be a non-negative integer.");
			if (!Number.isInteger(plane.stride) || plane.stride < 0) throw new TypeError("plane.stride must be a non-negative integer.");
		}
	}
	if (options.rect !== void 0) {
		if (!options.rect || typeof options.rect !== "object") throw new TypeError("options.rect, when provided, must be an object.");
		if (options.rect.x !== void 0 && (!Number.isInteger(options.rect.x) || options.rect.x < 0)) throw new TypeError("options.rect.x, when provided, must be a non-negative integer.");
		if (options.rect.y !== void 0 && (!Number.isInteger(options.rect.y) || options.rect.y < 0)) throw new TypeError("options.rect.y, when provided, must be a non-negative integer.");
		if (options.rect.width !== void 0 && (!Number.isInteger(options.rect.width) || options.rect.width < 0)) throw new TypeError("options.rect.width, when provided, must be a non-negative integer.");
		if (options.rect.height !== void 0 && (!Number.isInteger(options.rect.height) || options.rect.height < 0)) throw new TypeError("options.rect.height, when provided, must be a non-negative integer.");
	}
};
/** Implements logic from WebCodecs § 9.4.6 "Compute Layout and Allocation Size" */
const createDefaultPlaneLayout = (format, codedWidth, codedHeight) => {
	const planes = getPlaneConfigs(format);
	const layouts = [];
	let currentOffset = 0;
	for (const plane of planes) {
		const planeWidth = Math.ceil(codedWidth / plane.widthDivisor);
		const planeHeight = Math.ceil(codedHeight / plane.heightDivisor);
		const stride = planeWidth * plane.sampleBytes;
		const planeSize = stride * planeHeight;
		layouts.push({
			offset: currentOffset,
			stride
		});
		currentOffset += planeSize;
	}
	return layouts;
};
/** Helper to retrieve plane configurations based on WebCodecs § 9.8 Pixel Format definitions. */
const getPlaneConfigs = (format) => {
	const yuv = (yBytes, uvBytes, subX, subY, hasAlpha) => {
		const configs = [
			{
				sampleBytes: yBytes,
				widthDivisor: 1,
				heightDivisor: 1
			},
			{
				sampleBytes: uvBytes,
				widthDivisor: subX,
				heightDivisor: subY
			},
			{
				sampleBytes: uvBytes,
				widthDivisor: subX,
				heightDivisor: subY
			}
		];
		if (hasAlpha) configs.push({
			sampleBytes: yBytes,
			widthDivisor: 1,
			heightDivisor: 1
		});
		return configs;
	};
	switch (format) {
		case "I420": return yuv(1, 1, 2, 2, false);
		case "I420P10":
		case "I420P12": return yuv(2, 2, 2, 2, false);
		case "I420A": return yuv(1, 1, 2, 2, true);
		case "I420AP10":
		case "I420AP12": return yuv(2, 2, 2, 2, true);
		case "I422": return yuv(1, 1, 2, 1, false);
		case "I422P10":
		case "I422P12": return yuv(2, 2, 2, 1, false);
		case "I422A": return yuv(1, 1, 2, 1, true);
		case "I422AP10":
		case "I422AP12": return yuv(2, 2, 2, 1, true);
		case "I444": return yuv(1, 1, 1, 1, false);
		case "I444P10":
		case "I444P12": return yuv(2, 2, 1, 1, false);
		case "I444A": return yuv(1, 1, 1, 1, true);
		case "I444AP10":
		case "I444AP12": return yuv(2, 2, 1, 1, true);
		case "NV12": return [{
			sampleBytes: 1,
			widthDivisor: 1,
			heightDivisor: 1
		}, {
			sampleBytes: 2,
			widthDivisor: 2,
			heightDivisor: 2
		}];
		case "RGBA":
		case "RGBX":
		case "BGRA":
		case "BGRX": return [{
			sampleBytes: 4,
			widthDivisor: 1,
			heightDivisor: 1
		}];
		default:
			assertNever(format);
			assert(false);
	}
};
/** Taken from the WebCodecs spec. */
const ParseVideoFrameCopyToOptions = (sample, options) => {
	const defaultRect = {
		left: 0,
		top: 0,
		width: sample.codedWidth,
		height: sample.codedHeight
	};
	const overrideRect = options.rect;
	const parsedRect = ParseVisibleRect(defaultRect, overrideRect, sample.codedWidth, sample.codedHeight, sample.format);
	const optLayout = options.layout;
	let format;
	if (!options.format || options.format === sample.format) format = sample.format;
	else if ([
		"RGBA",
		"RGBX",
		"BGRA",
		"BGRX"
	].includes(options.format)) format = options.format;
	else throw new Error("NotSupportedError: Invalid destination format.");
	return ComputeLayoutAndAllocationSize(parsedRect, format, optLayout);
};
/** Taken from the WebCodecs spec. */
const ParseVisibleRect = (defaultRect, overrideRect, codedWidth, codedHeight, format) => {
	const sourceRect = { ...defaultRect };
	if (overrideRect !== void 0) {
		if (overrideRect.width === 0 || overrideRect.height === 0) throw new TypeError("visibleRect dimensions cannot be zero.");
		if ((overrideRect.x || 0) + (overrideRect.width || 0) > codedWidth) throw new TypeError("visibleRect exceeds codedWidth.");
		if ((overrideRect.y || 0) + (overrideRect.height || 0) > codedHeight) throw new TypeError("visibleRect exceeds codedHeight.");
		sourceRect.x = overrideRect.x || 0;
		sourceRect.y = overrideRect.y || 0;
		sourceRect.width = overrideRect.width || 0;
		sourceRect.height = overrideRect.height || 0;
	}
	if (!VerifyRectOffsetAlignment(format, sourceRect)) throw new TypeError("visibleRect alignment is invalid for the format.");
	return sourceRect;
};
/** Taken from the WebCodecs spec. */
const VerifyRectOffsetAlignment = (format, rect) => {
	if (format === null) return true;
	const planes = getPlaneConfigs(format);
	for (let planeIndex = 0; planeIndex < planes.length; planeIndex++) {
		const plane = planes[planeIndex];
		const sampleWidth = plane.widthDivisor;
		const sampleHeight = plane.heightDivisor;
		if ((rect.x || 0) % sampleWidth !== 0) return false;
		if ((rect.y || 0) % sampleHeight !== 0) return false;
	}
	return true;
};
/** Taken from the WebCodecs spec. */
const ComputeLayoutAndAllocationSize = (parsedRect, format, layout) => {
	const planes = getPlaneConfigs(format);
	const numPlanes = planes.length;
	if (layout !== void 0 && layout.length !== numPlanes) throw new TypeError(\`Layout must have \${numPlanes} planes.\`);
	let minAllocationSize = 0;
	const computedLayouts = [];
	const endOffsets = [];
	for (let planeIndex = 0; planeIndex < numPlanes; planeIndex++) {
		const plane = planes[planeIndex];
		const sampleBytes = plane.sampleBytes;
		const sampleWidth = plane.widthDivisor;
		const sampleHeight = plane.heightDivisor;
		const computedLayout = {
			destinationOffset: 0,
			destinationStride: 0,
			sourceTop: 0,
			sourceHeight: 0,
			sourceLeftBytes: 0,
			sourceWidthBytes: 0
		};
		computedLayout.sourceTop = Math.ceil(Math.trunc(parsedRect.y || 0) / sampleHeight);
		computedLayout.sourceHeight = Math.ceil(Math.trunc(parsedRect.height || 0) / sampleHeight);
		computedLayout.sourceLeftBytes = Math.floor(Math.trunc(parsedRect.x || 0) / sampleWidth) * sampleBytes;
		computedLayout.sourceWidthBytes = Math.floor(Math.trunc(parsedRect.width || 0) / sampleWidth) * sampleBytes;
		if (layout !== void 0) {
			const planeLayout = layout[planeIndex];
			if (planeLayout.stride < computedLayout.sourceWidthBytes) throw new TypeError(\`Stride for plane \${planeIndex} is too small.\`);
			computedLayout.destinationOffset = planeLayout.offset;
			computedLayout.destinationStride = planeLayout.stride;
		} else {
			computedLayout.destinationOffset = minAllocationSize;
			computedLayout.destinationStride = computedLayout.sourceWidthBytes;
		}
		const planeEnd = computedLayout.destinationStride * computedLayout.sourceHeight + computedLayout.destinationOffset;
		if (planeEnd > 4294967295) throw new TypeError("Allocation size exceeds limit.");
		endOffsets.push(planeEnd);
		minAllocationSize = Math.max(minAllocationSize, planeEnd);
		for (let earlierPlaneIndex = 0; earlierPlaneIndex < planeIndex; earlierPlaneIndex++) {
			const earlierLayout = computedLayouts[earlierPlaneIndex];
			if (endOffsets[planeIndex] <= earlierLayout.destinationOffset || endOffsets[earlierPlaneIndex] <= computedLayout.destinationOffset) continue;
			throw new TypeError("Planes overlap.");
		}
		computedLayouts.push(computedLayout);
	}
	return {
		allocationSize: minAllocationSize,
		computedLayouts
	};
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/encode.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
const canEncodeVideoMemo = /* @__PURE__ */ new Map();
const validateVideoEncodingConfig = (config) => {
	if (!config || typeof config !== "object") throw new TypeError("Encoding config must be an object.");
	if (!VIDEO_CODECS.includes(config.codec)) throw new TypeError(\`Invalid video codec '\${config.codec}'. Must be one of: \${VIDEO_CODECS.join(", ")}.\`);
	if (!(config.bitrate instanceof Quality) && (!Number.isInteger(config.bitrate) || config.bitrate <= 0)) throw new TypeError("config.bitrate must be a positive integer or a quality.");
	if (config.keyFrameInterval !== void 0 && (!Number.isFinite(config.keyFrameInterval) || config.keyFrameInterval < 0)) throw new TypeError("config.keyFrameInterval, when provided, must be a non-negative number.");
	if (config.sizeChangeBehavior !== void 0 && ![
		"deny",
		"passThrough",
		"fill",
		"contain",
		"cover"
	].includes(config.sizeChangeBehavior)) throw new TypeError("config.sizeChangeBehavior, when provided, must be 'deny', 'passThrough', 'fill', 'contain' or 'cover'.");
	if (config.transform !== void 0) {
		if (typeof config.transform !== "object" || !config.transform) throw new TypeError("config.transform, when provided, must be an object.");
		if (config.transform.width !== void 0 && (!Number.isInteger(config.transform.width) || config.transform.width <= 0)) throw new TypeError("config.transform.width, when provided, must be a positive integer.");
		if (config.transform.height !== void 0 && (!Number.isInteger(config.transform.height) || config.transform.height <= 0)) throw new TypeError("config.transform.height, when provided, must be a positive integer.");
		if (config.transform.fit !== void 0 && ![
			"fill",
			"contain",
			"cover"
		].includes(config.transform.fit)) throw new TypeError("config.transform.fit, when provided, must be one of \\"fill\\", \\"contain\\", or \\"cover\\".");
		if (config.transform.width !== void 0 && config.transform.height !== void 0 && config.transform.fit === void 0 && ![
			"fill",
			"contain",
			"cover"
		].includes(config.sizeChangeBehavior)) throw new TypeError("When both config.transform.width and config.transform.height are provided, config.transform.fit must also be provided.");
		if (config.transform.fit !== void 0 && [
			"fill",
			"contain",
			"cover"
		].includes(config.sizeChangeBehavior) && config.transform.fit !== config.sizeChangeBehavior) throw new TypeError("config.transform.fit, when provided, cannot differ from config.sizeChangeBehavior when config.sizeChangeBehavior is 'fill', 'contain' or 'cover', as sizeChangeBehavior already determines the fitting algorithm.");
		if (config.transform.rotate !== void 0 && ![
			0,
			90,
			180,
			270
		].includes(config.transform.rotate)) throw new TypeError("config.transform.rotate, when provided, must be 0, 90, 180 or 270.");
		if (config.transform.crop !== void 0) validateCropRectangle(config.transform.crop, "config.transform.");
		if (config.transform.process !== void 0 && typeof config.transform.process !== "function") throw new TypeError("config.transform.process, when provided, must be a function.");
		if (config.transform.frameRate !== void 0 && (!Number.isFinite(config.transform.frameRate) || config.transform.frameRate <= 0)) throw new TypeError("config.transform.frameRate, when provided, must be a finite positive number.");
		if (config.transform.force !== void 0 && typeof config.transform.force !== "boolean") throw new TypeError("config.transform.force, when provided, must be a boolean.");
	}
	if (config.onEncodedPacket !== void 0 && typeof config.onEncodedPacket !== "function") throw new TypeError("config.onEncodedPacket, when provided, must be a function.");
	if (config.onEncoderConfig !== void 0 && typeof config.onEncoderConfig !== "function") throw new TypeError("config.onEncoderConfig, when provided, must be a function.");
	if (config.onEncodedSample !== void 0 && typeof config.onEncodedSample !== "function") throw new TypeError("config.onEncodedSample, when provided, must be a function.");
	validateVideoEncodingAdditionalOptions(config.codec, config);
};
const validateVideoEncodingAdditionalOptions = (codec, options) => {
	if (!options || typeof options !== "object") throw new TypeError("Encoding options must be an object.");
	if (options.alpha !== void 0 && !["discard", "keep"].includes(options.alpha)) throw new TypeError("options.alpha, when provided, must be 'discard' or 'keep'.");
	if (options.bitrateMode !== void 0 && !["constant", "variable"].includes(options.bitrateMode)) throw new TypeError("bitrateMode, when provided, must be 'constant' or 'variable'.");
	if (options.latencyMode !== void 0 && !["quality", "realtime"].includes(options.latencyMode)) throw new TypeError("latencyMode, when provided, must be 'quality' or 'realtime'.");
	if (options.fullCodecString !== void 0 && typeof options.fullCodecString !== "string") throw new TypeError("fullCodecString, when provided, must be a string.");
	if (options.fullCodecString !== void 0 && inferCodecFromCodecString(options.fullCodecString) !== codec) throw new TypeError(\`fullCodecString, when provided, must be a string that matches the specified codec (\${codec}).\`);
	if (options.hardwareAcceleration !== void 0 && ![
		"no-preference",
		"prefer-hardware",
		"prefer-software"
	].includes(options.hardwareAcceleration)) throw new TypeError("hardwareAcceleration, when provided, must be 'no-preference', 'prefer-hardware' or 'prefer-software'.");
	if (options.scalabilityMode !== void 0 && typeof options.scalabilityMode !== "string") throw new TypeError("scalabilityMode, when provided, must be a string.");
	if (options.contentHint !== void 0 && typeof options.contentHint !== "string") throw new TypeError("contentHint, when provided, must be a string.");
};
const buildVideoEncoderConfig = (options) => {
	const resolvedBitrate = options.bitrate instanceof Quality ? options.bitrate._toVideoBitrate(options.codec, options.width, options.height) : options.bitrate;
	return {
		codec: options.fullCodecString ?? buildVideoCodecString(options.codec, options.width, options.height, resolvedBitrate),
		width: options.width,
		height: options.height,
		displayWidth: options.squarePixelWidth,
		displayHeight: options.squarePixelHeight,
		bitrate: resolvedBitrate,
		bitrateMode: options.bitrateMode,
		alpha: options.alpha ?? "discard",
		framerate: options.framerate,
		latencyMode: options.latencyMode,
		hardwareAcceleration: options.hardwareAcceleration,
		scalabilityMode: options.scalabilityMode,
		contentHint: options.contentHint,
		...getVideoEncoderConfigExtension(options.codec)
	};
};
/**
* Represents a subjective media quality level.
* @group Encoding
* @public
*/
var Quality = class {
	/** @internal */
	constructor(factor) {
		this._factor = factor;
	}
	/** @internal */
	_toVideoBitrate(codec, width, height) {
		const pixels = width * height;
		const finalBitrate = 3e6 * Math.pow(pixels / 2073600, .95) * {
			avc: 1,
			hevc: .6,
			vp9: .6,
			av1: .4,
			vp8: 1.2
		}[codec] * this._factor;
		return Math.ceil(finalBitrate / 1e3) * 1e3;
	}
	/** @internal */
	_toAudioBitrate(codec) {
		if (PCM_AUDIO_CODECS.includes(codec) || codec === "flac") return;
		const baseBitrate = {
			aac: 128e3,
			opus: 64e3,
			mp3: 16e4,
			vorbis: 64e3,
			ac3: 384e3,
			eac3: 192e3
		}[codec];
		if (!baseBitrate) throw new Error(\`Unhandled codec: \${codec}\`);
		let finalBitrate = baseBitrate * this._factor;
		if (codec === "aac") finalBitrate = [
			96e3,
			128e3,
			16e4,
			192e3
		].reduce((prev, curr) => Math.abs(curr - finalBitrate) < Math.abs(prev - finalBitrate) ? curr : prev);
		else if (codec === "opus" || codec === "vorbis") finalBitrate = Math.max(6e3, finalBitrate);
		else if (codec === "mp3") finalBitrate = [
			8e3,
			16e3,
			24e3,
			32e3,
			4e4,
			48e3,
			64e3,
			8e4,
			96e3,
			112e3,
			128e3,
			16e4,
			192e3,
			224e3,
			256e3,
			32e4
		].reduce((prev, curr) => Math.abs(curr - finalBitrate) < Math.abs(prev - finalBitrate) ? curr : prev);
		return Math.round(finalBitrate / 1e3) * 1e3;
	}
};
/**
* Represents a high media quality.
* @group Encoding
* @public
*/
const QUALITY_HIGH = /* #__PURE__ */ new Quality(2);
/**
* Checks if the browser is able to encode the given video codec with the given parameters.
* @group Encoding
* @public
*/
const canEncodeVideo = async (codec, options = {}) => {
	const { width = 1280, height = 720, bitrate = 1e6, ...restOptions } = options;
	if (!VIDEO_CODECS.includes(codec)) return false;
	if (!Number.isInteger(width) || width <= 0) throw new TypeError("width must be a positive integer.");
	if (!Number.isInteger(height) || height <= 0) throw new TypeError("height must be a positive integer.");
	if (!(bitrate instanceof Quality) && (!Number.isInteger(bitrate) || bitrate <= 0)) throw new TypeError("bitrate must be a positive integer or a quality.");
	validateVideoEncodingAdditionalOptions(codec, restOptions);
	const encoderConfig = buildVideoEncoderConfig({
		codec,
		width,
		height,
		bitrate,
		framerate: void 0,
		...restOptions,
		alpha: "discard"
	});
	const key = JSON.stringify(encoderConfig);
	const memoized = canEncodeVideoMemo.get(key);
	if (memoized) return memoized;
	const promise = (async () => {
		if (customVideoEncoders.some((x) => x.supports(codec, encoderConfig))) return true;
		if (typeof VideoEncoder === "undefined") return false;
		if ((width % 2 === 1 || height % 2 === 1) && (codec === "avc" || codec === "hevc")) return false;
		if (!(await VideoEncoder.isConfigSupported(encoderConfig)).supported) return false;
		if (isFirefox()) return new Promise(async (resolve) => {
			try {
				const encoder = new VideoEncoder({
					output: () => {},
					error: () => resolve(false)
				});
				encoder.configure(encoderConfig);
				const frameData = new Uint8Array(width * height * 4);
				const frame = new VideoFrame(frameData, {
					format: "RGBA",
					codedWidth: width,
					codedHeight: height,
					timestamp: 0
				});
				encoder.encode(frame);
				frame.close();
				await encoder.flush();
				resolve(true);
			} catch {
				resolve(false);
			}
		});
		return true;
	})();
	canEncodeVideoMemo.set(key, promise);
	return promise;
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/custom-coder.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
const customVideoEncoders = [];

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/reader.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var FileSlice = class FileSlice {
	constructor(bytes, view, offset, start, end) {
		this.bytes = bytes;
		this.view = view;
		this.offset = offset;
		this.start = start;
		this.end = end;
		this.bufferPos = start - offset;
	}
	static tempFromBytes(bytes) {
		return new FileSlice(bytes, toDataView(bytes), 0, 0, bytes.length);
	}
	get length() {
		return this.end - this.start;
	}
	get filePos() {
		return this.offset + this.bufferPos;
	}
	set filePos(value) {
		this.bufferPos = value - this.offset;
	}
	/** The number of bytes left from the current pos to the end of the slice. */
	get remainingLength() {
		return Math.max(this.end - this.filePos, 0);
	}
	skip(byteCount) {
		this.bufferPos += byteCount;
	}
	/** Creates a new subslice of this slice whose byte range must be contained within this slice. */
	slice(filePos, length = this.end - filePos) {
		if (filePos < this.start || filePos + length > this.end) throw new RangeError("Slicing outside of original slice.");
		return new FileSlice(this.bytes, this.view, this.offset, filePos, filePos + length);
	}
};
const checkIsInRange = (slice, bytesToRead) => {
	if (slice.filePos < slice.start || slice.filePos + bytesToRead > slice.end) throw new RangeError(\`Tried reading [\${slice.filePos}, \${slice.filePos + bytesToRead}), but slice is [\${slice.start}, \${slice.end}). This is likely an internal error, please report it alongside the file that caused it.\`);
};
const readBytes = (slice, length) => {
	checkIsInRange(slice, length);
	const bytes = slice.bytes.subarray(slice.bufferPos, slice.bufferPos + length);
	slice.bufferPos += length;
	return bytes;
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/muxer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var Muxer = class {
	constructor(output) {
		this.mutex = new AsyncMutex();
		this.trackTimestampInfo = /* @__PURE__ */ new WeakMap();
		this.output = output;
	}
	onTrackClose(track) {}
	validateTimestamp(track, timestampInSeconds, isKeyPacket) {
		if (timestampInSeconds < 0) throw new Error(\`Timestamps must be non-negative (got \${timestampInSeconds}s).\`);
		let timestampInfo = this.trackTimestampInfo.get(track);
		if (!timestampInfo) {
			if (!isKeyPacket) throw new Error("First packet must be a key packet.");
			timestampInfo = {
				maxTimestamp: timestampInSeconds,
				maxTimestampBeforeLastKeyPacket: null
			};
			this.trackTimestampInfo.set(track, timestampInfo);
		} else {
			if (isKeyPacket) timestampInfo.maxTimestampBeforeLastKeyPacket = timestampInfo.maxTimestamp;
			if (timestampInfo.maxTimestampBeforeLastKeyPacket !== null && timestampInSeconds < timestampInfo.maxTimestampBeforeLastKeyPacket) throw new Error(\`Timestamps cannot be smaller than the largest timestamp of the previous GOP (a GOP begins with a key packet and ends right before the next key packet). Got \${timestampInSeconds}s, but largest timestamp is \${timestampInfo.maxTimestampBeforeLastKeyPacket}s.\`);
			timestampInfo.maxTimestamp = Math.max(timestampInfo.maxTimestamp, timestampInSeconds);
		}
	}
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/subtitles.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
const inlineTimestampRegex = /<(?:(\\d{2}):)?(\\d{2}):(\\d{2}).(\\d{3})>/g;
const timestampRegex = /(?:(\\d{2}):)?(\\d{2}):(\\d{2}).(\\d{3})/;
const parseSubtitleTimestamp = (string) => {
	const match = timestampRegex.exec(string);
	if (!match) throw new Error("Expected match.");
	return 36e5 * Number(match[1] || "0") + 6e4 * Number(match[2]) + 1e3 * Number(match[3]) + Number(match[4]);
};
const formatSubtitleTimestamp = (timestamp) => {
	const hours = Math.floor(timestamp / 36e5);
	const minutes = Math.floor(timestamp % 36e5 / 6e4);
	const seconds = Math.floor(timestamp % 6e4 / 1e3);
	const milliseconds = timestamp % 1e3;
	return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0") + "." + milliseconds.toString().padStart(3, "0");
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/isobmff/isobmff-boxes.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var IsobmffBoxWriter = class {
	constructor(writer) {
		this.writer = writer;
		this.helper = /* @__PURE__ */ new Uint8Array(8);
		this.helperView = new DataView(this.helper.buffer);
		/**
		* Stores the position from the start of the file to where boxes elements have been written. This is used to
		* rewrite/edit elements that were already added before, and to measure sizes of things.
		*/
		this.offsets = /* @__PURE__ */ new WeakMap();
	}
	writeU32(value) {
		this.helperView.setUint32(0, value, false);
		this.writer.write(this.helper.subarray(0, 4));
	}
	writeU64(value) {
		this.helperView.setUint32(0, Math.floor(value / 2 ** 32), false);
		this.helperView.setUint32(4, value, false);
		this.writer.write(this.helper.subarray(0, 8));
	}
	writeAscii(text) {
		for (let i = 0; i < text.length; i++) {
			this.helperView.setUint8(i % 8, text.charCodeAt(i));
			if (i % 8 === 7) this.writer.write(this.helper);
		}
		if (text.length % 8 !== 0) this.writer.write(this.helper.subarray(0, text.length % 8));
	}
	writeBox(box) {
		this.offsets.set(box, this.writer.getPos());
		if (box.contents && !box.children) {
			this.writeBoxHeader(box, box.size ?? box.contents.byteLength + 8);
			this.writer.write(box.contents);
		} else {
			const startPos = this.writer.getPos();
			this.writeBoxHeader(box, 0);
			if (box.contents) this.writer.write(box.contents);
			if (box.children) {
				for (const child of box.children) if (child) this.writeBox(child);
			}
			const endPos = this.writer.getPos();
			const size = box.size ?? endPos - startPos;
			this.writer.seek(startPos);
			this.writeBoxHeader(box, size);
			this.writer.seek(endPos);
		}
	}
	writeBoxHeader(box, size) {
		this.writeU32(box.largeSize ? 1 : size);
		this.writeAscii(box.type);
		if (box.largeSize) this.writeU64(size);
	}
	measureBoxHeader(box) {
		return 8 + (box.largeSize ? 8 : 0);
	}
	patchBox(box) {
		const boxOffset = this.offsets.get(box);
		assert(boxOffset !== void 0);
		const endPos = this.writer.getPos();
		this.writer.seek(boxOffset);
		this.writeBox(box);
		this.writer.seek(endPos);
	}
	measureBox(box) {
		if (box.contents && !box.children) return this.measureBoxHeader(box) + box.contents.byteLength;
		else {
			let result = this.measureBoxHeader(box);
			if (box.contents) result += box.contents.byteLength;
			if (box.children) {
				for (const child of box.children) if (child) result += this.measureBox(child);
			}
			return result;
		}
	}
};
const bytes = /* #__PURE__ */ new Uint8Array(8);
const view = /* #__PURE__ */ new DataView(bytes.buffer);
const u8 = (value) => {
	return [(value % 256 + 256) % 256];
};
const u16 = (value) => {
	view.setUint16(0, value, false);
	return [bytes[0], bytes[1]];
};
const i16 = (value) => {
	view.setInt16(0, value, false);
	return [bytes[0], bytes[1]];
};
const u24 = (value) => {
	view.setUint32(0, value, false);
	return [
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
const u32 = (value) => {
	view.setUint32(0, value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
const i32 = (value) => {
	view.setInt32(0, value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
const u64 = (value) => {
	view.setUint32(0, Math.floor(value / 2 ** 32), false);
	view.setUint32(4, value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3],
		bytes[4],
		bytes[5],
		bytes[6],
		bytes[7]
	];
};
const i64 = (value) => {
	view.setInt32(0, Math.floor(value / 2 ** 32), false);
	view.setUint32(4, value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3],
		bytes[4],
		bytes[5],
		bytes[6],
		bytes[7]
	];
};
const fixed_8_8 = (value) => {
	view.setInt16(0, 256 * value, false);
	return [bytes[0], bytes[1]];
};
const fixed_16_16 = (value) => {
	view.setInt32(0, 2 ** 16 * value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
const fixed_2_30 = (value) => {
	view.setInt32(0, 2 ** 30 * value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
const variableUnsignedInt = (value, byteLength) => {
	const bytes = [];
	let remaining = value;
	do {
		let byte = remaining & 127;
		remaining >>= 7;
		if (bytes.length > 0) byte |= 128;
		bytes.push(byte);
		if (byteLength !== void 0) byteLength--;
	} while (remaining > 0 || byteLength);
	return bytes.reverse();
};
const ascii = (text, nullTerminated = false) => {
	const bytes = Array(text.length).fill(null).map((_, i) => text.charCodeAt(i));
	if (nullTerminated) bytes.push(0);
	return bytes;
};
const rotationMatrix = (rotationInDegrees) => {
	const theta = rotationInDegrees * (Math.PI / 180);
	const cosTheta = Math.round(Math.cos(theta));
	const sinTheta = Math.round(Math.sin(theta));
	return [
		cosTheta,
		sinTheta,
		0,
		-sinTheta,
		cosTheta,
		0,
		0,
		0,
		1
	];
};
const IDENTITY_MATRIX = /* #__PURE__ */ rotationMatrix(0);
const matrixToBytes = (matrix) => {
	return [
		fixed_16_16(matrix[0]),
		fixed_16_16(matrix[1]),
		fixed_2_30(matrix[2]),
		fixed_16_16(matrix[3]),
		fixed_16_16(matrix[4]),
		fixed_2_30(matrix[5]),
		fixed_16_16(matrix[6]),
		fixed_16_16(matrix[7]),
		fixed_2_30(matrix[8])
	];
};
const box = (type, contents, children) => ({
	type,
	contents: contents && new Uint8Array(contents.flat(10)),
	children
});
/** A FullBox always starts with a version byte, followed by three flag bytes. */
const fullBox = (type, version, flags, contents, children) => box(type, [
	u8(version),
	u24(flags),
	contents ?? []
], children);
/**
* File Type Compatibility Box: Allows the reader to determine whether this is a type of file that the
* reader understands.
*/
const ftyp = (details) => {
	const minorVersion = 512;
	if (details.isQuickTime) return box("ftyp", [
		ascii("qt  "),
		u32(minorVersion),
		ascii("qt  ")
	]);
	if (details.fragmented) {
		if (details.cmaf) return box("ftyp", [
			ascii("iso5"),
			u32(minorVersion),
			ascii("iso5"),
			ascii("iso6"),
			ascii("mp41"),
			ascii("cmfc"),
			ascii("dash")
		]);
		else return box("ftyp", [
			ascii("iso5"),
			u32(minorVersion),
			ascii("iso5"),
			ascii("iso6"),
			ascii("mp41")
		]);
	}
	return box("ftyp", [
		ascii("isom"),
		u32(minorVersion),
		ascii("isom"),
		details.holdsAvc ? ascii("avc1") : [],
		ascii("mp41")
	]);
};
/** Segment Type Box */
const styp = () => box("styp", [
	ascii("iso5"),
	u32(0),
	ascii("iso5"),
	ascii("iso6"),
	ascii("mp41"),
	ascii("cmfc"),
	ascii("dash")
]);
/** Segment Index Box */
const sidx = (muxer, referencedSize) => {
	let duration = muxer.maxWrittenEndTimestamp - muxer.minWrittenTimestamp;
	if (!Number.isFinite(duration)) duration = 0;
	return fullBox("sidx", 1, 0, [
		u32(1),
		u32(GLOBAL_TIMESCALE),
		u64(intoTimescale(muxer.minWrittenTimestamp, GLOBAL_TIMESCALE)),
		u64(0),
		u16(0),
		u16(1),
		u32(referencedSize & 2147483647),
		u32(intoTimescale(duration, GLOBAL_TIMESCALE)),
		u32(0)
	]);
};
/** Movie Sample Data Box. Contains the actual frames/samples of the media. */
const mdat = (reserveLargeSize) => ({
	type: "mdat",
	largeSize: reserveLargeSize
});
/** Free Space Box: A box that designates unused space in the movie data file. */
const free = (size) => ({
	type: "free",
	size
});
/**
* Movie Box: Used to specify the information that defines a movie - that is, the information that allows
* an application to interpret the sample data that is stored elsewhere.
*/
const moov = (muxer) => {
	return box("moov", void 0, [
		mvhd(muxer.creationTime, muxer.trackDatas),
		...muxer.trackDatas.map((x) => trak(x, muxer.creationTime)),
		muxer.isFragmented ? mvex(muxer.trackDatas) : null,
		udta(muxer)
	]);
};
/** Movie Header Box: Used to specify the characteristics of the entire movie, such as timescale and duration. */
const mvhd = (creationTime, trackDatas) => {
	const duration = Math.max(0, ...trackDatas.map((trackData) => intoTimescale(presentationSpan(trackData), GLOBAL_TIMESCALE) + intoTimescale(trackData.startTimestampOffset ?? 0, GLOBAL_TIMESCALE)));
	const nextTrackId = Math.max(0, ...trackDatas.map((x) => x.track.id)) + 1;
	const needsU64 = !isU32(creationTime) || !isU32(duration);
	const u32OrU64 = needsU64 ? u64 : u32;
	return fullBox("mvhd", +needsU64, 0, [
		u32OrU64(creationTime),
		u32OrU64(creationTime),
		u32(GLOBAL_TIMESCALE),
		u32OrU64(duration),
		fixed_16_16(1),
		fixed_8_8(1),
		Array(10).fill(0),
		matrixToBytes(IDENTITY_MATRIX),
		Array(24).fill(0),
		u32(nextTrackId)
	]);
};
const presentationSpan = (trackData) => {
	if (trackData.samples.length === 0) return 0;
	let minTimestamp = Infinity;
	let maxEndTimestamp = -Infinity;
	for (let i = 0; i < trackData.samples.length; i++) {
		const sample = trackData.samples[i];
		if (sample.timestamp < minTimestamp) minTimestamp = sample.timestamp;
		if (sample.timestamp + sample.duration > maxEndTimestamp) maxEndTimestamp = sample.timestamp + sample.duration;
	}
	if (minTimestamp === Infinity) return 0;
	return maxEndTimestamp - minTimestamp;
};
/**
* Track Box: Defines a single track of a movie. A movie may consist of one or more tracks. Each track is
* independent of the other tracks in the movie and carries its own temporal and spatial information. Each Track Box
* contains its associated Media Box.
*/
const trak = (trackData, creationTime) => {
	const trackMetadata = getTrackMetadata(trackData);
	const needsEditList = trackData.startTimestampOffset !== null && trackData.startTimestampOffset > 0;
	return box("trak", void 0, [
		tkhd(trackData, creationTime),
		needsEditList ? edts(trackData, trackData.startTimestampOffset) : null,
		mdia(trackData, creationTime),
		trackMetadata.name !== void 0 ? box("udta", void 0, [box("name", [...textEncoder.encode(trackMetadata.name)])]) : null
	]);
};
/** Track Header Box: Specifies the characteristics of a single track within a movie. */
const tkhd = (trackData, creationTime) => {
	const durationInGlobalTimescale = intoTimescale(presentationSpan(trackData), GLOBAL_TIMESCALE) + intoTimescale(trackData.startTimestampOffset ?? 0, GLOBAL_TIMESCALE);
	const needsU64 = !isU32(creationTime) || !isU32(durationInGlobalTimescale);
	const u32OrU64 = needsU64 ? u64 : u32;
	let matrix;
	if (trackData.type === "video") {
		const rotation = trackData.track.metadata.rotation;
		matrix = rotationMatrix(rotation ?? 0);
	} else matrix = IDENTITY_MATRIX;
	let flags = 2;
	if (trackData.track.metadata.disposition?.default !== false) flags |= 1;
	return fullBox("tkhd", +needsU64, flags, [
		u32OrU64(creationTime),
		u32OrU64(creationTime),
		u32(trackData.track.id),
		u32(0),
		u32OrU64(durationInGlobalTimescale),
		Array(8).fill(0),
		u16(0),
		u16(trackData.track.id),
		fixed_8_8(trackData.type === "audio" ? 1 : 0),
		u16(0),
		matrixToBytes(matrix),
		fixed_16_16(trackData.type === "video" ? trackData.info.width : 0),
		fixed_16_16(trackData.type === "video" ? trackData.info.height : 0)
	]);
};
/** Edit Box: Specifies edits to the track's media. */
const edts = (trackData, offset) => {
	const startOffset = intoTimescale(offset, GLOBAL_TIMESCALE);
	const mediaDuration = intoTimescale(presentationSpan(trackData), GLOBAL_TIMESCALE);
	const needs64Bits = !isU32(startOffset) || !isU32(mediaDuration);
	const u32OrU64 = needs64Bits ? u64 : u32;
	const i32OrI64 = needs64Bits ? i64 : i32;
	return box("edts", void 0, [fullBox("elst", needs64Bits ? 1 : 0, 0, [
		u32(2),
		u32OrU64(startOffset),
		i32OrI64(-1),
		fixed_16_16(1),
		u32OrU64(mediaDuration),
		i32OrI64(0),
		fixed_16_16(1)
	])]);
};
/** Media Box: Describes and define a track's media type and sample data. */
const mdia = (trackData, creationTime) => box("mdia", void 0, [
	mdhd(trackData, creationTime),
	hdlr(true, TRACK_TYPE_TO_COMPONENT_SUBTYPE[trackData.type], TRACK_TYPE_TO_HANDLER_NAME[trackData.type]),
	minf(trackData)
]);
/** Media Header Box: Specifies the characteristics of a media, including timescale and duration. */
const mdhd = (trackData, creationTime) => {
	const localDuration = intoTimescale(presentationSpan(trackData), trackData.timescale);
	const needsU64 = !isU32(creationTime) || !isU32(localDuration);
	const u32OrU64 = needsU64 ? u64 : u32;
	return fullBox("mdhd", +needsU64, 0, [
		u32OrU64(creationTime),
		u32OrU64(creationTime),
		u32(trackData.timescale),
		u32OrU64(localDuration),
		u16(getLanguageCodeInt(trackData.track.metadata.languageCode ?? "und")),
		u16(0)
	]);
};
const TRACK_TYPE_TO_COMPONENT_SUBTYPE = {
	video: "vide",
	audio: "soun",
	subtitle: "text"
};
const TRACK_TYPE_TO_HANDLER_NAME = {
	video: "MediabunnyVideoHandler",
	audio: "MediabunnySoundHandler",
	subtitle: "MediabunnyTextHandler"
};
/** Handler Reference Box. */
const hdlr = (hasComponentType, handlerType, name, manufacturer = "\\0\\0\\0\\0") => fullBox("hdlr", 0, 0, [
	hasComponentType ? ascii("mhlr") : u32(0),
	ascii(handlerType),
	ascii(manufacturer),
	u32(0),
	u32(0),
	ascii(name, true)
]);
/**
* Media Information Box: Stores handler-specific information for a track's media data. The media handler uses this
* information to map from media time to media data and to process the media data.
*/
const minf = (trackData) => box("minf", void 0, [
	TRACK_TYPE_TO_HEADER_BOX[trackData.type](),
	dinf(),
	stbl(trackData)
]);
/** Video Media Information Header Box: Defines specific color and graphics mode information. */
const vmhd = () => fullBox("vmhd", 0, 1, [
	u16(0),
	u16(0),
	u16(0),
	u16(0)
]);
/** Sound Media Information Header Box: Stores the sound media's control information, such as balance. */
const smhd = () => fullBox("smhd", 0, 0, [u16(0), u16(0)]);
/** Null Media Header Box. */
const nmhd = () => fullBox("nmhd", 0, 0);
const TRACK_TYPE_TO_HEADER_BOX = {
	video: vmhd,
	audio: smhd,
	subtitle: nmhd
};
/**
* Data Information Box: Contains information specifying the data handler component that provides access to the
* media data. The data handler component uses the Data Information Box to interpret the media's data.
*/
const dinf = () => box("dinf", void 0, [dref()]);
/**
* Data Reference Box: Contains tabular data that instructs the data handler component how to access the media's data.
*/
const dref = () => fullBox("dref", 0, 0, [u32(1)], [url()]);
const url = () => fullBox("url ", 0, 1);
/**
* Sample Table Box: Contains information for converting from media time to sample number to sample location. This box
* also indicates how to interpret the sample (for example, whether to decompress the video data and, if so, how).
*/
const stbl = (trackData) => {
	const needsCtts = trackData.compositionTimeOffsetTable.length > 1 || trackData.compositionTimeOffsetTable.some((x) => x.sampleCompositionTimeOffset !== 0);
	return box("stbl", void 0, [
		stsd(trackData),
		stts(trackData),
		needsCtts ? ctts(trackData) : null,
		needsCtts ? cslg(trackData) : null,
		stsc(trackData),
		stsz(trackData),
		stco(trackData),
		stss(trackData)
	]);
};
/**
* Sample Description Box: Stores information that allows you to decode samples in the media. The data stored in the
* sample description varies, depending on the media type.
*/
const stsd = (trackData) => {
	let sampleDescription;
	if (trackData.type === "video") sampleDescription = videoSampleDescription(videoCodecToBoxName(trackData.track.source._codec, trackData.info.decoderConfig.codec), trackData);
	else if (trackData.type === "audio") {
		const boxName = audioCodecToBoxName(trackData.track.source._codec, trackData.muxer.isQuickTime);
		assert(boxName);
		sampleDescription = soundSampleDescription(boxName, trackData);
	} else if (trackData.type === "subtitle") sampleDescription = subtitleSampleDescription(SUBTITLE_CODEC_TO_BOX_NAME[trackData.track.source._codec], trackData);
	assert(sampleDescription);
	return fullBox("stsd", 0, 0, [u32(1)], [sampleDescription]);
};
/** Video Sample Description Box: Contains information that defines how to interpret video media data. */
const videoSampleDescription = (compressionType, trackData) => box(compressionType, [
	Array(6).fill(0),
	u16(1),
	u16(0),
	u16(0),
	Array(12).fill(0),
	u16(trackData.info.width),
	u16(trackData.info.height),
	u32(4718592),
	u32(4718592),
	u32(0),
	u16(1),
	Array(32).fill(0),
	u16(24),
	i16(65535)
], [
	VIDEO_CODEC_TO_CONFIGURATION_BOX[trackData.track.source._codec](trackData),
	pasp(trackData),
	colorSpaceIsComplete(trackData.info.decoderConfig.colorSpace) ? colr(trackData) : null
]);
/** Pixel Aspect Ratio Box: Specifies pixel width:height spacing for non-square pixels. */
const pasp = (trackData) => {
	if (trackData.info.pixelAspectRatio.num === trackData.info.pixelAspectRatio.den) return null;
	return box("pasp", [u32(trackData.info.pixelAspectRatio.num), u32(trackData.info.pixelAspectRatio.den)]);
};
/** Colour Information Box: Specifies the color space of the video. */
const colr = (trackData) => box("colr", [
	ascii(trackData.muxer.isQuickTime ? "nclc" : "nclx"),
	u16(COLOR_PRIMARIES_MAP[trackData.info.decoderConfig.colorSpace.primaries]),
	u16(TRANSFER_CHARACTERISTICS_MAP[trackData.info.decoderConfig.colorSpace.transfer]),
	u16(MATRIX_COEFFICIENTS_MAP[trackData.info.decoderConfig.colorSpace.matrix]),
	trackData.muxer.isQuickTime ? [] : u8((trackData.info.decoderConfig.colorSpace.fullRange ? 1 : 0) << 7)
]);
/** AVC Configuration Box: Provides additional information to the decoder. */
const avcC = (trackData) => trackData.info.decoderConfig && box("avcC", [...toUint8Array(trackData.info.decoderConfig.description)]);
/** HEVC Configuration Box: Provides additional information to the decoder. */
const hvcC = (trackData) => trackData.info.decoderConfig && box("hvcC", [...toUint8Array(trackData.info.decoderConfig.description)]);
/** VP Configuration Box: Provides additional information to the decoder. */
const vpcC = (trackData) => {
	if (!trackData.info.decoderConfig) return null;
	const decoderConfig = trackData.info.decoderConfig;
	const parts = decoderConfig.codec.split(".");
	const profile = Number(parts[1]);
	const level = Number(parts[2]);
	const bitDepth = Number(parts[3]);
	const chromaSubsampling = parts[4] ? Number(parts[4]) : 1;
	const videoFullRangeFlag = parts[8] ? Number(parts[8]) : Number(decoderConfig.colorSpace?.fullRange ?? 0);
	const thirdByte = (bitDepth << 4) + (chromaSubsampling << 1) + videoFullRangeFlag;
	const colourPrimaries = parts[5] ? Number(parts[5]) : decoderConfig.colorSpace?.primaries ? COLOR_PRIMARIES_MAP[decoderConfig.colorSpace.primaries] : 2;
	const transferCharacteristics = parts[6] ? Number(parts[6]) : decoderConfig.colorSpace?.transfer ? TRANSFER_CHARACTERISTICS_MAP[decoderConfig.colorSpace.transfer] : 2;
	const matrixCoefficients = parts[7] ? Number(parts[7]) : decoderConfig.colorSpace?.matrix ? MATRIX_COEFFICIENTS_MAP[decoderConfig.colorSpace.matrix] : 2;
	return fullBox("vpcC", 1, 0, [
		u8(profile),
		u8(level),
		u8(thirdByte),
		u8(colourPrimaries),
		u8(transferCharacteristics),
		u8(matrixCoefficients),
		u16(0)
	]);
};
/** AV1 Configuration Box: Provides additional information to the decoder. */
const av1C = (trackData) => {
	return box("av1C", generateAv1CodecConfigurationFromCodecString(trackData.info.decoderConfig.codec));
};
/** Sound Sample Description Box: Contains information that defines how to interpret sound media data. */
const soundSampleDescription = (compressionType, trackData) => {
	let version = 0;
	let contents;
	let sampleSizeInBits = 16;
	const isPcmCodec = PCM_AUDIO_CODECS.includes(trackData.track.source._codec);
	if (isPcmCodec) {
		const codec = trackData.track.source._codec;
		const { sampleSize } = parsePcmCodec(codec);
		sampleSizeInBits = 8 * sampleSize;
		if (sampleSizeInBits > 16) version = 1;
	}
	if (trackData.muxer.isQuickTime) version = 1;
	if (version === 0) contents = [
		Array(6).fill(0),
		u16(1),
		u16(version),
		u16(0),
		u32(0),
		u16(trackData.info.numberOfChannels),
		u16(sampleSizeInBits),
		u16(0),
		u16(0),
		u16(trackData.info.sampleRate < 2 ** 16 ? trackData.info.sampleRate : 0),
		u16(0)
	];
	else {
		const compressionId = isPcmCodec ? 0 : -2;
		contents = [
			Array(6).fill(0),
			u16(1),
			u16(version),
			u16(0),
			u32(0),
			u16(trackData.info.numberOfChannels),
			u16(Math.min(sampleSizeInBits, 16)),
			i16(compressionId),
			u16(0),
			u16(trackData.info.sampleRate < 2 ** 16 ? trackData.info.sampleRate : 0),
			u16(0),
			isPcmCodec ? [
				u32(1),
				u32(sampleSizeInBits / 8),
				u32(trackData.info.numberOfChannels * sampleSizeInBits / 8)
			] : [
				u32(0),
				u32(0),
				u32(0)
			],
			u32(2)
		];
	}
	return box(compressionType, contents, [audioCodecToConfigurationBox(trackData.track.source._codec, trackData.muxer.isQuickTime)?.(trackData) ?? null]);
};
/** MPEG-4 Elementary Stream Descriptor Box. */
const esds = (trackData) => {
	let objectTypeIndication;
	switch (trackData.track.source._codec) {
		case "aac":
			objectTypeIndication = 64;
			break;
		case "mp3":
			objectTypeIndication = 107;
			break;
		case "vorbis":
			objectTypeIndication = 221;
			break;
		default: throw new Error(\`Unhandled audio codec: \${trackData.track.source._codec}\`);
	}
	let bytes = [
		...u8(objectTypeIndication),
		...u8(21),
		...u24(0),
		...u32(0),
		...u32(0)
	];
	if (trackData.info.decoderConfig.description) {
		const description = toUint8Array(trackData.info.decoderConfig.description);
		bytes = [
			...bytes,
			...u8(5),
			...variableUnsignedInt(description.byteLength),
			...description
		];
	}
	bytes = [
		...u16(1),
		...u8(0),
		...u8(4),
		...variableUnsignedInt(bytes.length),
		...bytes,
		...u8(6),
		...u8(1),
		...u8(2)
	];
	bytes = [
		...u8(3),
		...variableUnsignedInt(bytes.length),
		...bytes
	];
	return fullBox("esds", 0, 0, bytes);
};
const wave = (trackData) => {
	return box("wave", void 0, [
		frma(trackData),
		enda(trackData),
		box("\\0\\0\\0\\0")
	]);
};
const frma = (trackData) => {
	return box("frma", [ascii(audioCodecToBoxName(trackData.track.source._codec, trackData.muxer.isQuickTime))]);
};
const enda = (trackData) => {
	const { littleEndian } = parsePcmCodec(trackData.track.source._codec);
	return box("enda", [u16(+littleEndian)]);
};
/** Opus Specific Box. */
const dOps = (trackData) => {
	let outputChannelCount = trackData.info.numberOfChannels;
	let preSkip = 3840;
	let inputSampleRate = trackData.info.sampleRate;
	let outputGain = 0;
	let channelMappingFamily = 0;
	let channelMappingTable = /* @__PURE__ */ new Uint8Array(0);
	const description = trackData.info.decoderConfig?.description;
	if (description) {
		assert(description.byteLength >= 18);
		const bytes = toUint8Array(description);
		const header = parseOpusIdentificationHeader(bytes);
		outputChannelCount = header.outputChannelCount;
		preSkip = header.preSkip;
		inputSampleRate = header.inputSampleRate;
		outputGain = header.outputGain;
		channelMappingFamily = header.channelMappingFamily;
		if (header.channelMappingTable) channelMappingTable = header.channelMappingTable;
	}
	return box("dOps", [
		u8(0),
		u8(outputChannelCount),
		u16(preSkip),
		u32(inputSampleRate),
		i16(outputGain),
		u8(channelMappingFamily),
		...channelMappingTable
	]);
};
/** FLAC specific box. */
const dfLa = (trackData) => {
	const description = trackData.info.decoderConfig?.description;
	assert(description);
	const bytes = toUint8Array(description);
	return fullBox("dfLa", 0, 0, [...bytes.subarray(4)]);
};
/** PCM Configuration Box, ISO/IEC 23003-5. */
const pcmC = (trackData) => {
	const { littleEndian, sampleSize } = parsePcmCodec(trackData.track.source._codec);
	const formatFlags = +littleEndian;
	return fullBox("pcmC", 0, 0, [u8(formatFlags), u8(8 * sampleSize)]);
};
/** AC3SpecificBox */
const dac3 = (trackData) => {
	const frameInfo = parseAc3SyncFrame(trackData.info.firstPacket.data);
	if (!frameInfo) throw new Error("Couldn't extract AC-3 frame info from the audio packet. Ensure the packets contain valid AC-3 sync frames (as specified in ETSI TS 102 366).");
	const bytes = /* @__PURE__ */ new Uint8Array(3);
	const bitstream = new Bitstream(bytes);
	bitstream.writeBits(2, frameInfo.fscod);
	bitstream.writeBits(5, frameInfo.bsid);
	bitstream.writeBits(3, frameInfo.bsmod);
	bitstream.writeBits(3, frameInfo.acmod);
	bitstream.writeBits(1, frameInfo.lfeon);
	bitstream.writeBits(5, frameInfo.bitRateCode);
	bitstream.writeBits(5, 0);
	return box("dac3", [...bytes]);
};
/** EC3SpecificBox */
const dec3 = (trackData) => {
	const frameInfo = parseEac3SyncFrame(trackData.info.firstPacket.data);
	if (!frameInfo) throw new Error("Couldn't extract E-AC-3 frame info from the audio packet. Ensure the packets contain valid E-AC-3 sync frames (as specified in ETSI TS 102 366).");
	let totalBits = 16;
	for (const sub of frameInfo.substreams) {
		totalBits += 23;
		if (sub.numDepSub > 0) totalBits += 9;
		else totalBits += 1;
	}
	const size = Math.ceil(totalBits / 8);
	const bytes = new Uint8Array(size);
	const bitstream = new Bitstream(bytes);
	bitstream.writeBits(13, frameInfo.dataRate);
	bitstream.writeBits(3, frameInfo.substreams.length - 1);
	for (const sub of frameInfo.substreams) {
		bitstream.writeBits(2, sub.fscod);
		bitstream.writeBits(5, sub.bsid);
		bitstream.writeBits(1, 0);
		bitstream.writeBits(1, 0);
		bitstream.writeBits(3, sub.bsmod);
		bitstream.writeBits(3, sub.acmod);
		bitstream.writeBits(1, sub.lfeon);
		bitstream.writeBits(3, 0);
		bitstream.writeBits(4, sub.numDepSub);
		if (sub.numDepSub > 0) bitstream.writeBits(9, sub.chanLoc);
		else bitstream.writeBits(1, 0);
	}
	return box("dec3", [...bytes]);
};
const subtitleSampleDescription = (compressionType, trackData) => box(compressionType, [Array(6).fill(0), u16(1)], [SUBTITLE_CODEC_TO_CONFIGURATION_BOX[trackData.track.source._codec](trackData)]);
const vttC = (trackData) => box("vttC", [...textEncoder.encode(trackData.info.config.description)]);
/**
* Time-To-Sample Box: Stores duration information for a media's samples, providing a mapping from a time in a media
* to the corresponding data sample. The table is compact, meaning that consecutive samples with the same time delta
* will be grouped.
*/
const stts = (trackData) => {
	return fullBox("stts", 0, 0, [u32(trackData.timeToSampleTable.length), trackData.timeToSampleTable.map((x) => [u32(x.sampleCount), u32(x.sampleDelta)])]);
};
/** Sync Sample Box: Identifies the key frames in the media, marking the random access points within a stream. */
const stss = (trackData) => {
	if (trackData.samples.every((x) => x.type === "key")) return null;
	const keySamples = [...trackData.samples.entries()].filter(([, sample]) => sample.type === "key");
	return fullBox("stss", 0, 0, [u32(keySamples.length), keySamples.map(([index]) => u32(index + 1))]);
};
/**
* Sample-To-Chunk Box: As samples are added to a media, they are collected into chunks that allow optimized data
* access. A chunk contains one or more samples. Chunks in a media may have different sizes, and the samples within a
* chunk may have different sizes. The Sample-To-Chunk Box stores chunk information for the samples in a media, stored
* in a compactly-coded fashion.
*/
const stsc = (trackData) => {
	return fullBox("stsc", 0, 0, [u32(trackData.compactlyCodedChunkTable.length), trackData.compactlyCodedChunkTable.map((x) => [
		u32(x.firstChunk),
		u32(x.samplesPerChunk),
		u32(1)
	])]);
};
/** Sample Size Box: Specifies the byte size of each sample in the media. */
const stsz = (trackData) => {
	if (trackData.type === "audio" && trackData.info.requiresPcmTransformation) {
		const { sampleSize } = parsePcmCodec(trackData.track.source._codec);
		return fullBox("stsz", 0, 0, [u32(sampleSize * trackData.info.numberOfChannels), u32(trackData.samples.reduce((acc, x) => acc + intoTimescale(x.duration, trackData.timescale), 0))]);
	}
	return fullBox("stsz", 0, 0, [
		u32(0),
		u32(trackData.samples.length),
		trackData.samples.map((x) => u32(x.size))
	]);
};
/** Chunk Offset Box: Identifies the location of each chunk of data in the media's data stream, relative to the file. */
const stco = (trackData) => {
	if (trackData.finalizedChunks.length > 0 && last(trackData.finalizedChunks).offset >= 2 ** 32) return fullBox("co64", 0, 0, [u32(trackData.finalizedChunks.length), trackData.finalizedChunks.map((x) => u64(x.offset))]);
	return fullBox("stco", 0, 0, [u32(trackData.finalizedChunks.length), trackData.finalizedChunks.map((x) => u32(x.offset))]);
};
/**
* Composition Time to Sample Box: Stores composition time offset information (PTS-DTS) for a
* media's samples. The table is compact, meaning that consecutive samples with the same time
* composition time offset will be grouped.
*/
const ctts = (trackData) => {
	return fullBox("ctts", 1, 0, [u32(trackData.compositionTimeOffsetTable.length), trackData.compositionTimeOffsetTable.map((x) => [u32(x.sampleCount), i32(x.sampleCompositionTimeOffset)])]);
};
/**
* Composition to Decode Box: Stores information about the composition and display times of the media samples.
*/
const cslg = (trackData) => {
	let leastDecodeToDisplayDelta = Infinity;
	let greatestDecodeToDisplayDelta = -Infinity;
	let compositionStartTime = Infinity;
	let compositionEndTime = -Infinity;
	assert(trackData.compositionTimeOffsetTable.length > 0);
	assert(trackData.samples.length > 0);
	for (let i = 0; i < trackData.compositionTimeOffsetTable.length; i++) {
		const entry = trackData.compositionTimeOffsetTable[i];
		leastDecodeToDisplayDelta = Math.min(leastDecodeToDisplayDelta, entry.sampleCompositionTimeOffset);
		greatestDecodeToDisplayDelta = Math.max(greatestDecodeToDisplayDelta, entry.sampleCompositionTimeOffset);
	}
	for (let i = 0; i < trackData.samples.length; i++) {
		const sample = trackData.samples[i];
		compositionStartTime = Math.min(compositionStartTime, intoTimescale(sample.timestamp, trackData.timescale));
		compositionEndTime = Math.max(compositionEndTime, intoTimescale(sample.timestamp + sample.duration, trackData.timescale));
	}
	const compositionToDtsShift = Math.max(-leastDecodeToDisplayDelta, 0);
	if (compositionEndTime >= 2 ** 31) return null;
	return fullBox("cslg", 0, 0, [
		i32(compositionToDtsShift),
		i32(leastDecodeToDisplayDelta),
		i32(greatestDecodeToDisplayDelta),
		i32(compositionStartTime),
		i32(compositionEndTime)
	]);
};
/**
* Movie Extends Box: This box signals to readers that the file is fragmented. Contains a single Track Extends Box
* for each track in the movie.
*/
const mvex = (trackDatas) => {
	return box("mvex", void 0, trackDatas.map(trex));
};
/** Track Extends Box: Contains the default values used by the movie fragments. */
const trex = (trackData) => {
	return fullBox("trex", 0, 0, [
		u32(trackData.track.id),
		u32(1),
		u32(0),
		u32(0),
		u32(0)
	]);
};
/**
* Movie Fragment Box: The movie fragments extend the presentation in time. They provide the information that would
* previously have been	in the Movie Box.
*/
const moof = (sequenceNumber, trackDatas) => {
	return box("moof", void 0, [mfhd(sequenceNumber), ...trackDatas.map(traf)]);
};
/** Movie Fragment Header Box: Contains a sequence number as a safety check. */
const mfhd = (sequenceNumber) => {
	return fullBox("mfhd", 0, 0, [u32(sequenceNumber)]);
};
const fragmentSampleFlags = (sample) => {
	let byte1 = 0;
	let byte2 = 0;
	const sampleIsDifferenceSample = sample.type === "delta";
	byte2 |= +sampleIsDifferenceSample;
	if (sampleIsDifferenceSample) byte1 |= 1;
	else byte1 |= 2;
	return byte1 << 24 | byte2 << 16 | 0;
};
/** Track Fragment Box */
const traf = (trackData) => {
	return box("traf", void 0, [
		tfhd(trackData),
		tfdt(trackData),
		trun(trackData)
	]);
};
/** Track Fragment Header Box: Provides a reference to the extended track, and flags. */
const tfhd = (trackData) => {
	assert(trackData.currentChunk);
	let tfFlags = 0;
	tfFlags |= 8;
	tfFlags |= 16;
	tfFlags |= 32;
	tfFlags |= 131072;
	const referenceSample = trackData.currentChunk.samples[1] ?? trackData.currentChunk.samples[0];
	const referenceSampleInfo = {
		duration: referenceSample.timescaleUnitsToNextSample,
		size: referenceSample.size,
		flags: fragmentSampleFlags(referenceSample)
	};
	return fullBox("tfhd", 0, tfFlags, [
		u32(trackData.track.id),
		u32(referenceSampleInfo.duration),
		u32(referenceSampleInfo.size),
		u32(referenceSampleInfo.flags)
	]);
};
/**
* Track Fragment Decode Time Box: Provides the absolute decode time of the first sample of the fragment. This is
* useful for performing random access on the media file.
*/
const tfdt = (trackData) => {
	assert(trackData.currentChunk);
	return fullBox("tfdt", 1, 0, [u64(intoTimescale(trackData.currentChunk.startTimestamp, trackData.timescale))]);
};
/** Track Run Box: Specifies a run of contiguous samples for a given track. */
const trun = (trackData) => {
	assert(trackData.currentChunk);
	const allSampleDurations = trackData.currentChunk.samples.map((x) => x.timescaleUnitsToNextSample);
	const allSampleSizes = trackData.currentChunk.samples.map((x) => x.size);
	const allSampleFlags = trackData.currentChunk.samples.map(fragmentSampleFlags);
	const allSampleCompositionTimeOffsets = trackData.currentChunk.samples.map((x) => intoTimescale(x.timestamp - x.decodeTimestamp, trackData.timescale));
	const uniqueSampleDurations = new Set(allSampleDurations);
	const uniqueSampleSizes = new Set(allSampleSizes);
	const uniqueSampleFlags = new Set(allSampleFlags);
	const uniqueSampleCompositionTimeOffsets = new Set(allSampleCompositionTimeOffsets);
	const firstSampleFlagsPresent = uniqueSampleFlags.size === 2 && allSampleFlags[0] !== allSampleFlags[1];
	const sampleDurationPresent = uniqueSampleDurations.size > 1;
	const sampleSizePresent = uniqueSampleSizes.size > 1;
	const sampleFlagsPresent = !firstSampleFlagsPresent && uniqueSampleFlags.size > 1;
	const sampleCompositionTimeOffsetsPresent = uniqueSampleCompositionTimeOffsets.size > 1 || [...uniqueSampleCompositionTimeOffsets].some((x) => x !== 0);
	let flags = 0;
	flags |= 1;
	flags |= 4 * +firstSampleFlagsPresent;
	flags |= 256 * +sampleDurationPresent;
	flags |= 512 * +sampleSizePresent;
	flags |= 1024 * +sampleFlagsPresent;
	flags |= 2048 * +sampleCompositionTimeOffsetsPresent;
	return fullBox("trun", 1, flags, [
		u32(trackData.currentChunk.samples.length),
		u32(trackData.currentChunk.offset - trackData.currentChunk.moofOffset || 0),
		firstSampleFlagsPresent ? u32(allSampleFlags[0]) : [],
		trackData.currentChunk.samples.map((_, i) => [
			sampleDurationPresent ? u32(allSampleDurations[i]) : [],
			sampleSizePresent ? u32(allSampleSizes[i]) : [],
			sampleFlagsPresent ? u32(allSampleFlags[i]) : [],
			sampleCompositionTimeOffsetsPresent ? i32(allSampleCompositionTimeOffsets[i]) : []
		])
	]);
};
/**
* Movie Fragment Random Access Box: For each track, provides pointers to sync samples within the file
* for random access.
*/
const mfra = (trackDatas) => {
	return box("mfra", void 0, [...trackDatas.map(tfra), mfro()]);
};
/** Track Fragment Random Access Box: Provides pointers to sync samples within the file for random access. */
const tfra = (trackData, trackIndex) => {
	return fullBox("tfra", 1, 0, [
		u32(trackData.track.id),
		u32(63),
		u32(trackData.finalizedChunks.length),
		trackData.finalizedChunks.map((chunk) => [
			u64(intoTimescale(chunk.samples[0].timestamp, trackData.timescale)),
			u64(chunk.moofOffset),
			u32(trackIndex + 1),
			u32(1),
			u32(1)
		])
	]);
};
/**
* Movie Fragment Random Access Offset Box: Provides the size of the enclosing mfra box. This box can be used by readers
* to quickly locate the mfra box by searching from the end of the file.
*/
const mfro = () => {
	return fullBox("mfro", 0, 0, [u32(0)]);
};
/** VTT Empty Cue Box */
const vtte = () => box("vtte");
/** VTT Cue Box */
const vttc = (payload, timestamp, identifier, settings, sourceId) => box("vttc", void 0, [
	sourceId !== null ? box("vsid", [i32(sourceId)]) : null,
	identifier !== null ? box("iden", [...textEncoder.encode(identifier)]) : null,
	timestamp !== null ? box("ctim", [...textEncoder.encode(formatSubtitleTimestamp(timestamp))]) : null,
	settings !== null ? box("sttg", [...textEncoder.encode(settings)]) : null,
	box("payl", [...textEncoder.encode(payload)])
]);
/** VTT Additional Text Box */
const vtta = (notes) => box("vtta", [...textEncoder.encode(notes)]);
/** User Data Box */
const udta = (muxer) => {
	const boxes = [];
	const metadataFormat = muxer.format._options.metadataFormat ?? "auto";
	const metadataTags = muxer.output._metadataTags;
	if (metadataFormat === "mdir" || metadataFormat === "auto" && !muxer.isQuickTime) {
		const metaBox = metaMdir(metadataTags);
		if (metaBox) boxes.push(metaBox);
	} else if (metadataFormat === "mdta") {
		const metaBox = metaMdta(metadataTags);
		if (metaBox) boxes.push(metaBox);
	} else if (metadataFormat === "udta" || metadataFormat === "auto" && muxer.isQuickTime) addQuickTimeMetadataTagBoxes(boxes, muxer.output._metadataTags);
	if (boxes.length === 0) return null;
	return box("udta", void 0, boxes);
};
const addQuickTimeMetadataTagBoxes = (boxes, tags) => {
	for (const { key, value } of keyValueIterator(tags)) switch (key) {
		case "title":
			boxes.push(metadataTagStringBoxShort("©nam", value));
			break;
		case "description":
			boxes.push(metadataTagStringBoxShort("©des", value));
			break;
		case "artist":
			boxes.push(metadataTagStringBoxShort("©ART", value));
			break;
		case "album":
			boxes.push(metadataTagStringBoxShort("©alb", value));
			break;
		case "albumArtist":
			boxes.push(metadataTagStringBoxShort("albr", value));
			break;
		case "genre":
			boxes.push(metadataTagStringBoxShort("©gen", value));
			break;
		case "date":
			boxes.push(metadataTagStringBoxShort("©day", value.toISOString().slice(0, 10)));
			break;
		case "comment":
			boxes.push(metadataTagStringBoxShort("©cmt", value));
			break;
		case "lyrics":
			boxes.push(metadataTagStringBoxShort("©lyr", value));
			break;
		case "raw": break;
		case "discNumber":
		case "discsTotal":
		case "trackNumber":
		case "tracksTotal":
		case "images": break;
		default: assertNever(key);
	}
	if (tags.raw) for (const key in tags.raw) {
		const value = tags.raw[key];
		if (value == null || key.length !== 4 || boxes.some((x) => x.type === key)) continue;
		if (typeof value === "string") boxes.push(metadataTagStringBoxShort(key, value));
		else if (value instanceof Uint8Array) boxes.push(box(key, Array.from(value)));
	}
};
const metadataTagStringBoxShort = (name, value) => {
	const encoded = textEncoder.encode(value);
	return box(name, [
		u16(encoded.length),
		u16(getLanguageCodeInt("und")),
		Array.from(encoded)
	]);
};
const DATA_BOX_MIME_TYPE_MAP = {
	"image/jpeg": 13,
	"image/png": 14,
	"image/bmp": 27
};
/**
* Generates key-value metadata for inclusion in the "meta" box.
*/
const generateMetadataPairs = (tags, isMdta) => {
	const pairs = [];
	for (const { key, value } of keyValueIterator(tags)) switch (key) {
		case "title":
			pairs.push({
				key: isMdta ? "title" : "©nam",
				value: dataStringBoxLong(value)
			});
			break;
		case "description":
			pairs.push({
				key: isMdta ? "description" : "©des",
				value: dataStringBoxLong(value)
			});
			break;
		case "artist":
			pairs.push({
				key: isMdta ? "artist" : "©ART",
				value: dataStringBoxLong(value)
			});
			break;
		case "album":
			pairs.push({
				key: isMdta ? "album" : "©alb",
				value: dataStringBoxLong(value)
			});
			break;
		case "albumArtist":
			pairs.push({
				key: isMdta ? "album_artist" : "aART",
				value: dataStringBoxLong(value)
			});
			break;
		case "comment":
			pairs.push({
				key: isMdta ? "comment" : "©cmt",
				value: dataStringBoxLong(value)
			});
			break;
		case "genre":
			pairs.push({
				key: isMdta ? "genre" : "©gen",
				value: dataStringBoxLong(value)
			});
			break;
		case "lyrics":
			pairs.push({
				key: isMdta ? "lyrics" : "©lyr",
				value: dataStringBoxLong(value)
			});
			break;
		case "date":
			pairs.push({
				key: isMdta ? "date" : "©day",
				value: dataStringBoxLong(value.toISOString().slice(0, 10))
			});
			break;
		case "images":
			for (const image of value) {
				if (image.kind !== "coverFront") continue;
				pairs.push({
					key: "covr",
					value: box("data", [
						u32(DATA_BOX_MIME_TYPE_MAP[image.mimeType] ?? 0),
						u32(0),
						Array.from(image.data)
					])
				});
			}
			break;
		case "trackNumber":
			if (isMdta) {
				const string = tags.tracksTotal !== void 0 ? \`\${value}/\${tags.tracksTotal}\` : value.toString();
				pairs.push({
					key: "track",
					value: dataStringBoxLong(string)
				});
			} else pairs.push({
				key: "trkn",
				value: box("data", [
					u32(0),
					u32(0),
					u16(0),
					u16(value),
					u16(tags.tracksTotal ?? 0),
					u16(0)
				])
			});
			break;
		case "discNumber":
			if (!isMdta) pairs.push({
				key: "disc",
				value: box("data", [
					u32(0),
					u32(0),
					u16(0),
					u16(value),
					u16(tags.discsTotal ?? 0),
					u16(0)
				])
			});
			break;
		case "tracksTotal":
		case "discsTotal": break;
		case "raw": break;
		default: assertNever(key);
	}
	if (tags.raw) for (const key in tags.raw) {
		const value = tags.raw[key];
		if (value == null || !isMdta && key.length !== 4 || pairs.some((x) => x.key === key)) continue;
		if (typeof value === "string") pairs.push({
			key,
			value: dataStringBoxLong(value)
		});
		else if (value instanceof Uint8Array) pairs.push({
			key,
			value: box("data", [
				u32(0),
				u32(0),
				Array.from(value)
			])
		});
		else if (value instanceof RichImageData) pairs.push({
			key,
			value: box("data", [
				u32(DATA_BOX_MIME_TYPE_MAP[value.mimeType] ?? 0),
				u32(0),
				Array.from(value.data)
			])
		});
	}
	return pairs;
};
/** Metadata Box (mdir format) */
const metaMdir = (tags) => {
	const pairs = generateMetadataPairs(tags, false);
	if (pairs.length === 0) return null;
	return fullBox("meta", 0, 0, void 0, [hdlr(false, "mdir", "", "appl"), box("ilst", void 0, pairs.map((pair) => box(pair.key, void 0, [pair.value])))]);
};
/** Metadata Box (mdta format with keys box) */
const metaMdta = (tags) => {
	const pairs = generateMetadataPairs(tags, true);
	if (pairs.length === 0) return null;
	return box("meta", void 0, [
		hdlr(false, "mdta", ""),
		fullBox("keys", 0, 0, [u32(pairs.length)], pairs.map((pair) => box("mdta", [...textEncoder.encode(pair.key)]))),
		box("ilst", void 0, pairs.map((pair, i) => {
			const boxName = String.fromCharCode(...u32(i + 1));
			return box(boxName, void 0, [pair.value]);
		}))
	]);
};
const dataStringBoxLong = (value) => {
	return box("data", [
		u32(1),
		u32(0),
		...textEncoder.encode(value)
	]);
};
const videoCodecToBoxName = (codec, fullCodecString) => {
	switch (codec) {
		case "avc": return fullCodecString.startsWith("avc3") ? "avc3" : "avc1";
		case "hevc": return "hvc1";
		case "vp8": return "vp08";
		case "vp9": return "vp09";
		case "av1": return "av01";
	}
};
const VIDEO_CODEC_TO_CONFIGURATION_BOX = {
	avc: avcC,
	hevc: hvcC,
	vp8: vpcC,
	vp9: vpcC,
	av1: av1C
};
const audioCodecToBoxName = (codec, isQuickTime) => {
	switch (codec) {
		case "aac": return "mp4a";
		case "mp3": return "mp4a";
		case "opus": return "Opus";
		case "vorbis": return "mp4a";
		case "flac": return "fLaC";
		case "ulaw": return "ulaw";
		case "alaw": return "alaw";
		case "pcm-u8": return "raw ";
		case "pcm-s8": return "sowt";
		case "ac3": return "ac-3";
		case "eac3": return "ec-3";
	}
	if (isQuickTime) switch (codec) {
		case "pcm-s16": return "sowt";
		case "pcm-s16be": return "twos";
		case "pcm-s24": return "in24";
		case "pcm-s24be": return "in24";
		case "pcm-s32": return "in32";
		case "pcm-s32be": return "in32";
		case "pcm-f32": return "fl32";
		case "pcm-f32be": return "fl32";
		case "pcm-f64": return "fl64";
		case "pcm-f64be": return "fl64";
	}
	else switch (codec) {
		case "pcm-s16": return "ipcm";
		case "pcm-s16be": return "ipcm";
		case "pcm-s24": return "ipcm";
		case "pcm-s24be": return "ipcm";
		case "pcm-s32": return "ipcm";
		case "pcm-s32be": return "ipcm";
		case "pcm-f32": return "fpcm";
		case "pcm-f32be": return "fpcm";
		case "pcm-f64": return "fpcm";
		case "pcm-f64be": return "fpcm";
	}
};
const audioCodecToConfigurationBox = (codec, isQuickTime) => {
	switch (codec) {
		case "aac": return esds;
		case "mp3": return esds;
		case "opus": return dOps;
		case "vorbis": return esds;
		case "flac": return dfLa;
		case "ac3": return dac3;
		case "eac3": return dec3;
	}
	if (isQuickTime) switch (codec) {
		case "pcm-s24": return wave;
		case "pcm-s24be": return wave;
		case "pcm-s32": return wave;
		case "pcm-s32be": return wave;
		case "pcm-f32": return wave;
		case "pcm-f32be": return wave;
		case "pcm-f64": return wave;
		case "pcm-f64be": return wave;
	}
	else switch (codec) {
		case "pcm-s16": return pcmC;
		case "pcm-s16be": return pcmC;
		case "pcm-s24": return pcmC;
		case "pcm-s24be": return pcmC;
		case "pcm-s32": return pcmC;
		case "pcm-s32be": return pcmC;
		case "pcm-f32": return pcmC;
		case "pcm-f32be": return pcmC;
		case "pcm-f64": return pcmC;
		case "pcm-f64be": return pcmC;
	}
	return null;
};
const SUBTITLE_CODEC_TO_BOX_NAME = { webvtt: "wvtt" };
const SUBTITLE_CODEC_TO_CONFIGURATION_BOX = { webvtt: vttC };
const getLanguageCodeInt = (code) => {
	assert(code.length === 3);
	let language = 0;
	for (let i = 0; i < 3; i++) {
		language <<= 5;
		language += code.charCodeAt(i) - 96;
	}
	return language;
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/writer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var Writer = class {
	constructor(target, isMonotonic) {
		this.finalized = false;
		this.started = false;
		this.pos = 0;
		this.trackedWrites = null;
		this.trackedStart = -1;
		this.trackedEnd = -1;
		if (target._writerAcquired) throw new Error("Can't have multiple Writers for the same Target.");
		this.target = target;
		target._setMonotonicity(isMonotonic);
		target._writerAcquired = true;
	}
	start() {
		assert(!this.started);
		this.target._start();
		this.started = true;
	}
	/** Writes the given data to the target, at the current position. */
	write(data) {
		assert(this.started && !this.finalized);
		this.maybeTrackWrites(data);
		this.target._write(data, this.pos);
		this.pos += data.byteLength;
	}
	/** Sets the current position for future writes to a new one. */
	seek(newPos) {
		this.pos = newPos;
	}
	/** Returns the current position. */
	getPos() {
		return this.pos;
	}
	/** Signals to the writer that it may be time to flush. */
	async flush() {
		assert(this.started && !this.finalized);
		return this.target._flush();
	}
	/** Called after muxing has finished. */
	async finalize() {
		assert(this.started && !this.finalized);
		await this.target._finalize();
		this.finalized = true;
	}
	maybeTrackWrites(data) {
		if (!this.trackedWrites) return;
		let pos = this.getPos();
		if (pos < this.trackedStart) {
			if (pos + data.byteLength <= this.trackedStart) return;
			data = data.subarray(this.trackedStart - pos);
			pos = 0;
		}
		const neededSize = pos + data.byteLength - this.trackedStart;
		let newLength = this.trackedWrites.byteLength;
		while (newLength < neededSize) newLength *= 2;
		if (newLength !== this.trackedWrites.byteLength) {
			const copy = new Uint8Array(newLength);
			copy.set(this.trackedWrites, 0);
			this.trackedWrites = copy;
		}
		this.trackedWrites.set(data, pos - this.trackedStart);
		this.trackedEnd = Math.max(this.trackedEnd, pos + data.byteLength);
	}
	startTrackingWrites() {
		this.trackedWrites = /* @__PURE__ */ new Uint8Array(1024);
		this.trackedStart = this.getPos();
		this.trackedEnd = this.trackedStart;
	}
	stopTrackingWrites() {
		if (!this.trackedWrites) throw new Error("Internal error: Can't get tracked writes since nothing was tracked.");
		const result = {
			data: this.trackedWrites.subarray(0, this.trackedEnd - this.trackedStart),
			start: this.trackedStart,
			end: this.trackedEnd
		};
		this.trackedWrites = null;
		return result;
	}
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/target.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* Base class for targets, specifying where output files are written.
* @group Output targets
* @public
*/
var Target = class extends EventEmitter {
	constructor() {
		super(...arguments);
		/** @internal */
		this._writerAcquired = false;
		/** @internal */
		this._monotonicity = null;
		/**
		* Called each time data is written to the target. Will be called with the byte range into which data was written.
		*
		* Use this callback to track the size of the output file as it grows. But be warned, this function is chatty and
		* gets called *extremely* often.
		*
		* @deprecated Use \`target.on('write', ({ start, end }) => ...)\` instead.
		*/
		this.onwrite = null;
	}
	/** @internal */
	_setMonotonicity(monotonicity) {
		if (this._monotonicity !== false) this._monotonicity = monotonicity;
	}
	/** @internal */
	_dispatchWrite(start, end) {
		this.onwrite?.(start, end);
		this._emit("write", {
			start,
			end
		});
	}
	/**
	* Returns a new {@link RangedTarget} that writes data to this target using the given offset.
	*
	* Useful for writing a file into a section of a larger file.
	*/
	slice(offset) {
		if (!Number.isInteger(offset) || offset < 0) throw new TypeError("offset must be a non-negative integer.");
		return new RangedTarget(this, offset);
	}
};
const ARRAY_BUFFER_INITIAL_SIZE = 2 ** 16;
const ARRAY_BUFFER_MAX_SIZE = 2 ** 32;
/**
* A target that writes data directly into an ArrayBuffer in memory. Great for performance, but not suitable for very
* large files. The buffer will be available once the output has been finalized.
* @group Output targets
* @public
*/
var BufferTarget = class extends Target {
	/** Creates a new {@link BufferTarget}. The buffer holding the data will be created and managed internally. */
	constructor(options = {}) {
		super();
		/** Stores the final output buffer. Until the output is finalized, this will be \`null\`. */
		this.buffer = null;
		/** @internal */
		this._maxPos = 0;
		if (!options || typeof options !== "object") throw new TypeError("BufferTarget options, when provided, must be an object.");
		if (options.onFinalize !== void 0 && typeof options.onFinalize !== "function") throw new TypeError("options.onFinalize, when provided, must be a function.");
		this._options = options;
		this._supportsResize = "resize" in /* @__PURE__ */ new ArrayBuffer(0);
		if (this._supportsResize) try {
			this._buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE, { maxByteLength: ARRAY_BUFFER_MAX_SIZE });
		} catch {
			this._buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE);
			this._supportsResize = false;
		}
		else this._buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE);
		this._bytes = new Uint8Array(this._buffer);
	}
	/** @internal */
	_ensureSize(size) {
		let newLength = this._buffer.byteLength;
		while (newLength < size) newLength *= 2;
		if (newLength === this._buffer.byteLength) return;
		if (newLength > ARRAY_BUFFER_MAX_SIZE) throw new Error(\`ArrayBuffer exceeded maximum size of \${ARRAY_BUFFER_MAX_SIZE} bytes. Please consider using another target.\`);
		if (this._supportsResize) this._buffer.resize(newLength);
		else {
			const newBuffer = new ArrayBuffer(newLength);
			const newBytes = new Uint8Array(newBuffer);
			newBytes.set(this._bytes, 0);
			this._buffer = newBuffer;
			this._bytes = newBytes;
		}
	}
	/** @internal */
	_start() {}
	/** @internal */
	_write(data, pos) {
		this._ensureSize(pos + data.byteLength);
		this._bytes.set(data, pos);
		this._maxPos = Math.max(this._maxPos, pos + data.byteLength);
		this._dispatchWrite(pos, pos + data.byteLength);
	}
	/** @internal */
	async _flush() {}
	/** @internal */
	async _finalize() {
		this.buffer = this._buffer.slice(0, this._maxPos);
		if (this._options.onFinalize) await this._options.onFinalize(this.buffer);
		this._emit("finalized");
	}
	/** @internal */
	async _close() {}
	/** @internal */
	_getSlice(start, end) {
		return this._bytes.slice(start, end);
	}
};
/**
* A target that writes to a subrange (defined by an offset) of another, underlying target. Useful for writing a file
* into a section of a larger file.
* @group Output targets
* @public
*/
var RangedTarget = class extends Target {
	/** @internal */
	constructor(baseTarget, offset) {
		super();
		this._baseTarget = baseTarget;
		this._offset = offset;
	}
	/** @internal */
	_start() {}
	/** @internal */
	_write(data, pos) {
		this._baseTarget._write(data, this._offset + pos);
		this._dispatchWrite(pos, pos + data.byteLength);
	}
	/** @internal */
	_flush() {
		return this._baseTarget._flush();
	}
	/** @internal */
	async _finalize() {
		this._emit("finalized");
	}
	/** @internal */
	async _close() {}
	/** @internal */
	_setMonotonicity(monotonicity) {
		super._setMonotonicity(monotonicity);
		this._baseTarget._setMonotonicity(monotonicity);
	}
};
/**
* A special target for writing multi-file media where each file is uniquely identified by a path.
* @group Output targets
* @public
*/
var PathedTarget = class {
	/** Creates a new {@link PathedTarget} from a root path and a callback. */
	constructor(rootPath, getTarget) {
		this.rootPath = rootPath;
		this.getTarget = getTarget;
		if (typeof rootPath !== "string") throw new TypeError("rootPath must be a string.");
		if (typeof getTarget !== "function") throw new TypeError("getTarget must be a function.");
	}
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/isobmff/isobmff-muxer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
const GLOBAL_TIMESCALE = 57600;
const TIMESTAMP_OFFSET = 2082844800;
const getTrackMetadata = (trackData) => {
	const metadata = {};
	const track = trackData.track;
	if (track.metadata.name !== void 0) metadata.name = track.metadata.name;
	return metadata;
};
const intoTimescale = (timeInSeconds, timescale, round = true) => {
	const value = timeInSeconds * timescale;
	return round ? Math.round(value) : value;
};
var IsobmffMuxer = class extends Muxer {
	constructor(output, format) {
		super(output);
		this.writer = null;
		this.boxWriter = null;
		this.initWriter = null;
		this.initBoxWriter = null;
		this.auxTarget = new BufferTarget();
		this.auxWriter = new Writer(this.auxTarget, false);
		this.auxBoxWriter = new IsobmffBoxWriter(this.auxWriter);
		this.mdat = null;
		this.ftypSize = null;
		this.trackDatas = [];
		this.allTracksKnown = promiseWithResolvers();
		this.creationTime = Math.floor(Date.now() / 1e3) + TIMESTAMP_OFFSET;
		this.finalizedChunks = [];
		this.nextFragmentNumber = 1;
		this.maxWrittenTimestamp = -Infinity;
		this.minWrittenTimestamp = Infinity;
		this.maxWrittenEndTimestamp = -Infinity;
		this.segmentHeaderSize = null;
		this.format = format;
		this.isQuickTime = format instanceof MovOutputFormat;
		this.isCmaf = format instanceof CmafOutputFormat;
		this.minimumFragmentDuration = format._options.minimumFragmentDuration ?? (format instanceof CmafOutputFormat ? Infinity : 1);
	}
	async start() {
		const release = await this.mutex.acquire();
		if (!this.isCmaf) {
			this.writer = await this.output._getRootWriter((target) => this.format._options.fastStart !== void 0 ? this.format._options.fastStart === "fragmented" : target instanceof BufferTarget);
			this.boxWriter = new IsobmffBoxWriter(this.writer);
			this.fastStart = this.format._options.fastStart ?? (this.writer.target instanceof BufferTarget ? "in-memory" : false);
			this.isFragmented = this.fastStart === "fragmented";
		} else {
			this.fastStart = "fragmented";
			this.isFragmented = true;
		}
		if (this.isCmaf) {
			if (!this.output._hasInitTarget()) throw new Error("CMAF outputs require the initTarget field in OutputOptions to be set; the init segment will be written to it.");
			const initTarget = await this.output._getInitTarget();
			const initWriter = new Writer(initTarget, true);
			initWriter.start();
			this.initWriter = initWriter;
			this.initBoxWriter = new IsobmffBoxWriter(initWriter);
		}
		const holdsAvc = this.output._tracks.some((x) => x.isVideoTrack() && x.source._codec === "avc");
		{
			const boxWriter = this.initBoxWriter ?? this.boxWriter;
			assert(boxWriter);
			if (this.format._options.onFtyp) boxWriter.writer.startTrackingWrites();
			boxWriter.writeBox(ftyp({
				isQuickTime: this.isQuickTime,
				holdsAvc,
				fragmented: this.isFragmented,
				cmaf: this.isCmaf
			}));
			if (this.format._options.onFtyp) {
				const { data, start } = boxWriter.writer.stopTrackingWrites();
				this.format._options.onFtyp(data, start);
			}
			this.ftypSize = boxWriter.writer.getPos();
			if (this.isCmaf) await this.initWriter.flush();
		}
		if (this.fastStart === "in-memory") {} else if (this.fastStart === "reserve") {
			for (const track of this.output._tracks) if (track.metadata.maximumPacketCount === void 0) throw new Error("All tracks must specify maximumPacketCount in their metadata when using fastStart: 'reserve'.");
		} else if (this.isFragmented) {} else {
			assert(this.writer);
			assert(this.boxWriter);
			if (this.format._options.onMdat) this.writer.startTrackingWrites();
			this.mdat = mdat(true);
			this.boxWriter.writeBox(this.mdat);
		}
		await this.writer?.flush();
		release();
	}
	allTracksAreKnown() {
		for (const track of this.output._tracks) if (!track.source._closed && !this.trackDatas.some((x) => x.track === track)) return false;
		return true;
	}
	async getMimeType() {
		await this.allTracksKnown.promise;
		const codecStrings = this.trackDatas.map((trackData) => {
			if (trackData.type === "video") return trackData.info.decoderConfig.codec;
			else if (trackData.type === "audio") return trackData.info.decoderConfig.codec;
			else return { webvtt: "wvtt" }[trackData.track.source._codec];
		});
		return buildIsobmffMimeType({
			isQuickTime: this.isQuickTime,
			hasVideo: this.trackDatas.some((x) => x.type === "video"),
			hasAudio: this.trackDatas.some((x) => x.type === "audio"),
			codecStrings
		});
	}
	getVideoTrackData(track, packet, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateVideoChunkMetadata(meta);
		assert(meta);
		assert(meta.decoderConfig);
		const decoderConfig = { ...meta.decoderConfig };
		assert(decoderConfig.codedWidth !== void 0);
		assert(decoderConfig.codedHeight !== void 0);
		let requiresAnnexBTransformation = false;
		if (track.source._codec === "avc" && !decoderConfig.description) {
			const decoderConfigurationRecord = extractAvcDecoderConfigurationRecord(packet.data);
			if (!decoderConfigurationRecord) throw new Error("Couldn't extract an AVCDecoderConfigurationRecord from the AVC packet. Make sure the packets are in Annex B format (as specified in ITU-T-REC-H.264) when not providing a description, or provide a description (must be an AVCDecoderConfigurationRecord as specified in ISO 14496-15) and ensure the packets are in AVCC format.");
			decoderConfig.description = serializeAvcDecoderConfigurationRecord(decoderConfigurationRecord);
			requiresAnnexBTransformation = true;
		} else if (track.source._codec === "hevc" && !decoderConfig.description) {
			const decoderConfigurationRecord = extractHevcDecoderConfigurationRecord(packet.data);
			if (!decoderConfigurationRecord) throw new Error("Couldn't extract an HEVCDecoderConfigurationRecord from the HEVC packet. Make sure the packets are in Annex B format (as specified in ITU-T-REC-H.265) when not providing a description, or provide a description (must be an HEVCDecoderConfigurationRecord as specified in ISO 14496-15) and ensure the packets are in HEVC format.");
			decoderConfig.description = serializeHevcDecoderConfigurationRecord(decoderConfigurationRecord);
			requiresAnnexBTransformation = true;
		}
		const timescale = computeRationalApproximation(1 / (track.metadata.frameRate ?? 57600), 1e6).den;
		const displayAspectWidth = decoderConfig.displayAspectWidth;
		const displayAspectHeight = decoderConfig.displayAspectHeight;
		const pixelAspectRatio = displayAspectWidth === void 0 || displayAspectHeight === void 0 ? {
			num: 1,
			den: 1
		} : simplifyRational({
			num: displayAspectWidth * decoderConfig.codedHeight,
			den: displayAspectHeight * decoderConfig.codedWidth
		});
		const newTrackData = {
			muxer: this,
			track,
			type: "video",
			info: {
				width: decoderConfig.codedWidth,
				height: decoderConfig.codedHeight,
				pixelAspectRatio,
				decoderConfig,
				requiresAnnexBTransformation
			},
			timescale,
			samples: [],
			sampleQueue: [],
			timestampProcessingQueue: [],
			timeToSampleTable: [],
			compositionTimeOffsetTable: [],
			lastTimescaleUnits: null,
			lastSample: null,
			startTimestampOffset: null,
			finalizedChunks: [],
			currentChunk: null,
			compactlyCodedChunkTable: [],
			closed: false
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	getAudioTrackData(track, packet, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateAudioChunkMetadata(meta);
		assert(meta);
		assert(meta.decoderConfig);
		const decoderConfig = { ...meta.decoderConfig };
		let requiresAdtsStripping = false;
		if (track.source._codec === "aac" && !decoderConfig.description) {
			const adtsFrame = readAdtsFrameHeader(FileSlice.tempFromBytes(packet.data));
			if (!adtsFrame) throw new Error("Couldn't parse ADTS header from the AAC packet. Make sure the packets are in ADTS format (as specified in ISO 13818-7) when not providing a description, or provide a description (must be an AudioSpecificConfig as specified in ISO 14496-3) and ensure the packets are raw AAC data.");
			const sampleRate = aacFrequencyTable[adtsFrame.samplingFrequencyIndex];
			const numberOfChannels = aacChannelMap[adtsFrame.channelConfiguration];
			if (sampleRate === void 0 || numberOfChannels === void 0) throw new Error("Invalid ADTS frame header.");
			decoderConfig.description = buildAacAudioSpecificConfig({
				objectType: adtsFrame.objectType,
				sampleRate,
				numberOfChannels
			});
			requiresAdtsStripping = true;
		}
		const newTrackData = {
			muxer: this,
			track,
			type: "audio",
			info: {
				numberOfChannels: meta.decoderConfig.numberOfChannels,
				sampleRate: meta.decoderConfig.sampleRate,
				decoderConfig,
				requiresPcmTransformation: !this.isFragmented && PCM_AUDIO_CODECS.includes(track.source._codec),
				expectedNextPcmPacketTimestamp: null,
				requiresAdtsStripping,
				firstPacket: packet
			},
			timescale: decoderConfig.sampleRate,
			samples: [],
			sampleQueue: [],
			timestampProcessingQueue: [],
			timeToSampleTable: [],
			compositionTimeOffsetTable: [],
			lastTimescaleUnits: null,
			lastSample: null,
			startTimestampOffset: null,
			finalizedChunks: [],
			currentChunk: null,
			compactlyCodedChunkTable: [],
			closed: false
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	getSubtitleTrackData(track, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateSubtitleMetadata(meta);
		assert(meta);
		assert(meta.config);
		const newTrackData = {
			muxer: this,
			track,
			type: "subtitle",
			info: { config: meta.config },
			timescale: 1e3,
			samples: [],
			sampleQueue: [],
			timestampProcessingQueue: [],
			timeToSampleTable: [],
			compositionTimeOffsetTable: [],
			lastTimescaleUnits: null,
			lastSample: null,
			startTimestampOffset: null,
			finalizedChunks: [],
			currentChunk: null,
			compactlyCodedChunkTable: [],
			closed: false,
			lastCueEndTimestamp: 0,
			cueQueue: [],
			nextSourceId: 0,
			cueToSourceId: /* @__PURE__ */ new WeakMap()
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	async addEncodedVideoPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getVideoTrackData(track, packet, meta);
			let packetData = packet.data;
			if (trackData.info.requiresAnnexBTransformation) {
				const nalUnits = [...iterateNalUnitsInAnnexB(packetData)].map((loc) => packetData.subarray(loc.offset, loc.offset + loc.length));
				if (nalUnits.length === 0) throw new Error("Failed to transform packet data. Make sure all packets are provided in Annex B format, as specified in ITU-T-REC-H.264 and ITU-T-REC-H.265.");
				packetData = concatNalUnitsInLengthPrefixed(nalUnits, 4);
			}
			this.validateTimestamp(trackData.track, packet.timestamp, packet.type === "key");
			const internalSample = this.createSampleForTrack(trackData, packetData, packet.timestamp, packet.duration, packet.type);
			await this.registerSample(trackData, internalSample);
		} finally {
			release();
		}
	}
	async addEncodedAudioPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getAudioTrackData(track, packet, meta);
			let packetData = packet.data;
			if (trackData.info.requiresAdtsStripping) {
				const adtsFrame = readAdtsFrameHeader(FileSlice.tempFromBytes(packetData));
				if (!adtsFrame) throw new Error("Expected ADTS frame, didn't get one.");
				const headerLength = adtsFrame.crcCheck === null ? 7 : 9;
				packetData = packetData.subarray(headerLength);
			}
			this.validateTimestamp(trackData.track, packet.timestamp, packet.type === "key");
			let timestamp = packet.timestamp;
			let duration = packet.duration;
			if (trackData.info.requiresPcmTransformation) {
				const frameSize = parsePcmCodec(trackData.info.decoderConfig.codec).sampleSize * trackData.info.numberOfChannels;
				duration = packetData.byteLength / frameSize / trackData.info.sampleRate;
				if (trackData.info.expectedNextPcmPacketTimestamp !== null) {
					const diff = timestamp - trackData.info.expectedNextPcmPacketTimestamp;
					if (diff < .01) timestamp = trackData.info.expectedNextPcmPacketTimestamp;
					else {
						const paddedDuration = await this.padWithSilence(trackData, trackData.info.expectedNextPcmPacketTimestamp, diff);
						timestamp = trackData.info.expectedNextPcmPacketTimestamp + paddedDuration;
					}
				}
				trackData.info.expectedNextPcmPacketTimestamp = timestamp + duration;
			}
			const internalSample = this.createSampleForTrack(trackData, packetData, timestamp, duration, packet.type);
			await this.registerSample(trackData, internalSample);
		} finally {
			release();
		}
	}
	async padWithSilence(trackData, timestamp, duration) {
		const deltaInTimescale = intoTimescale(duration, trackData.timescale);
		duration = deltaInTimescale / trackData.timescale;
		if (deltaInTimescale > 0) {
			const { sampleSize, silentValue } = parsePcmCodec(trackData.info.decoderConfig.codec);
			const samplesNeeded = deltaInTimescale * trackData.info.numberOfChannels;
			const data = new Uint8Array(sampleSize * samplesNeeded).fill(silentValue);
			const paddingSample = this.createSampleForTrack(trackData, new Uint8Array(data.buffer), timestamp, duration, "key");
			await this.registerSample(trackData, paddingSample);
		}
		return duration;
	}
	async addSubtitleCue(track, cue, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getSubtitleTrackData(track, meta);
			this.validateTimestamp(trackData.track, cue.timestamp, true);
			if (track.source._codec === "webvtt") {
				trackData.cueQueue.push(cue);
				await this.processWebVTTCues(trackData, cue.timestamp);
			}
		} finally {
			release();
		}
	}
	async processWebVTTCues(trackData, until) {
		while (trackData.cueQueue.length > 0) {
			const timestamps = /* @__PURE__ */ new Set([]);
			for (const cue of trackData.cueQueue) {
				assert(cue.timestamp <= until);
				assert(trackData.lastCueEndTimestamp <= cue.timestamp + cue.duration);
				timestamps.add(Math.max(cue.timestamp, trackData.lastCueEndTimestamp));
				timestamps.add(cue.timestamp + cue.duration);
			}
			const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
			const sampleStart = sortedTimestamps[0];
			const sampleEnd = sortedTimestamps[1] ?? sampleStart;
			if (until < sampleEnd) break;
			if (trackData.lastCueEndTimestamp < sampleStart) {
				this.auxWriter.seek(0);
				const box = vtte();
				this.auxBoxWriter.writeBox(box);
				const body = this.auxTarget._getSlice(0, this.auxWriter.getPos());
				const sample = this.createSampleForTrack(trackData, body, trackData.lastCueEndTimestamp, sampleStart - trackData.lastCueEndTimestamp, "key");
				await this.registerSample(trackData, sample);
				trackData.lastCueEndTimestamp = sampleStart;
			}
			this.auxWriter.seek(0);
			for (let i = 0; i < trackData.cueQueue.length; i++) {
				const cue = trackData.cueQueue[i];
				if (cue.timestamp >= sampleEnd) break;
				inlineTimestampRegex.lastIndex = 0;
				const containsTimestamp = inlineTimestampRegex.test(cue.text);
				const endTimestamp = cue.timestamp + cue.duration;
				let sourceId = trackData.cueToSourceId.get(cue);
				if (sourceId === void 0 && sampleEnd < endTimestamp) {
					sourceId = trackData.nextSourceId++;
					trackData.cueToSourceId.set(cue, sourceId);
				}
				if (cue.notes) {
					const box = vtta(cue.notes);
					this.auxBoxWriter.writeBox(box);
				}
				const box = vttc(cue.text, containsTimestamp ? sampleStart : null, cue.identifier ?? null, cue.settings ?? null, sourceId ?? null);
				this.auxBoxWriter.writeBox(box);
				if (endTimestamp === sampleEnd) trackData.cueQueue.splice(i--, 1);
			}
			const body = this.auxTarget._getSlice(0, this.auxWriter.getPos());
			const sample = this.createSampleForTrack(trackData, body, sampleStart, sampleEnd - sampleStart, "key");
			await this.registerSample(trackData, sample);
			trackData.lastCueEndTimestamp = sampleEnd;
		}
	}
	createSampleForTrack(trackData, data, timestamp, duration, type) {
		return {
			timestamp,
			decodeTimestamp: timestamp,
			duration,
			data,
			size: data.byteLength,
			type,
			timescaleUnitsToNextSample: intoTimescale(duration, trackData.timescale)
		};
	}
	processTimestamps(trackData, nextSample) {
		if (trackData.timestampProcessingQueue.length === 0) return;
		if (trackData.type === "audio" && trackData.info.requiresPcmTransformation) {
			if (!this.isFragmented) trackData.startTimestampOffset ??= trackData.timestampProcessingQueue[0].timestamp;
			let totalDuration = 0;
			for (let i = 0; i < trackData.timestampProcessingQueue.length; i++) {
				const sample = trackData.timestampProcessingQueue[i];
				const duration = intoTimescale(sample.duration, trackData.timescale);
				totalDuration += duration;
			}
			if (trackData.timeToSampleTable.length === 0) trackData.timeToSampleTable.push({
				sampleCount: totalDuration,
				sampleDelta: 1
			});
			else {
				const lastEntry = last(trackData.timeToSampleTable);
				lastEntry.sampleCount += totalDuration;
			}
			trackData.timestampProcessingQueue.length = 0;
			return;
		}
		const sortedTimestamps = trackData.timestampProcessingQueue.map((x) => x.timestamp).sort((a, b) => a - b);
		if (!this.isFragmented) trackData.startTimestampOffset ??= sortedTimestamps[0];
		for (let i = 0; i < trackData.timestampProcessingQueue.length; i++) {
			const sample = trackData.timestampProcessingQueue[i];
			sample.decodeTimestamp = sortedTimestamps[i];
			const sampleCompositionTimeOffset = intoTimescale(sample.timestamp - sample.decodeTimestamp, trackData.timescale);
			const durationInTimescale = intoTimescale(sample.duration, trackData.timescale);
			if (trackData.lastTimescaleUnits !== null) {
				assert(trackData.lastSample);
				const timescaleUnits = intoTimescale(sample.decodeTimestamp, trackData.timescale, false);
				const delta = Math.round(timescaleUnits - trackData.lastTimescaleUnits);
				assert(delta >= 0);
				trackData.lastTimescaleUnits += delta;
				trackData.lastSample.timescaleUnitsToNextSample = delta;
				if (!this.isFragmented) {
					let lastTableEntry = last(trackData.timeToSampleTable);
					assert(lastTableEntry);
					if (lastTableEntry.sampleCount === 1) {
						lastTableEntry.sampleDelta = delta;
						const entryBefore = trackData.timeToSampleTable[trackData.timeToSampleTable.length - 2];
						if (entryBefore && entryBefore.sampleDelta === delta) {
							entryBefore.sampleCount++;
							trackData.timeToSampleTable.pop();
							lastTableEntry = entryBefore;
						}
					} else if (lastTableEntry.sampleDelta !== delta) {
						lastTableEntry.sampleCount--;
						trackData.timeToSampleTable.push(lastTableEntry = {
							sampleCount: 1,
							sampleDelta: delta
						});
					}
					if (lastTableEntry.sampleDelta === durationInTimescale) lastTableEntry.sampleCount++;
					else trackData.timeToSampleTable.push({
						sampleCount: 1,
						sampleDelta: durationInTimescale
					});
					const lastCompositionTimeOffsetTableEntry = last(trackData.compositionTimeOffsetTable);
					assert(lastCompositionTimeOffsetTableEntry);
					if (lastCompositionTimeOffsetTableEntry.sampleCompositionTimeOffset === sampleCompositionTimeOffset) lastCompositionTimeOffsetTableEntry.sampleCount++;
					else trackData.compositionTimeOffsetTable.push({
						sampleCount: 1,
						sampleCompositionTimeOffset
					});
				}
			} else {
				trackData.lastTimescaleUnits = intoTimescale(sample.decodeTimestamp, trackData.timescale, false);
				if (!this.isFragmented) {
					trackData.timeToSampleTable.push({
						sampleCount: 1,
						sampleDelta: durationInTimescale
					});
					trackData.compositionTimeOffsetTable.push({
						sampleCount: 1,
						sampleCompositionTimeOffset
					});
				}
			}
			trackData.lastSample = sample;
		}
		trackData.timestampProcessingQueue.length = 0;
		assert(trackData.lastSample);
		assert(trackData.lastTimescaleUnits !== null);
		if (nextSample !== void 0 && trackData.lastSample.timescaleUnitsToNextSample === 0) {
			assert(nextSample.type === "key");
			const timescaleUnits = intoTimescale(nextSample.timestamp, trackData.timescale, false);
			const delta = Math.round(timescaleUnits - trackData.lastTimescaleUnits);
			trackData.lastSample.timescaleUnitsToNextSample = delta;
		}
	}
	async registerSample(trackData, sample) {
		if (sample.type === "key") this.processTimestamps(trackData, sample);
		trackData.timestampProcessingQueue.push(sample);
		if (this.isFragmented) {
			trackData.sampleQueue.push(sample);
			await this.interleaveSamples();
		} else if (this.fastStart === "reserve") await this.registerSampleFastStartReserve(trackData, sample);
		else await this.addSampleToTrack(trackData, sample);
	}
	async addSampleToTrack(trackData, sample) {
		if (!this.isFragmented) {
			trackData.samples.push(sample);
			if (this.fastStart === "reserve") {
				const maximumPacketCount = trackData.track.metadata.maximumPacketCount;
				assert(maximumPacketCount !== void 0);
				if (trackData.samples.length > maximumPacketCount) throw new Error(\`Track #\${trackData.track.id} has already reached the maximum packet count (\${maximumPacketCount}). Either add less packets or increase the maximum packet count.\`);
			}
		}
		let beginNewChunk = false;
		if (!trackData.currentChunk) beginNewChunk = true;
		else {
			trackData.currentChunk.startTimestamp = Math.min(trackData.currentChunk.startTimestamp, sample.timestamp);
			const currentChunkDuration = sample.timestamp - trackData.currentChunk.startTimestamp;
			if (this.isFragmented) {
				const keyFrameQueuedEverywhere = this.trackDatas.every((otherTrackData) => {
					if (trackData === otherTrackData) return sample.type === "key";
					const firstQueuedSample = otherTrackData.sampleQueue[0];
					if (firstQueuedSample) return firstQueuedSample.type === "key";
					return otherTrackData.closed;
				});
				if (currentChunkDuration >= this.minimumFragmentDuration && keyFrameQueuedEverywhere && sample.timestamp > this.maxWrittenTimestamp) {
					beginNewChunk = true;
					await this.finalizeFragment();
				}
			} else beginNewChunk = currentChunkDuration >= .5;
		}
		if (beginNewChunk) {
			if (trackData.currentChunk) await this.finalizeCurrentChunk(trackData);
			trackData.currentChunk = {
				startTimestamp: sample.timestamp,
				samples: [],
				offset: null,
				moofOffset: null
			};
		}
		assert(trackData.currentChunk);
		trackData.currentChunk.samples.push(sample);
		if (this.isFragmented) {
			this.maxWrittenTimestamp = Math.max(this.maxWrittenTimestamp, sample.timestamp);
			this.maxWrittenEndTimestamp = Math.max(this.maxWrittenEndTimestamp, sample.timestamp + sample.duration);
			this.minWrittenTimestamp = Math.min(this.minWrittenTimestamp, sample.timestamp);
		}
	}
	async finalizeCurrentChunk(trackData) {
		assert(!this.isFragmented);
		assert(this.writer);
		if (!trackData.currentChunk) return;
		trackData.finalizedChunks.push(trackData.currentChunk);
		this.finalizedChunks.push(trackData.currentChunk);
		let sampleCount = trackData.currentChunk.samples.length;
		if (trackData.type === "audio" && trackData.info.requiresPcmTransformation) sampleCount = trackData.currentChunk.samples.reduce((acc, sample) => acc + intoTimescale(sample.duration, trackData.timescale), 0);
		if (trackData.compactlyCodedChunkTable.length === 0 || last(trackData.compactlyCodedChunkTable).samplesPerChunk !== sampleCount) trackData.compactlyCodedChunkTable.push({
			firstChunk: trackData.finalizedChunks.length,
			samplesPerChunk: sampleCount
		});
		if (this.fastStart === "in-memory") {
			trackData.currentChunk.offset = 0;
			return;
		}
		trackData.currentChunk.offset = this.writer.getPos();
		for (const sample of trackData.currentChunk.samples) {
			assert(sample.data);
			this.writer.write(sample.data);
			sample.data = null;
		}
		await this.writer.flush();
	}
	async interleaveSamples(isFinalCall = false) {
		assert(this.isFragmented);
		if (!isFinalCall && !this.allTracksAreKnown()) return;
		outer: while (true) {
			let trackWithMinTimestamp = null;
			let minTimestamp = Infinity;
			for (const trackData of this.trackDatas) {
				if (!isFinalCall && trackData.sampleQueue.length === 0 && !trackData.closed) break outer;
				if (trackData.sampleQueue.length > 0 && trackData.sampleQueue[0].timestamp < minTimestamp) {
					trackWithMinTimestamp = trackData;
					minTimestamp = trackData.sampleQueue[0].timestamp;
				}
			}
			if (!trackWithMinTimestamp) break;
			const sample = trackWithMinTimestamp.sampleQueue.shift();
			await this.addSampleToTrack(trackWithMinTimestamp, sample);
		}
	}
	async finalizeFragment(flushWriter = !this.isCmaf) {
		assert(this.isFragmented);
		const fragmentNumber = this.nextFragmentNumber++;
		if (fragmentNumber === 1) {
			const boxWriter = this.initBoxWriter ?? this.boxWriter;
			assert(boxWriter);
			if (this.format._options.onMoov) boxWriter.writer.startTrackingWrites();
			this.ensureOneEnabledTrack();
			const movieBox = moov(this);
			boxWriter.writeBox(movieBox);
			if (this.format._options.onMoov) {
				const { data, start } = boxWriter.writer.stopTrackingWrites();
				this.format._options.onMoov(data, start);
			}
			if (this.isCmaf) {
				assert(this.initWriter);
				await this.initWriter.flush();
				await this.initWriter.finalize();
				this.writer = await this.output._getRootWriter(true);
				this.boxWriter = new IsobmffBoxWriter(this.writer);
				const stypSize = this.boxWriter.measureBox(styp());
				const sidxSize = this.boxWriter.measureBox(sidx(this, 0));
				this.segmentHeaderSize = stypSize + sidxSize;
				this.writer.seek(this.segmentHeaderSize);
			}
		}
		assert(this.writer);
		assert(this.boxWriter);
		const tracksInFragment = this.trackDatas.filter((x) => x.currentChunk);
		const moofBox = moof(fragmentNumber, tracksInFragment);
		const moofOffset = this.writer.getPos();
		const mdatStartPos = moofOffset + this.boxWriter.measureBox(moofBox);
		let currentPos = mdatStartPos + 8;
		let fragmentStartTimestamp = Infinity;
		for (const trackData of tracksInFragment) {
			trackData.currentChunk.offset = currentPos;
			trackData.currentChunk.moofOffset = moofOffset;
			for (const sample of trackData.currentChunk.samples) currentPos += sample.size;
			fragmentStartTimestamp = Math.min(fragmentStartTimestamp, trackData.currentChunk.startTimestamp);
		}
		const mdatSize = currentPos - mdatStartPos;
		const needsLargeMdatSize = mdatSize >= 2 ** 32;
		if (needsLargeMdatSize) for (const trackData of tracksInFragment) trackData.currentChunk.offset += 16 - 8;
		if (this.format._options.onMoof) this.writer.startTrackingWrites();
		const newMoofBox = moof(fragmentNumber, tracksInFragment);
		this.boxWriter.writeBox(newMoofBox);
		if (this.format._options.onMoof) {
			const { data, start } = this.writer.stopTrackingWrites();
			this.format._options.onMoof(data, start, fragmentStartTimestamp);
		}
		assert(this.writer.getPos() === mdatStartPos);
		if (this.format._options.onMdat) this.writer.startTrackingWrites();
		const mdatBox = mdat(needsLargeMdatSize);
		mdatBox.size = mdatSize;
		this.boxWriter.writeBox(mdatBox);
		this.writer.seek(mdatStartPos + (needsLargeMdatSize ? 16 : 8));
		for (const trackData of tracksInFragment) for (const sample of trackData.currentChunk.samples) {
			this.writer.write(sample.data);
			sample.data = null;
		}
		if (this.format._options.onMdat) {
			const { data, start } = this.writer.stopTrackingWrites();
			this.format._options.onMdat(data, start);
		}
		for (const trackData of tracksInFragment) {
			trackData.finalizedChunks.push(trackData.currentChunk);
			this.finalizedChunks.push(trackData.currentChunk);
			trackData.currentChunk = null;
		}
		if (flushWriter) await this.writer.flush();
	}
	async registerSampleFastStartReserve(trackData, sample) {
		assert(this.writer);
		assert(this.boxWriter);
		if (this.allTracksAreKnown()) {
			if (!this.mdat) {
				this.ensureOneEnabledTrack();
				const moovBox = moov(this);
				const reservedSize = this.boxWriter.measureBox(moovBox) + this.computeSampleTableSizeUpperBound() + 4096;
				assert(this.ftypSize !== null);
				this.writer.seek(this.ftypSize + reservedSize);
				if (this.format._options.onMdat) this.writer.startTrackingWrites();
				this.mdat = mdat(true);
				this.boxWriter.writeBox(this.mdat);
				for (const trackData of this.trackDatas) {
					for (const sample of trackData.sampleQueue) await this.addSampleToTrack(trackData, sample);
					trackData.sampleQueue.length = 0;
				}
			}
			await this.addSampleToTrack(trackData, sample);
		} else trackData.sampleQueue.push(sample);
	}
	computeSampleTableSizeUpperBound() {
		assert(this.fastStart === "reserve");
		let upperBound = 0;
		for (const trackData of this.trackDatas) {
			const n = trackData.track.metadata.maximumPacketCount;
			assert(n !== void 0);
			upperBound += 8 * Math.ceil(2 / 3 * n);
			upperBound += 4 * n;
			upperBound += 8 * Math.ceil(2 / 3 * n);
			upperBound += 12 * Math.ceil(2 / 3 * n);
			upperBound += 4 * n;
			upperBound += 8 * n;
		}
		return upperBound;
	}
	async onTrackClose(track) {
		const release = await this.mutex.acquire();
		const trackData = this.trackDatas.find((x) => x.track === track);
		if (trackData) {
			trackData.closed = true;
			if (trackData.type === "subtitle" && track.source._codec === "webvtt") await this.processWebVTTCues(trackData, Infinity);
			this.processTimestamps(trackData);
		}
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		if (this.isFragmented) await this.interleaveSamples();
		release();
	}
	ensureOneEnabledTrack() {
		for (const type of [
			"video",
			"audio",
			"subtitle"
		]) {
			const tracks = this.trackDatas.filter((t) => t.type === type);
			if (tracks.length === 0) continue;
			if (!tracks.some((t) => t.track.metadata.disposition?.default !== false)) {
				const firstTrack = tracks[0];
				firstTrack.track.metadata.disposition = {
					...firstTrack.track.metadata.disposition,
					default: true
				};
			}
		}
	}
	/** Finalizes the file, making it ready for use. Must be called after all video and audio chunks have been added. */
	async finalize() {
		const release = await this.mutex.acquire();
		this.allTracksKnown.resolve();
		this.ensureOneEnabledTrack();
		for (const trackData of this.trackDatas) {
			trackData.closed = true;
			if (trackData.type === "subtitle" && trackData.track.source._codec === "webvtt") await this.processWebVTTCues(trackData, Infinity);
			this.processTimestamps(trackData);
		}
		if (this.isFragmented) {
			await this.interleaveSamples(true);
			await this.finalizeFragment(false);
		} else for (const trackData of this.trackDatas) {
			await this.finalizeCurrentChunk(trackData);
			assert(trackData.startTimestampOffset !== null);
			for (let i = 0; i < trackData.samples.length; i++) {
				const sample = trackData.samples[i];
				sample.timestamp -= trackData.startTimestampOffset;
				sample.decodeTimestamp -= trackData.startTimestampOffset;
			}
		}
		assert(this.writer);
		assert(this.boxWriter);
		if (this.fastStart === "in-memory") {
			this.mdat = mdat(false);
			let mdatSize;
			for (let i = 0; i < 2; i++) {
				const movieBox = moov(this);
				const movieBoxSize = this.boxWriter.measureBox(movieBox);
				mdatSize = this.boxWriter.measureBox(this.mdat);
				let currentChunkPos = this.writer.getPos() + movieBoxSize + mdatSize;
				for (const chunk of this.finalizedChunks) {
					chunk.offset = currentChunkPos;
					for (const { data } of chunk.samples) {
						assert(data);
						currentChunkPos += data.byteLength;
						mdatSize += data.byteLength;
					}
				}
				if (currentChunkPos < 2 ** 32) break;
				if (mdatSize >= 2 ** 32) this.mdat.largeSize = true;
			}
			if (this.format._options.onMoov) this.writer.startTrackingWrites();
			const movieBox = moov(this);
			this.boxWriter.writeBox(movieBox);
			if (this.format._options.onMoov) {
				const { data, start } = this.writer.stopTrackingWrites();
				this.format._options.onMoov(data, start);
			}
			if (this.format._options.onMdat) this.writer.startTrackingWrites();
			this.mdat.size = mdatSize;
			this.boxWriter.writeBox(this.mdat);
			for (const chunk of this.finalizedChunks) for (const sample of chunk.samples) {
				assert(sample.data);
				this.writer.write(sample.data);
				sample.data = null;
			}
			if (this.format._options.onMdat) {
				const { data, start } = this.writer.stopTrackingWrites();
				this.format._options.onMdat(data, start);
			}
		} else if (this.isFragmented) {
			if (this.isCmaf) {
				const contentSize = this.segmentHeaderSize !== null ? this.writer.getPos() - this.segmentHeaderSize : 0;
				this.writer.seek(0);
				this.boxWriter.writeBox(styp());
				this.boxWriter.writeBox(sidx(this, contentSize));
			} else {
				const startPos = this.writer.getPos();
				const mfraBox = mfra(this.trackDatas);
				this.boxWriter.writeBox(mfraBox);
				const mfraBoxSize = this.writer.getPos() - startPos;
				this.writer.seek(this.writer.getPos() - 4);
				this.boxWriter.writeU32(mfraBoxSize);
			}
		} else {
			assert(this.mdat);
			const mdatPos = this.boxWriter.offsets.get(this.mdat);
			assert(mdatPos !== void 0);
			const mdatSize = this.writer.getPos() - mdatPos;
			this.mdat.size = mdatSize;
			this.mdat.largeSize = mdatSize >= 2 ** 32;
			this.boxWriter.patchBox(this.mdat);
			if (this.format._options.onMdat) {
				const { data, start } = this.writer.stopTrackingWrites();
				this.format._options.onMdat(data, start);
			}
			const movieBox = moov(this);
			if (this.fastStart === "reserve") {
				assert(this.ftypSize !== null);
				this.writer.seek(this.ftypSize);
				if (this.format._options.onMoov) this.writer.startTrackingWrites();
				this.boxWriter.writeBox(movieBox);
				const remainingSpace = this.boxWriter.offsets.get(this.mdat) - this.writer.getPos();
				this.boxWriter.writeBox(free(remainingSpace));
			} else {
				if (this.format._options.onMoov) this.writer.startTrackingWrites();
				this.boxWriter.writeBox(movieBox);
			}
			if (this.format._options.onMoov) {
				const { data, start } = this.writer.stopTrackingWrites();
				this.format._options.onMoov(data, start);
			}
		}
		release();
	}
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/matroska/matroska-muxer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
const MIN_CLUSTER_TIMESTAMP_MS = -(2 ** 15);
const MAX_CLUSTER_TIMESTAMP_MS = 2 ** 15 - 1;
const APP_NAME = "Mediabunny";
const SEGMENT_SIZE_BYTES = 6;
const CLUSTER_SIZE_BYTES = 5;
const TRACK_TYPE_MAP = {
	video: 1,
	audio: 2,
	subtitle: 17
};
var MatroskaMuxer = class extends Muxer {
	constructor(output, format) {
		super(output);
		this.trackDatas = [];
		this.allTracksKnown = promiseWithResolvers();
		this.segment = null;
		this.segmentInfo = null;
		this.seekHead = null;
		this.tracksElement = null;
		this.tagsElement = null;
		this.attachmentsElement = null;
		this.segmentDuration = null;
		this.cues = null;
		this.currentCluster = null;
		this.currentClusterStartMsTimestamp = null;
		this.currentClusterMaxMsTimestamp = null;
		this.trackDatasInCurrentCluster = /* @__PURE__ */ new Map();
		this.startTimestamp = Infinity;
		this.endTimestamp = -Infinity;
		this.format = format;
	}
	async start() {
		const release = await this.mutex.acquire();
		this.writer = await this.output._getRootWriter(!!this.format._options.appendOnly);
		this.ebmlWriter = new EBMLWriter(this.writer);
		this.writeEBMLHeader();
		this.createSegmentInfo();
		this.createCues();
		await this.writer.flush();
		release();
	}
	writeEBMLHeader() {
		if (this.format._options.onEbmlHeader) this.writer.startTrackingWrites();
		const ebmlHeader = {
			id: EBMLId.EBML,
			data: [
				{
					id: EBMLId.EBMLVersion,
					data: 1
				},
				{
					id: EBMLId.EBMLReadVersion,
					data: 1
				},
				{
					id: EBMLId.EBMLMaxIDLength,
					data: 4
				},
				{
					id: EBMLId.EBMLMaxSizeLength,
					data: 8
				},
				{
					id: EBMLId.DocType,
					data: this.format instanceof WebMOutputFormat ? "webm" : "matroska"
				},
				{
					id: EBMLId.DocTypeVersion,
					data: 2
				},
				{
					id: EBMLId.DocTypeReadVersion,
					data: 2
				}
			]
		};
		this.ebmlWriter.writeEBML(ebmlHeader);
		if (this.format._options.onEbmlHeader) {
			const { data, start } = this.writer.stopTrackingWrites();
			this.format._options.onEbmlHeader(data, start);
		}
	}
	/**
	* Creates a SeekHead element which is positioned near the start of the file and allows the media player to seek to
	* relevant sections more easily. Since we don't know the positions of those sections yet, we'll set them later.
	*/
	maybeCreateSeekHead(writeOffsets) {
		if (this.format._options.appendOnly) return;
		const kaxCues = new Uint8Array([
			28,
			83,
			187,
			107
		]);
		const kaxInfo = new Uint8Array([
			21,
			73,
			169,
			102
		]);
		const kaxTracks = new Uint8Array([
			22,
			84,
			174,
			107
		]);
		const kaxAttachments = new Uint8Array([
			25,
			65,
			164,
			105
		]);
		const kaxTags = new Uint8Array([
			18,
			84,
			195,
			103
		]);
		const seekHead = {
			id: EBMLId.SeekHead,
			data: [
				{
					id: EBMLId.Seek,
					data: [{
						id: EBMLId.SeekID,
						data: kaxCues
					}, {
						id: EBMLId.SeekPosition,
						size: 5,
						data: writeOffsets ? this.ebmlWriter.offsets.get(this.cues) - this.segmentDataOffset : 0
					}]
				},
				{
					id: EBMLId.Seek,
					data: [{
						id: EBMLId.SeekID,
						data: kaxInfo
					}, {
						id: EBMLId.SeekPosition,
						size: 5,
						data: writeOffsets ? this.ebmlWriter.offsets.get(this.segmentInfo) - this.segmentDataOffset : 0
					}]
				},
				{
					id: EBMLId.Seek,
					data: [{
						id: EBMLId.SeekID,
						data: kaxTracks
					}, {
						id: EBMLId.SeekPosition,
						size: 5,
						data: writeOffsets ? this.ebmlWriter.offsets.get(this.tracksElement) - this.segmentDataOffset : 0
					}]
				},
				this.attachmentsElement ? {
					id: EBMLId.Seek,
					data: [{
						id: EBMLId.SeekID,
						data: kaxAttachments
					}, {
						id: EBMLId.SeekPosition,
						size: 5,
						data: writeOffsets ? this.ebmlWriter.offsets.get(this.attachmentsElement) - this.segmentDataOffset : 0
					}]
				} : null,
				this.tagsElement ? {
					id: EBMLId.Seek,
					data: [{
						id: EBMLId.SeekID,
						data: kaxTags
					}, {
						id: EBMLId.SeekPosition,
						size: 5,
						data: writeOffsets ? this.ebmlWriter.offsets.get(this.tagsElement) - this.segmentDataOffset : 0
					}]
				} : null
			]
		};
		this.seekHead = seekHead;
	}
	createSegmentInfo() {
		const segmentDuration = {
			id: EBMLId.Duration,
			data: new EBMLFloat64(0)
		};
		this.segmentDuration = segmentDuration;
		const segmentInfo = {
			id: EBMLId.Info,
			data: [
				{
					id: EBMLId.TimestampScale,
					data: 1e6
				},
				{
					id: EBMLId.MuxingApp,
					data: APP_NAME
				},
				{
					id: EBMLId.WritingApp,
					data: APP_NAME
				},
				!this.format._options.appendOnly ? segmentDuration : null
			]
		};
		this.segmentInfo = segmentInfo;
	}
	createTracks() {
		const tracksElement = {
			id: EBMLId.Tracks,
			data: []
		};
		this.tracksElement = tracksElement;
		for (const trackData of this.trackDatas) {
			const codecId = CODEC_STRING_MAP[trackData.track.source._codec];
			assert(codecId);
			let seekPreRollNs = 0;
			if (trackData.type === "audio" && trackData.track.source._codec === "opus") {
				seekPreRollNs = 8e7;
				const description = trackData.info.decoderConfig.description;
				if (description) {
					const bytes = toUint8Array(description);
					const header = parseOpusIdentificationHeader(bytes);
					seekPreRollNs = Math.round(1e9 * (header.preSkip / OPUS_SAMPLE_RATE));
				}
			}
			tracksElement.data.push({
				id: EBMLId.TrackEntry,
				data: [
					{
						id: EBMLId.TrackNumber,
						data: trackData.track.id
					},
					{
						id: EBMLId.TrackUID,
						data: trackData.track.id
					},
					{
						id: EBMLId.TrackType,
						data: TRACK_TYPE_MAP[trackData.type]
					},
					trackData.track.metadata.disposition?.default === false ? {
						id: EBMLId.FlagDefault,
						data: 0
					} : null,
					trackData.track.metadata.disposition?.forced ? {
						id: EBMLId.FlagForced,
						data: 1
					} : null,
					trackData.track.metadata.disposition?.hearingImpaired ? {
						id: EBMLId.FlagHearingImpaired,
						data: 1
					} : null,
					trackData.track.metadata.disposition?.visuallyImpaired ? {
						id: EBMLId.FlagVisualImpaired,
						data: 1
					} : null,
					trackData.track.metadata.disposition?.original ? {
						id: EBMLId.FlagOriginal,
						data: 1
					} : null,
					trackData.track.metadata.disposition?.commentary ? {
						id: EBMLId.FlagCommentary,
						data: 1
					} : null,
					{
						id: EBMLId.FlagLacing,
						data: 0
					},
					{
						id: EBMLId.Language,
						data: trackData.track.metadata.languageCode ?? "und"
					},
					{
						id: EBMLId.CodecID,
						data: codecId
					},
					{
						id: EBMLId.CodecDelay,
						data: 0
					},
					{
						id: EBMLId.SeekPreRoll,
						data: seekPreRollNs
					},
					trackData.track.metadata.name !== void 0 ? {
						id: EBMLId.Name,
						data: new EBMLUnicodeString(trackData.track.metadata.name)
					} : null,
					trackData.type === "video" ? this.videoSpecificTrackInfo(trackData) : null,
					trackData.type === "audio" ? this.audioSpecificTrackInfo(trackData) : null,
					trackData.type === "subtitle" ? this.subtitleSpecificTrackInfo(trackData) : null
				]
			});
		}
	}
	videoSpecificTrackInfo(trackData) {
		const { frameRate, rotation } = trackData.track.metadata;
		const elements = [trackData.info.decoderConfig.description ? {
			id: EBMLId.CodecPrivate,
			data: toUint8Array(trackData.info.decoderConfig.description)
		} : null, frameRate ? {
			id: EBMLId.DefaultDuration,
			data: 1e9 / frameRate
		} : null];
		const flippedRotation = rotation ? normalizeRotation(-rotation) : 0;
		const hasNonSquarePixelAspectRatio = !!trackData.info.aspectRatio && trackData.info.aspectRatio.num * trackData.info.height !== trackData.info.aspectRatio.den * trackData.info.width;
		const colorSpace = trackData.info.decoderConfig.colorSpace;
		const videoElement = {
			id: EBMLId.Video,
			data: [
				{
					id: EBMLId.PixelWidth,
					data: trackData.info.width
				},
				{
					id: EBMLId.PixelHeight,
					data: trackData.info.height
				},
				hasNonSquarePixelAspectRatio ? {
					id: EBMLId.DisplayWidth,
					data: trackData.info.aspectRatio.num
				} : null,
				hasNonSquarePixelAspectRatio ? {
					id: EBMLId.DisplayHeight,
					data: trackData.info.aspectRatio.den
				} : null,
				hasNonSquarePixelAspectRatio ? {
					id: EBMLId.DisplayUnit,
					data: 3
				} : null,
				trackData.info.alphaMode ? {
					id: EBMLId.AlphaMode,
					data: 1
				} : null,
				colorSpaceIsComplete(colorSpace) ? {
					id: EBMLId.Colour,
					data: [
						{
							id: EBMLId.MatrixCoefficients,
							data: MATRIX_COEFFICIENTS_MAP[colorSpace.matrix]
						},
						{
							id: EBMLId.TransferCharacteristics,
							data: TRANSFER_CHARACTERISTICS_MAP[colorSpace.transfer]
						},
						{
							id: EBMLId.Primaries,
							data: COLOR_PRIMARIES_MAP[colorSpace.primaries]
						},
						{
							id: EBMLId.Range,
							data: colorSpace.fullRange ? 2 : 1
						}
					]
				} : null,
				flippedRotation ? {
					id: EBMLId.Projection,
					data: [{
						id: EBMLId.ProjectionType,
						data: 0
					}, {
						id: EBMLId.ProjectionPoseRoll,
						data: new EBMLFloat32((flippedRotation + 180) % 360 - 180)
					}]
				} : null
			]
		};
		elements.push(videoElement);
		return elements;
	}
	audioSpecificTrackInfo(trackData) {
		const pcmInfo = PCM_AUDIO_CODECS.includes(trackData.track.source._codec) ? parsePcmCodec(trackData.track.source._codec) : null;
		return [trackData.info.decoderConfig.description ? {
			id: EBMLId.CodecPrivate,
			data: toUint8Array(trackData.info.decoderConfig.description)
		} : null, {
			id: EBMLId.Audio,
			data: [
				{
					id: EBMLId.SamplingFrequency,
					data: new EBMLFloat32(trackData.info.sampleRate)
				},
				{
					id: EBMLId.Channels,
					data: trackData.info.numberOfChannels
				},
				pcmInfo ? {
					id: EBMLId.BitDepth,
					data: 8 * pcmInfo.sampleSize
				} : null
			]
		}];
	}
	subtitleSpecificTrackInfo(trackData) {
		return [{
			id: EBMLId.CodecPrivate,
			data: textEncoder.encode(trackData.info.config.description)
		}];
	}
	maybeCreateTags() {
		const simpleTags = [];
		const addSimpleTag = (key, value) => {
			simpleTags.push({
				id: EBMLId.SimpleTag,
				data: [{
					id: EBMLId.TagName,
					data: new EBMLUnicodeString(key)
				}, typeof value === "string" ? {
					id: EBMLId.TagString,
					data: new EBMLUnicodeString(value)
				} : {
					id: EBMLId.TagBinary,
					data: value
				}]
			});
		};
		const metadataTags = this.output._metadataTags;
		const writtenTags = /* @__PURE__ */ new Set();
		for (const { key, value } of keyValueIterator(metadataTags)) switch (key) {
			case "title":
				addSimpleTag("TITLE", value);
				writtenTags.add("TITLE");
				break;
			case "description":
				addSimpleTag("DESCRIPTION", value);
				writtenTags.add("DESCRIPTION");
				break;
			case "artist":
				addSimpleTag("ARTIST", value);
				writtenTags.add("ARTIST");
				break;
			case "album":
				addSimpleTag("ALBUM", value);
				writtenTags.add("ALBUM");
				break;
			case "albumArtist":
				addSimpleTag("ALBUM_ARTIST", value);
				writtenTags.add("ALBUM_ARTIST");
				break;
			case "genre":
				addSimpleTag("GENRE", value);
				writtenTags.add("GENRE");
				break;
			case "comment":
				addSimpleTag("COMMENT", value);
				writtenTags.add("COMMENT");
				break;
			case "lyrics":
				addSimpleTag("LYRICS", value);
				writtenTags.add("LYRICS");
				break;
			case "date":
				addSimpleTag("DATE", value.toISOString().slice(0, 10));
				writtenTags.add("DATE");
				break;
			case "trackNumber":
				addSimpleTag("PART_NUMBER", metadataTags.tracksTotal !== void 0 ? \`\${value}/\${metadataTags.tracksTotal}\` : value.toString());
				writtenTags.add("PART_NUMBER");
				break;
			case "discNumber":
				addSimpleTag("DISC", metadataTags.discsTotal !== void 0 ? \`\${value}/\${metadataTags.discsTotal}\` : value.toString());
				writtenTags.add("DISC");
				break;
			case "tracksTotal":
			case "discsTotal": break;
			case "images":
			case "raw": break;
			default: assertNever(key);
		}
		if (metadataTags.raw) for (const key in metadataTags.raw) {
			const value = metadataTags.raw[key];
			if (value == null || writtenTags.has(key)) continue;
			if (typeof value === "string" || value instanceof Uint8Array) addSimpleTag(key, value);
		}
		if (simpleTags.length === 0) return;
		this.tagsElement = {
			id: EBMLId.Tags,
			data: [{
				id: EBMLId.Tag,
				data: [{
					id: EBMLId.Targets,
					data: [{
						id: EBMLId.TargetTypeValue,
						data: 50
					}, {
						id: EBMLId.TargetType,
						data: "MOVIE"
					}]
				}, ...simpleTags]
			}]
		};
	}
	maybeCreateAttachments() {
		const metadataTags = this.output._metadataTags;
		const elements = [];
		const existingFileUids = /* @__PURE__ */ new Set();
		const images = metadataTags.images ?? [];
		for (const image of images) {
			let imageName = image.name;
			if (imageName === void 0) imageName = (image.kind === "coverFront" ? "cover" : image.kind === "coverBack" ? "back" : "image") + (imageMimeTypeToExtension(image.mimeType) ?? "");
			let fileUid;
			while (true) {
				fileUid = 0n;
				for (let i = 0; i < 8; i++) {
					fileUid <<= 8n;
					fileUid |= BigInt(Math.floor(Math.random() * 256));
				}
				if (fileUid !== 0n && !existingFileUids.has(fileUid)) break;
			}
			existingFileUids.add(fileUid);
			elements.push({
				id: EBMLId.AttachedFile,
				data: [
					image.description !== void 0 ? {
						id: EBMLId.FileDescription,
						data: new EBMLUnicodeString(image.description)
					} : null,
					{
						id: EBMLId.FileName,
						data: new EBMLUnicodeString(imageName)
					},
					{
						id: EBMLId.FileMediaType,
						data: image.mimeType
					},
					{
						id: EBMLId.FileData,
						data: image.data
					},
					{
						id: EBMLId.FileUID,
						data: fileUid
					}
				]
			});
		}
		for (const [key, value] of Object.entries(metadataTags.raw ?? {})) {
			if (!(value instanceof AttachedFile)) continue;
			if (!/^\\d+$/.test(key)) continue;
			if (images.find((x) => x.mimeType === value.mimeType && uint8ArraysAreEqual(x.data, value.data))) continue;
			elements.push({
				id: EBMLId.AttachedFile,
				data: [
					value.description !== void 0 ? {
						id: EBMLId.FileDescription,
						data: new EBMLUnicodeString(value.description)
					} : null,
					{
						id: EBMLId.FileName,
						data: new EBMLUnicodeString(value.name ?? "")
					},
					{
						id: EBMLId.FileMediaType,
						data: value.mimeType ?? ""
					},
					{
						id: EBMLId.FileData,
						data: value.data
					},
					{
						id: EBMLId.FileUID,
						data: BigInt(key)
					}
				]
			});
		}
		if (elements.length === 0) return;
		this.attachmentsElement = {
			id: EBMLId.Attachments,
			data: elements
		};
	}
	createSegment() {
		this.createTracks();
		this.maybeCreateTags();
		this.maybeCreateAttachments();
		this.maybeCreateSeekHead(false);
		const segment = {
			id: EBMLId.Segment,
			size: this.format._options.appendOnly ? -1 : SEGMENT_SIZE_BYTES,
			data: [
				this.seekHead,
				this.segmentInfo,
				this.tracksElement,
				this.attachmentsElement,
				this.tagsElement
			]
		};
		this.segment = segment;
		if (this.format._options.onSegmentHeader) this.writer.startTrackingWrites();
		this.ebmlWriter.writeEBML(segment);
		if (this.format._options.onSegmentHeader) {
			const { data, start } = this.writer.stopTrackingWrites();
			this.format._options.onSegmentHeader(data, start);
		}
	}
	createCues() {
		this.cues = {
			id: EBMLId.Cues,
			data: []
		};
	}
	get segmentDataOffset() {
		assert(this.segment);
		return this.ebmlWriter.dataOffsets.get(this.segment);
	}
	allTracksAreKnown() {
		for (const track of this.output._tracks) if (!track.source._closed && !this.trackDatas.some((x) => x.track === track)) return false;
		return true;
	}
	async getMimeType() {
		await this.allTracksKnown.promise;
		const codecStrings = this.trackDatas.map((trackData) => {
			if (trackData.type === "video") return trackData.info.decoderConfig.codec;
			else if (trackData.type === "audio") return trackData.info.decoderConfig.codec;
			else return { webvtt: "wvtt" }[trackData.track.source._codec];
		});
		return buildMatroskaMimeType({
			isWebM: this.format instanceof WebMOutputFormat,
			hasVideo: this.trackDatas.some((x) => x.type === "video"),
			hasAudio: this.trackDatas.some((x) => x.type === "audio"),
			codecStrings
		});
	}
	getVideoTrackData(track, packet, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateVideoChunkMetadata(meta);
		assert(meta);
		assert(meta.decoderConfig);
		assert(meta.decoderConfig.codedWidth !== void 0);
		assert(meta.decoderConfig.codedHeight !== void 0);
		const displayAspectWidth = meta.decoderConfig.displayAspectWidth;
		const displayAspectHeight = meta.decoderConfig.displayAspectHeight;
		const aspectRatio = displayAspectWidth === void 0 || displayAspectHeight === void 0 ? null : simplifyRational({
			num: displayAspectWidth,
			den: displayAspectHeight
		});
		const newTrackData = {
			track,
			type: "video",
			info: {
				width: meta.decoderConfig.codedWidth,
				height: meta.decoderConfig.codedHeight,
				aspectRatio,
				decoderConfig: meta.decoderConfig,
				alphaMode: !!packet.sideData.alpha
			},
			chunkQueue: [],
			lastWrittenMsTimestamp: null,
			closed: false
		};
		if (track.source._codec === "vp9") newTrackData.info.decoderConfig = {
			...newTrackData.info.decoderConfig,
			description: new Uint8Array(generateVp9CodecConfigurationFromCodecString(newTrackData.info.decoderConfig.codec))
		};
		else if (track.source._codec === "av1") newTrackData.info.decoderConfig = {
			...newTrackData.info.decoderConfig,
			description: new Uint8Array(generateAv1CodecConfigurationFromCodecString(newTrackData.info.decoderConfig.codec))
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	getAudioTrackData(track, packet, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateAudioChunkMetadata(meta);
		assert(meta);
		assert(meta.decoderConfig);
		const decoderConfig = { ...meta.decoderConfig };
		let requiresAdtsStripping = false;
		if (track.source._codec === "aac" && !decoderConfig.description) {
			const adtsFrame = readAdtsFrameHeader(FileSlice.tempFromBytes(packet.data));
			if (!adtsFrame) throw new Error("Couldn't parse ADTS header from the AAC packet. Make sure the packets are in ADTS format (as specified in ISO 13818-7) when not providing a description, or provide a description (must be an AudioSpecificConfig as specified in ISO 14496-3) and ensure the packets are raw AAC data.");
			const sampleRate = aacFrequencyTable[adtsFrame.samplingFrequencyIndex];
			const numberOfChannels = aacChannelMap[adtsFrame.channelConfiguration];
			if (sampleRate === void 0 || numberOfChannels === void 0) throw new Error("Invalid ADTS frame header.");
			decoderConfig.description = buildAacAudioSpecificConfig({
				objectType: adtsFrame.objectType,
				sampleRate,
				numberOfChannels
			});
			requiresAdtsStripping = true;
		}
		const newTrackData = {
			track,
			type: "audio",
			info: {
				numberOfChannels: meta.decoderConfig.numberOfChannels,
				sampleRate: meta.decoderConfig.sampleRate,
				decoderConfig,
				requiresAdtsStripping
			},
			chunkQueue: [],
			lastWrittenMsTimestamp: null,
			closed: false
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	getSubtitleTrackData(track, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateSubtitleMetadata(meta);
		assert(meta);
		assert(meta.config);
		const newTrackData = {
			track,
			type: "subtitle",
			info: { config: meta.config },
			chunkQueue: [],
			lastWrittenMsTimestamp: null,
			closed: false
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	async addEncodedVideoPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getVideoTrackData(track, packet, meta);
			const isKeyFrame = packet.type === "key";
			this.validateTimestamp(trackData.track, packet.timestamp, isKeyFrame);
			let timestamp = packet.timestamp;
			let duration = packet.duration;
			if (track.metadata.frameRate !== void 0) {
				timestamp = roundToDivisor(timestamp, track.metadata.frameRate);
				duration = roundToDivisor(duration, track.metadata.frameRate);
			}
			const additions = trackData.info.alphaMode ? packet.sideData.alpha ?? null : null;
			const videoChunk = this.createInternalChunk(packet.data, timestamp, duration, packet.type, additions);
			if (track.source._codec === "vp9") this.fixVP9ColorSpace(trackData, videoChunk);
			trackData.chunkQueue.push(videoChunk);
			await this.interleaveChunks();
		} finally {
			release();
		}
	}
	async addEncodedAudioPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getAudioTrackData(track, packet, meta);
			let packetData = packet.data;
			if (trackData.info.requiresAdtsStripping) {
				const adtsFrame = readAdtsFrameHeader(FileSlice.tempFromBytes(packetData));
				if (!adtsFrame) throw new Error("Expected ADTS frame, didn't get one.");
				const headerLength = adtsFrame.crcCheck === null ? 7 : 9;
				packetData = packetData.subarray(headerLength);
			}
			const isKeyFrame = packet.type === "key";
			this.validateTimestamp(trackData.track, packet.timestamp, isKeyFrame);
			const audioChunk = this.createInternalChunk(packetData, packet.timestamp, packet.duration, packet.type);
			trackData.chunkQueue.push(audioChunk);
			await this.interleaveChunks();
		} finally {
			release();
		}
	}
	async addSubtitleCue(track, cue, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getSubtitleTrackData(track, meta);
			this.validateTimestamp(trackData.track, cue.timestamp, true);
			let bodyText = cue.text;
			const timestampMs = Math.round(cue.timestamp * 1e3);
			inlineTimestampRegex.lastIndex = 0;
			bodyText = bodyText.replace(inlineTimestampRegex, (match) => {
				const offsetTime = parseSubtitleTimestamp(match.slice(1, -1)) - timestampMs;
				return \`<\${formatSubtitleTimestamp(offsetTime)}>\`;
			});
			const body = textEncoder.encode(bodyText);
			const additions = \`\${cue.settings ?? ""}\\n\${cue.identifier ?? ""}\\n\${cue.notes ?? ""}\`;
			const subtitleChunk = this.createInternalChunk(body, cue.timestamp, cue.duration, "key", additions.trim() ? textEncoder.encode(additions) : null);
			trackData.chunkQueue.push(subtitleChunk);
			await this.interleaveChunks();
		} finally {
			release();
		}
	}
	async interleaveChunks(isFinalCall = false) {
		if (!isFinalCall && !this.allTracksAreKnown()) return;
		outer: while (true) {
			let trackWithMinTimestamp = null;
			let minTimestamp = Infinity;
			for (const trackData of this.trackDatas) {
				if (!isFinalCall && trackData.chunkQueue.length === 0 && !trackData.closed) break outer;
				if (trackData.chunkQueue.length > 0 && trackData.chunkQueue[0].timestamp < minTimestamp) {
					trackWithMinTimestamp = trackData;
					minTimestamp = trackData.chunkQueue[0].timestamp;
				}
			}
			if (!trackWithMinTimestamp) break;
			const chunk = trackWithMinTimestamp.chunkQueue.shift();
			this.writeBlock(trackWithMinTimestamp, chunk);
		}
		if (!isFinalCall) await this.writer.flush();
	}
	/**
	* Due to [a bug in Chromium](https://bugs.chromium.org/p/chromium/issues/detail?id=1377842), VP9 streams often
	* lack color space information. This method patches in that information.
	*/
	fixVP9ColorSpace(trackData, chunk) {
		if (chunk.type !== "key") return;
		if (!trackData.info.decoderConfig.colorSpace || !trackData.info.decoderConfig.colorSpace.matrix) return;
		const bitstream = new Bitstream(chunk.data);
		bitstream.skipBits(2);
		const profileLowBit = bitstream.readBits(1);
		const profile = (bitstream.readBits(1) << 1) + profileLowBit;
		if (profile === 3) bitstream.skipBits(1);
		if (bitstream.readBits(1)) return;
		if (bitstream.readBits(1) !== 0) return;
		bitstream.skipBits(2);
		if (bitstream.readBits(24) !== 4817730) return;
		if (profile >= 2) bitstream.skipBits(1);
		const colorSpaceID = {
			rgb: 7,
			bt709: 2,
			bt470bg: 1,
			smpte170m: 3
		}[trackData.info.decoderConfig.colorSpace.matrix];
		writeBits(chunk.data, bitstream.pos, bitstream.pos + 3, colorSpaceID);
	}
	/** Converts a read-only external chunk into an internal one for easier use. */
	createInternalChunk(data, timestamp, duration, type, additions = null) {
		return {
			data,
			type,
			timestamp,
			duration,
			additions
		};
	}
	/** Writes a block containing media data to the file. */
	writeBlock(trackData, chunk) {
		if (!this.segment) this.createSegment();
		const msTimestamp = Math.round(1e3 * chunk.timestamp);
		const keyFrameQueuedEverywhere = this.trackDatas.every((otherTrackData) => {
			if (trackData === otherTrackData) return chunk.type === "key";
			const firstQueuedSample = otherTrackData.chunkQueue[0];
			if (firstQueuedSample) return firstQueuedSample.type === "key";
			return otherTrackData.closed;
		});
		let shouldCreateNewCluster = false;
		if (!this.currentCluster) shouldCreateNewCluster = true;
		else {
			assert(this.currentClusterStartMsTimestamp !== null);
			assert(this.currentClusterMaxMsTimestamp !== null);
			const relativeTimestamp = msTimestamp - this.currentClusterStartMsTimestamp;
			shouldCreateNewCluster = keyFrameQueuedEverywhere && msTimestamp > this.currentClusterMaxMsTimestamp && relativeTimestamp >= 1e3 * (this.format._options.minimumClusterDuration ?? 1) || relativeTimestamp > MAX_CLUSTER_TIMESTAMP_MS;
		}
		if (shouldCreateNewCluster) this.createNewCluster(msTimestamp);
		const relativeTimestamp = msTimestamp - this.currentClusterStartMsTimestamp;
		if (relativeTimestamp < MIN_CLUSTER_TIMESTAMP_MS) return;
		const prelude = /* @__PURE__ */ new Uint8Array(4);
		const view = new DataView(prelude.buffer);
		view.setUint8(0, 128 | trackData.track.id);
		view.setInt16(1, relativeTimestamp, false);
		const msDuration = Math.round(1e3 * chunk.duration);
		if (!chunk.additions) {
			view.setUint8(3, Number(chunk.type === "key") << 7);
			const simpleBlock = {
				id: EBMLId.SimpleBlock,
				data: [prelude, chunk.data]
			};
			this.ebmlWriter.writeEBML(simpleBlock);
		} else {
			const blockGroup = {
				id: EBMLId.BlockGroup,
				data: [
					{
						id: EBMLId.Block,
						data: [prelude, chunk.data]
					},
					chunk.type === "delta" ? {
						id: EBMLId.ReferenceBlock,
						data: new EBMLSignedInt(trackData.lastWrittenMsTimestamp - msTimestamp)
					} : null,
					chunk.additions ? {
						id: EBMLId.BlockAdditions,
						data: [{
							id: EBMLId.BlockMore,
							data: [{
								id: EBMLId.BlockAddID,
								data: 1
							}, {
								id: EBMLId.BlockAdditional,
								data: chunk.additions
							}]
						}]
					} : null,
					msDuration > 0 ? {
						id: EBMLId.BlockDuration,
						data: msDuration
					} : null
				]
			};
			this.ebmlWriter.writeEBML(blockGroup);
		}
		this.startTimestamp = Math.min(this.startTimestamp, msTimestamp);
		this.endTimestamp = Math.max(this.endTimestamp, msTimestamp + msDuration);
		trackData.lastWrittenMsTimestamp = msTimestamp;
		if (!this.trackDatasInCurrentCluster.has(trackData)) this.trackDatasInCurrentCluster.set(trackData, { firstMsTimestamp: msTimestamp });
		this.currentClusterMaxMsTimestamp = Math.max(this.currentClusterMaxMsTimestamp, msTimestamp);
	}
	/** Creates a new Cluster element to contain media chunks. */
	createNewCluster(msTimestamp) {
		if (this.currentCluster) this.finalizeCurrentCluster();
		if (this.format._options.onCluster) this.writer.startTrackingWrites();
		this.currentCluster = {
			id: EBMLId.Cluster,
			size: this.format._options.appendOnly ? -1 : CLUSTER_SIZE_BYTES,
			data: [{
				id: EBMLId.Timestamp,
				data: msTimestamp
			}]
		};
		this.ebmlWriter.writeEBML(this.currentCluster);
		this.currentClusterStartMsTimestamp = msTimestamp;
		this.currentClusterMaxMsTimestamp = msTimestamp;
		this.trackDatasInCurrentCluster.clear();
	}
	finalizeCurrentCluster() {
		assert(this.currentCluster);
		if (!this.format._options.appendOnly) {
			const clusterSize = this.writer.getPos() - this.ebmlWriter.dataOffsets.get(this.currentCluster);
			const endPos = this.writer.getPos();
			this.writer.seek(this.ebmlWriter.offsets.get(this.currentCluster) + 4);
			this.ebmlWriter.writeVarInt(clusterSize, CLUSTER_SIZE_BYTES);
			this.writer.seek(endPos);
		}
		if (this.format._options.onCluster) {
			assert(this.currentClusterStartMsTimestamp !== null);
			const { data, start } = this.writer.stopTrackingWrites();
			this.format._options.onCluster(data, start, this.currentClusterStartMsTimestamp / 1e3);
		}
		const clusterOffsetFromSegment = this.ebmlWriter.offsets.get(this.currentCluster) - this.segmentDataOffset;
		const groupedByTimestamp = /* @__PURE__ */ new Map();
		for (const [trackData, { firstMsTimestamp }] of this.trackDatasInCurrentCluster) {
			if (!groupedByTimestamp.has(firstMsTimestamp)) groupedByTimestamp.set(firstMsTimestamp, []);
			groupedByTimestamp.get(firstMsTimestamp).push(trackData);
		}
		const groupedAndSortedByTimestamp = [...groupedByTimestamp.entries()].sort((a, b) => a[0] - b[0]);
		for (const [msTimestamp, trackDatas] of groupedAndSortedByTimestamp) {
			assert(this.cues);
			this.cues.data.push({
				id: EBMLId.CuePoint,
				data: [{
					id: EBMLId.CueTime,
					data: msTimestamp
				}, ...trackDatas.map((trackData) => {
					return {
						id: EBMLId.CueTrackPositions,
						data: [{
							id: EBMLId.CueTrack,
							data: trackData.track.id
						}, {
							id: EBMLId.CueClusterPosition,
							data: clusterOffsetFromSegment
						}]
					};
				})]
			});
		}
	}
	async onTrackClose(track) {
		const release = await this.mutex.acquire();
		const trackData = this.trackDatas.find((x) => x.track === track);
		if (trackData) trackData.closed = true;
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		await this.interleaveChunks();
		release();
	}
	/** Finalizes the file, making it ready for use. Must be called after all media chunks have been added. */
	async finalize() {
		const release = await this.mutex.acquire();
		this.allTracksKnown.resolve();
		for (const trackData of this.trackDatas) trackData.closed = true;
		if (!this.segment) this.createSegment();
		await this.interleaveChunks(true);
		if (this.currentCluster) this.finalizeCurrentCluster();
		assert(this.cues);
		this.ebmlWriter.writeEBML(this.cues);
		if (!this.format._options.appendOnly) {
			const segmentSize = this.writer.getPos() - this.segmentDataOffset;
			this.writer.seek(this.ebmlWriter.offsets.get(this.segment) + 4);
			this.ebmlWriter.writeVarInt(segmentSize, SEGMENT_SIZE_BYTES);
			const duration = this.startTimestamp === Infinity ? 0 : this.endTimestamp - this.startTimestamp;
			this.segmentDuration.data = new EBMLFloat64(duration);
			this.writer.seek(this.ebmlWriter.offsets.get(this.segmentDuration));
			this.ebmlWriter.writeEBML(this.segmentDuration);
			assert(this.seekHead);
			this.writer.seek(this.ebmlWriter.offsets.get(this.seekHead));
			this.maybeCreateSeekHead(true);
			this.ebmlWriter.writeEBML(this.seekHead);
		}
		release();
	}
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/media-source.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* Base class for media sources. Media sources are used to add media samples to an output file.
* @group Media sources
* @public
*/
var MediaSource = class {
	constructor() {
		/** @internal */
		this._connectedTrack = null;
		/** @internal */
		this._closingPromise = null;
		/** @internal */
		this._closed = false;
	}
	/** @internal */
	_ensureValidAdd() {
		if (!this._connectedTrack) throw new Error("Source is not connected to an output track.");
		if (this._connectedTrack.output.state === "canceled") throw new Error("Output has been canceled.");
		if (this._connectedTrack.output.state === "finalizing" || this._connectedTrack.output.state === "finalized") throw new Error("Output has been finalized.");
		if (this._connectedTrack.output.state === "pending") throw new Error("Output has not started.");
		if (this._closed) throw new Error("Source is closed.");
	}
	/** @internal */
	async _start() {}
	/** @internal */
	async _flushAndClose(forceClose) {}
	/**
	* Closes this source. This prevents future samples from being added and signals to the output file that no further
	* samples will come in for this track. Calling \`.close()\` is optional but recommended after adding the
	* last sample - for improved performance and reduced memory usage.
	*/
	close() {
		if (this._closingPromise) return;
		const connectedTrack = this._connectedTrack;
		if (!connectedTrack) throw new Error("Cannot call close without connecting the source to an output track.");
		if (connectedTrack.output.state === "pending") throw new Error("Cannot call close before output has been started.");
		this._closingPromise = (async () => {
			await this._flushAndClose(false);
			this._closed = true;
			if (connectedTrack.output.state === "finalizing" || connectedTrack.output.state === "finalized") return;
			connectedTrack.output._muxer.onTrackClose(connectedTrack);
		})();
	}
	/** @internal */
	async _flushOrWaitForOngoingClose(forceClose) {
		return this._closingPromise ??= (async () => {
			await this._flushAndClose(forceClose);
			this._closed = true;
		})();
	}
};
/**
* Base class for video sources - sources for video tracks.
* @group Media sources
* @public
*/
var VideoSource = class extends MediaSource {
	/** Internal constructor. */
	constructor(codec) {
		super();
		/** @internal */
		this._connectedTrack = null;
		if (!VIDEO_CODECS.includes(codec)) throw new TypeError(\`Invalid video codec '\${codec}'. Must be one of: \${VIDEO_CODECS.join(", ")}.\`);
		this._codec = codec;
	}
};
const maybeEnsureIsKeyPacket = (track, packet) => {
	if (track.metadata.hasOnlyKeyPackets && packet.type !== "key") throw new Error("Cannot add non-key packets to a hasOnlyKeyPackets video track.");
};
var VideoEncoderWrapper = class {
	constructor(source, encodingConfig) {
		this.source = source;
		this.encodingConfig = encodingConfig;
		this.ensureEncoderPromise = null;
		this.encoderInitialized = false;
		this.encoder = null;
		this.muxer = null;
		this.lastMultipleOfKeyFrameInterval = -1;
		this.emittedEncoderPackets = 0;
		this.codedWidth = null;
		this.codedHeight = null;
		this.outputWidth = null;
		this.outputHeight = null;
		this.frameRateLastSample = null;
		this.frameRateLastTimestamp = null;
		this.frameRateLastEndTimestamp = null;
		this.preciseTimings = [];
		this.customEncoder = null;
		this.customEncoderCallSerializer = new CallSerializer();
		this.customEncoderQueueSize = 0;
		this.alphaEncoder = null;
		this.splitter = null;
		this.splitterCreationFailed = false;
		this.alphaFrameQueue = [];
		/**
		* Encoders typically throw their errors "out of band", meaning asynchronously in some other execution context.
		* However, we want to surface these errors to the user within the normal control flow, so they don't go uncaught.
		* So, we keep track of the encoder error and throw it as soon as we get the chance.
		*/
		this.error = null;
		this.closed = false;
		this.lastMuxerPromise = Promise.resolve();
	}
	async add(videoSample, shouldClose, encodeOptions) {
		const originalSample = videoSample;
		try {
			this.checkForEncoderError();
			this.source._ensureValidAdd();
			const config = this.encodingConfig;
			const sizeChangeBehavior = config.sizeChangeBehavior ?? "deny";
			let isSizeChange = false;
			if (this.codedWidth !== null && this.codedHeight !== null) {
				if (videoSample.codedWidth !== this.codedWidth || videoSample.codedHeight !== this.codedHeight) {
					isSizeChange = true;
					if (sizeChangeBehavior === "deny") throw new Error(\`Video sample size must remain constant. Expected \${this.codedWidth}x\${this.codedHeight}, got \${videoSample.codedWidth}x\${videoSample.codedHeight}. To allow the sample size to change over time, set \\\`sizeChangeBehavior\\\` to a value other than 'deny' in the encoding options.\`);
				}
			} else {
				this.codedWidth = videoSample.codedWidth;
				this.codedHeight = videoSample.codedHeight;
			}
			if (config.transform?.width !== void 0 || config.transform?.height !== void 0 || config.transform?.rotate !== void 0 || config.transform?.crop !== void 0 || config.transform?.force === true || isSizeChange && sizeChangeBehavior !== "passThrough") {
				let targetWidth = config.transform?.width;
				let targetHeight = config.transform?.height;
				let appliedFit = config.transform?.fit ?? "fill";
				if (isSizeChange && sizeChangeBehavior !== "passThrough") {
					assert(this.outputWidth);
					assert(this.outputHeight);
					assert(sizeChangeBehavior !== "deny");
					targetWidth = this.outputWidth;
					targetHeight = this.outputHeight;
					appliedFit = sizeChangeBehavior;
				}
				const transformed = await videoSample.transform({
					width: targetWidth,
					height: targetHeight,
					roundDimensionsTo: 2,
					crop: config.transform?.crop,
					rotate: config.transform?.rotate,
					fit: appliedFit,
					alpha: config.alpha
				});
				if (this.outputWidth === null || this.outputHeight === null) {
					this.outputWidth = transformed.displayWidth;
					this.outputHeight = transformed.displayHeight;
				}
				if (shouldClose) videoSample.close();
				videoSample = transformed;
				shouldClose = true;
			} else if (this.outputWidth === null || this.outputHeight === null) {
				this.outputWidth = videoSample.codedWidth;
				this.outputHeight = videoSample.codedHeight;
			}
			const frameRate = config.transform?.frameRate;
			if (frameRate !== void 0) {
				const originalEndTimestamp = videoSample.timestamp + videoSample.duration;
				const alignedTimestamp = floorToDivisor(videoSample.timestamp, frameRate);
				if (this.frameRateLastSample !== null) {
					if (alignedTimestamp <= this.frameRateLastTimestamp) {
						this.frameRateLastSample.close();
						this.frameRateLastSample = videoSample.clone();
						this.frameRateLastEndTimestamp = originalEndTimestamp;
						return;
					} else await this.padFrameRate(alignedTimestamp, encodeOptions);
				}
				if (videoSample === originalSample) {
					videoSample = videoSample.clone();
					shouldClose = true;
				}
				videoSample.setTimestamp(alignedTimestamp);
				videoSample.setDuration(1 / frameRate);
				this.frameRateLastSample?.close();
				this.frameRateLastSample = videoSample.clone();
				this.frameRateLastTimestamp = alignedTimestamp;
				this.frameRateLastEndTimestamp = originalEndTimestamp;
			}
			await this.processAndEncode(videoSample, encodeOptions);
		} finally {
			if (shouldClose) videoSample.close();
		}
	}
	/**
	* Runs the process function (if any) and encodes the resulting samples.
	*/
	async processAndEncode(videoSample, encodeOptions) {
		const config = this.encodingConfig;
		let samplesToEncode;
		if (config.transform?.process) {
			let processed = config.transform.process(videoSample);
			if (processed instanceof Promise) processed = await processed;
			if (processed === null) return;
			if (!Array.isArray(processed)) processed = [processed];
			samplesToEncode = processed.map((x) => {
				if (x instanceof VideoSample) return x;
				if (typeof VideoFrame !== "undefined" && x instanceof VideoFrame) return new VideoSample(x);
				return new VideoSample(x, {
					timestamp: videoSample.timestamp,
					duration: videoSample.duration
				});
			});
		} else samplesToEncode = [videoSample];
		try {
			for (const sampleToEncode of samplesToEncode) {
				if (!this.encoderInitialized) {
					if (!this.ensureEncoderPromise) this.ensureEncoder(sampleToEncode);
					if (!this.encoderInitialized) await this.ensureEncoderPromise;
				}
				assert(this.encoderInitialized);
				if (this.closed) break;
				const keyFrameInterval = this.encodingConfig.keyFrameInterval ?? 2;
				const multipleOfKeyFrameInterval = Math.floor(sampleToEncode.timestamp / keyFrameInterval);
				const mergedEncodeOptions = {
					...sampleToEncode.encodeOptions,
					...encodeOptions
				};
				const finalEncodeOptions = {
					...mergedEncodeOptions,
					keyFrame: mergedEncodeOptions.keyFrame !== void 0 ? mergedEncodeOptions.keyFrame : keyFrameInterval === 0 || multipleOfKeyFrameInterval !== this.lastMultipleOfKeyFrameInterval
				};
				this.lastMultipleOfKeyFrameInterval = multipleOfKeyFrameInterval;
				this.encodingConfig.onEncodedSample?.(sampleToEncode);
				if (this.customEncoder) {
					this.customEncoderQueueSize++;
					const clonedSample = sampleToEncode.clone();
					const promise = this.customEncoderCallSerializer.call(() => this.customEncoder.encode(clonedSample, finalEncodeOptions)).then(() => this.customEncoderQueueSize--).catch((error) => this.error ??= error).finally(() => {
						clonedSample.close();
					});
					if (this.customEncoderQueueSize >= 4) await promise;
				} else {
					assert(this.encoder);
					const videoFrame = sampleToEncode.toVideoFrame();
					const preciseTimingIndex = binarySearchLessOrEqual(this.preciseTimings, videoFrame.timestamp, (x) => x.microsecondTimestamp);
					const existingEntry = preciseTimingIndex !== -1 ? this.preciseTimings[preciseTimingIndex] : null;
					if (existingEntry && existingEntry.microsecondTimestamp === videoFrame.timestamp) {
						if (existingEntry.timestamp !== sampleToEncode.timestamp) existingEntry.timestampIsValid = false;
						if (existingEntry.duration !== sampleToEncode.duration) existingEntry.durationIsValid = false;
					} else {
						this.preciseTimings.splice(preciseTimingIndex + 1, 0, {
							microsecondTimestamp: videoFrame.timestamp,
							timestamp: sampleToEncode.timestamp,
							duration: sampleToEncode.duration,
							timestampIsValid: true,
							durationIsValid: true
						});
						if (this.preciseTimings.length > 128) this.preciseTimings.shift();
					}
					if (!this.alphaEncoder) {
						this.encoder.encode(videoFrame, finalEncodeOptions);
						videoFrame.close();
					} else if (!!videoFrame.format && !videoFrame.format.includes("A") || this.splitterCreationFailed) {
						this.alphaFrameQueue.push(null);
						this.encoder.encode(videoFrame, finalEncodeOptions);
						videoFrame.close();
					} else {
						const width = videoFrame.displayWidth;
						const height = videoFrame.displayHeight;
						if (!this.splitter) this.splitter = new ColorAlphaSplitter(width, height);
						const { colorFrame, alphaFrame } = await this.splitter.update(videoFrame);
						this.alphaFrameQueue.push(alphaFrame);
						this.encoder.encode(colorFrame, finalEncodeOptions);
						colorFrame.close();
					}
					if (this.encoder.encodeQueueSize >= 4) await new Promise((resolve) => this.encoder.addEventListener("dequeue", resolve, { once: true }));
				}
				await this.lastMuxerPromise;
			}
		} finally {
			for (const sample of samplesToEncode) if (sample !== videoSample) sample.close();
		}
	}
	/** Repeats the last frame rate sample to fill the gap up to the given timestamp. */
	async padFrameRate(until, encodeOptions) {
		const frameRate = this.encodingConfig.transform.frameRate;
		assert(this.frameRateLastSample);
		const frameDifference = Math.round((until - this.frameRateLastTimestamp) * frameRate);
		for (let i = 1; i < frameDifference; i++) {
			const sample = this.frameRateLastSample.clone();
			sample.setTimestamp(this.frameRateLastTimestamp + i / frameRate);
			sample.setDuration(1 / frameRate);
			await this.processAndEncode(sample, encodeOptions);
			sample.close();
		}
	}
	ensureEncoder(videoSample) {
		this.ensureEncoderPromise = (async () => {
			const encoderConfig = buildVideoEncoderConfig({
				...this.encodingConfig,
				width: videoSample.codedWidth,
				height: videoSample.codedHeight,
				squarePixelWidth: videoSample.squarePixelWidth,
				squarePixelHeight: videoSample.squarePixelHeight,
				framerate: this.source._connectedTrack?.metadata.frameRate
			});
			this.encodingConfig.onEncoderConfig?.(encoderConfig);
			const MatchingCustomEncoder = customVideoEncoders.find((x) => x.supports(this.encodingConfig.codec, encoderConfig));
			if (MatchingCustomEncoder) {
				this.customEncoder = new MatchingCustomEncoder();
				this.customEncoder.codec = this.encodingConfig.codec;
				this.customEncoder.config = encoderConfig;
				this.customEncoder.onPacket = (packet, meta) => {
					if (!(packet instanceof EncodedPacket)) throw new TypeError("The first argument passed to onPacket must be an EncodedPacket.");
					if (meta !== void 0 && (!meta || typeof meta !== "object")) throw new TypeError("The second argument passed to onPacket must be an object or undefined.");
					maybeEnsureIsKeyPacket(this.source._connectedTrack, packet);
					this.encodingConfig.onEncodedPacket?.(packet, meta);
					this.lastMuxerPromise = this.muxer.addEncodedVideoPacket(this.source._connectedTrack, packet, meta).catch((error) => {
						this.error ??= error;
					});
				};
				await this.customEncoder.init();
			} else {
				if (typeof VideoEncoder === "undefined") throw new Error("VideoEncoder is not supported by this browser.");
				encoderConfig.alpha = "discard";
				if (this.encodingConfig.alpha === "keep") encoderConfig.latencyMode = "quality";
				if ((encoderConfig.width % 2 === 1 || encoderConfig.height % 2 === 1) && (this.encodingConfig.codec === "avc" || this.encodingConfig.codec === "hevc")) throw new Error(\`The dimensions \${encoderConfig.width}x\${encoderConfig.height} are not supported for codec '\${this.encodingConfig.codec}'; both width and height must be even numbers. Make sure to round your dimensions to the nearest even number.\`);
				if (!(await VideoEncoder.isConfigSupported(encoderConfig)).supported) throw new Error(\`This specific encoder configuration (\${encoderConfig.codec}, \${encoderConfig.bitrate} bps, \${encoderConfig.width}x\${encoderConfig.height}, hardware acceleration: \${encoderConfig.hardwareAcceleration ?? "no-preference"}) is not supported by this browser. Consider using another codec or changing your video parameters.\`);
				/** Queue of color chunks waiting for their alpha counterpart. */
				const colorChunkQueue = [];
				/** Each value is the number of encoded alpha chunks at which a null alpha chunk should be added. */
				const nullAlphaChunkQueue = [];
				let encodedAlphaChunkCount = 0;
				let alphaEncoderQueue = 0;
				const addPacket = (colorChunk, alphaChunk, meta) => {
					const sideData = {};
					if (alphaChunk) {
						const alphaData = new Uint8Array(alphaChunk.byteLength);
						alphaChunk.copyTo(alphaData);
						sideData.alpha = alphaData;
					}
					let packet = EncodedPacket.fromEncodedChunk(colorChunk, sideData);
					const preciseTimingIndex = binarySearchLessOrEqual(this.preciseTimings, colorChunk.timestamp, (x) => x.microsecondTimestamp);
					const entry = preciseTimingIndex !== -1 ? this.preciseTimings[preciseTimingIndex] : null;
					let actualType = null;
					if (this.emittedEncoderPackets === 0 && packet.type === "delta" && meta?.decoderConfig) actualType = determineVideoPacketType(this.encodingConfig.codec, meta.decoderConfig, packet.data);
					if (entry && entry.microsecondTimestamp === colorChunk.timestamp || actualType !== null) packet = packet.clone({
						timestamp: entry?.timestampIsValid ? entry.timestamp : void 0,
						duration: entry?.durationIsValid ? entry.duration : void 0,
						type: actualType ?? void 0
					});
					maybeEnsureIsKeyPacket(this.source._connectedTrack, packet);
					this.encodingConfig.onEncodedPacket?.(packet, meta);
					this.lastMuxerPromise = this.muxer.addEncodedVideoPacket(this.source._connectedTrack, packet, meta).catch((error) => {
						this.error ??= error;
					});
					this.emittedEncoderPackets++;
				};
				const stack = (/* @__PURE__ */ new Error("Encoding error")).stack;
				this.encoder = new VideoEncoder({
					output: (chunk, meta) => {
						if (!this.alphaEncoder) {
							addPacket(chunk, null, meta);
							return;
						}
						const alphaFrame = this.alphaFrameQueue.shift();
						assert(alphaFrame !== void 0);
						if (alphaFrame) {
							this.alphaEncoder.encode(alphaFrame, { keyFrame: chunk.type === "key" });
							alphaEncoderQueue++;
							alphaFrame.close();
							colorChunkQueue.push({
								chunk,
								meta
							});
						} else if (alphaEncoderQueue === 0) addPacket(chunk, null, meta);
						else {
							nullAlphaChunkQueue.push(encodedAlphaChunkCount + alphaEncoderQueue);
							colorChunkQueue.push({
								chunk,
								meta
							});
						}
					},
					error: (error) => {
						error.stack = stack;
						this.error ??= error;
					}
				});
				this.encoder.configure(encoderConfig);
				if (this.encodingConfig.alpha === "keep") {
					const stack = (/* @__PURE__ */ new Error("Encoding error")).stack;
					this.alphaEncoder = new VideoEncoder({
						output: (chunk, meta) => {
							alphaEncoderQueue--;
							const colorChunk = colorChunkQueue.shift();
							assert(colorChunk !== void 0);
							addPacket(colorChunk.chunk, chunk, colorChunk.meta);
							encodedAlphaChunkCount++;
							while (nullAlphaChunkQueue.length > 0 && nullAlphaChunkQueue[0] === encodedAlphaChunkCount) {
								nullAlphaChunkQueue.shift();
								const colorChunk = colorChunkQueue.shift();
								assert(colorChunk !== void 0);
								addPacket(colorChunk.chunk, null, colorChunk.meta);
							}
						},
						error: (error) => {
							error.stack = stack;
							this.error ??= error;
						}
					});
					this.alphaEncoder.configure(encoderConfig);
				}
			}
			assert(this.source._connectedTrack);
			this.muxer = this.source._connectedTrack.output._muxer;
			this.encoderInitialized = true;
		})();
	}
	async flushAndClose(forceClose) {
		if (!forceClose) this.checkForEncoderError();
		if (!forceClose && this.frameRateLastSample) {
			const frameRate = this.encodingConfig.transform.frameRate;
			const alignedEnd = floorToDivisor(this.frameRateLastEndTimestamp, frameRate);
			await this.padFrameRate(alignedEnd);
		}
		this.closed = true;
		this.frameRateLastSample?.close();
		this.frameRateLastSample = null;
		if (this.customEncoder) {
			if (!forceClose) this.customEncoderCallSerializer.call(() => this.customEncoder.flush());
			await this.customEncoderCallSerializer.call(() => this.customEncoder.close());
		} else if (this.encoder) {
			if (!forceClose) {
				await this.encoder.flush();
				await this.alphaEncoder?.flush();
			}
			if (this.encoder.state !== "closed") this.encoder.close();
			if (this.alphaEncoder && this.alphaEncoder.state !== "closed") this.alphaEncoder.close();
			this.alphaFrameQueue.forEach((x) => x?.close());
			this.splitter?.close();
		}
		if (!forceClose) this.checkForEncoderError();
	}
	getQueueSize() {
		if (this.customEncoder) return this.customEncoderQueueSize;
		else return this.encoder?.encodeQueueSize ?? 0;
	}
	checkForEncoderError() {
		if (this.error) throw this.error;
	}
};
let splitterGpuUnavailable = false;
/** Utility class for splitting a composite frame into separate color and alpha components. */
var ColorAlphaSplitter = class ColorAlphaSplitter {
	constructor(initialWidth, initialHeight) {
		this.canvas = null;
		this.gl = null;
		this.colorProgram = null;
		this.alphaProgram = null;
		this.vao = null;
		this.sourceTexture = null;
		this.alphaResolutionLocation = null;
		this.worker = null;
		this.pendingRequests = /* @__PURE__ */ new Map();
		this.nextRequestId = 0;
		const canMakeCanvas = typeof OffscreenCanvas !== "undefined" || typeof document !== "undefined" && typeof document.createElement === "function";
		if (!ColorAlphaSplitter.forceCpu && canMakeCanvas && !splitterGpuUnavailable) try {
			if (typeof OffscreenCanvas !== "undefined") this.canvas = new OffscreenCanvas(initialWidth, initialHeight);
			else {
				this.canvas = document.createElement("canvas");
				this.canvas.width = initialWidth;
				this.canvas.height = initialHeight;
			}
			const gl = this.canvas.getContext("webgl2", { alpha: true });
			if (!gl) throw new Error("Couldn't acquire WebGL 2 context.");
			this.gl = gl;
			this.colorProgram = this.createColorProgram();
			this.alphaProgram = this.createAlphaProgram();
			this.vao = this.createVAO();
			this.sourceTexture = this.createTexture();
			this.alphaResolutionLocation = this.gl.getUniformLocation(this.alphaProgram, "u_resolution");
			this.gl.useProgram(this.colorProgram);
			this.gl.uniform1i(this.gl.getUniformLocation(this.colorProgram, "u_sourceTexture"), 0);
			this.gl.useProgram(this.alphaProgram);
			this.gl.uniform1i(this.gl.getUniformLocation(this.alphaProgram, "u_sourceTexture"), 0);
		} catch (error) {
			this.gl = null;
			this.canvas = null;
			splitterGpuUnavailable = true;
			Logging._warn("Falling back to CPU for color/alpha splitting.", error);
		}
	}
	async update(sourceFrame) {
		if (this.gl) return this.updateGpu(sourceFrame);
		else return this.updateCpu(sourceFrame);
	}
	updateGpu(sourceFrame) {
		assert(this.gl);
		assert(this.canvas);
		if (sourceFrame.displayWidth !== this.canvas.width || sourceFrame.displayHeight !== this.canvas.height) {
			this.canvas.width = sourceFrame.displayWidth;
			this.canvas.height = sourceFrame.displayHeight;
		}
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.sourceTexture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, sourceFrame);
		const colorFrame = this.runColorProgram(sourceFrame);
		const alphaFrame = this.runAlphaProgram(sourceFrame);
		sourceFrame.close();
		return {
			colorFrame,
			alphaFrame
		};
	}
	createVertexShader() {
		assert(this.gl);
		return this.createShader(this.gl.VERTEX_SHADER, \`#version 300 es
			in vec2 a_position;
			in vec2 a_texCoord;
			out vec2 v_texCoord;
			
			void main() {
				gl_Position = vec4(a_position, 0.0, 1.0);
				v_texCoord = a_texCoord;
			}
		\`);
	}
	createColorProgram() {
		assert(this.gl);
		const vertexShader = this.createVertexShader();
		const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, \`#version 300 es
			precision highp float;
			
			uniform sampler2D u_sourceTexture;
			in vec2 v_texCoord;
			out vec4 fragColor;
			
			void main() {
				vec4 source = texture(u_sourceTexture, v_texCoord);
				fragColor = vec4(source.rgb, 1.0);
			}
		\`);
		const program = this.gl.createProgram();
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);
		return program;
	}
	createAlphaProgram() {
		assert(this.gl);
		const vertexShader = this.createVertexShader();
		const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, \`#version 300 es
			precision highp float;
			
			uniform sampler2D u_sourceTexture;
			uniform vec2 u_resolution; // The width and height of the canvas
			in vec2 v_texCoord;
			out vec4 fragColor;

			// This function determines the value for a single byte in the YUV stream
			float getByteValue(float byteOffset) {
				float width = u_resolution.x;
				float height = u_resolution.y;

				float yPlaneSize = width * height;

				if (byteOffset < yPlaneSize) {
					// This byte is in the luma plane. Find the corresponding pixel coordinates to sample from
					float y = floor(byteOffset / width);
					float x = mod(byteOffset, width);
					
					// Add 0.5 to sample the center of the texel
					vec2 sampleCoord = (vec2(x, y) + 0.5) / u_resolution;
					
					// The luma value is the alpha from the source texture
					return texture(u_sourceTexture, sampleCoord).a;
				} else {
					// Write a fixed value for chroma and beyond
					return 128.0 / 255.0;
				}
			}
			
			void main() {
				// Each fragment writes 4 bytes (R, G, B, A)
				float pixelIndex = floor(gl_FragCoord.y) * u_resolution.x + floor(gl_FragCoord.x);
				float baseByteOffset = pixelIndex * 4.0;

				vec4 result;
				for (int i = 0; i < 4; i++) {
					float currentByteOffset = baseByteOffset + float(i);
					result[i] = getByteValue(currentByteOffset);
				}
				
				fragColor = result;
			}
		\`);
		const program = this.gl.createProgram();
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);
		return program;
	}
	createShader(type, source) {
		assert(this.gl);
		const shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) Logging._error("Shader compile error:", this.gl.getShaderInfoLog(shader));
		return shader;
	}
	createVAO() {
		assert(this.gl);
		assert(this.colorProgram);
		const vao = this.gl.createVertexArray();
		this.gl.bindVertexArray(vao);
		const vertices = new Float32Array([
			-1,
			-1,
			0,
			1,
			1,
			-1,
			1,
			1,
			-1,
			1,
			0,
			0,
			1,
			1,
			1,
			0
		]);
		const buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
		const positionLocation = this.gl.getAttribLocation(this.colorProgram, "a_position");
		const texCoordLocation = this.gl.getAttribLocation(this.colorProgram, "a_texCoord");
		this.gl.enableVertexAttribArray(positionLocation);
		this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0);
		this.gl.enableVertexAttribArray(texCoordLocation);
		this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8);
		return vao;
	}
	createTexture() {
		assert(this.gl);
		const texture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
		return texture;
	}
	runColorProgram(sourceFrame) {
		assert(this.gl);
		assert(this.canvas);
		this.gl.useProgram(this.colorProgram);
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.gl.bindVertexArray(this.vao);
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
		return new VideoFrame(this.canvas, {
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0,
			alpha: "discard"
		});
	}
	runAlphaProgram(sourceFrame) {
		assert(this.gl);
		assert(this.canvas);
		this.gl.useProgram(this.alphaProgram);
		this.gl.uniform2f(this.alphaResolutionLocation, this.canvas.width, this.canvas.height);
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.gl.bindVertexArray(this.vao);
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
		const { width, height } = this.canvas;
		const chromaSamples = Math.ceil(width / 2) * Math.ceil(height / 2);
		const yuvSize = width * height + chromaSamples * 2;
		const requiredHeight = Math.ceil(yuvSize / (width * 4));
		let yuv = new Uint8Array(4 * width * requiredHeight);
		this.gl.readPixels(0, 0, width, requiredHeight, this.gl.RGBA, this.gl.UNSIGNED_BYTE, yuv);
		yuv = yuv.subarray(0, yuvSize);
		assert(yuv[width * height] === 128);
		assert(yuv[yuv.length - 1] === 128);
		const init = {
			format: "I420",
			codedWidth: width,
			codedHeight: height,
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0,
			transfer: [yuv.buffer]
		};
		return new VideoFrame(yuv, init);
	}
	updateCpu(sourceFrame) {
		if (!this.worker) {
			const blob = new Blob([\`(\${colorAlphaSplitterWorkerCode.toString()})()\`], { type: "application/javascript" });
			const url = URL.createObjectURL(blob);
			this.worker = new Worker(url);
			URL.revokeObjectURL(url);
			this.worker.addEventListener("message", (event) => {
				const data = event.data;
				const pending = this.pendingRequests.get(data.id);
				if (!pending) return;
				this.pendingRequests.delete(data.id);
				if ("error" in data) pending.reject(new Error(data.error));
				else pending.resolve({
					colorFrame: data.colorFrame,
					alphaFrame: data.alphaFrame
				});
			});
			this.worker.addEventListener("error", (event) => {
				const error = new Error(event.message || "Color/alpha splitter worker error.");
				for (const pending of this.pendingRequests.values()) pending.reject(error);
				this.pendingRequests.clear();
			});
		}
		const id = this.nextRequestId++;
		const pending = promiseWithResolvers();
		this.pendingRequests.set(id, pending);
		this.worker.postMessage({
			id,
			sourceFrame
		}, { transfer: [sourceFrame] });
		return pending.promise;
	}
	close() {
		this.gl?.getExtension("WEBGL_lose_context")?.loseContext();
		this.gl = null;
		this.canvas = null;
		this.worker?.terminate();
		this.worker = null;
		const error = /* @__PURE__ */ new Error("Color/alpha splitter closed.");
		for (const pending of this.pendingRequests.values()) pending.reject(error);
		this.pendingRequests.clear();
	}
};
ColorAlphaSplitter.forceCpu = true;
const colorAlphaSplitterWorkerCode = () => {
	let cpuSourceBuffer = null;
	let chain = Promise.resolve();
	self.addEventListener("message", (event) => {
		const { id, sourceFrame } = event.data;
		chain = chain.then(async () => {
			try {
				const { colorFrame, alphaFrame } = await split(sourceFrame);
				self.postMessage({
					id,
					colorFrame,
					alphaFrame
				}, { transfer: [colorFrame, alphaFrame] });
			} catch (error) {
				self.postMessage({
					id,
					error: error.message
				});
			} finally {
				sourceFrame.close();
			}
		});
	});
	const split = async (sourceFrame) => {
		const format = sourceFrame.format;
		if (!format) throw new Error("CPU color/alpha splitting requires a known VideoFrame format.");
		const width = sourceFrame.codedWidth;
		const height = sourceFrame.codedHeight;
		const sourceSize = sourceFrame.allocationSize();
		if (!cpuSourceBuffer || cpuSourceBuffer.byteLength !== sourceSize) cpuSourceBuffer = new Uint8Array(sourceSize);
		await sourceFrame.copyTo(cpuSourceBuffer);
		if (format === "RGBA" || format === "BGRA") return splitInterleavedRgba(cpuSourceBuffer, width, height, format, sourceFrame);
		else if (format === "I420A" || format === "I420AP10" || format === "I420AP12" || format === "I422A" || format === "I422AP10" || format === "I422AP12" || format === "I444A" || format === "I444AP10" || format === "I444AP12") return splitPlanarYuvA(cpuSourceBuffer, width, height, format, sourceFrame);
		throw new Error(\`CPU color/alpha splitting does not support format '\${format}'.\`);
	};
	const splitInterleavedRgba = (source, width, height, format, sourceFrame) => {
		const pixelCount = width * height;
		const alphaSize = pixelCount + Math.ceil(width / 2) * Math.ceil(height / 2) * 2;
		const alphaBuffer = new Uint8Array(alphaSize);
		for (let i = 0, j = 3; i < pixelCount; i++, j += 4) alphaBuffer[i] = source[j];
		alphaBuffer.fill(128, pixelCount);
		const colorFrame = new VideoFrame(source, {
			format: format === "RGBA" ? "RGBX" : "BGRX",
			codedWidth: width,
			codedHeight: height,
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0
		});
		const alphaInit = {
			format: "I420",
			codedWidth: width,
			codedHeight: height,
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0,
			transfer: [alphaBuffer.buffer]
		};
		return {
			colorFrame,
			alphaFrame: new VideoFrame(alphaBuffer, alphaInit)
		};
	};
	const splitPlanarYuvA = (source, width, height, format, sourceFrame) => {
		const is10 = format.includes("P10");
		const is12 = format.includes("P12");
		const bytesPerSample = is10 || is12 ? 2 : 1;
		let chromaW;
		let chromaH;
		if (format.startsWith("I420")) {
			chromaW = Math.ceil(width / 2);
			chromaH = Math.ceil(height / 2);
		} else if (format.startsWith("I422")) {
			chromaW = Math.ceil(width / 2);
			chromaH = height;
		} else {
			chromaW = width;
			chromaH = height;
		}
		const ySamples = width * height;
		const uvSamples = chromaW * chromaH;
		const yBytes = ySamples * bytesPerSample;
		const uvBytes = uvSamples * bytesPerSample;
		const aBytes = ySamples * bytesPerSample;
		const colorBytes = yBytes + uvBytes * 2;
		const colorFormat = format.replace("A", "");
		const alphaUvSamples = Math.ceil(width / 2) * Math.ceil(height / 2);
		const alphaSize = aBytes + 2 * (alphaUvSamples * bytesPerSample);
		const alphaBuffer = new Uint8Array(alphaSize);
		const aPlaneStart = colorBytes;
		alphaBuffer.set(source.subarray(aPlaneStart, aPlaneStart + aBytes), 0);
		const uvOffset = aBytes;
		const neutralChroma = is10 ? 512 : is12 ? 2048 : 128;
		if (bytesPerSample === 1) alphaBuffer.fill(neutralChroma, uvOffset);
		else new Uint16Array(alphaBuffer.buffer, uvOffset, 2 * alphaUvSamples).fill(neutralChroma);
		const alphaFormat = is10 ? "I420P10" : is12 ? "I420P12" : "I420";
		const colorFrame = new VideoFrame(source.subarray(0, colorBytes), {
			format: colorFormat,
			codedWidth: width,
			codedHeight: height,
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0
		});
		const alphaInit = {
			format: alphaFormat,
			codedWidth: width,
			codedHeight: height,
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0,
			transfer: [alphaBuffer.buffer]
		};
		return {
			colorFrame,
			alphaFrame: new VideoFrame(alphaBuffer, alphaInit)
		};
	};
};
/**
* This source can be used to add raw, unencoded video samples (frames) to an output video track. These frames will
* automatically be encoded and then piped into the output.
* @group Media sources
* @public
*/
var VideoSampleSource = class extends VideoSource {
	/**
	* Creates a new {@link VideoSampleSource} whose samples are encoded according to the specified
	* {@link VideoEncodingConfig}.
	*/
	constructor(encodingConfig) {
		validateVideoEncodingConfig(encodingConfig);
		super(encodingConfig.codec);
		this._encoder = new VideoEncoderWrapper(this, encodingConfig);
	}
	/**
	* Encodes a video sample (frame) and then adds it to the output.
	*
	* @returns A Promise that resolves once the output is ready to receive more samples. You should await this Promise
	* to respect writer and encoder backpressure.
	*/
	add(videoSample, encodeOptions) {
		if (!(videoSample instanceof VideoSample)) throw new TypeError("videoSample must be a VideoSample.");
		return this._encoder.add(videoSample, false, encodeOptions);
	}
	/** @internal */
	_flushAndClose(forceClose) {
		return this._encoder.flushAndClose(forceClose);
	}
};
/**
* Base class for audio sources - sources for audio tracks.
* @group Media sources
* @public
*/
var AudioSource = class extends MediaSource {
	/** Internal constructor. */
	constructor(codec) {
		super();
		/** @internal */
		this._connectedTrack = null;
		if (!AUDIO_CODECS.includes(codec)) throw new TypeError(\`Invalid audio codec '\${codec}'. Must be one of: \${AUDIO_CODECS.join(", ")}.\`);
		this._codec = codec;
	}
};
/**
* Base class for subtitle sources - sources for subtitle tracks.
* @group Media sources
* @public
*/
var SubtitleSource = class extends MediaSource {
	/** Internal constructor. */
	constructor(codec) {
		super();
		/** @internal */
		this._connectedTrack = null;
		if (!SUBTITLE_CODECS.includes(codec)) throw new TypeError(\`Invalid subtitle codec '\${codec}'. Must be one of: \${SUBTITLE_CODECS.join(", ")}.\`);
		this._codec = codec;
	}
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/output-format.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* Base class representing an output media file format.
* @group Output formats
* @public
*/
var OutputFormat = class {
	/** Returns a list of video codecs that this output format can contain. */
	getSupportedVideoCodecs() {
		return this.getSupportedCodecs().filter((codec) => VIDEO_CODECS.includes(codec));
	}
	/** Returns a list of audio codecs that this output format can contain. */
	getSupportedAudioCodecs() {
		return this.getSupportedCodecs().filter((codec) => AUDIO_CODECS.includes(codec));
	}
	/** Returns a list of subtitle codecs that this output format can contain. */
	getSupportedSubtitleCodecs() {
		return this.getSupportedCodecs().filter((codec) => SUBTITLE_CODECS.includes(codec));
	}
	/** @internal */
	_codecUnsupportedHint(codec) {
		return "";
	}
};
/**
* Format representing files compatible with the ISO base media file format (ISOBMFF), like MP4 or MOV files.
* @group Output formats
* @public
*/
var IsobmffOutputFormat = class extends OutputFormat {
	/** Internal constructor. */
	constructor(options = {}) {
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (options.fastStart !== void 0 && ![
			false,
			"in-memory",
			"reserve",
			"fragmented"
		].includes(options.fastStart)) throw new TypeError("options.fastStart, when provided, must be false, 'in-memory', 'reserve', or 'fragmented'.");
		if (options.minimumFragmentDuration !== void 0 && (!Number.isFinite(options.minimumFragmentDuration) || options.minimumFragmentDuration < 0)) throw new TypeError("options.minimumFragmentDuration, when provided, must be a non-negative number.");
		if (options.onFtyp !== void 0 && typeof options.onFtyp !== "function") throw new TypeError("options.onFtyp, when provided, must be a function.");
		if (options.onMoov !== void 0 && typeof options.onMoov !== "function") throw new TypeError("options.onMoov, when provided, must be a function.");
		if (options.onMdat !== void 0 && typeof options.onMdat !== "function") throw new TypeError("options.onMdat, when provided, must be a function.");
		if (options.onMoof !== void 0 && typeof options.onMoof !== "function") throw new TypeError("options.onMoof, when provided, must be a function.");
		if (options.metadataFormat !== void 0 && ![
			"mdir",
			"mdta",
			"udta",
			"auto"
		].includes(options.metadataFormat)) throw new TypeError("options.metadataFormat, when provided, must be either 'auto', 'mdir', 'mdta', or 'udta'.");
		super();
		this._options = options;
	}
	getSupportedTrackCounts() {
		const max = 2 ** 32 - 1;
		return {
			video: {
				min: 0,
				max
			},
			audio: {
				min: 0,
				max
			},
			subtitle: {
				min: 0,
				max
			},
			total: {
				min: 1,
				max
			}
		};
	}
	get supportsVideoRotationMetadata() {
		return true;
	}
	get supportsTimestampedMediaData() {
		return true;
	}
	/** @internal */
	_createMuxer(output) {
		return new IsobmffMuxer(output, this);
	}
};
/**
* MPEG-4 Part 14 (MP4) file format. Supports most codecs.
* @group Output formats
* @public
*/
var Mp4OutputFormat = class extends IsobmffOutputFormat {
	/** Creates a new {@link Mp4OutputFormat} configured with the specified \`options\`. */
	constructor(options) {
		super(options);
	}
	/** @internal */
	get _name() {
		return "MP4";
	}
	get fileExtension() {
		return ".mp4";
	}
	get mimeType() {
		return "video/mp4";
	}
	getSupportedCodecs() {
		return [
			...VIDEO_CODECS,
			...NON_PCM_AUDIO_CODECS,
			"pcm-s16",
			"pcm-s16be",
			"pcm-s24",
			"pcm-s24be",
			"pcm-s32",
			"pcm-s32be",
			"pcm-f32",
			"pcm-f32be",
			"pcm-f64",
			"pcm-f64be",
			...SUBTITLE_CODECS
		];
	}
	/** @internal */
	_codecUnsupportedHint(codec) {
		if (new MovOutputFormat().getSupportedCodecs().includes(codec)) return " Switching to MOV will grant support for this codec.";
		return "";
	}
};
/**
* Creates a single Common Media Application Format (CMAF) segment. An init segment will be written to the
* {@link Target} specified in {@link OutputOptions.initTarget}. Supports most codecs.
* @group Output formats
* @public
*/
var CmafOutputFormat = class extends IsobmffOutputFormat {
	/** Creates a new {@link CmafOutputFormat} configured with the specified \`options\`. */
	constructor(options) {
		super(options);
	}
	/** @internal */
	get _name() {
		return "CMAF";
	}
	get fileExtension() {
		return ".m4s";
	}
	get mimeType() {
		return "video/mp4";
	}
	getSupportedCodecs() {
		return [
			...VIDEO_CODECS,
			...NON_PCM_AUDIO_CODECS,
			"pcm-s16",
			"pcm-s16be",
			"pcm-s24",
			"pcm-s24be",
			"pcm-s32",
			"pcm-s32be",
			"pcm-f32",
			"pcm-f32be",
			"pcm-f64",
			"pcm-f64be",
			...SUBTITLE_CODECS
		];
	}
};
/**
* QuickTime File Format (QTFF), often called MOV. Supports all video and audio codecs, but not subtitle codecs.
* @group Output formats
* @public
*/
var MovOutputFormat = class extends IsobmffOutputFormat {
	/** Creates a new {@link MovOutputFormat} configured with the specified \`options\`. */
	constructor(options) {
		super(options);
	}
	/** @internal */
	get _name() {
		return "MOV";
	}
	get fileExtension() {
		return ".mov";
	}
	get mimeType() {
		return "video/quicktime";
	}
	getSupportedCodecs() {
		return [...VIDEO_CODECS, ...AUDIO_CODECS];
	}
	/** @internal */
	_codecUnsupportedHint(codec) {
		if (new Mp4OutputFormat().getSupportedCodecs().includes(codec)) return " Switching to MP4 will grant support for this codec.";
		return "";
	}
};
/**
* Matroska file format.
*
* Supports writing transparent video. For a video track to be marked as transparent, the first packet added must
* contain alpha side data.
*
* @group Output formats
* @public
*/
var MkvOutputFormat = class extends OutputFormat {
	/** Creates a new {@link MkvOutputFormat} configured with the specified \`options\`. */
	constructor(options = {}) {
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (options.appendOnly !== void 0 && typeof options.appendOnly !== "boolean") throw new TypeError("options.appendOnly, when provided, must be a boolean.");
		if (options.minimumClusterDuration !== void 0 && (!Number.isFinite(options.minimumClusterDuration) || options.minimumClusterDuration < 0)) throw new TypeError("options.minimumClusterDuration, when provided, must be a non-negative number.");
		if (options.onEbmlHeader !== void 0 && typeof options.onEbmlHeader !== "function") throw new TypeError("options.onEbmlHeader, when provided, must be a function.");
		if (options.onSegmentHeader !== void 0 && typeof options.onSegmentHeader !== "function") throw new TypeError("options.onHeader, when provided, must be a function.");
		if (options.onCluster !== void 0 && typeof options.onCluster !== "function") throw new TypeError("options.onCluster, when provided, must be a function.");
		super();
		this._options = options;
	}
	/** @internal */
	_createMuxer(output) {
		return new MatroskaMuxer(output, this);
	}
	/** @internal */
	get _name() {
		return "Matroska";
	}
	getSupportedTrackCounts() {
		const max = 127;
		return {
			video: {
				min: 0,
				max
			},
			audio: {
				min: 0,
				max
			},
			subtitle: {
				min: 0,
				max
			},
			total: {
				min: 1,
				max
			}
		};
	}
	get fileExtension() {
		return ".mkv";
	}
	get mimeType() {
		return "video/x-matroska";
	}
	getSupportedCodecs() {
		return [
			...VIDEO_CODECS,
			...NON_PCM_AUDIO_CODECS,
			...PCM_AUDIO_CODECS.filter((codec) => ![
				"pcm-s8",
				"pcm-f32be",
				"pcm-f64be",
				"ulaw",
				"alaw"
			].includes(codec)),
			...SUBTITLE_CODECS
		];
	}
	get supportsVideoRotationMetadata() {
		return false;
	}
	get supportsTimestampedMediaData() {
		return true;
	}
};
/**
* WebM file format, based on Matroska.
*
* Supports writing transparent video. For a video track to be marked as transparent, the first packet added must
* contain alpha side data.
*
* @group Output formats
* @public
*/
var WebMOutputFormat = class extends MkvOutputFormat {
	/** Creates a new {@link WebMOutputFormat} configured with the specified \`options\`. */
	constructor(options) {
		super(options);
	}
	getSupportedCodecs() {
		return [
			...VIDEO_CODECS.filter((codec) => [
				"vp8",
				"vp9",
				"av1"
			].includes(codec)),
			...AUDIO_CODECS.filter((codec) => ["opus", "vorbis"].includes(codec)),
			...SUBTITLE_CODECS
		];
	}
	/** @internal */
	get _name() {
		return "WebM";
	}
	get fileExtension() {
		return ".webm";
	}
	get mimeType() {
		return "video/webm";
	}
	/** @internal */
	_codecUnsupportedHint(codec) {
		if (new MkvOutputFormat().getSupportedCodecs().includes(codec)) return " Switching to MKV will grant support for this codec.";
		return "";
	}
};

// node_modules/.store/mediabunny@1.49.0-HhpaZ6MccKRiPtbaBe06Yg/node_modules/mediabunny/dist/modules/src/output.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* List of all track types.
* @group Miscellaneous
* @public
*/
const ALL_TRACK_TYPES = [
	"video",
	"audio",
	"subtitle"
];
/**
* Represents a track added to an {@link Output}.
* @group Output files
* @public
*/
var OutputTrack = class OutputTrack {
	/** @internal */
	constructor(id, output, type, source, metadata) {
		this.id = id;
		this.output = output;
		this.type = type;
		this.source = source;
		this.metadata = metadata;
	}
	/** Returns true if and only if this track is a video track. */
	isVideoTrack() {
		return this.type === "video";
	}
	/** Returns true if and only if this track is an audio track. */
	isAudioTrack() {
		return this.type === "audio";
	}
	/** Returns true if and only if this track is a subtitle track. */
	isSubtitleTrack() {
		return this.type === "subtitle";
	}
	/**
	* Returns true if and only if this track can be paired with the given other track. Pairability can be set using
	* the {@link BaseTrackMetadata.group} option.
	*/
	canBePairedWith(other) {
		if (!(other instanceof OutputTrack)) throw new TypeError("other must be an OutputTrack.");
		if (this === other) return false;
		const thisGroups = toArray(this.metadata.group);
		const otherGroups = toArray(other.metadata.group);
		for (const aGroup of thisGroups) {
			if (this.type !== other.type && otherGroups.some((bGroup) => aGroup === bGroup)) return true;
			if (otherGroups.some((bGroup) => aGroup._pairedGroups.has(bGroup))) return true;
		}
		return false;
	}
};
/**
* An {@link OutputTrack} providing video data, created using {@link Output.addVideoTrack}.
* @group Output files
* @public
*/
var OutputVideoTrack = class extends OutputTrack {
	/** @internal */
	constructor(id, output, source, metadata) {
		super(id, output, "video", source, metadata);
	}
};
/**
* An {@link OutputTrack} providing audio data, created using {@link Output.addAudioTrack}.
* @group Output files
* @public
*/
var OutputAudioTrack = class extends OutputTrack {
	/** @internal */
	constructor(id, output, source, metadata) {
		super(id, output, "audio", source, metadata);
	}
};
/**
* An {@link OutputTrack} providing subtitle data, created using {@link Output.addSubtitleTrack}.
* @group Output files
* @public
*/
var OutputSubtitleTrack = class extends OutputTrack {
	/** @internal */
	constructor(id, output, source, metadata) {
		super(id, output, "subtitle", source, metadata);
	}
};
/**
* Used to define pairability between {@link OutputTrack} instances. First create the group, then assign tracks to it
* via {@link BaseTrackMetadata.group}.
*
* Two tracks are considered _pairable_ if they are in the same group but have a different {@link TrackType}, or if they
* are in different groups that are paired with each other. Groups can be paired with each other using the
* {@link OutputTrackGroup.pairWith} method.
*
* @group Output files
* @public
*/
var OutputTrackGroup = class OutputTrackGroup {
	/** Creates a new {@link OutputTrackGroup}. */
	constructor() {
		/** @internal */
		this._pairedGroups = /* @__PURE__ */ new Set();
	}
	/**
	* Marks this group as being pairable with another group, symmetrically. Output tracks where each track is assigned
	* to one half of a group pairing are then considered pairable.
	*
	* You cannot pair a group with itself.
	*/
	pairWith(other) {
		if (!(other instanceof OutputTrackGroup)) throw new TypeError("other must be an OutputTrackGroup.");
		if (this === other) throw new TypeError("Cannot pair a group with itself.");
		this._pairedGroups.add(other);
		other._pairedGroups.add(this);
	}
};
const validateBaseTrackMetadata = (metadata) => {
	if (!metadata || typeof metadata !== "object") throw new TypeError("metadata must be an object.");
	if (metadata.languageCode !== void 0 && !isIso639Dash2LanguageCode(metadata.languageCode)) throw new TypeError("metadata.languageCode, when provided, must be a three-letter, ISO 639-2/T language code.");
	if (metadata.name !== void 0 && typeof metadata.name !== "string") throw new TypeError("metadata.name, when provided, must be a string.");
	if (metadata.disposition !== void 0) validateTrackDisposition(metadata.disposition);
	if (metadata.maximumPacketCount !== void 0 && (!Number.isInteger(metadata.maximumPacketCount) || metadata.maximumPacketCount < 0)) throw new TypeError("metadata.maximumPacketCount, when provided, must be a non-negative integer.");
	if (metadata.group !== void 0 && !(metadata.group instanceof OutputTrackGroup) && (!Array.isArray(metadata.group) || metadata.group.some((group) => !(group instanceof OutputTrackGroup)))) throw new TypeError("metadata.group, when provided, must be an OutputTrackGroup instance or an array of OutputTrackGroup instances.");
};
/**
* Main class orchestrating the creation of new media files.
* @group Output files
* @public
*/
var Output = class extends EventEmitter {
	/**
	* The target to which the root file will be written. Throws when using {@link PathedTarget} with an async callback;
	* prefer the \`'target'\` event for those cases.
	*/
	get target() {
		const errorMessage = "Output.target cannot be used when using PathedTarget with an async callback. Use the 'target' event instead.";
		if (this._rootTargetPromise) throw new TypeError(errorMessage);
		const rootTargetResult = this._getRootTarget();
		if (rootTargetResult instanceof Promise) throw new TypeError(errorMessage);
		return rootTargetResult;
	}
	/**
	* Creates a new instance of {@link Output} which can then be used to create a new media file according to the
	* specified {@link OutputOptions}.
	*/
	constructor(options) {
		super();
		/** The current state of the output. */
		this.state = "pending";
		/**
		* The {@link OutputTrackGroup} that all tracks are assigned to by default unless otherwise specified by
		* {@link BaseTrackMetadata.group}.
		*/
		this.defaultTrackGroup = new OutputTrackGroup();
		/** @internal */
		this._onFinalize = null;
		/** @internal */
		this._unfinalizedTargets = /* @__PURE__ */ new Set();
		/** @internal */
		this._rootWriterPromise = null;
		/** @internal */
		this._tracks = [];
		/** @internal */
		this._startPromise = null;
		/** @internal */
		this._cancelPromise = null;
		/** @internal */
		this._finalizePromise = null;
		/** @internal */
		this._mutex = new AsyncMutex();
		/** @internal */
		this._metadataTags = {};
		/** @internal */
		this._rootTarget = null;
		/** @internal */
		this._rootTargetPromise = null;
		/**
		* This field is used to synchronize multiple MediaStreamTracks. They use the same time coordinate system across
		* tracks, and to ensure correct audio-video sync, we must use the same offset for all of them. The reason an offset
		* is needed at all is because the timestamps typically don't start at zero.
		* @internal
		*/
		this._firstMediaStreamTimestamp = null;
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (!(options.format instanceof OutputFormat)) throw new TypeError("options.format must be an OutputFormat.");
		if (!(options.target instanceof Target || options.target instanceof PathedTarget)) throw new TypeError("options.target must be a Target or a PathedTarget.");
		if (options.target instanceof Target) this._rememberTarget(options.target);
		if (options.initTarget !== void 0 && !(options.initTarget instanceof Target) && typeof options.initTarget !== "function") throw new Error("options.initTarget, when provided, must be a Target or a function that returns or resolves to a Target.");
		if (options.onFinalize !== void 0 && typeof options.onFinalize !== "function") throw new TypeError("options.onFinalize, when provided, must be a function.");
		this.format = options.format;
		this._target = options.target;
		this._onFinalize = options.onFinalize ?? null;
		this._initTarget = options.initTarget ?? null;
		if (this._initTarget instanceof Target) this._rememberTarget(this._initTarget);
		this._muxer = options.format._createMuxer(this);
	}
	/** @internal */
	_getTargetValidated(request) {
		assert(this._target instanceof PathedTarget);
		const result = this._target.getTarget(request);
		const handleResult = (result) => {
			if (!(result instanceof Target)) throw new TypeError("getTarget must return a Target.");
			return result;
		};
		if (result instanceof Promise) return result.then(handleResult);
		else return handleResult(result);
	}
	/** @internal */
	async _getTarget(request) {
		assert(this._target instanceof PathedTarget);
		const target = await this._getTargetValidated(request);
		this._emit("target", {
			target,
			request,
			isRoot: request.isRoot
		});
		if (this.state === "canceled") await target._close();
		else this._rememberTarget(target);
		return target;
	}
	/** @internal */
	_rememberTarget(target) {
		this._unfinalizedTargets.add(target);
		target.on("finalized", () => this._unfinalizedTargets.delete(target), { once: true });
	}
	/** @internal */
	async _getInitTarget() {
		assert(this._initTarget !== null);
		if (this._initTarget instanceof Target) return this._initTarget;
		const target = await this._initTarget();
		if (this.state === "canceled") await target._close();
		else this._rememberTarget(target);
		return target;
	}
	/** @internal */
	_hasInitTarget() {
		return this._initTarget !== null;
	}
	/** @internal */
	_getRootTarget() {
		if (this._rootTarget) return this._rootTarget;
		if (this._rootTargetPromise) return this._rootTargetPromise;
		if (this._target instanceof Target) {
			this._emit("target", {
				target: this._target,
				request: null,
				isRoot: true
			});
			this._rootTarget = this._target;
			return this._target;
		}
		const request = {
			path: this._target.rootPath,
			isRoot: true,
			mimeType: this.format.mimeType
		};
		const result = this._getTargetValidated(request);
		const handleResult = (target) => {
			if (this.state === "canceled") target._close();
			else this._rememberTarget(target);
			this._emit("target", {
				target,
				request,
				isRoot: true
			});
			this._rootTarget = target;
			return target;
		};
		if (result instanceof Promise) return this._rootTargetPromise = result.then(handleResult);
		else return handleResult(result);
	}
	/** @internal */
	_getRootWriter(isMonotonic) {
		return this._rootWriterPromise ??= (async () => {
			const target = await this._getRootTarget();
			const writer = new Writer(target, typeof isMonotonic === "boolean" ? isMonotonic : isMonotonic(target));
			writer.start();
			return writer;
		})();
	}
	/** Adds a video track to the output with the given source. Can only be called before the output is started. */
	addVideoTrack(source, metadata = {}) {
		if (!(source instanceof VideoSource)) throw new TypeError("source must be a VideoSource.");
		validateBaseTrackMetadata(metadata);
		if (metadata.rotation !== void 0 && ![
			0,
			90,
			180,
			270
		].includes(metadata.rotation)) throw new TypeError(\`Invalid video rotation: \${metadata.rotation}. Has to be 0, 90, 180 or 270.\`);
		if (!this.format.supportsVideoRotationMetadata && metadata.rotation) throw new Error(\`\${this.format._name} does not support video rotation metadata.\`);
		if (metadata.frameRate !== void 0 && (!Number.isFinite(metadata.frameRate) || metadata.frameRate <= 0)) throw new TypeError(\`Invalid video frame rate: \${metadata.frameRate}. Must be a positive number.\`);
		const metadataCopy = { ...metadata };
		metadataCopy.group ??= this.defaultTrackGroup;
		return this._addTrack(new OutputVideoTrack(this._tracks.length + 1, this, source, metadataCopy));
	}
	/** Adds an audio track to the output with the given source. Can only be called before the output is started. */
	addAudioTrack(source, metadata = {}) {
		if (!(source instanceof AudioSource)) throw new TypeError("source must be an AudioSource.");
		validateBaseTrackMetadata(metadata);
		const metadataCopy = { ...metadata };
		metadataCopy.group ??= this.defaultTrackGroup;
		return this._addTrack(new OutputAudioTrack(this._tracks.length + 1, this, source, metadataCopy));
	}
	/** Adds a subtitle track to the output with the given source. Can only be called before the output is started. */
	addSubtitleTrack(source, metadata = {}) {
		if (!(source instanceof SubtitleSource)) throw new TypeError("source must be a SubtitleSource.");
		validateBaseTrackMetadata(metadata);
		const metadataCopy = { ...metadata };
		metadataCopy.group ??= this.defaultTrackGroup;
		return this._addTrack(new OutputSubtitleTrack(this._tracks.length + 1, this, source, metadataCopy));
	}
	/**
	* Sets descriptive metadata tags about the media file, such as title, author, date, or cover art. When called
	* multiple times, only the metadata from the last call will be used.
	*
	* Can only be called before the output is started.
	*/
	setMetadataTags(tags) {
		validateMetadataTags(tags);
		if (this.state !== "pending") throw new Error("Cannot set metadata tags after output has been started or canceled.");
		this._metadataTags = tags;
	}
	/** @internal */
	_addTrack(track) {
		if (this.state !== "pending") throw new Error("Cannot add track after output has been started or canceled.");
		if (track.source._connectedTrack) throw new Error("Source is already used for a track.");
		const supportedTrackCounts = this.format.getSupportedTrackCounts();
		const presentTracksOfThisType = this._tracks.reduce((count, t) => count + (t.type === track.type ? 1 : 0), 0);
		const maxCount = supportedTrackCounts[track.type].max;
		if (presentTracksOfThisType === maxCount) throw new Error(maxCount === 0 ? \`\${this.format._name} does not support \${track.type} tracks.\` : \`\${this.format._name} does not support more than \${maxCount} \${track.type} track\${maxCount === 1 ? "" : "s"}.\`);
		const maxTotalCount = supportedTrackCounts.total.max;
		if (this._tracks.length === maxTotalCount) throw new Error(\`\${this.format._name} does not support more than \${maxTotalCount} tracks\${maxTotalCount === 1 ? "" : "s"} in total.\`);
		if (track.isVideoTrack()) {
			const supportedVideoCodecs = this.format.getSupportedVideoCodecs();
			if (supportedVideoCodecs.length === 0) throw new Error(\`\${this.format._name} does not support video tracks.\` + this.format._codecUnsupportedHint(track.source._codec));
			else if (!supportedVideoCodecs.includes(track.source._codec)) throw new Error(\`Codec '\${track.source._codec}' cannot be contained within \${this.format._name}. Supported video codecs are: \${supportedVideoCodecs.map((codec) => \`'\${codec}'\`).join(", ")}.\` + this.format._codecUnsupportedHint(track.source._codec));
		} else if (track.isAudioTrack()) {
			const supportedAudioCodecs = this.format.getSupportedAudioCodecs();
			if (supportedAudioCodecs.length === 0) throw new Error(\`\${this.format._name} does not support audio tracks.\` + this.format._codecUnsupportedHint(track.source._codec));
			else if (!supportedAudioCodecs.includes(track.source._codec)) throw new Error(\`Codec '\${track.source._codec}' cannot be contained within \${this.format._name}. Supported audio codecs are: \${supportedAudioCodecs.map((codec) => \`'\${codec}'\`).join(", ")}.\` + this.format._codecUnsupportedHint(track.source._codec));
		} else if (track.isSubtitleTrack()) {
			const supportedSubtitleCodecs = this.format.getSupportedSubtitleCodecs();
			if (supportedSubtitleCodecs.length === 0) throw new Error(\`\${this.format._name} does not support subtitle tracks.\` + this.format._codecUnsupportedHint(track.source._codec));
			else if (!supportedSubtitleCodecs.includes(track.source._codec)) throw new Error(\`Codec '\${track.source._codec}' cannot be contained within \${this.format._name}. Supported subtitle codecs are: \${supportedSubtitleCodecs.map((codec) => \`'\${codec}'\`).join(", ")}.\` + this.format._codecUnsupportedHint(track.source._codec));
		}
		this._tracks.push(track);
		track.source._connectedTrack = track;
		return track;
	}
	/**
	* Starts the creation of the output file. This method should be called after all tracks have been added. Only after
	* the output has started can media samples be added to the tracks.
	*
	* @returns A promise that resolves when the output has successfully started and is ready to receive media samples.
	*/
	async start() {
		const supportedTrackCounts = this.format.getSupportedTrackCounts();
		for (const trackType of ALL_TRACK_TYPES) {
			const presentTracksOfThisType = this._tracks.reduce((count, track) => count + (track.type === trackType ? 1 : 0), 0);
			const minCount = supportedTrackCounts[trackType].min;
			if (presentTracksOfThisType < minCount) throw new Error(minCount === supportedTrackCounts[trackType].max ? \`\${this.format._name} requires exactly \${minCount} \${trackType} track\${minCount === 1 ? "" : "s"}.\` : \`\${this.format._name} requires at least \${minCount} \${trackType} track\${minCount === 1 ? "" : "s"}.\`);
		}
		const totalMinCount = supportedTrackCounts.total.min;
		if (this._tracks.length < totalMinCount) throw new Error(totalMinCount === supportedTrackCounts.total.max ? \`\${this.format._name} requires exactly \${totalMinCount} track\${totalMinCount === 1 ? "" : "s"}.\` : \`\${this.format._name} requires at least \${totalMinCount} track\${totalMinCount === 1 ? "" : "s"}.\`);
		if (this.state === "canceled") throw new Error("Output has been canceled.");
		if (this._startPromise) {
			Logging._warn("Output has already been started.");
			return this._startPromise;
		}
		return this._startPromise = (async () => {
			this.state = "started";
			const release = await this._mutex.acquire();
			try {
				await this._muxer.start();
				const promises = this._tracks.map((track) => track.source._start());
				await Promise.all(promises);
			} finally {
				release();
			}
		})();
	}
	/**
	* Resolves with the full MIME type of the output file, including track codecs.
	*
	* The returned promise will resolve only once the precise codec strings of all tracks are known.
	*/
	getMimeType() {
		return this._muxer.getMimeType();
	}
	/**
	* Cancels the creation of the output file, releasing internal resources like encoders and preventing further
	* samples from being added.
	*
	* @returns A promise that resolves once all internal resources have been released.
	*/
	async cancel() {
		if (this._cancelPromise) {
			Logging._warn("Output has already been canceled.");
			return this._cancelPromise;
		} else if (this.state === "finalizing" || this.state === "finalized") {
			if (this.state === "finalized") Logging._warn("Output has already been finalized.");
			return;
		}
		return this._cancelPromise = (async () => {
			this.state = "canceled";
			const release = await this._mutex.acquire();
			try {
				const promises = this._tracks.map((x) => x.source._flushOrWaitForOngoingClose(true));
				await Promise.all(promises);
				await Promise.all([...this._unfinalizedTargets].map((target) => target._close()));
				this._unfinalizedTargets.clear();
			} finally {
				release();
			}
		})();
	}
	/**
	* Finalizes the output file. This method must be called after all media samples across all tracks have been added.
	* Once the Promise returned by this method completes, the output file is ready.
	*/
	async finalize() {
		if (this.state === "pending") throw new Error("Cannot finalize before starting.");
		if (this.state === "canceled") throw new Error("Cannot finalize after canceling.");
		if (this._finalizePromise) {
			Logging._warn("Output has already been finalized.");
			return this._finalizePromise;
		}
		return this._finalizePromise = (async () => {
			this.state = "finalizing";
			const release = await this._mutex.acquire();
			try {
				const promises = this._tracks.map((x) => x.source._flushOrWaitForOngoingClose(false));
				await Promise.all(promises);
				await this._muxer.finalize();
				if (this._rootWriterPromise) {
					const rootWriter = await this._rootWriterPromise;
					if (!rootWriter.finalized) {
						await rootWriter.flush();
						await rootWriter.finalize();
					}
				}
				if (this._onFinalize) await this._onFinalize();
				this.state = "finalized";
			} finally {
				release();
			}
		})();
	}
};

// packages/video-conversion/src/index.ts
/**
* Tracks in-progress operations so they can be cancelled at async boundaries.
*/
const inProgressOperations = /* @__PURE__ */ new Set();
/**
* Fallback per-frame duration when ImageDecoder reports none.
* GIF spec default 10fps = 100ms (in microseconds).
*/
const GIF_DEFAULT_FRAME_DURATION_US = 1e5;
/**
* Message prefix for "unsupported but graceful" outcomes (no WebCodecs,
* unsupported codec). Consumers detect this prefix and fall back to uploading
* the original GIF instead of surfacing a hard error.
*
* The contract is the message *prefix*, not the Error type: the worker RPC
* layer (comctx) serializes a thrown error to its \`message\` string only - the
* Error subclass, \`name\`, and \`stack\` do not survive the worker boundary.
*/
const UNSUPPORTED_ERROR_PREFIX = "Unsupported";
/**
* Message prefix for GIFs skipped because they exceed the total-pixel budget.
*
* Starts with UNSUPPORTED_ERROR_PREFIX so existing consumers treat the skip
* as a graceful fallback (keep the uploaded GIF, no companion video); the
* longer prefix lets consumers distinguish it, e.g. to log a warning. Like
* UNSUPPORTED_ERROR_PREFIX, the contract is the message prefix because only
* the message string survives the worker boundary.
*/
const SIZE_LIMIT_ERROR_PREFIX = \`\${UNSUPPORTED_ERROR_PREFIX}: GIF exceeds maximum conversion size\`;
/**
* Default budget for total decoded pixels (width × height × frame count)
* beyond which conversion is not attempted.
*
* Conversion cost is roughly proportional to the total number of decoded
* pixels. 300 megapixels approximates what a mid-range machine converts
* within the ~30s the caller is willing to wait (e.g. a 1920x1080 GIF at
* ~145 frames); anything larger would likely be abandoned anyway, so it is
* cheaper to not start. Pass \`0\` to disable the check.
*/
const DEFAULT_MAX_TOTAL_PIXELS = 3e8;
/**
* Serializes encoder access. The upload-media concurrency limit already caps
* this at 1, but the lock guards direct callers too.
*/
let operationLock = Promise.resolve();
/**
* Cancels all ongoing operations for a given item ID.
*
* Cancellation takes effect at async boundaries (waiting for the lock,
* encoder-support check, decoder completion, between frames).
*
* @param id Item ID.
* @return Whether an operation was cancelled.
*/
async function cancelOperations(id) {
	return inProgressOperations.delete(id);
}
/**
* Pads a dimension up to the nearest even number (encoder requirement).
*
* @param value Dimension value.
* @return Even dimension value.
*/
function padToEven(value) {
	return value % 2 === 0 ? value : value + 1;
}
/**
* Converts an animated GIF to a video file (MP4 or WebM).
*
* Decodes GIF frames via the browser ImageDecoder (honoring per-frame
* delays) and re-encodes them with mediabunny / WebCodecs.
*
* Accepts the GIF as a Blob so the bytes are read once, here in the worker,
* instead of being materialized on the main thread and transferred. An
* ArrayBuffer is still accepted for direct callers and tests.
*
* @param id             Item ID.
* @param gifSource      GIF file as a Blob/File or ArrayBuffer.
* @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
* @param maxDimensions  Optional maximum dimension for downscaling.
* @param maxTotalPixels Optional budget for total decoded pixels
*                       (width × height × frame count) beyond which the
*                       conversion is rejected with SIZE_LIMIT_ERROR_PREFIX.
*                       Defaults to DEFAULT_MAX_TOTAL_PIXELS; \`0\` disables.
* @return Encoded video buffer.
*/
async function convertGifToVideo(id, gifSource, outputMimeType, maxDimensions, maxTotalPixels) {
	inProgressOperations.add(id);
	const previousLock = operationLock;
	let releaseLock = () => {};
	operationLock = new Promise((resolve) => {
		releaseLock = resolve;
	});
	try {
		await previousLock;
		if (!inProgressOperations.has(id)) throw new Error("Operation cancelled");
		if (typeof ImageDecoder === "undefined" || typeof VideoEncoder === "undefined") throw new Error(\`\${UNSUPPORTED_ERROR_PREFIX}: WebCodecs unavailable\`);
		const isWebm = outputMimeType === "video/webm";
		const codec = isWebm ? "vp9" : "avc";
		if (!await canEncodeVideo(codec)) throw new Error(\`\${UNSUPPORTED_ERROR_PREFIX}: encoder codec not supported\`);
		if (!inProgressOperations.has(id)) throw new Error("Operation cancelled");
		const data = gifSource instanceof ArrayBuffer ? gifSource : await gifSource.arrayBuffer();
		if (!inProgressOperations.has(id)) throw new Error("Operation cancelled");
		const decoder = new ImageDecoder({
			data,
			type: "image/gif"
		});
		try {
			await decoder.tracks.ready;
			if (!inProgressOperations.has(id)) throw new Error("Operation cancelled");
			const frameCount = decoder.tracks.selectedTrack?.frameCount ?? 0;
			if (frameCount === 0) throw new Error("GIF contains no decodable frames");
			const pixelBudget = maxTotalPixels ?? 3e8;
			if (pixelBudget > 0) {
				const { image: probe } = await decoder.decode({ frameIndex: 0 });
				const probeWidth = probe.displayWidth;
				const probeHeight = probe.displayHeight;
				probe.close();
				if (!inProgressOperations.has(id)) throw new Error("Operation cancelled");
				const totalPixels = probeWidth * probeHeight * frameCount;
				if (totalPixels > pixelBudget) throw new Error(\`\${SIZE_LIMIT_ERROR_PREFIX} (\${probeWidth}x\${probeHeight} x \${frameCount} frames = \${totalPixels} pixels; limit is \${pixelBudget})\`);
			}
			const source = new VideoSampleSource({
				codec,
				bitrate: QUALITY_HIGH,
				keyFrameInterval: 10
			});
			const target = new BufferTarget();
			const output = new Output({
				format: isWebm ? new WebMOutputFormat() : new Mp4OutputFormat(),
				target
			});
			output.addVideoTrack(source);
			await output.start();
			let timestampSec = 0;
			for (let i = 0; i < frameCount; i++) {
				if (!inProgressOperations.has(id)) throw new Error("Operation cancelled");
				const { image } = await decoder.decode({ frameIndex: i });
				const durationUs = image.duration ?? GIF_DEFAULT_FRAME_DURATION_US;
				const durationSec = durationUs / 1e6;
				const srcW = image.displayWidth;
				const srcH = image.displayHeight;
				let targetW = srcW;
				let targetH = srcH;
				if (maxDimensions && (srcW > maxDimensions || srcH > maxDimensions)) {
					const scale = Math.min(maxDimensions / srcW, maxDimensions / srcH);
					targetW = Math.round(srcW * scale);
					targetH = Math.round(srcH * scale);
				}
				targetW = padToEven(targetW);
				targetH = padToEven(targetH);
				let frameForEncode = image;
				if (targetW !== srcW || targetH !== srcH) {
					const canvas = new OffscreenCanvas(targetW, targetH);
					const ctx = canvas.getContext("2d");
					if (!ctx) throw new Error("Failed to create 2D canvas context");
					ctx.drawImage(image, 0, 0, targetW, targetH);
					frameForEncode = new VideoFrame(canvas, {
						timestamp: Math.round(timestampSec * 1e6),
						duration: durationUs
					});
					image.close();
				}
				const sample = new VideoSample(frameForEncode, {
					timestamp: timestampSec,
					duration: durationSec
				});
				try {
					await source.add(sample);
				} finally {
					sample.close();
					frameForEncode.close();
				}
				timestampSec += durationSec;
			}
			await output.finalize();
			const out = target.buffer;
			if (!out || out.byteLength === 0) throw new Error("Encoder produced empty output");
			return out;
		} finally {
			decoder.close();
		}
	} finally {
		inProgressOperations.delete(id);
		releaseLock();
	}
}

// packages/video-conversion/src/worker.ts
/**
* Worker entry point for video conversion.
*
* This file exposes the video conversion functions in the Web Worker
* context. The \`@wordpress/worker-threads\` library handles the RPC
* communication with the main thread.
*/
expose({
	cancelOperations,
	convertGifToVideo
});

//# sourceMappingURL=worker.mjs.map`})))()}function getWorkerAPI(){if(w===void 0){let e=new Blob([S],{type:`application/javascript`});T=URL.createObjectURL(e),C=new Worker(T,{type:`module`}),w=wrap(C)}return w}async function convertGifToVideo(e,t,i,o,u){return getWorkerAPI().convertGifToVideo(e,t,i,o,u)}async function cancelGifToVideoOperations(e){return getWorkerAPI().cancelOperations(e)}function terminateVideoConversionWorker(){w&&(terminate(w),w=void 0,C=void 0),T&&=(URL.revokeObjectURL(T),void 0)}var C,w,T;function init_video_conversion_worker(){return(init_video_conversion_worker=e((()=>{init_main_thread(),init_worker_code()})))()}init_video_conversion_worker();export{cancelGifToVideoOperations,convertGifToVideo,terminateVideoConversionWorker};