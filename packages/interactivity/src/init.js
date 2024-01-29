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
	const nodes = document.querySelectorAll(
		`[data-${ directivePrefix }-interactive]`
	);

	for ( const node of nodes ) {
		if ( ! hydratedIslands.has( node ) ) {
			await yieldToMain();
			const fragment = getRegionRootFragment( node );
			const vdom = toVdom( node );
			await yieldToMain();
			hydrate( vdom, fragment );
		}
	}
};
