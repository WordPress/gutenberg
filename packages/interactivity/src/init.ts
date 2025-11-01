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
export const init = async () => {
	const nodes = document.querySelectorAll( `[data-wp-interactive]` );

	/*
	 * This `await` with setTimeout is required to apparently ensure that the interactive blocks have their stores
	 * fully initialized prior to hydrating the blocks. If this is not present, then an error occurs, for example:
	 * > view.js:46 Uncaught (in promise) ReferenceError: Cannot access 'state' before initialization
	 * This occurs when splitTask() is implemented with scheduler.yield() as opposed to setTimeout(), as with the former
	 * split tasks are added to the front of the task queue whereas with the latter they are added to the end of the queue.
	 */
	await new Promise( ( resolve ) => {
		setTimeout( resolve, 0 );
	} );

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
