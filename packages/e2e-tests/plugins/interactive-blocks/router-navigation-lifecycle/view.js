import {
	store,
	withSyncEvent,
	getContext,
	getServerState,
	watch,
} from '@wordpress/interactivity';

/*
 * A short timeout for the `navigate (timeout)` link's action. It only needs
 * to be short enough that a route held open indefinitely by a test triggers
 * the router's own timeout fallback well within a test's default timeout.
 */
const NAVIGATE_TIMEOUT = 100;

/*
 * `core/router` is *read*, never imported: this namespace is auto-created by
 * the store proxy and later merges into the very same proxy the router
 * module registers, once (and if) that module loads. That is what makes
 * Flow 26 ("a page where the router module never loads") meaningful -- these
 * getters must be safe to read before the router exists.
 */
const { state: routerState } = store( 'core/router' );

/*
 * Both logs below live *inside* the store's reactive `state`, as plain
 * arrays under `state._log` / `state._settlementLog`, rather than as
 * module-scope variables: mutating a module-scope array is invisible to the
 * signals system, so nothing would ever mark `state.log` / `state.settlementLog`
 * dirty and their `data-wp-text` readouts would render once, at hydration,
 * and never again. Pushing into an array that is itself part of the
 * reactive state (the same shape `state.items.push( … )` uses in
 * `router-regions/view.js`) does notify.
 */
let previousNavigating = false;

/*
 * Flow 29's per-region previous-`navigating` bookkeeping, keyed by region
 * id. A plain module-scope object, not `context`: `watchFocus()` below
 * both reads and writes it in the same run, and reading it through the
 * reactive `context` proxy would subscribe that same effect to its own
 * write, re-triggering it. It also has to live outside any one region's
 * DOM, since the region element it would otherwise sit on can be torn
 * down and recreated by a client-side navigation while this module stays
 * loaded -- the same reason `previousNavigating` above is module scope
 * rather than an element-local variable.
 */
const focusWasNavigating = {};

/*
 * Flow 30's debounce timer, for the bare `watch()` registered near the
 * bottom of this file.
 */
let debounceTimer;

/*
 * Raw lifecycle-write log. Unlike the counted `data-wp-watch` observer, a
 * bare `watch()` runs synchronously for each notification, so it can observe
 * the discharge immediately before this document is replaced.
 */
const rawWriteLog = [];

/**
 * Renders a `navigating` value the same way for the counted log and for the
 * `lifecycle navigating` readout. `undefined` (never navigated) and `false`
 * both read "not navigating", matching every flow's own wording -- the
 * distinction between them is only ever observable through the four
 * directive-bound elements (`state.navigating`, the raw value), not through
 * this human-readable form.
 *
 * @param {boolean|undefined} navigating
 * @return {string} The human-readable reading.
 */
function describeNavigating( navigating ) {
	return navigating ? 'navigating' : 'not navigating';
}

/**
 * Renders an `initiator` value the same way for the counted log and for the
 * `lifecycle initiator` readout. `undefined` (never set) and `null` (an
 * explicit "no initiator", see `{ initiator: null }`) are deliberately not
 * distinguished here: both are the documented "absence of identity" reading
 * (Requirement 11), and every flow's own wording says "reads absent" for
 * both.
 *
 * @param {string|null|undefined} initiator
 * @return {string} The human-readable reading.
 */
function describeInitiator( initiator ) {
	return initiator === undefined || initiator === null ? 'absent' : initiator;
}

