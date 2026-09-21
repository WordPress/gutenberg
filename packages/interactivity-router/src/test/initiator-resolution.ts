/**
 * Deriving the initiator from the ambient directive scope (Task 3), and the
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
 * `packages/interactivity/src/index.ts` cannot be imported for real under
 * Jest (investigation fact 1), so, like every other file in this
 * directory, this suite is exercised through the shim that assembles the
 * real implementations of everything the router destructures from
 * `privateApis` (investigation fact 2) — see
 * `__fixtures__/interactivity-shim.ts`. This file hydrates real
 * `data-wp-on--click` triggers, which call `performance.measure()`
 * (`packages/interactivity/src/directives/on.ts`), unimplemented by jsdom
 * (investigation fact 4) — stubbed below.
 *
 * `jest.resetModules()` is unusable here (see the harness comment in
 * `lifecycle-navigate.ts`), so the router module is imported once and every
 * test in this file shares that one instance and its `core/router` store.
 * No row in this file depends on the lifecycle keys' pristine pre-navigation
 * value, so ordering between tests is not load-bearing here.
 */

/**
 * External dependencies
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hydrate } from 'preact';

/**
 * WordPress dependencies
 */
jest.mock( '@wordpress/interactivity', () =>
	require( './__fixtures__/interactivity-shim' )
);

import { store, privateApis } from '@wordpress/interactivity';

const CONSENT =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';
const { getRegionRootFragment, toVdom, getScope, routerRegions } =
	privateApis( CONSENT );

beforeAll( () => {
	// See the module comment: this file hydrates real data-wp-on--click
	// triggers, whose handler calls performance.measure(), unimplemented
	// by jsdom.
	window.performance.measure = jest.fn();
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
 * the destination page doesn't happen to include (investigation: a region
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

	test( 'row 7 — no derivation input causes a throw, including a detached element and an element inside a detached region carrier (characterisation of Requirement 11)', async () => {
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
			join( __dirname, '../index.ts' ),
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
