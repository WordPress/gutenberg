/**
 * External dependencies
 */
import { hydrate, type ContainerNode, type ComponentChild } from 'preact';
/**
 * Internal dependencies
 */
import { toVdom, hydratedIslands } from './vdom';
import { createRootFragment, yieldToMain } from './utils';
import { directivePrefix } from './constants';

// Keep the same root fragment for each interactive region node.
const regionRootFragments = new WeakMap();
export const getRegionRootFragment = ( region: Element ): ContainerNode => {
	if ( ! region.parentElement ) {
		throw Error( 'The passed region should be an element with a parent.' );
	}
	if ( ! regionRootFragments.has( region ) ) {
		regionRootFragments.set(
			region,
			createRootFragment( region.parentElement, region )
		);
	}
	return regionRootFragments.get( region );
};

// Initial vDOM regions associated with its DOM element.
export const initialVdom = new WeakMap< Element, ComponentChild[] >();

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
			initialVdom.set( node, vdom );
			await yieldToMain();
			hydrate( vdom, fragment );
		}
	}
};
