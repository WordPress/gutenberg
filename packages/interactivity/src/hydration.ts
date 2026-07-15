/**
 * External dependencies
 */
import { hydrate, type ContainerNode, type ComponentChild } from 'preact';
/**
 * Internal dependencies
 */
import {
	toVdom,
	hydratedIslands,
	restoreRemovedNodes,
	type RemovedNode,
} from './vdom';
import { createRootFragment, splitTask } from './utils';

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

// Initialize the router with the initial DOM.
export const hydrateRegions = async () => {
	const nodes = document.querySelectorAll( `[data-wp-interactive]` );

	for ( const node of nodes ) {
		if ( ! hydratedIslands.has( node ) ) {
			await splitTask();
			const fragment = getRegionRootFragment( node );
			// Comments and processing instructions have no vDOM
			// representation, so `toVdom` removes them from the DOM before
			// Preact hydrates the region (otherwise, Preact would remove
			// them itself while treating them as un-recognized nodes). Track
			// them here so they can be restored to the live DOM once
			// hydration has finished, preserving third-party markers (e.g.,
			// GTM snippets, A/B testing boundaries) that may rely on them.
			const removedNodes: RemovedNode[] = [];
			const vdom = toVdom( node, removedNodes );
			initialVdom.set( node, vdom );
			await splitTask();
			hydrate( vdom, fragment );
			restoreRemovedNodes( removedNodes );
		}
	}

	// Resolve the promise with the fully populated initialVdom after all regions are hydrated.
	resolveInitialVdom( initialVdom );
};
