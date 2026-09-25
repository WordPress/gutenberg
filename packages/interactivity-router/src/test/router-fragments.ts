// eslint-disable-next-line no-warning-comments
/**
 * @jest-environment jsdom
 */

/**
 * Router probes (R2–R4) — renderHTML + router navigation interplay.
 *
 * These probe how a navigation interacts with a `renderHTML`-inserted node
 * and with region content generally. All probes share ONE module registry
 * (no `jest.resetModules`): the importmap loader defines a non-configurable
 * `wpInteractivityRouterImport` global at module-eval, so re-importing per
 * test would throw. Contamination is avoided by using a distinct region id
 * per probe (r2–r4), fresh DOM per probe, and resetting the test store's
 * `count` in `setup`.
 *
 * - R2: a `renderHTML`-inserted node inside a region is removed from the DOM
 *   when a navigation replaces the region.
 * - R3: repeated navigations do not accumulate event listeners (guard).
 * - R4: a region that disappears from a later page leaves its element behind
 *   (guard).
 */

/*
 * The router imports `@wordpress/interactivity`, whose `index.ts` contains
 * top-level `await import('preact/debug')` — which jest's CJS transform cannot
 * parse. Mock the package with the real internals (relative requires avoid the
 * TLA-carrying index), so the router can be unit-tested at all. This is also
 * why upstream only e2e-tests the router.
 */
jest.mock( '@wordpress/interactivity', () => {
	// preact / @preact/signals back the mocked internals but are not direct
	// deps of this package — test-only requires, so disable the rule.
	/* eslint-disable import/no-extraneous-dependencies */
	const {
		store,
		getConfig,
		parseServerData,
		populateServerData,
	} = require( '../../../interactivity/src/store' );
	const {
		getRegionRootFragment,
		initialVdomPromise,
	} = require( '../../../interactivity/src/hydration' );
	const { toVdom } = require( '../../../interactivity/src/vdom' );
	const {
		routerRegions,
	} = require( '../../../interactivity/src/directives/router-region' );
	const {
		navigationSignal,
		sessionId,
		warn,
	} = require( '../../../interactivity/src/utils' );
	const { h, render } = require( 'preact' );
	const { batch } = require( '@preact/signals' );
	/* eslint-enable import/no-extraneous-dependencies */

	return {
		store,
		getConfig,
		privateApis: () => ( {
			getRegionRootFragment,
			initialVdomPromise,
			toVdom,
			render,
			parseServerData,
			populateServerData,
			batch,
			routerRegions,
			h,
			navigationSignal,
			sessionId,
			warn,
		} ),
	};
} );

import { actions } from '../index';
import { store } from '../../../interactivity/src/store';
import {
	hydrateRegions,
	initialVdomPromise,
} from '../../../interactivity/src/hydration';
import { renderHTML } from '../../../interactivity/src/render';
// The mock bypasses interactivity's index.ts, so directives are not registered
// by it — register them explicitly.
import '../../../interactivity/src/directives';

const ROUTER_NS = 'router-regions';