const { state } = store( 'router-navigation-lifecycle', {
	state: {
		// Backing arrays for the two serialized logs -- see the comment
		// above on why these must live inside `state`, not at module scope.
		_log: [],
		_settlementLog: [],

		// Flow 30's debounced-bar flag. Declared with an idle default and
		// written directly (never derived), unlike `navigating`/`initiator`
		// below -- this is *this* store's own state, not a passthrough of
		// `core/router`'s, so none of the "don't declare" reasoning applies.
		showBar: false,

		/*
		 * Raw passthroughs of the router's own state, for the four
		 * directive-bound elements Flow 24 enumerates. These need the real
		 * `boolean | undefined` value, not the human-readable text below,
		 * because their whole point is to exercise `data-wp-bind`'s and
		 * `data-wp-class`'s real boolean/undefined handling.
		 */
		get navigating() {
			return routerState.navigating;
		},
		get initiator() {
			return routerState.initiator;
		},

		// Human-readable readouts for `data-testid="lifecycle navigating"`
		// and `data-testid="lifecycle initiator"`.
		get navigatingReading() {
			return describeNavigating( routerState.navigating );
		},
		get initiatorReading() {
			return describeInitiator( routerState.initiator );
		},

		/*
		 * `true` only while a navigation *this* element's own region
		 * initiated is in flight. Context-dependent so the same getter
		 * serves every region: each region co-renders its own id into
		 * `data-wp-context`, and this getter reads it back -- see Flow 13.
		 */
		get isOrigin() {
			const { regionId } = getContext();
			return (
				!! routerState.navigating && routerState.initiator === regionId
			);
		},

		/*
		 * Flow 28's sufficiency demonstration: `true` only while a
		 * navigation *this* region's own element initiated is in flight.
		 * Computationally identical to `isOrigin` above -- both are the
		 * documented composition `state.navigating && state.initiator ===
		 * myRegionId` -- but kept as its own getter because it stands in
		 * for a real consumer's own per-block spinner, built from only the
		 * two public keys and `getContext()`, independent of the
		 * `isOrigin`/`is-origin` scaffolding the earlier identity flows use.
		 */
		get isLoading() {
			const { regionId } = getContext();
			return (
				!! routerState.navigating && routerState.initiator === regionId
			);
		},

		/*
		 * Serialized logs. A serialized array, rather than a hand-rolled
		 * delimited string, so a spec can `JSON.parse` the readout and
		 * assert on entry count and contents structurally.
		 */
		get log() {
			return JSON.stringify( state._log );
		},
		get settlementLog() {
			return JSON.stringify( state._settlementLog );
		},
	},
	actions: {
		navigate: withSyncEvent( function* ( e ) {
			e.preventDefault();
			const { actions: router } = yield import(
				'@wordpress/interactivity-router'
			);
			yield router.navigate( e.target.href );
		} ),
		navigateSilent: withSyncEvent( function* ( e ) {
			e.preventDefault();
			const { actions: router } = yield import(
				'@wordpress/interactivity-router'
			);
			yield router.navigate( e.target.href, {
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} );
		} ),
		refresh: withSyncEvent( function* ( e ) {
			e.preventDefault();
			const { actions: router } = yield import(
				'@wordpress/interactivity-router'
			);
			yield router.navigate( window.location.href, { force: true } );
		} ),
		navigateDeclared: withSyncEvent( function* ( e ) {
			e.preventDefault();
			const { actions: router } = yield import(
				'@wordpress/interactivity-router'
			);
			yield router.navigate( e.target.href, {
				initiator: 'my-plugin/declared',
			} );
		} ),
		navigateSuppressed: withSyncEvent( function* ( e ) {
			e.preventDefault();
			const { actions: router } = yield import(
				'@wordpress/interactivity-router'
			);
			yield router.navigate( e.target.href, { initiator: null } );
		} ),
		navigateTimeout: withSyncEvent( function* ( e ) {
			e.preventDefault();
			const { actions: router } = yield import(
				'@wordpress/interactivity-router'
			);
			yield router.navigate( e.target.href, {
				timeout: NAVIGATE_TIMEOUT,
			} );
		} ),
		prefetch: withSyncEvent( function* ( e ) {
			e.preventDefault();
			const { actions: router } = yield import(
				'@wordpress/interactivity-router'
			);
			yield router.prefetch( e.target.href );
		} ),
	},
	callbacks: {
		/*
		 * The counted lifecycle observer. Reads *only*
		 * `routerState.navigating` and `routerState.initiator`, so it never
		 * re-runs at the commit batch, which writes `state.url` while
		 * `navigating` is still truthy.
		 */
		watchLifecycle() {
			state._log.push( {
				navigating: describeNavigating( routerState.navigating ),
				initiator: describeInitiator( routerState.initiator ),
			} );
		},
		/*
		 * The settlement probe. Edge-triggered: appends an entry only the
		 * moment `navigating` turns falsy, recording `routerState.url`, the
		 * destination marker's text and the server-context readout's text
		 * at that moment -- both read directly from the DOM, since this
		 * watcher's whole point is to observe the *committed* page rather
		 * than any reactive value of its own.
		 *
		 * FIXTURE TRAP: `populateServerData()` merges each navigation's
		 * server state with `override: false`
		 * (`packages/interactivity/src/proxies/state.ts:378-389`), so an
		 * *existing* key such as `state.readout` is never overwritten
		 * automatically on a later navigation -- only genuinely new keys
		 * are. Binding `data-wp-text="state.readout"` and expecting it to
		 * track each destination's own server-seeded value, with no further
		 * code, looked correct through hydration and the first page but
		 * silently kept showing the *first* page's value forever after.
		 * A consumer that wants a key to track the destination's
		 * own server-seeded value must re-sync it itself from
		 * `getServerState()`, the documented pattern
		 * (`router-regions/view.js`'s `updateCounterFromServer` does the
		 * same for context). Doing that sync here, as this callback's first
		 * statement, keeps the write and the DOM read that discharges the
		 * falling edge in one synchronous callback -- `@preact/signals`'
		 * text bindings update the DOM synchronously on write, so there is
		 * no cross-watcher race to get this wrong.
		 */
		watchSettlement() {
			const serverReadout = getServerState().readout;
			if ( serverReadout !== undefined ) {
				state.readout = serverReadout;
			}
			const navigating = !! routerState.navigating;
			if ( previousNavigating && ! navigating ) {
				const marker = document.querySelector(
					'[data-testid="page-marker"]'
				);
				const readout = document.querySelector(
					'[data-testid="server-context-readout"]'
				);
				state._settlementLog.push( {
					url: routerState.url,
					marker: marker ? marker.textContent : null,
					serverContextReadout: readout ? readout.textContent : null,
				} );
			}
			previousNavigating = navigating;
		},
		/*
		 * Flow 29's sufficiency demonstration: region-scoped focus. Edge-
		 * triggered like `watchSettlement` above, but per-instance -- it
		 * lives on its own element inside *each* region (a third
		 * `data-wp-watch`, never run-counted), so it is scoped and can read
		 * its own `regionId` from context. Only fires on the falling edge
		 * when `initiator` still reads as *this* region's own id, which is
		 * what makes it refrain on a traversal (`initiator` reads absent
		 * there). No DOM reference is captured across the navigation: the
		 * target link is looked up fresh, by region id, only once the
		 * falling edge actually fires -- never stored ahead of time.
		 */
		watchFocus() {
			const { regionId } = getContext();
			const navigating = !! routerState.navigating;
			if (
				focusWasNavigating[ regionId ] &&
				! navigating &&
				routerState.initiator === regionId
			) {
				document
					.querySelector(
						`[data-wp-router-region="${ regionId }"] a`
					)
					?.focus();
			}
			focusWasNavigating[ regionId ] = navigating;
		},
	},
} );

