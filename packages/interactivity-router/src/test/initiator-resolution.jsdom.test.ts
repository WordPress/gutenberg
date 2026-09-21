/**
 * Derives the initiator from the ambient directive scope and verifies that
 * region identity uses the directive runtime's shared value interpretation.
 *
 * The attribute-form tests pin attribution against **real, hydrated
 * directive-side registration** for all six `data-wp-router-region`
 * attribute forms — the four id-bearing forms and the two absent-id forms —
 * and two further tests exercise matching, updates, and attachment through
 * navigation for those forms.
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
 * No test in this file depends on the lifecycle keys' pristine pre-navigation
 * value, so ordering between tests is not load-bearing here.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { hydrate } from 'preact';
import { store, privateApis, watch, withScope } from '@wordpress/interactivity';
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
 * what the attribute-form and absent-scope tests need to exercise every attribute form.
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
 * Builds a router-region element, hydrates its real directive, and returns
 * the element so navigation can be observed through its rendered content.
 *
 * @param namespace      Store namespace — must be unique per call.
 * @param regionAttrText Raw `data-wp-router-region` value.
 * @param marker         Text rendered inside the region.
 * @return The hydrated region element.
 */
function setupNavigableRegion(
	namespace: string,
	regionAttrText: string,
	marker: string
) {
	store( namespace, {} );

	const container = document.createElement( 'div' );
	container.innerHTML = regionMarkup( namespace, regionAttrText, marker );
	document.body.appendChild( container );
	const regionEl = container.firstElementChild as Element;

	hydrate( toVdom( regionEl ), getRegionRootFragment( regionEl ) );

	return regionEl;
}

/**
 * Creates markup for a hydrated or destination router region.
 *
 * @param namespace      Store namespace used by the interactive island.
 * @param regionAttrText Raw `data-wp-router-region` value.
 * @param marker         Text rendered inside the region.
 * @return Serialized router-region markup.
 */
function regionMarkup(
	namespace: string,
	regionAttrText: string,
	marker: string
) {
	return (
		`<div data-wp-interactive="${ namespace }" data-wp-router-region='${ regionAttrText }'>` +
		`<span>${ marker }</span>` +
		'</div>'
	);
}

/**
 * Same recipe as `setupRegionTrigger()`, but with no `data-wp-router-region`
 * anywhere in the markup — for the "no enclosing region" input and the
 * "detached element" (no region) input.
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
 * namespace, with the trigger inside `inner` — the nested-regions
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
 * interactive namespace — the "two instances of one block type"
 * construction, e.g. two Query blocks both under `core/query`.
 *
 * Regions are hydrated **lazily**, one at a time via `hydrateRegion()`,
 * rather than all upfront. This matters: `renderPage()` (the router's own
 * navigation-commit routine) resets *every* entry already registered in
 * the shared `routerRegions` map — not only the ones present on the
 * destination page — which unmounts any region hydrated earlier whose id
 * the destination page doesn't happen to include (a region
 * hydrated *before* an unrelated navigation completes loses its scope's
 * `ref.current`, the same guard the absent-scope test exercises deliberately — so
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
 * Used by the attribute-forms test to read the directive-side-registered id straight out of
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
	test( 'the four id-bearing attribute forms report the id the shared interpretation registers', async () => {
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

	test( 'an empty region attribute and an id-less JSON form both report null, asserted as null and not merely as falsy', async () => {
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

	test( 'plain, object, namespace-prefixed, and JSON-scalar regions match and update under their registered ids', async () => {
		const { actions } = await import( '../index' );
		const forms = [
			{
				namespace: 'test/r19-match-plain',
				attribute: 'r19-match-plain',
				id: 'r19-match-plain',
				before: 'plain-before',
				after: 'plain-after',
			},
			{
				namespace: 'test/r19-match-object',
				attribute: '{"id":"r19-match-object"}',
				id: 'r19-match-object',
				before: 'object-before',
				after: 'object-after',
			},
			{
				namespace: 'test/r19-match-namespace',
				attribute: 'myplugin::r19-match-namespace',
				id: 'r19-match-namespace',
				before: 'namespace-before',
				after: 'namespace-after',
			},
			{
				namespace: 'test/r19-match-scalar',
				attribute: '901',
				id: '901',
				before: 'scalar-before',
				after: 'scalar-after',
			},
		];

		const regions = forms.map( ( form ) => {
			const element = setupNavigableRegion(
				form.namespace,
				form.attribute,
				form.before
			);
			expect( routerRegions.has( form.id ) ).toBe( true );
			return element;
		} );

		await actions.navigate( 'http://localhost/r19-matching', {
			html: plainHtml(
				forms
					.map( ( form ) =>
						regionMarkup(
							form.namespace,
							form.attribute,
							form.after
						)
					)
					.join( '' )
			),
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );

		expect( regions.map( ( region ) => region.textContent ) ).toEqual(
			forms.map( ( form ) => form.after )
		);
	} );

	test( 'namespace-prefixed and plain JSON object regions attach destination content under their declared parents', async () => {
		const { actions } = await import( '../index' );
		const cases = [
			{
				namespace: 'test/r19-attach-namespace',
				id: 'r19-attach-namespace',
				parentId: 'r19-parent-namespace',
				attribute:
					'myplugin::{"id":"r19-attach-namespace","attachTo":"#r19-parent-namespace"}',
				marker: 'namespace-attached',
			},
			{
				namespace: 'test/r19-attach-object',
				id: 'r19-attach-object',
				parentId: 'r19-parent-object',
				attribute:
					'{"id":"r19-attach-object","attachTo":"#r19-parent-object"}',
				marker: 'object-attached',
			},
		];

		for ( const item of cases ) {
			const parent = document.createElement( 'div' );
			parent.id = item.parentId;
			document.body.appendChild( parent );
			// Register each id from an existing region; the destination's
			// attachTo value then exercises the router's new-region path.
			setupNavigableRegion( item.namespace, item.id, 'before-attach' );
		}

		await actions.navigate( 'http://localhost/r19-attachment', {
			html: plainHtml(
				cases
					.map( ( item ) =>
						regionMarkup(
							item.namespace,
							item.attribute,
							item.marker
						)
					)
					.join( '' )
			),
			loadingAnimation: false,
			screenReaderAnnouncement: false,
		} );

		for ( const item of cases ) {
			expect(
				document.getElementById( item.parentId )
			).toHaveTextContent( item.marker );
		}
	} );

	test( 'nested regions report the nearest enclosing region, not the outermost', async () => {
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

	test( 'two instances of one block type, in two regions with distinct ids, are distinguished', async () => {
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

	test( 'absent-scope inputs report null and never throw: no scope at all, ref.current null, ref.current a text node, no enclosing region', async () => {
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

	test( 'an explicit initiator still wins ahead of derivation, and an explicit null still suppresses it, both exercised from inside a region', async () => {
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

	test( 'no derivation input is safe, including a detached element and an element inside a detached region carrier', async () => {
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
} );

/**
 * The scope semantics of watcher-driven navigation derivation.
 *
 * `watch()` derives `null` without an ambient directive scope, while
 * `data-wp-watch` and callbacks explicitly wrapped with `withScope()` derive
 * from the scope their author installed.
 */
