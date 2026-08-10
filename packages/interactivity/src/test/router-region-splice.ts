// eslint-disable-next-line no-warning-comments
/**
 * @jest-environment jsdom
 */

/**
 * RED probes — a splice into a NAVIGATED router region does not persist.
 *
 * The `router-region` directive renders `routerRegions.get( id ).value` as
 * the region's children. After a navigation the signal holds the region
 * vnode; a `renderHTML` splice rebuilds the TREE path (§3) — but the path
 * rebuild RE-CREATES the region's `Directives` wrapper, whose render re-runs
 * the `router-region` callback, which returns the STALE signal vnode (still
 * the pre-splice object). Preact diffs that stale vnode against the
 * just-spliced tree and REMOVES the new content — the splice is reverted
 * DURING the splice's own render. Net effect: `renderHTML` into a navigated
 * region is a silent no-op (no warn; the path was found).
 *
 * These probes are RED on the current code. The fix (region signal
 * write-through from the spliced tree, plan §6) makes them green.
 */

import { h, type VNode } from 'preact';

/**
 * Internal dependencies
 */
import '../directives'; // Registers all the core directives.
import { store } from '../store';
import { getContext } from '../scopes';
import { renderHTML } from '../render';
import { hydrateRegions } from '../hydration';
import { routerRegions } from '../directives/router-region';
import { Directives } from '../hooks';

const NS = 'test/router-region-splice';

store( NS, {
	state: { active: true },
	actions: {
		bump() {
			getContext< { n: number } >().n += 1;
		},
	},
} );

/* eslint-disable @wordpress/wp-global-usage */
const testGlobalThis = globalThis as typeof globalThis & {
	IS_GUTENBERG_PLUGIN?: boolean;
};
let originalIsGutenbergPlugin: boolean | undefined;

( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = false;

beforeEach( () => {
	document.body.innerHTML = '';
	originalIsGutenbergPlugin = testGlobalThis.IS_GUTENBERG_PLUGIN;
	testGlobalThis.IS_GUTENBERG_PLUGIN = false;
} );

afterEach( () => {
	testGlobalThis.IS_GUTENBERG_PLUGIN = originalIsGutenbergPlugin;
} );
/* eslint-enable @wordpress/wp-global-usage */

// Drains preact's effect queue reliably: a macrotask plus two frames.
const flush = async () => {
	await new Promise( ( r ) => setTimeout( r, 0 ) );
	await new Promise( ( r ) => requestAnimationFrame( r ) );
	await new Promise( ( r ) => requestAnimationFrame( r ) );
};

/**
 * Navigation-equivalent region update: sets the region signal to a fresh
 * region vnode with new children — the same shape `renderPage` writes via
 * `cloneRouterRegionContent( page.regions[ id ] )`.
 * @param id
 * @param children
 */
const navigateRegion = ( id: string, children: VNode[] ) => {
	routerRegions.get( id )!.value = h(
		'div',
		{ 'data-testid': 'region' },
		children
	);
};

const islandHtml = ( regionId: string ) => `
	<div data-wp-interactive="${ NS }">
		<div data-wp-context='{ "n": 1 }'>
			<button data-testid="bump" data-wp-on--click="actions.bump">bump</button>
			<div data-testid="region" data-wp-router-region="${ regionId }">
				<p data-testid="ssr">ssr</p>
			</div>
		</div>
	</div>
`;

describe( 'renderHTML into a router region (after a navigation)', () => {
	it( "RED: a splice into a navigated region does not persist (the stale signal reverts it in the splice's own render)", async () => {
		document.body.innerHTML = islandHtml( 'test-r1' );
		await hydrateRegions();
		await flush();

		// Navigation-equivalent: the region signal now holds fresh content.
		navigateRegion( 'test-r1', [
			h( 'p', null, 'a' ),
			h( 'p', null, 'b' ),
		] );
		await flush();

		const regionEl = document.querySelector(
			'[data-testid="region"]'
		) as HTMLElement;
		expect( regionEl.querySelectorAll( 'p' ).length ).toBe( 2 );

		// Splice a button into the region — it must persist. RED: the path
		// rebuild re-creates the Directives wrapper, the router-region
		// callback re-reads the stale signal vnode, and the button is
		// removed before the splice's own render commits.
		renderHTML( regionEl, '<button data-testid="x">x</button>' );
		await flush();
		expect( regionEl.querySelector( '[data-testid="x"]' ) ).not.toBeNull();
	} );

	it( 'RED: a splice into a navigated region survives a later region re-render (context change)', async () => {
		document.body.innerHTML = islandHtml( 'test-r1b' );
		await hydrateRegions();
		await flush();

		navigateRegion( 'test-r1b', [
			h( 'p', null, 'a' ),
			h( 'p', null, 'b' ),
		] );
		await flush();

		const regionEl = document.querySelector(
			'[data-testid="region"]'
		) as HTMLElement;

		// Splice a button into the region.
		renderHTML( regionEl, '<button data-testid="x">x</button>' );
		await flush();

		// The region's Directives wrapper re-renders because the context
		// above it changed — the splice must survive. RED: it is already
		// gone (reverted by the stale signal during the splice).
		(
			document.querySelector(
				'[data-testid="bump"]'
			) as HTMLButtonElement
		 ).click();
		await flush();

		expect( regionEl.querySelector( '[data-testid="x"]' ) ).not.toBeNull();
	} );

	it( "GREEN guard: a splice into an SSR-only region survives (signal undefined, children are the tree's)", async () => {
		document.body.innerHTML = islandHtml( 'test-r1c' );
		await hydrateRegions();
		await flush();

		const regionEl = document.querySelector(
			'[data-testid="region"]'
		) as HTMLElement;

		// NO navigation — the signal is still undefined (SSR content).
		renderHTML( regionEl, '<button data-testid="x">x</button>' );
		await flush();
		expect( regionEl.querySelector( '[data-testid="x"]' ) ).not.toBeNull();

		// A context change must NOT remove it (the signal is undefined, so
		// the directive keeps the tree's children).
		(
			document.querySelector(
				'[data-testid="bump"]'
			) as HTMLButtonElement
		 ).click();
		await flush();
		expect( regionEl.querySelector( '[data-testid="x"]' ) ).not.toBeNull();
	} );

	it( 'GREEN: a splice into a navigated region with a lower-priority directive keeps the directive applied', async () => {
		document.body.innerHTML = islandHtml( 'test-r1d' );
		await hydrateRegions();
		await flush();

		// Simulate a navigation whose region element ALSO carries a class
		// directive: `cloneRouterRegionContent` keeps the priority levels
		// BELOW `router-region`, so the signal holds a `Directives` wrapper
		// with the remaining ['class'] level — the same shape the real router
		// produces. The write-through must preserve that level.
		routerRegions.get( 'test-r1d' )!.value = h( Directives, {
			directives: {
				'router-region': [
					{
						value: 'test-r1d',
						namespace: NS,
						suffix: null,
						uniqueId: null,
					},
				],
				class: [
					{
						value: 'state.active',
						namespace: NS,
						suffix: 'bn-active',
						uniqueId: null,
					},
				],
			},
			priorityLevels: [ [ 'class' ] ],
			element: h(
				'div',
				{
					'data-testid': 'region',
					'data-wp-class--bn-active': 'state.active',
				},
				[ h( 'p', null, 'a' ) ]
			),
			originalProps: {},
		} );
		await flush();

		const regionEl = document.querySelector(
			'[data-testid="region"]'
		) as HTMLElement;
		expect( regionEl ).toHaveClass( 'bn-active' );

		// Splice into the region — must persist AND keep the class directive.
		renderHTML( regionEl, '<button data-testid="x">x</button>' );
		await flush();
		expect( regionEl.querySelector( '[data-testid="x"]' ) ).not.toBeNull();
		expect( regionEl ).toHaveClass( 'bn-active' );
	} );
} );
