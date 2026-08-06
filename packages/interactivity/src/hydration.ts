/**
 * External dependencies
 */
import { hydrate, type ContainerNode, type ComponentChild } from 'preact';
import 'requestidlecallback';
/**
 * Internal dependencies
 */
import { toVdom, hydratedIslands } from './vdom';
import { createRootFragment, splitTask, warn } from './utils';

// Keep the same root fragment for each interactive region node.
const regionRootFragments = new WeakMap();
export const getRegionRootFragment = (
	regions: Element | Element[]
): ContainerNode => {
	const region = Array.isArray( regions ) ? regions[ 0 ] : regions;
	if ( ! region.parentElement ) {
		throw Error( 'The passed region should be an element with a parent.' );
	}
	if ( ! regionRootFragments.has( region ) ) {
		regionRootFragments.set(
			region,
			createRootFragment( region.parentElement, regions )
		);
	}
	return regionRootFragments.get( region );
};

// Initial vDOM regions associated with its DOM element.
export const initialVdom = new WeakMap< Element, ComponentChild >();

// Promise that resolves with the populated initialVdom after hydration completes.
let resolveInitialVdom!: ( map: WeakMap< Element, ComponentChild > ) => void;
export const initialVdomPromise = new Promise<
	WeakMap< Element, ComponentChild >
>( ( resolve ) => {
	resolveInitialVdom = resolve;
} );

// The IntersectionObserver used to hydrate islands as they approach the
// viewport. Module-level so `hydrateAllRemaining` can disconnect it.
let intersectionObserver: IntersectionObserver | null = null;

// Whether hydration has already completed — either the idle-time sweep ran,
// or the observer finished all islands. `hydrateAllRemaining` is one-shot:
// once it runs, it is permanently disarmed. Islands inserted into the DOM
// later (e.g. raw HTML) are NOT auto-hydrated; developers should hydrate
// injected markup explicitly (e.g. with `renderElement`).
let idleFired = false;

/**
 * Hydrates a single island: builds its vdom, registers it in initialVdom,
 * and hydrates it. Shared by the IntersectionObserver callback, the idle-time
 * sweep, and `hydrateAllRemaining`.
 *
 * @param node The island element to hydrate.
 */
const hydrateNode = async ( node: Element ) => {
	if ( hydratedIslands.has( node ) ) {
		return;
	}
	try {
		const fragment = getRegionRootFragment( node );
		const vdom = toVdom( node );
		initialVdom.set( node, vdom );
		await splitTask();
		hydrate( vdom, fragment );
	} catch ( e ) {
		warn(
			`Failed to hydrate island: ${( e as Error ).message ?? e}`
		);
	} finally {
		await splitTask();
	}
};

/**
 * Force-hydrates every island that hasn't been hydrated yet, disconnects the
 * observer, and resolves the initialVdom promise.
 *
 * Called when the CPU goes idle (or the idle timeout elapses) so islands the
 * user never scrolls to still become interactive, and by the router before
 * navigating so its regions are always hydrated for diffing.
 *
 * One-shot: after the first run (or when the observer finishes all islands),
 * this is a permanent no-op. Router-rendered regions are preact-rendered
 * (fully interactive) and must not be re-hydrated.
 */
export const hydrateAllRemaining = async () => {
	if ( idleFired ) {
		return;
	}
	idleFired = true;
	intersectionObserver?.disconnect();
	// Hydrate every island currently in the DOM that isn't hydrated yet.
	for ( const node of document.querySelectorAll( '[data-wp-interactive]' ) ) {
		await hydrateNode( node as Element );
	}
	resolveInitialVdom( initialVdom );
};

/*
 * Lazily hydrates all interactive regions: instead of hydrating every island
 * at DOMContentLoaded, an IntersectionObserver hydrates each island when it
 * approaches the viewport (within one viewport height, from the top or
 * bottom). This avoids running hydration JS for off-screen blocks during page
 * load.
 *
 * As a fallback, all remaining unhydrated islands are also hydrated when the
 * CPU goes idle (or after a bounded timeout). This guarantees interactive
 * content — and the router regions the router needs to diff during navigation —
 * is eventually hydrated even if the user never scrolls to it.
 */
export const hydrateRegions = async () => {
	const nodes = document.querySelectorAll( '[data-wp-interactive]' );
	// The islands still awaiting hydration via the observer. A `Set` rather
	// than a counter: `Set.delete` is idempotent, so duplicate intersection
	// entries for the same node cannot corrupt the "all done" detection (a
	// counter would double-decrement and prematurely fire `idleFired`,
	// disarming the router's force-hydrate while islands remain unhydrated).
	const observedNodes = new Set< Element >();

	const intersectionObserverInstance = new window.IntersectionObserver(
		async ( entries ) => {
			for ( const entry of entries ) {
				if ( ! entry.isIntersecting ) {
					continue;
				}

				const node = entry.target as Element;
				intersectionObserverInstance.unobserve( node );
				observedNodes.delete( node );
				// `hydrateNode` handles its own errors, so a single
				// failing island cannot abort the rest of the batch.
				await hydrateNode( node );
			}

			// All observed islands have been hydrated: resolve the promise
			// with the fully populated initialVdom so the router can start
			// doing the DOM diffing between the previous and next pages.
			// Resolving AFTER the batch's hydration attempts (rather than
			// before the last node's hydrate) guarantees the router never
			// reads a partially hydrated island list.
			if ( observedNodes.size === 0 ) {
				intersectionObserverInstance.disconnect();
				// Disarm the idle-time sweep.
				idleFired = true;
				resolveInitialVdom( initialVdom );
			}
		},
		{
			root: null, // To watch for intersection relative to the device's viewport.
			rootMargin: '100% 0% 100% 0%', // Intersect when within 1 viewport approaching from top or bottom.
			threshold: 0.0, // As soon as even one pixel is visible.
		}
	);
	intersectionObserver = intersectionObserverInstance;

	for ( const node of nodes ) {
		if ( hydratedIslands.has( node ) ) {
			continue;
		}
		observedNodes.add( node );
		intersectionObserver.observe( node );
	}

	// All nodes were already hydrated (nothing to observe): resolve the
	// promise immediately, since the observer callback will never fire.
	if ( observedNodes.size === 0 ) {
		idleFired = true; // Disarm the idle-time sweep.
		resolveInitialVdom( initialVdom );
		return;
	}

	/*
	 * Fallback: hydrate everything when the CPU is idle, so islands the user
	 * never scrolls to (and router regions) still become interactive. The
	 * `timeout` bounds how long we wait even on a busy CPU. Whichever fires
	 * first — viewport entry or idle — wins; `idleFired` disarms the other.
	 *
	 * No feature detection is needed: the `requestidlecallback` polyfill
	 * (already used by `@wordpress/priority-queue`) installs
	 * `window.requestIdleCallback` when native support is missing, and is a
	 * no-op on browsers that have it.
	 */
	requestIdleCallback( hydrateAllRemaining, { timeout: 2000 } );
};
