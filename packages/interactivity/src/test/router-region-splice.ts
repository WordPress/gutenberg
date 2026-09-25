// eslint-disable-next-line no-warning-comments
/**
 * @jest-environment jsdom
 */

/**
 * Router-region splice tests — the region signal must mirror the tree.
 *
 * The `router-region` directive renders `routerRegions.get( id ).value` as
 * the region's children. After a navigation the signal holds the region
 * vnode; a `renderHTML` splice rebuilds the TREE path (§3) — but the path
 * rebuild RE-CREATES the region's `Directives` wrapper, whose render re-runs
 * the `router-region` callback and re-reads the signal. Without a
 * write-through, the signal still holds the PRE-splice vnode, so preact
 * diffs it against the just-spliced tree and REMOVES the new content — the
 * splice is reverted DURING the splice's own render (a silent no-op).
 *
 * The fix (`writeRegionSignal` in render.ts) writes the rebuilt region
 * content into the signal before the render, so the signal mirrors the tree
 * and every splice sticks.
 *
 * Signal states: `undefined` (SSR, directive keeps the tree's children),
 * a vnode (navigated, directive renders it), `null` (hidden — a navigation
 * removed the region; the directive renders nothing). Only navigated
 * regions are written through; SSR needs no mirror and hidden regions must
 * stay hidden.
 */

import { h, type VNode } from 'preact';

/**
 * Internal dependencies
 */
import '../directives'; // Registers all the core directives.
import { store } from '../store';
import { renderHTML } from '../render';
import { hydrateRegions } from '../hydration';
import { routerRegions } from '../directives/router-region';
import { Directives } from '../hooks';

const NS = 'test/router-region-splice';

const { state } = store( NS, {
	state: { count: 0, active: true },
	actions: {
		inc() {
			state.count += 1;
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
	state.count = 0;
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
 *
 * @param id       The region id.
 * @param children The children the region renders after the navigation.
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
		<div data-testid="region" data-wp-router-region="${ regionId }">
			<p data-testid="ssr">ssr</p>
		</div>
	</div>
`;

// A spliced button with REAL directives: proves the splice persists AND the
// spliced content is fully interactive (not just present in the DOM).
const interactiveButton = ( id: string ) =>
	`<button data-testid="${ id }" data-wp-on--click="actions.inc" data-wp-text="state.count">0</button>`;

describe( 'renderHTML into a router region (after a navigation)', () => {
	it( 'a splice into a navigated region persists and its directives work', async () => {
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

		// Splice an INTERACTIVE button into the region. Without the
		// write-through, the stale signal reverts it during the splice's own
		// render (silent no-op).
		renderHTML( regionEl, interactiveButton( 'x' ) );
		await flush();
		const x = regionEl.querySelector(
			'[data-testid="x"]'
		) as HTMLButtonElement;
		expect( x ).not.toBeNull();

		// The spliced button is fully interactive — clicking it must
		// increment state and re-render its own data-wp-text.
		x.click();
		await flush();
		expect( x ).toHaveTextContent( '1' );
	} );

	it( 'successive splices into a navigated region accumulate (the signal mirrors the cumulative tree)', async () => {
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

		// Splice 1 appends button x. The write-through stores the rebuilt
		// region content (with x) into the signal.
		renderHTML( regionEl, interactiveButton( 'x' ) );
		await flush();

		// Splice 2 appends button y. Its path rebuild re-creates the region
		// wrapper again, which re-reads the signal — which must already
		// contain x, so the second splice builds on the first (no lost
		// content, no duplicates).
		renderHTML( regionEl, interactiveButton( 'y' ) );
		await flush();

		const children = regionEl.children;
		expect( children.length ).toBe( 4 ); // p, p, x, y
		expect( children[ 2 ] ).toHaveAttribute( 'data-testid', 'x' );
		expect( children[ 3 ] ).toHaveAttribute( 'data-testid', 'y' );

		// Both spliced buttons are interactive.
		( children[ 2 ] as HTMLButtonElement ).click();
		( children[ 3 ] as HTMLButtonElement ).click();
		await flush();
		expect( state.count ).toBe( 2 );
	} );

	it( "a splice into an SSR-only region persists and its directives work (signal undefined, children are the tree's)", async () => {
		document.body.innerHTML = islandHtml( 'test-r1c' );
		await hydrateRegions();
		await flush();

		const regionEl = document.querySelector(
			'[data-testid="region"]'
		) as HTMLElement;

		// NO navigation — the signal is still undefined (SSR content). The
		// directive keeps the tree's children, so the splice persists
		// without any write-through.
		renderHTML( regionEl, interactiveButton( 'x' ) );
		await flush();
		const x = regionEl.querySelector(
			'[data-testid="x"]'
		) as HTMLButtonElement;
		expect( x ).not.toBeNull();

		// The spliced button is interactive.
		x.click();
		await flush();
		expect( x ).toHaveTextContent( '1' );
	} );

	it( 'a splice into a navigated region with a lower-priority directive keeps the directive applied', async () => {
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
		renderHTML( regionEl, interactiveButton( 'x' ) );
		await flush();
		const x = regionEl.querySelector(
			'[data-testid="x"]'
		) as HTMLButtonElement;
		expect( x ).not.toBeNull();
		expect( regionEl ).toHaveClass( 'bn-active' );

		// And the spliced button is interactive.
		x.click();
		await flush();
		expect( x ).toHaveTextContent( '1' );
	} );

	it( 'a splice into a hidden region (null signal) is a no-op and does not resurrect it', async () => {
		document.body.innerHTML = islandHtml( 'test-r1e' );
		await hydrateRegions();
		await flush();

		const regionEl = document.querySelector(
			'[data-testid="region"]'
		) as HTMLElement;

		// A navigation that REMOVES the region nulls its signal — the
		// directive renders null, so the region ELEMENT is removed from the
		// DOM entirely (probed behavior), not just emptied.
		routerRegions.get( 'test-r1e' )!.value = null;
		await flush();
		expect( document.querySelector( '[data-testid="region"]' ) ).toBeNull();

		// Splice into the (now detached) region element: nothing may appear
		// and the signal stays null (the write-through skips null signals).
		renderHTML( regionEl, interactiveButton( 'x' ) );
		await flush();
		expect( document.querySelector( '[data-testid="x"]' ) ).toBeNull();
		expect( routerRegions.get( 'test-r1e' )!.value ).toBeNull();

		// A LATER navigation that re-adds the region re-creates its element
		// and re-enables splicing.
		navigateRegion( 'test-r1e', [ h( 'p', null, 'a' ) ] );
		await flush();
		const newRegion = document.querySelector(
			'[data-testid="region"]'
		) as HTMLElement;
		expect( newRegion ).not.toBeNull();
		renderHTML( newRegion, interactiveButton( 'y' ) );
		await flush();
		const y = newRegion.querySelector(
			'[data-testid="y"]'
		) as HTMLButtonElement;
		expect( y ).not.toBeNull();
		expect( y ).toHaveTextContent( '0' );
	} );
} );
