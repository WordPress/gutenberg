/**
 * External dependencies
 */
import { hydrate, type ContainerNode, type ComponentChild } from 'preact';
/**
 * Internal dependencies
 */
import { toVdom, hydratedIslands } from './vdom';
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

// Initialize the router with the initial DOM.
export const hydrateRegions = async () => {
	const nodes = document.querySelectorAll( `[data-wp-interactive]` );

	for ( const node of nodes ) {
		if ( ! hydratedIslands.has( node ) ) {
			await splitTask();
			const fragment = getRegionRootFragment( node );
			const vdom = toVdom( node );
			initialVdom.set( node, vdom );
			await splitTask();
			hydrate( vdom, fragment );
		}
	}
};
