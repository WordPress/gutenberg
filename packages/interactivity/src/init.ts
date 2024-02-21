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
export const getRegionRootFragment = ( region: Node ): Node => {
	if ( ! regionRootFragments.has( region ) ) {
		regionRootFragments.set(
			region,
			createRootFragment( region.parentElement, region )
		);
	}
	return regionRootFragments.get( region );
};

function yieldToMain(): Promise< void > {
	return new Promise( ( resolve ) => {
		// TODO: Use scheduler.yield() when available.
		setTimeout( resolve, 0 );
	} );
}

// Initial vDOM regions associated with its DOM element.
export const initialVdom = new WeakMap();

// Initialize the router with the initial DOM.
export const init = async (): Promise< void > => {
	const nodes: NodeListOf< Element > = document.querySelectorAll(
		`[data-${ directivePrefix }-interactive]`
	);
	const nodesArray: Element[] = Array.from( nodes );
	for ( const node of nodesArray ) {
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
