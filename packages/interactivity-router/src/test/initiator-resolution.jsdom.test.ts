/**
 * Deriving the initiator from the ambient directive scope, and the
 * three-clause `parseRegionId` mirror it is built on.
 *
 * Rows 1–8, in order. Rows 1 and 2 together pin the parse mirror against
 * **real, hydrated directive-side registration** for all six
 * `data-wp-router-region` attribute forms — the four id-bearing forms
 * (row 1) and the two absent-id forms (row 2), which the mirror
 * deliberately normalises to `null` rather than mirroring. Row 8 is the
 * drift guard that keeps this deliberate duplication from being "fixed"
 * into a reuse of `parseRegionAttribute`.
 *
 * Like every other file in this directory, this suite is exercised through a
 * Vitest module mock that assembles the real implementations of everything
 * the router destructures from `privateApis` — see
 * `__fixtures__/interactivity-shim.ts`. This file hydrates real
 * `data-wp-on--click` triggers, which call `performance.measure()`
 * (`packages/interactivity/src/directives/on.ts`), unimplemented by jsdom —
 * stubbed below.
 *
 * `vi.resetModules()` is unusable here (see the harness comment in
 * `lifecycle-navigate.ts`), so the router module is imported once and every
 * test in this file shares that one instance and its `core/router` store.
 * No row in this file depends on the lifecycle keys' pristine pre-navigation
 * value, so ordering between tests is not load-bearing here.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { hydrate } from 'preact';
import { effect } from '@preact/signals';
import { store, privateApis, withScope } from '@wordpress/interactivity';
vi.mock(
	import( '@wordpress/interactivity' ),
	async () => await import( './__fixtures__/interactivity-shim' )
);

const CONSENT =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';
const { getRegionRootFragment, toVdom, getScope, routerRegions } =
	privateApis( CONSENT );

/** Native timeout used to let fake-timer frame callbacks yield between tasks. */
const nativeSetTimeout = globalThis.setTimeout;

beforeAll( () => {
	// See the module comment: this file hydrates real data-wp-on--click
	// triggers, whose handler calls performance.measure(), unimplemented
	// by jsdom.
	window.performance.measure = vi.fn();
	window.performance.getEntriesByType = vi.fn( () => [] );
} );

const plainHtml = ( marker: string ) =>
	`<!doctype html><title>t</title><body>${ marker }</body>`;

/**
 * Hydrates a `[data-wp-router-region]` with a real `data-wp-on--click`
 * trigger, so a call made through `runInScope()` runs from a genuine
 * ambient directive scope inside the region — the same construction
 * `initiator-invalid-warning.ts` uses, generalised to accept the *raw*
 * `data-wp-router-region` attribute text (not just a bare id), which is
 * what rows 1, 2, 5 and 7 need to exercise every attribute form.
 *
 * @param namespace      Store namespace — must be unique per call.
 * @param regionAttrText The raw text to put in the `data-wp-router-region`
 *                       attribute, verbatim (may itself contain `"`, e.g. a
 *                       JSON object form — the markup below therefore
 *                       single-quotes this one attribute).
 * @return An object exposing `runInScope()` and `remove()`.
 */
function setupRegionTrigger( namespace: string, regionAttrText: string ) {
	let onClick: () => unknown = () => undefined;
	store( namespace, {
		actions: {
			trigger() {
				return onClick();
			},
		},
	} );

	const container = document.createElement( 'div' );
	container.innerHTML =
		`<div data-wp-interactive="${ namespace }" data-wp-router-region='${ regionAttrText }'>` +
		'<button data-wp-on--click="actions.trigger"></button>' +
		'</div>';
	document.body.appendChild( container );
	const regionEl = container.firstElementChild as Element;

	hydrate( toVdom( regionEl ), getRegionRootFragment( regionEl ) );

	const button = regionEl.querySelector( 'button' ) as HTMLButtonElement;

	return {
		runInScope< T >( fn: () => T ): T {
			let result: T;
			onClick = () => {
				result = fn();
				return result;
			};
			button.click();
			return result!;
		},
		remove() {
			container.remove();
		},
	};
}

/**
 * Same recipe as `setupRegionTrigger()`, but with no `data-wp-router-region`
 * anywhere in the markup — for row 5's "no enclosing region" input and
 * row 7's "a detached element" (no region) input.
 *
 * @param namespace Store namespace — must be unique per call.
 * @return An object exposing `runInScope()` and `remove()`.
 */
function setupTriggerWithNoRegion( namespace: string ) {
	let onClick: () => unknown = () => undefined;
	store( namespace, {
		actions: {
			trigger() {
				return onClick();
			},
		},
	} );

	const container = document.createElement( 'div' );
	container.innerHTML =
		`<div data-wp-interactive="${ namespace }">` +
		'<button data-wp-on--click="actions.trigger"></button>' +
		'</div>';
	document.body.appendChild( container );
	const el = container.firstElementChild as Element;

	hydrate( toVdom( el ), getRegionRootFragment( el ) );

	const button = el.querySelector( 'button' ) as HTMLButtonElement;

	return {
		runInScope< T >( fn: () => T ): T {
			let result: T;
			onClick = () => {
				result = fn();
				return result;
			};
			button.click();
			return result!;
		},
		remove() {
			container.remove();
		},
	};
}

/**
 * Two router regions (`outer` containing `inner`), sharing one interactive
 * namespace, with the trigger inside `inner` — row 3's nested-regions
 * construction.
 *
 * @param namespace Store namespace — must be unique per call.
 * @return An object exposing `runInScope()`.
 */