describe( 'watcher scope semantics for navigation derivation', () => {
	// navigate()'s end write is fire-and-forget (`finally` schedules it via
	// afterNextFrame() without yielding it — see index.ts), so a completed
	// `await actions.navigate( … )` does not guarantee state.navigating has
	// been written back to false yet. Left pending on this file's real
	// clock, that write would land during a later test and, being a
	// same-value write (@preact/signals does not notify a signal set to
	// its current value), silently swallow that test's own start batch's
	// rising-edge notification too — a watcher installed
	// after such a pending write never observes the next navigation's
	// `true` at all, because state.navigating was already (stale-)true.
	// 150 ms comfortably exceeds afterNextFrame()'s 100 ms fallback arm
	// plus its nested setTimeout.
	beforeEach( async () => {
		await new Promise( ( resolve ) => setTimeout( resolve, 150 ) );
	} );

	test( 'derivation reads the ambient scope without a router-side marker', () => {
		/** Source text used to pin the router's scope derivation mechanism. */
		const routerIndexSource = readFileSync(
			join( dirname( fileURLToPath( import.meta.url ) ), '../index.ts' ),
			'utf-8'
		);

		expect( routerIndexSource ).not.toContain( 'writeFrameScope' );
		expect( routerIndexSource ).not.toContain( 'entryScope' );
		expect( routerIndexSource ).not.toContain(
			'scope === writeFrameScope'
		);
		expect( routerIndexSource ).toContain( 'const scope = getScope();' );
	} );

	/**
	 * Builds a reactive-navigate callback for this describe block's tests:
	 * `react()` calls `actions.navigate( innerHref, options )` the first
	 * time `read()`'s signal changes *after* `react` starts being called —
	 * its second call, since the first is the baseline call `watch()`
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
	 *         `watch()`, optionally wrapped in `withScope()` first) and
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
	 * The destination-page HTML for the second-click test: a full document whose BODY *is* a
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
	 * it. That is what lets that test click "the same element" a second time,
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

	test( 'an unwrapped watch() subscriber reacting to state.navigating, state.initiator or state.url derives null for all three trigger points', async () => {
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
			const dispose = watch( nav.react );
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
			const dispose = watch( nav.react );
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
		// other two, so this covers both lifecycle write batches.
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
			const dispose = watch( nav.react );
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

	test( 'a withScope-wrapped watch callback keeps its captured region when another region writes the trigger signal', async () => {
		const { state, actions } = await import( '../index' );

		const regionA = setupRegionTrigger(
			'test/watch-row2-a',
			'watch-row2-region-a'
		);
		const nav = buildReactiveNavigateOnRise(
			actions,
			() => state.navigating,
			'http://localhost/watch-row2-inner'
		);
		const wrappedReact = regionA.runInScope( () => withScope( nav.react ) );
		const dispose = watch( wrappedReact );

		const regionB = setupRegionTrigger(
			'test/watch-row2-b',
			'watch-row2-region-b'
		);
		await regionB.runInScope( () =>
			actions.navigate( 'http://localhost/watch-row2-outer', {
				html: plainHtml( 'outer' ),
				loadingAnimation: false,
				screenReaderAnnouncement: false,
			} )
		);
		await nav.settled();

		expect( state.initiator ).toBe( 'watch-row2-region-a' );
		dispose();
	} );

	test( 'a data-wp-watch in region B reacting to the end transition derives region B', async () => {
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
			// routerRegions is keyed by id regardless of namespace, so
			// reusing an earlier region id would silently inherit that
			// already-nulled signal instead of a fresh one.
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

	test( 'after a navigation from an element in a region has fully ended, a second, ordinary navigation from the same element still reports that region', async () => {
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
		// premise.
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
} );
