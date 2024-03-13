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
import { store, stores, universalUnlock } from './store';

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

// Initial vDOM regions associated with its DOM element.
export const initialVdom = new WeakMap();

// Initialize the router with the initial DOM.
export const init = async () => {
	/** @type { NodeListOf<HTMLElement>} */
	const nodes = document.querySelectorAll(
		`[data-${ directivePrefix }-interactive]`
	);

	for ( const node of nodes ) {
		// Before initializing the vdom, make sure a store exists for the namespace.
		// This ensures that directives can subscribe to the store even if it has
		// not yet been created on the client so that directives can be updated when
		// stores are later created.
		let namespace = /** @type {HTMLElement} */ ( node ).dataset[
			`${ directivePrefix }Interactive`
		];
		try {
			namespace = JSON.parse( namespace ).namespace;
		} catch {}
		if ( ! stores.has( namespace ) ) {
			store( namespace, undefined, {
				lock: universalUnlock,
			} );
		}
	}

	for ( const node of nodes ) {
		if ( ! hydratedIslands.has( node ) ) {
			await yieldToMain();
			const fragment = getRegionRootFragment( node );
			const vdom = toVdom( node );
			initialVdom.set( node, vdom );
			await yieldToMain();
			hydrate( vdom, fragment );
		}
	}
};