// Suppress `state.navigation` deprecation warnings (and other SCRIPT_DEBUG
// noise) that trip the global `not.toHaveWarned` console matcher.
/* eslint-disable @wordpress/wp-global-usage */
( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = false;
/* eslint-enable @wordpress/wp-global-usage */

const { state } = store( ROUTER_NS, {
	// Each probe uses its own counter/action so a leaked listener from one
	// probe (e.g. R2's intentionally-leaked window listener) cannot pollute
	// another probe's assertions in the shared module registry.
	state: { countB: 0, countC: 0 },
	actions: {
		incB() {
			state.countB += 1;
		},
		incC() {
			state.countC += 1;
		},
	},
} );

const page = ( body: string ) =>
	`<!DOCTYPE html><html><head><title>t</title></head><body>${ body }</body></html>`;

const tick = () => new Promise( ( r ) => setTimeout( r, 0 ) );

// Drains preact's effect queue (useInit/useEffect) reliably: a macrotask
// plus two animation frames, same as the interactivity fragment tests.
const flush = async () => {
	await new Promise( ( r ) => setTimeout( r, 0 ) );
	await new Promise( ( r ) => requestAnimationFrame( r ) );
	await new Promise( ( r ) => requestAnimationFrame( r ) );
};

/**
 * Sets up the initial DOM for a probe, hydrates all islands, and lets the
 * router cache the initial page.
 *
 * @param initialHtml The initial page's HTML (body content).
 */
const setup = async ( initialHtml: string ) => {
	document.body.innerHTML = initialHtml;
	state.countB = 0;
	state.countC = 0;
	await hydrateRegions();
	await initialVdomPromise;
	// Let the router's async IIFE (`initialVdomPromise` → `preparePage`) finish
	// caching the initial page.
	await tick();
	await tick();
};

const navigate = async ( href: string, html: string ) => {
	await actions.navigate( href, { html } );
	// Settle the signal-driven region re-renders before the probe asserts.
	await tick();
	await tick();
	await flush();
};

describe( 'router fragment probes (R2-R4)', () => {
	it( 'R2: renderHTML node inside a region is removed from the DOM on navigation', async () => {
		await setup( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div
					data-wp-interactive="${ ROUTER_NS }"
					data-wp-router-region="r2"
					data-testid="region-r2"
				>
					<div data-testid="content"></div>
				</div>
			</div>
		` );

		// Insert a node with a window listener into the region via renderHTML.
		const content = document.querySelector(
			'[data-testid="content"]'
		) as HTMLElement;
		renderHTML(
			content,
			'<span data-testid="extra" data-wp-on-window--resize="actions.incB"></span>'
		);
		await flush();
		expect(
			content.querySelector( '[data-testid="extra"]' )
		).not.toBeNull();

		// Navigate to a page whose r2 content does NOT include the extra node.
		await navigate(
			'/r2-b',
			page( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div
					data-wp-interactive="${ ROUTER_NS }"
					data-wp-router-region="r2"
					data-testid="region-r2"
				>
					<p>page B</p>
				</div>
			</div>
		` )
		);

		// The renderHTML node is removed from the DOM by the navigation.
		expect( document.querySelector( '[data-testid="extra"]' ) ).toBeNull();
	} );

	it( 'R3: repeated navigations do not accumulate event listeners (guard)', async () => {
		await setup( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div
					data-wp-interactive="${ ROUTER_NS }"
					data-wp-router-region="r3"
					data-testid="region-r3"
				>
					<button data-testid="inc-btn" data-wp-on--click="actions.incC">inc</button>
					<span data-testid="resize-span" data-wp-on-window--resize="actions.incC"></span>
				</div>
			</div>
		` );

		const regionPage = page( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div
					data-wp-interactive="${ ROUTER_NS }"
					data-wp-router-region="r3"
					data-testid="region-r3"
				>
					<button data-testid="inc-btn" data-wp-on--click="actions.incC">inc</button>
					<span data-testid="resize-span" data-wp-on-window--resize="actions.incC"></span>
				</div>
			</div>
		` );

		await navigate( '/r3-b', regionPage );
		await navigate( '/r3-a', regionPage );
		await navigate( '/r3-b', regionPage );

		// One listener each: clicking once and resizing once each increment once.
		(
			document.querySelector(
				'[data-testid="inc-btn"]'
			) as HTMLButtonElement
		 ).click();
		expect( state.countC ).toBe( 1 );
		window.dispatchEvent( new Event( 'resize' ) );
		expect( state.countC ).toBe( 2 );
	} );

	it( 'R4: a region that disappears from a later page leaves its element behind', async () => {
		await setup( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div
					data-wp-interactive="${ ROUTER_NS }"
					data-wp-router-region="r4"
					data-testid="region-r4"
				>
					<p>page A</p>
				</div>
			</div>
		` );

		await navigate(
			'/r4-b',
			page( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<p>no region here</p>
			</div>
		` )
		);

		// Correct: the region element is removed from the DOM.
		expect(
			document.querySelector( '[data-testid="region-r4"]' )
		).toBeNull();
	} );
} );