/*
 * Flow 30's sufficiency demonstration: a Core-loading-bar equivalent,
 * rebuilt purely from the two public keys plus a consumer-side 400 ms
 * debounce -- the debounced loading bar recipe from the Client-Side
 * Navigation guide. A bare `watch()`, not a
 * `data-wp-watch`: the timer callback writes this store's own `state`
 * (`showBar`), not `context`, so it needs no scope at all.
 */
watch( () => {
	if ( routerState.navigating ) {
		debounceTimer = setTimeout( () => {
			state.showBar = true;
		}, 400 );
	} else {
		clearTimeout( debounceTimer );
		state.showBar = false;
	}
} );

watch( () => {
	rawWriteLog.push( {
		navigating: routerState.navigating,
		initiator: routerState.initiator,
	} );
} );

/*
 * Persists the counted log to `localStorage` right before this document is
 * torn down, so a test can recover the *outgoing* document's last known
 * state after a forced full page load -- even one triggered by a
 * `window.location.assign()` / `.reload()` call whose own network request
 * was intercepted (held or aborted) via Playwright's `page.route()`.
 *
 * This exists because holding a main-frame document request open, or
 * aborting it, are both equally unable to keep the outgoing document's
 * execution context alive and assertable in this environment. `pagehide`
 * and `beforeunload`, by contrast, were confirmed (by a standalone probe
 * against this same environment) to fire reliably even when the
 * *outgoing* navigation's own request is aborted, and `localStorage`
 * persists across the reload because the destination is same-origin. Both
 * events are listened for, writing the same key, because a future
 * navigation's exact treatment of an aborted vs. held request is not a
 * guarantee this fixture should depend on.
 */
window.addEventListener( 'pagehide', persistLogBeforeUnload );
window.addEventListener( 'beforeunload', persistLogBeforeUnload );
function persistLogBeforeUnload() {
	try {
		localStorage.setItem(
			'router-navigation-lifecycle:log-before-unload',
			state.log
		);
		localStorage.setItem(
			'router-navigation-lifecycle:raw-write-log-before-unload',
			JSON.stringify( rawWriteLog )
		);
	} catch {}
}

/*
 * Module-scope, no directive scope at all: dynamically imports the router
 * and navigates from an awaited continuation, for the scope-less flow
 * (Flow 18). The destination is read off the already-rendered `navigate`
 * link rather than hardcoded, so this works on any page carrying a region.
 */
window.addEventListener( '_test_navigate_scopeless_', async () => {
	const link = document.querySelector( '[data-testid="navigate"]' );
	const { actions: router } = await import(
		'@wordpress/interactivity-router'
	);
	await router.navigate( link.href );
} );
