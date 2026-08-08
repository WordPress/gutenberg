/**
 * @jest-environment jsdom
 */

/**
 * Router `attachTo` probes (R1, R5, R6).
 *
 * These probes exercise the router's `attachTo` placement logic and live with
 * the router fix they guard (the attachTo target-change revision) rather than
 * the renderElement fragment work — the fragment-work navigation guards
 * (R2–R4) live in `router-fragments.ts`.
 *
 * - R1: a region that gains an `attachTo` target on a later page renders only
 *   in the new attachTo parent (was: in both the original spot and the new
 *   parent).
 * - R5: an attachTo region whose target element is removed from a later page
 *   stays functional, exactly once.
 * - R6: an attachTo region whose attachTo target changes between pages
 *   renders only in the new target.
 *
 * All probes share ONE module registry (no `jest.resetModules`): the
 * importmap loader defines a non-configurable `wpInteractivityRouterImport`
 * global at module-eval, so re-importing per test would throw. Contamination
 * is avoided by using a distinct region id per probe (r1/r5/r6) and fresh DOM
 * per probe.
 */

/*
 * The router imports `@wordpress/interactivity`, whose `index.ts` contains
 * top-level `await import('preact/debug')` — which jest's CJS transform cannot
 * parse. Mock the package with the real internals (relative requires avoid the
 * TLA-carrying index), so the router can be unit-tested at all. This is also
 * why upstream only e2e-tests the router.
 */
jest.mock( '@wordpress/interactivity', () => {
	const { store, getConfig, parseServerData, populateServerData } = require(
		'../../../interactivity/src/store'
	);
	const {
		getRegionRootFragment,
		initialVdomPromise,
	} = require( '../../../interactivity/src/hydration' );
	const { toVdom } = require( '../../../interactivity/src/vdom' );
	const { routerRegions } = require(
		'../../../interactivity/src/directives/router-region'
	);
	const { navigationSignal, sessionId, warn } = require(
		'../../../interactivity/src/utils'
	);
	const { pruneNodeFragments } = require(
		'../../../interactivity/src/render'
	);
	const { h, render } = require( 'preact' );
	const { batch } = require( '@preact/signals' );

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
			pruneNodeFragments,
		} ),
	};
} );

import { actions } from '../index';
import {
	hydrateRegions,
	initialVdomPromise,
} from '../../../interactivity/src/hydration';
// The mock bypasses interactivity's index.ts, so directives are not registered
// by it — register them explicitly.
import '../../../interactivity/src/directives';

const ROUTER_NS = 'router-regions';

// Suppress `state.navigation` deprecation warnings (and other SCRIPT_DEBUG
// noise) that trip the global `not.toHaveWarned` console matcher.
( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = false;

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
	await hydrateRegions();
	await initialVdomPromise;
	// Let the router's async IIFE (`initialVdomPromise` → `preparePage`) finish
	// caching the initial page.
	await tick();
	await tick();
};

const navigate = async ( href: string, html: string ) => {
	await actions.navigate( href, { html } );
	// Settle the signal-driven region re-renders AND the router's async
	// `pruneNodeFragments` (setTimeout 0) so the removed nodes' listeners are
	// cleaned up before the probe asserts.
	await tick();
	await tick();
	await flush();
};