function setupNestedRegionsTrigger( namespace: string ) {
	let onClick: () => unknown = () => undefined;
	store( namespace, {
		actions: {
			trigger() {
				return onClick();
			},
		},
	} );

	const container = document.createElement( 'div' );
	container.innerHTML =
		`<div data-wp-interactive="${ namespace }" data-wp-router-region="outer">` +
		`<div data-wp-interactive="${ namespace }" data-wp-router-region="inner">` +
		'<button data-wp-on--click="actions.trigger"></button>' +
		'</div></div>';
	document.body.appendChild( container );
	const outerEl = container.firstElementChild as Element;

	hydrate( toVdom( outerEl ), getRegionRootFragment( outerEl ) );

	const button = outerEl.querySelector( 'button' ) as HTMLButtonElement;

	return {
		runInScope< T >( fn: () => T ): T {
			let result: T;
			onClick = () => {
				result = fn();
				return result;
			};
			button.click();
			return result!;
		},
	};
}

/**
 * A factory for hydrating *separate* router regions that all share one
 * interactive namespace — row 4's "two instances of one block type"
 * construction, e.g. two Query blocks both under `core/query`.
 *
 * Regions are hydrated **lazily**, one at a time via `hydrateRegion()`,
 * rather than all upfront. This matters: `renderPage()` (the router's own
 * navigation-commit routine) resets *every* entry already registered in
 * the shared `routerRegions` map — not only the ones present on the
 * destination page — which unmounts any region hydrated earlier whose id
 * the destination page doesn't happen to include (a region
 * hydrated *before* an unrelated navigation completes loses its scope's
 * `ref.current`, the same guard row 5 exercises deliberately — so
 * completing a navigation from one instance before the next instance is
 * even hydrated is what keeps the second instance's scope genuinely live
 * when it is used).
 *
 * @param namespace Store namespace, shared by every region this factory
 *                  hydrates.
 * @return An object exposing `hydrateRegion()`.
 */
function setupSharedNamespaceRegionFactory( namespace: string ) {
	let onClick: () => unknown = () => undefined;
	store( namespace, {
		actions: {
			trigger() {
				return onClick();
			},
		},
	} );

	return {
		hydrateRegion( id: string ) {
			const container = document.createElement( 'div' );
			container.innerHTML =
				`<div data-wp-interactive="${ namespace }" data-wp-router-region="${ id }">` +
				'<button data-wp-on--click="actions.trigger"></button>' +
				'</div>';
			document.body.appendChild( container );
			const regionEl = container.firstElementChild as Element;
			hydrate( toVdom( regionEl ), getRegionRootFragment( regionEl ) );
			const button = regionEl.querySelector(
				'button'
			) as HTMLButtonElement;

			return {
				runInScope< T >( fn: () => T ): T {
					let result: T;
					onClick = () => {
						result = fn();
						return result;
					};
					button.click();
					return result!;
				},
			};
		},
	};
}

/**
 * Finds the one key `routerRegions` gained since `before` was captured.
 * Used by row 1 to read the directive-side-registered id straight out of
 * the real `routerRegions` map, rather than assuming it.
 *
 * @param before A snapshot of `routerRegions`' keys taken before hydrating.
 * @return The single newly-registered key.
 */
function newlyRegisteredKey( before: Set< unknown > ): unknown {
	for ( const key of routerRegions.keys() ) {
		if ( ! before.has( key ) ) {
			return key;
		}
	}
	throw new Error(
		'setupRegionTrigger() did not register a new entry in routerRegions.'
	);
}

