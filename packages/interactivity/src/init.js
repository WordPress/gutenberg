/**
 * External dependencies
 */
import { hydrate } from 'preact';
/**
 * Internal dependencies
 */
import { toVdom, hydratedIslands } from './vdom';
import { createRootFragment } from './utils';
import { directivePrefix } from './constants';

// Keep the same root fragment for each interactive region node.
const regionRootFragments = new WeakMap();
export const getRegionRootFragment = ( region ) => {
	if ( ! regionRootFragments.has( region ) ) {
		regionRootFragments.set(
			region,
			createRootFragment( region.parentElement, region )
		);
	}
	return regionRootFragments.get( region );
};

function yieldToMain() {
	return new Promise( ( resolve ) => {
		// TODO: Use scheduler.yield() when available.
		setTimeout( resolve, 0 );
	} );
}

// Initialize the router with the initial DOM.
export const init = async () => {
	const pendingNodes = new Set();

	const intersectionObserver = new window.IntersectionObserver(
		async ( entries ) => {
			for ( const entry of entries ) {
				if ( ! entry.isIntersecting ) {
					continue;
				}

				const node = entry.target;
				intersectionObserver.unobserve( node );
				pendingNodes.delete( node );
				if ( pendingNodes.size === 0 ) {
					intersectionObserver.disconnect();
				}

				if ( ! hydratedIslands.has( node ) ) {
					await yieldToMain();
					const fragment = getRegionRootFragment( node );
					const vdom = toVdom( node );
					await yieldToMain();
					hydrate( vdom, fragment );
				}
			}
		},
		{
			root: null, // To watch for intersection relative to the device's viewport.
			rootMargin: '100% 0% 100% 0%', // Intersect when within 1 viewport approaching from top or bottom.
			threshold: 0.0, // As soon as even one pixel is visible.
		}
	);

	const nodes = document.querySelectorAll(
		`[data-${ directivePrefix }-interactive]`
	);

	for ( const node of nodes ) {
		pendingNodes.add( node );
		intersectionObserver.observe( node );
	}
};