describe( 'router attachTo probes (R1, R5, R6)', () => {
	it( 'R1: region gaining an attachTo target on a later page renders only in the new parent', async () => {
		await setup( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div id="slotA" data-testid="slotA">
					<div
						data-wp-interactive="${ ROUTER_NS }"
						data-wp-router-region="r1"
						data-testid="region-r1"
					>
						<p>page A</p>
					</div>
				</div>
				<div id="slotB" data-testid="slotB"></div>
			</div>
		` );

		// Page B declares r1 with an attachTo target that differs from where
		// the region currently lives.
		await navigate( '/r1-b', page( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div
					data-wp-interactive="${ ROUTER_NS }"
					data-wp-router-region='{"id":"r1","attachTo":"#slotB"}'
					data-testid="region-r1"
				>
					<p>page B</p>
				</div>
			</div>
		` ) );

		// Correct: the region appears exactly once, in its new attachTo parent.
		expect( document.querySelectorAll( '[data-testid="region-r1"]' ).length ).toBe( 1 );
		expect(
			document
				.querySelector( '[data-testid="slotB"]' )
				?.querySelector( '[data-testid="region-r1"]' )
		).not.toBeNull();
	} );

	it( 'R5: attachTo target element removed from a later page — region stays functional, exactly once', async () => {
		await setup( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div id="slotA" data-testid="slotA"></div>
			</div>
		` );

		// Page B: region r5 attaches to #slotA (which exists).
		await navigate( '/r5-b', page( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div id="slotA">
					<div
						data-wp-interactive="${ ROUTER_NS }"
						data-wp-router-region='{"id":"r5","attachTo":"#slotA"}'
						data-testid="region-r5"
					>
						<p data-testid="r5-text">page B</p>
					</div>
				</div>
			</div>
		` ) );
		expect( document.querySelectorAll( '[data-testid="region-r5"]' ).length ).toBe( 1 );

		// Page C: region r5 still declares attachTo #slotA, but #slotA is gone.
		// Correct behavior: no crash; the region must NOT be duplicated; and
		// its content must still be present (the router must not orphan the
		// old element or create a second one).
		await navigate( '/r5-c', page( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div
					data-wp-interactive="${ ROUTER_NS }"
					data-wp-router-region='{"id":"r5","attachTo":"#slotA"}'
					data-testid="region-r5"
				>
					<p data-testid="r5-text">page C</p>
				</div>
			</div>
		` ) );

		// Exactly one region, and its content reflects the new page.
		expect( document.querySelectorAll( '[data-testid="region-r5"]' ).length ).toBe( 1 );
		const region = document.querySelector( '[data-testid="region-r5"]' );
		expect( region?.querySelector( '[data-testid="r5-text"]' )?.textContent ).toBe(
			'page C'
		);

		// Navigating again (to a page with the target present again) must not
		// duplicate the region either.
		await navigate( '/r5-d', page( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div id="slotA">
					<div
						data-wp-interactive="${ ROUTER_NS }"
						data-wp-router-region='{"id":"r5","attachTo":"#slotA"}'
						data-testid="region-r5"
					>
						<p data-testid="r5-text">page D</p>
					</div>
				</div>
			</div>
		` ) );
		expect( document.querySelectorAll( '[data-testid="region-r5"]' ).length ).toBe( 1 );
		const regionD = document.querySelector( '[data-testid="region-r5"]' );
		expect( regionD?.querySelector( '[data-testid="r5-text"]' )?.textContent ).toBe(
			'page D'
		);
	} );

	it( 'R6: attachTo region whose target changes between pages renders only in the new target', async () => {
		await setup( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div id="slotA" data-testid="slotA"></div>
				<div id="slotB" data-testid="slotB"></div>
			</div>
		` );

		// Page B: region r6 attaches to #slotA.
		await navigate( '/r6-b', page( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div id="slotA">
					<div
						data-wp-interactive="${ ROUTER_NS }"
						data-wp-router-region='{"id":"r6","attachTo":"#slotA"}'
						data-testid="region-r6"
					>
						<p>page B</p>
					</div>
				</div>
			</div>
		` ) );
		expect(
			document
				.querySelector( '[data-testid="slotA"]' )
				?.querySelector( '[data-testid="region-r6"]' )
		).not.toBeNull();

		// Page C: region r6 now attaches to #slotB. Correct: appears exactly
		// once, in #slotB (old #slotA element removed).
		await navigate( '/r6-c', page( `
			<div data-wp-interactive="${ ROUTER_NS }">
				<div id="slotB">
					<div
						data-wp-interactive="${ ROUTER_NS }"
						data-wp-router-region='{"id":"r6","attachTo":"#slotB"}'
						data-testid="region-r6"
					>
						<p>page C</p>
					</div>
				</div>
			</div>
		` ) );

		expect( document.querySelectorAll( '[data-testid="region-r6"]' ).length ).toBe( 1 );
		expect(
			document
				.querySelector( '[data-testid="slotB"]' )
				?.querySelector( '[data-testid="region-r6"]' )
		).not.toBeNull();
		expect(
			document.querySelector( '[data-testid="slotA"]' )?.children.length
		).toBe( 0 );
	} );
} );