describe( 'deriving the initiator from the ambient directive scope', () => {
	test( 'row 1 — the four id-bearing attribute forms report the id the directive side actually registered', async () => {
		const { state, actions } = await import( '../index' );

		// A plain string id.
		{
			const before = new Set( routerRegions.keys() );
			const region = setupRegionTrigger( 'test/row1-plain', 'plain-id' );
			const registeredKey = newlyRegisteredKey( before );
			// Sanity: ground the assumption in the real directive-side
			// registration before pinning derivation against it.
			expect( registeredKey ).toBe( 'plain-id' );

			await region.runInScope( () =>
				actions.navigate( 'http://localhost/row1-plain', {
					html: plainHtml( 'plain' ),
					loadingAnimation: false,
					screenReaderAnnouncement: false,
				} )
			);
			expect( state.initiator ).toBe( registeredKey );
		}

		// The JSON object form.
		{
			const before = new Set( routerRegions.keys() );
			const region = setupRegionTrigger(
				'test/row1-json',
				'{"id":"json-id"}'
			);
			const registeredKey = newlyRegisteredKey( before );
			expect( registeredKey ).toBe( 'json-id' );

			await region.runInScope( () =>
				actions.navigate( 'http://localhost/row1-json', {
					html: plainHtml( 'json' ),
					loadingAnimation: false,
					screenReaderAnnouncement: false,
				} )
			);
			expect( state.initiator ).toBe( registeredKey );
		}

		// A `::`-prefixed id — must report the post-`::` remainder, not the
		// whole string.
		{
			const before = new Set( routerRegions.keys() );
			const region = setupRegionTrigger(
				'test/row1-ns',
				'myplugin::ns-id'
			);
			const registeredKey = newlyRegisteredKey( before );
			expect( registeredKey ).toBe( 'ns-id' );

			await region.runInScope( () =>
				actions.navigate( 'http://localhost/row1-ns', {
					html: plainHtml( 'ns' ),
					loadingAnimation: false,
					screenReaderAnnouncement: false,
				} )
			);
			expect( state.initiator ).toBe( registeredKey );
		}

		// A JSON-scalar id — must report the string '123', not undefined.
		{
			const before = new Set( routerRegions.keys() );
			const region = setupRegionTrigger( 'test/row1-scalar', '123' );
			const registeredKey = newlyRegisteredKey( before );
			expect( registeredKey ).toBe( '123' );

			await region.runInScope( () =>
				actions.navigate( 'http://localhost/row1-scalar', {
					html: plainHtml( 'scalar' ),
					loadingAnimation: false,
					screenReaderAnnouncement: false,
				} )
			);
			expect( state.initiator ).toBe( registeredKey );
		}
	} );

	test( 'row 2 — an empty region attribute and an id-less JSON form both report null, asserted as null and not merely as falsy', async () => {
		const { state, actions } = await import( '../index' );

		const empty = setupRegionTrigger( 'test/row2-empty', '' );
		await empty.runInScope( () =>
			actions.navigate( 'http://localhost/row2-empty', {
				html: plainHtml( 'empty' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBeNull();

		const noId = setupRegionTrigger(
			'test/row2-noid',
			'{"attachTo":"body"}'
		);
		await noId.runInScope( () =>
			actions.navigate( 'http://localhost/row2-noid', {
				html: plainHtml( 'noid' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBeNull();
	} );

	test( 'row 3 — nested regions report the nearest enclosing region, not the outermost', async () => {
		const { state, actions } = await import( '../index' );
		const nested = setupNestedRegionsTrigger( 'test/row3' );

		await nested.runInScope( () =>
			actions.navigate( 'http://localhost/row3-dest', {
				html: plainHtml( 'row3' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);

		expect( state.initiator ).toBe( 'inner' );
	} );

	test( 'row 4 — two instances of one block type, in two regions with distinct ids, are distinguished', async () => {
		const { state, actions } = await import( '../index' );
		const factory = setupSharedNamespaceRegionFactory( 'test/row4-probe' );

		const region1 = factory.hydrateRegion( 'query-1' );
		await region1.runInScope( () =>
			actions.navigate( 'http://localhost/row4-a', {
				html: plainHtml( 'row4-a' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		const first = state.initiator;

		// Hydrated only now, after the first navigation has fully
		// completed — see setupSharedNamespaceRegionFactory()'s comment.
		const region2 = factory.hydrateRegion( 'query-2' );
		await region2.runInScope( () =>
			actions.navigate( 'http://localhost/row4-b', {
				html: plainHtml( 'row4-b' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		const second = state.initiator;

		expect( first ).toBe( 'query-1' );
		expect( second ).toBe( 'query-2' );
		expect( first ).not.toBe( second );
	} );

	test( 'row 5 — absent-scope inputs report null and never throw: no scope at all, ref.current null, ref.current a text node, no enclosing region', async () => {
		const { state, actions } = await import( '../index' );

		// (a) No ambient scope at all — called directly, not through a
		// hydrated trigger.
		await actions.navigate( 'http://localhost/row5-noscope', {
			html: plainHtml( 'a' ),
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );
		expect( state.initiator ).toBeNull();

		// (b) scope.ref.current is null. The scope object — and its `ref`
		// sub-object — persists across invocations for the same element
		// (hooks.tsx holds it in a useRef), so mutating the `ref` captured
		// on one call affects what a later call from the same element
		// observes.
		const regionB = setupRegionTrigger( 'test/row5-refnull', 'region-b' );
		const scopeB: { ref: { current: unknown } } = regionB.runInScope( () =>
			getScope()
		);
		scopeB.ref.current = null;
		await regionB.runInScope( () =>
			actions.navigate( 'http://localhost/row5-refnull-dest', {
				html: plainHtml( 'b' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBeNull();

		// (c) scope.ref.current is not an element (a text node).
		const regionC = setupRegionTrigger(
			'test/row5-reftextnode',
			'region-c'
		);
		const scopeC: { ref: { current: unknown } } = regionC.runInScope( () =>
			getScope()
		);
		scopeC.ref.current = document.createTextNode( 'x' );
		await regionC.runInScope( () =>
			actions.navigate( 'http://localhost/row5-reftextnode-dest', {
				html: plainHtml( 'c' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBeNull();

		// (d) A real scope whose element has no enclosing router region.
		const noRegion = setupTriggerWithNoRegion( 'test/row5-noregion' );
		await noRegion.runInScope( () =>
			actions.navigate( 'http://localhost/row5-noregion-dest', {
				html: plainHtml( 'd' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBeNull();
	} );

	test( 'row 6 — an explicit initiator still wins ahead of derivation, and an explicit null still suppresses it, both exercised from inside a region', async () => {
		const { state, actions } = await import( '../index' );

		// Each arm gets its own freshly-hydrated, single-use region, with
		// an id unique across the whole file: `routerRegions` is keyed by
		// region id globally, regardless of namespace, so reusing an id
		// already registered elsewhere would silently inherit that other
		// region's (possibly already-nulled) signal instead of a fresh
		// one. A region already used for one completed navigation is
		// unmounted by that navigation's own renderPage() (see
		// setupSharedNamespaceRegionFactory()'s comment above), so reusing
		// one region across all three arms would make the third (the
		// derive arm, the one that actually needs a live scope) read
		// `null` for a reason unrelated to what this row pins.
		const stringArm = setupRegionTrigger(
			'test/row6-string',
			'row6-region-string'
		);
		await stringArm.runInScope( () =>
			actions.navigate( 'http://localhost/row6-string', {
				initiator: 'declared-x',
				html: plainHtml( 'a' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBe( 'declared-x' );

		const nullArm = setupRegionTrigger(
			'test/row6-null',
			'row6-region-null'
		);
		await nullArm.runInScope( () =>
			actions.navigate( 'http://localhost/row6-null', {
				initiator: null,
				html: plainHtml( 'b' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBeNull();

		// Sanity — not vacuous: from a scope inside a region, omitting
		// `initiator` derives a non-null value, so the two assertions
		// above are not merely agreeing with derivation by accident.
		const deriveArm = setupRegionTrigger(
			'test/row6-derive',
			'row6-region-derive'
		);
		await deriveArm.runInScope( () =>
			actions.navigate( 'http://localhost/row6-derive', {
				html: plainHtml( 'c' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBe( 'row6-region-derive' );
	} );

	test( 'row 7 — no derivation input is safe, including a detached element and an element inside a detached region carrier', async () => {
		const { state, actions } = await import( '../index' );

		// A detached element, no region at all.
		const detachedNoRegion = setupTriggerWithNoRegion(
			'test/row7-detached-no-region'
		);
		detachedNoRegion.remove();
		await expect(
			detachedNoRegion.runInScope( () =>
				actions.navigate( 'http://localhost/row7-a', {
					html: plainHtml( 'a' ),
					loadingAnimation: false,
					screenReaderAnnouncement: false,
				} )
			)
		).resolves.toBeUndefined();
		expect( state.initiator ).toBeNull();

		// An element inside a region carrier that is itself detached — the
		// rule stays uniform over any tree (no isConnected check), so the
		// region's honest id is still reported.
		const detachedInRegion = setupRegionTrigger(
			'test/row7-detached-region',
			'region-detached'
		);
		detachedInRegion.remove();
		await expect(
			detachedInRegion.runInScope( () =>
				actions.navigate( 'http://localhost/row7-b', {
					html: plainHtml( 'b' ),
					loadingAnimation: false,
					screenReaderAnnouncement: false,
				} )
			)
		).resolves.toBeUndefined();
		expect( state.initiator ).toBe( 'region-detached' );
	} );

	test( 'row 8 — parseRegionAttribute is unchanged (drift guard), asserted at source level against a literal', () => {
		const routerIndexSource = readFileSync(
			join( dirname( fileURLToPath( import.meta.url ) ), '../index.ts' ),
			'utf-8'
		);

		// This must stay byte-identical to packages/interactivity-router/
		// src/index.ts's parseRegionAttribute(). Do not "fix" it to agree
		// with parseRegionId() above — see that function's own comment for
		// why the disagreement is deliberate and why changing this one
		// would change which regions client navigation updates.
		const parseRegionAttributeSource =
			'const parseRegionAttribute = ( region: Element ) => {\n' +
			'\tconst value = region.getAttribute( regionAttr );\n' +
			'\ttry {\n' +
			'\t\tconst { id, attachTo } = JSON.parse( value );\n' +
			'\t\treturn { id, attachTo };\n' +
			'\t} catch {\n' +
			'\t\treturn { id: value };\n' +
			'\t}\n' +
			'};';

		expect( routerIndexSource ).toContain( parseRegionAttributeSource );
	} );
} );

/**
 * The frame-scope guard.
 *
 * `writeFrameScope` refuses to attribute a navigation to a scope that
 * reached derivation only because it is the ambient scope of one of the
 * router's own lifecycle writes. Rows 1–7, in order, numbered independently
 * of the describe block above.
 *
 * Every row below shares one construction: the outer navigation is started
 * from an action whose scope sits inside a region with a known id
 * (`…-region-x`). Without that, the guard has nothing to refuse.
 */
describe( 'the frame-scope guard', () => {
	// navigate()'s end write is fire-and-forget (`finally` schedules it via
	// afterNextFrame() without yielding it — see index.ts), so a completed
	// `await actions.navigate( … )` does not guarantee state.navigating has
	// been written back to false yet. Left pending on this file's real
	// clock, that write would land during a later test and, being a
	// same-value write (@preact/signals does not notify a signal set to
	// its current value), silently swallow that test's own start batch's
	// rising-edge notification too — a raw effect installed
	// after such a pending write never observes the next navigation's
	// `true` at all, because state.navigating was already (stale-)true.
	// 150 ms comfortably exceeds afterNextFrame()'s 100 ms fallback arm
	// plus its nested setTimeout.
	beforeEach( async () => {
		await new Promise( ( resolve ) => setTimeout( resolve, 150 ) );
	} );

	/**
	 * Builds a reactive-navigate callback for this describe block's rows:
	 * `react()` calls `actions.navigate( innerHref, options )` the first
	 * time `read()`'s signal changes *after* `react` starts being called —
	 * its second call, since the first is the baseline call `effect()`
	 * performs immediately at creation, which may observe a value left
	 * over from an earlier test in this file's shared module state (see
	 * the module comment above the first describe block). Usable for a
	 * signal that takes a different value on every navigation
	 * (`state.url`) or one whose baseline is never itself a value this
	 * describe block cares about (`state.initiator`, which no earlier
	 * test's *pending* work can rewrite — see `buildReactiveNavigateOnRise`
	 * below for the one signal that needs a stronger guard).
	 *
	 * @param actions          The router's `actions`.
	 * @param actions.navigate The router's `navigate()` action.
	 * @param read             Zero-arg getter for the signal to subscribe
	 *                         to.
	 * @param innerHref        The href for the reactive `navigate()` call.
	 * @param options          Extra `navigate()` options (e.g. a declared
	 *                         `initiator`).
	 * @return An object exposing the raw `react` callback (to pass to
	 *         `effect()`, optionally wrapped in `withScope()` first) and
	 *         `settled()`, a promise for the reactive call once it has
	 *         fired (`undefined` before then).
	 */
	function buildReactiveNavigate(
		actions: {
			navigate: ( href: string, options?: any ) => Promise< void >;
		},
		read: () => unknown,
		innerHref: string,
		options: Record< string, unknown > = {}
	) {
		let runCount = 0;
		let fired = false;
		let innerPromise: Promise< void > | undefined;
		const react = () => {
			read();
			runCount++;
			if ( runCount === 2 && ! fired ) {
				fired = true;
				innerPromise = actions.navigate( innerHref, {
					html: plainHtml( 'inner' ),
					loadingAnimation: false,
					screenReaderAnnouncement: false,
					...options,
				} );
			}
		};
		return {
			react,
			settled: () => innerPromise,
		};
	}

	/**
	 * Like `buildReactiveNavigate()` above, but for `state.navigating`
	 * specifically, whose *falling* edge (`true` -> `false`) is written by
	 * a fire-and-forget `afterNextFrame()` callback that an earlier test's
	 * navigation may leave pending on the real clock this file runs under
	 * (`navigate()`'s `finally` never yields it). A plain "fires on the
	 * first change" rule (`buildReactiveNavigate()` above) would treat
	 * that stale `false` as the awaited change and fire too early, from no
	 * ambient scope at all — this happened during development and is why
	 * this variant exists. Skipping the baseline call *and* requiring the
	 * new value to be `true` closes that: a stale write can only ever set
	 * `false`, never `true`, so it cannot satisfy this guard.
	 *
	 * @param actions          The router's `actions`.
	 * @param actions.navigate The router's `navigate()` action.
	 * @param read             Zero-arg getter for `state.navigating`.
	 * @param innerHref        The href for the reactive `navigate()` call.
	 * @param options          Extra `navigate()` options.
	 * @return An object exposing `react` and `settled()`, as above.
	 */
	function buildReactiveNavigateOnRise(
		actions: {
			navigate: ( href: string, options?: any ) => Promise< void >;
		},
		read: () => unknown,
		innerHref: string,
		options: Record< string, unknown > = {}
	) {
		let seenBaseline = false;
		let fired = false;
		let innerPromise: Promise< void > | undefined;
		const react = () => {
			if ( ! seenBaseline ) {
				seenBaseline = true;
				read(); // Subscribe, without acting on the baseline value.
				return;
			}
			if ( read() === true && ! fired ) {
				fired = true;
				innerPromise = actions.navigate( innerHref, {
					html: plainHtml( 'inner' ),
					loadingAnimation: false,
					screenReaderAnnouncement: false,
					...options,
				} );
			}
		};
		return {
			react,
			settled: () => innerPromise,
		};
	}

	/**
	 * Row 6's own destination-page HTML: a full document whose BODY *is* a
	 * `[data-wp-router-region]` carrying the same region id and the same
	 * nested trigger button `setupRegionTrigger()` hydrates initially.
	 *
	 * This matters because `renderPage()` — the router's own navigation-
	 * commit routine — nulls *every* entry in the shared `routerRegions`
	 * map at the start of every completed navigation, and only
	 * repopulates the ids present in `page.regions`; an id absent from the
	 * destination is left at `null`, which unmounts that region's content
	 * (including a nested trigger) permanently (confirmed
	 * by probing `scope.ref.current` and `element.isConnected` across a
	 * completed navigation). Because the null-then-repopulate write is a
	 * single batch, a destination that *does* include the id never
	 * actually renders the intermediate `null` at all — Preact's diff
	 * matches the re-hydrated button against the freshly parsed one by
	 * position and tag, patching the existing DOM node (and its scope,
	 * held in a `useRef` per `hooks.tsx`) in place rather than remounting
	 * it. That is what lets row 6 click "the same element" a second time,
	 * after a completed navigation, at all.
	 *
	 * @param namespace Store namespace — must match the one
	 *                  `setupRegionTrigger()` originally hydrated.
	 * @param regionId  The region id to declare.
	 * @param marker    Distinguishing body text, for readability only.
	 * @return A full HTML document string.
	 */
	function regionHtml( namespace: string, regionId: string, marker: string ) {
		return (
			`<!doctype html><title>t</title><body>` +
			`<div data-wp-interactive="${ namespace }" data-wp-router-region="${ regionId }">` +
			`<button data-wp-on--click="actions.trigger">${ marker }</button>` +
			`</div></body>`
		);
	}

	test( 'row 1 — a scope-less subscriber reacting to state.navigating, state.initiator or state.url reports null, not region-x, for all three trigger points', async () => {
		const { state, actions } = await import( '../index' );

		// state.navigating — written inside the start batch.
		{
			const outer = setupRegionTrigger(
				'test/guard-row1-navigating',
				'guard-row1-region-navigating'
			);
			const nav = buildReactiveNavigateOnRise(
				actions,
				() => state.navigating,
				'http://localhost/guard-row1-navigating-inner'
			);
			const dispose = effect( nav.react );
			await outer.runInScope( () =>
				actions.navigate(
					'http://localhost/guard-row1-navigating-outer',
					{
						html: plainHtml( 'outer' ),
						loadingAnimation: false,
						screenReaderAnnouncement: false,
					}
				)
			);
			await nav.settled();
			expect( state.initiator ).toBeNull();
			dispose();
		}

		// state.initiator — also written inside the start batch.
		{
			const outer = setupRegionTrigger(
				'test/guard-row1-initiator',
				'guard-row1-region-initiator'
			);
			const nav = buildReactiveNavigate(
				actions,
				() => state.initiator,
				'http://localhost/guard-row1-initiator-inner'
			);
			const dispose = effect( nav.react );
			await outer.runInScope( () =>
				actions.navigate(
					'http://localhost/guard-row1-initiator-outer',
					{
						html: plainHtml( 'outer' ),
						loadingAnimation: false,
						screenReaderAnnouncement: false,
					}
				)
			);
			await nav.settled();
			expect( state.initiator ).toBeNull();
			dispose();
		}

		// state.url — written only in the commit batch, later than the
		// other two; this is the trigger point that catches a marker
		// applied to the start batch and not the commit batch.
		{
			const outer = setupRegionTrigger(
				'test/guard-row1-url',
				'guard-row1-region-url'
			);
			const nav = buildReactiveNavigate(
				actions,
				() => state.url,
				'http://localhost/guard-row1-url-inner'
			);
			const dispose = effect( nav.react );
			await outer.runInScope( () =>
				actions.navigate( 'http://localhost/guard-row1-url-outer', {
					html: plainHtml( 'outer' ),
					loadingAnimation: false,
					screenReaderAnnouncement: false,
				} )
			);
			await nav.settled();
			expect( state.initiator ).toBeNull();
			dispose();
		}
	} );

	test( "row 2 — a withScope-wrapped raw effect() carrying region B's own scope, reacting to the rising edge of state.navigating, still reports lifecycle-b", async () => {
		const { state, actions } = await import( '../index' );

		// withScope() captures getScope() at *wrap* time, so the wrap
		// must happen inside a scoped callback belonging to region B —
		// here, region B's own hydrated trigger, via runInScope().
		const regionB = setupRegionTrigger(
			'test/guard-row2-b',
			'lifecycle-b'
		);
		const nav = buildReactiveNavigateOnRise(
			actions,
			() => state.navigating,
			'http://localhost/guard-row2-inner'
		);
		regionB.runInScope( () => effect( withScope( nav.react ) ) );

		const outer = setupRegionTrigger(
			'test/guard-row2-outer',
			'guard-row2-region-x'
		);
		await outer.runInScope( () =>
			actions.navigate( 'http://localhost/guard-row2-outer', {
				html: plainHtml( 'outer' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		await nav.settled();

		expect( state.initiator ).toBe( 'lifecycle-b' );
	} );

	test( "row 3 — an explicit initiator string still wins even when called from inside the router's own write frame, by a callback whose captured scope is the initiating element's own", async () => {
		const { state, actions } = await import( '../index' );

		// Row 4's construction, with one effect instead of two: the
		// withScope-wrapped reacting effect and the outer trigger share
		// the *same* hydrated element, so the scope the effect captures
		// is the very object the outer navigation itself carries.
		const trigger = setupRegionTrigger(
			'test/guard-row3',
			'guard-row3-region-x'
		);
		const nav = buildReactiveNavigateOnRise(
			actions,
			() => state.navigating,
			'http://localhost/guard-row3-inner',
			{ initiator: 'declared-x' }
		);
		trigger.runInScope( () => effect( withScope( nav.react ) ) );

		trigger.runInScope( () =>
			actions.navigate( 'http://localhost/guard-row3-outer', {
				html: plainHtml( 'outer' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);

		// The reactive call's synchronous prefix — including its start
		// batch, which writes state.initiator — has already run by this
		// point, nested inside the outer's own synchronous span; no need
		// to wait for either navigation to fully settle before reading it.
		expect( state.initiator ).toBe( 'declared-x' );

		await nav.settled();
		expect( state.initiator ).toBe( 'declared-x' );
	} );

	test( "row 4 — a third-level navigation started from a withScope effect, after a nested navigation's own write span has closed, still reports null", async () => {
		const { state, actions } = await import( '../index' );

		const trigger = setupRegionTrigger(
			'test/guard-row4',
			'guard-row4-region-x'
		);

		// Effect 1 — scope-less, registered *first*: reacts to the outer
		// navigation's rising edge and starts a second-level (inner)
		// navigation, whose own write span opens and closes before
		// effect 2 below gets its turn.
		const innerNav = buildReactiveNavigateOnRise(
			actions,
			() => state.navigating,
			'http://localhost/guard-row4-inner'
		);
		trigger.runInScope( () => effect( innerNav.react ) );

		// Effect 2 — withScope-wrapped with the *same* element's scope,
		// registered second: also reacts to the outer navigation's rising
		// edge, and starts the third-level navigation this row asserts
		// on, after the inner span above has already closed.
		const thirdNav = buildReactiveNavigateOnRise(
			actions,
			() => state.navigating,
			'http://localhost/guard-row4-third'
		);
		trigger.runInScope( () => effect( withScope( thirdNav.react ) ) );

		const outerPromise = trigger.runInScope( () =>
			actions.navigate( 'http://localhost/guard-row4-outer', {
				html: plainHtml( 'outer' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);

		// Both reactive calls' synchronous prefixes have already run,
		// nested inside the outer's own synchronous span.
		expect( thirdNav.settled() ).toBeDefined();
		expect( state.initiator ).toBeNull();

		await Promise.all( [
			outerPromise,
			innerNav.settled(),
			thirdNav.settled(),
		] );
		expect( state.initiator ).toBeNull();
	} );

	test( 'row 5 — a data-wp-watch in region B reacting to the end transition still reports guard-row5-region-b, not region-x and not null (characterisation)', async () => {
		vi.useFakeTimers( { shouldAdvanceTime: true } );
		const fakeSetTimeout = globalThis.setTimeout;
		const redirectSetTimeout = ( (
			callback: TimerHandler,
			delay?: number,
			...args: unknown[]
		) => {
			if ( delay === undefined || delay === 0 ) {
				return nativeSetTimeout( callback, 0, ...args );
			}
			return fakeSetTimeout( callback, delay, ...args );
		} ) as typeof globalThis.setTimeout;
		globalThis.setTimeout = redirectSetTimeout;
		window.performance.measure = vi.fn();
		window.performance.getEntriesByType = vi.fn( () => [] );
		try {
			const { state, actions } = await import( '../index' );

			/**
			 * Settles afterNextFrame on either scheduler arm — see the
			 * same helper's comment in directive-observability.ts.
			 */
			const advanceOneFrame = async () => {
				await vi.advanceTimersByTimeAsync( 300 );
				await new Promise( ( resolve ) =>
					nativeSetTimeout( resolve, 0 )
				);
			};

			// A real hydrated data-wp-watch, in region B, that reacts to
			// the falling edge of state.navigating (true -> false, the
			// end write) and navigates reactively — the reading is only
			// ever taken after having observed a true, so a leftover
			// `false` from an earlier test's completed navigation cannot
			// fire it prematurely at hydration.
			let sawTrue = false;
			let fired = false;
			let innerPromise: Promise< void > | undefined;
			const namespace = 'test/guard-row5';
			store( namespace, {
				callbacks: {
					reactToEnd() {
						if ( state.navigating === true ) {
							sawTrue = true;
						} else if (
							state.navigating === false &&
							sawTrue &&
							! fired
						) {
							fired = true;
							innerPromise = actions.navigate(
								'http://localhost/guard-row5-inner',
								{
									html: plainHtml( 'inner' ),
									loadingAnimation: false,
									screenReaderAnnouncement: false,
								}
							);
						}
					},
				},
			} );

			// Region B's own markup, reused for the destination page below:
			// renderPage() nulls every entry in the shared routerRegions
			// map at the start of every completed navigation, and only
			// repopulates ids present in the destination — an id absent
			// there is left at null, unmounting that region's content
			// (including its data-wp-watch, and the useSignalEffect flush
			// loop backing it) for good. Since the null-then-repopulate
			// write is one batch, a destination that *does* include the id
			// never actually renders the intermediate null, so region B's
			// watch survives the outer navigation's own commit to observe
			// its end write afterwards. The id itself
			// (guard-row5-region-b) is unique across this file —
			// routerRegions is keyed by id regardless of namespace, and
			// reusing row 2's "lifecycle-b" here would silently inherit
			// that already-nulled signal instead of a fresh one.
			const regionBMarkup = ( marker: string ) =>
				`<div data-wp-interactive="${ namespace }" data-wp-router-region="guard-row5-region-b" data-wp-watch="callbacks.reactToEnd">${ marker }</div>`;

			const container = document.createElement( 'div' );
			container.innerHTML = regionBMarkup( '' );
			document.body.appendChild( container );
			const regionB = container.firstElementChild as Element;
			hydrate( toVdom( regionB ), getRegionRootFragment( regionB ) );
			await advanceOneFrame();

			const outer = setupRegionTrigger(
				'test/guard-row5-outer',
				'guard-row5-region-x'
			);
			await outer.runInScope( () =>
				actions.navigate( 'http://localhost/guard-row5-outer', {
					html: `<!doctype html><title>t</title><body>${ regionBMarkup(
						'outer'
					) }</body>`,
					loadingAnimation: false,
					screenReaderAnnouncement: false,
				} )
			);
			// Settle the frame-deferred data-wp-watch flush that observes
			// both the start and the end transitions.
			await advanceOneFrame();
			await advanceOneFrame();
			await innerPromise;
			await advanceOneFrame();

			expect( state.initiator ).toBe( 'guard-row5-region-b' );
		} finally {
			vi.useRealTimers();
			globalThis.setTimeout = nativeSetTimeout;
		}
	} );

	test( 'row 6 — after a navigation from an element in a region has fully ended, a second, ordinary navigation from the same element still reports that region', async () => {
		const { state, actions } = await import( '../index' );

		const namespace = 'test/guard-row6';
		const regionId = 'guard-row6-region-x';
		const trigger = setupRegionTrigger( namespace, regionId );

		await trigger.runInScope( () =>
			actions.navigate( 'http://localhost/guard-row6-first', {
				html: regionHtml( namespace, regionId, 'first' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBe( 'guard-row6-region-x' );

		// The end write is fire-and-forget (`finally` schedules it via
		// afterNextFrame() without yielding it), so the completed await
		// above does not guarantee it has run yet — wait for it, so the
		// second navigation genuinely starts after the first's lifecycle
		// has fully ended, matching the row's own "has fully ended"
		// premise (and letting a marker wrongly set there, and never
		// restored, actually land before the second navigation reads it).
		await new Promise( ( resolve ) => setTimeout( resolve, 150 ) );

		await trigger.runInScope( () =>
			actions.navigate( 'http://localhost/guard-row6-second', {
				html: regionHtml( namespace, regionId, 'second' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		expect( state.initiator ).toBe( 'guard-row6-region-x' );
	} );

	test( 'row 7 — a throwing raw effect in the start batch does not pin the frame marker (a restore outside finally would make the second navigation report null)', async () => {
		const { state, actions } = await import( '../index' );
		const namespace = 'test/guard-row7-start';
		const regionId = 'guard-row7-start-region-x';
		const firstHref = 'http://localhost/guard-row7-start-first';
		const trigger = setupRegionTrigger( namespace, regionId );
		expect( state.navigating ).toBe( false );
		// Capture the action wrapper from this element's scope, then invoke it
		// outside the DOM event so a synchronous start-batch rejection remains
		// observable to the test.
		const navigateFromTrigger = trigger.runInScope( () =>
			withScope( ( href: string, options: any ) =>
				actions.navigate( href, options )
			)
		);
		let throwOnStart = false;
		let consumerError: unknown;
		let effectRuns = 0;

		const dispose = trigger.runInScope( () =>
			effect(
				withScope( () => {
					effectRuns++;
					const navigating = state.navigating;
					if ( throwOnStart && navigating === true ) {
						try {
							throw new Error( 'start-consumer-effect-throw' );
						} catch ( error ) {
							consumerError = error;
							throw error;
						}
					}
				} )
			)
		);

		throwOnStart = true;
		let caught: unknown;
		try {
			await navigateFromTrigger( firstHref, {
				html: regionHtml( namespace, regionId, 'first' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} );
		} catch ( error ) {
			caught = error;
		}
		throwOnStart = false;
		dispose();

		expect( caught ).toBeInstanceOf( Error );
		expect( ( caught as Error ).message ).toBe(
			'start-consumer-effect-throw'
		);
		expect( { effectRuns, consumerError } ).toEqual( {
			effectRuns: 2,
			consumerError: expect.any( Error ),
		} );
		expect( ( consumerError as Error ).message ).toBe(
			'start-consumer-effect-throw'
		);

		// The rejected navigation's finally schedules its end write; let that
		// write finish before starting the follow-up navigation.
		await new Promise( ( resolve ) => setTimeout( resolve, 150 ) );

		await navigateFromTrigger( 'http://localhost/guard-row7-start-second', {
			html: regionHtml( namespace, regionId, 'second' ),
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );

		expect( state.initiator ).toBe( regionId );
	} );

	test( 'row 8 — a throwing raw effect in the commit batch does not pin the frame marker (a restore outside finally would make the second navigation report null)', async () => {
		const { state, actions } = await import( '../index' );
		const namespace = 'test/guard-row8-commit';
		const regionId = 'guard-row8-commit-region-x';
		const firstHref = 'http://localhost/guard-row8-commit-first';
		const trigger = setupRegionTrigger( namespace, regionId );
		const navigateFromTrigger = trigger.runInScope( () =>
			withScope( ( href: string, options: any ) =>
				actions.navigate( href, options )
			)
		);

		const dispose = trigger.runInScope( () =>
			effect(
				withScope( () => {
					if ( state.url === firstHref ) {
						throw new Error( 'commit-consumer-effect-throw' );
					}
				} )
			)
		);

		let caught: unknown;
		try {
			await navigateFromTrigger( firstHref, {
				html: regionHtml( namespace, regionId, 'first' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} );
		} catch ( error ) {
			caught = error;
		}
		dispose();

		expect( caught ).toBeInstanceOf( Error );
		expect( ( caught as Error ).message ).toBe(
			'commit-consumer-effect-throw'
		);

		// The rejected navigation's finally schedules its end write; let that
		// write finish before starting the follow-up navigation.
		await new Promise( ( resolve ) => setTimeout( resolve, 150 ) );

		await navigateFromTrigger(
			'http://localhost/guard-row8-commit-second',
			{
				html: regionHtml( namespace, regionId, 'second' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			}
		);

		expect( state.initiator ).toBe( regionId );
	} );

	test( 'row 7 — the commit batch still contains the same statements in the same order (drift guard), asserted at source level against a literal', () => {
		const routerIndexSource = readFileSync(
			join( dirname( fileURLToPath( import.meta.url ) ), '../index.ts' ),
			'utf-8'
		);

		// This must stay byte-identical to packages/interactivity-router/
		// src/index.ts's commit batch inside navigate() (the batch() call
		// wrapped by the frame-scope guard's save-and-restore, not the
		// wrapping itself). What this protects: the atomicity of
		// state.url with renderPage() is what makes a rendering consumer
		// see the URL and the DOM change together.
		const commitBatchSource =
			'\t\t\t\t\t\tbatch( () => {\n' +
			'\t\t\t\t\t\t\t// Updates the URL in the state.\n' +
			'\t\t\t\t\t\t\tstate.url = href;\n' +
			'\n' +
			'\t\t\t\t\t\t\t// Updates the navigation status once the the new page rendering\n' +
			'\t\t\t\t\t\t\t// has been completed.\n' +
			'\t\t\t\t\t\t\tif ( loadingAnimation ) {\n' +
			'\t\t\t\t\t\t\t\tnavigation.hasStarted = false;\n' +
			'\t\t\t\t\t\t\t\tnavigation.hasFinished = true;\n' +
			'\t\t\t\t\t\t\t}\n' +
			'\n' +
			'\t\t\t\t\t\t\t// Renders the new page.\n' +
			'\t\t\t\t\t\t\trenderPage( page );\n' +
			'\t\t\t\t\t\t} );';

		expect( routerIndexSource ).toContain( commitBatchSource );
	} );
} );
