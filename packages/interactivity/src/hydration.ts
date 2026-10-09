import { hydrate, type ContainerNode, type ComponentChild } from 'preact';
import {
	toVdom,
	hydratedIslands,
	parseDirectiveName,
	getHtmlDirectiveStatus,
	type ParsedDirectives,
} from './vdom';
import { createRootFragment, splitTask } from './utils';

/**
 * Finds the nearest inclusive ancestor whose HTML directive owns its content.
 * Attribute names use the same filter and parser as `toVdom()`, and content
 * ownership follows the shared parsed-directive rule in `vdom.ts`.
 *
 * @param element Element at which to begin the inclusive ancestor walk. Pass
 *                a node's parent element to test strict content membership.
 * @return The nearest eligible HTML directive element, or `null`.
 */
export function closestHtmlDirectiveElement(
	element: Element
): Element | null {
	let current: Element | null = element;
	while ( current ) {
		const directives: ParsedDirectives = {};
		for ( const { name } of current.attributes ) {
			if (
				! name.startsWith( 'data-wp-' ) ||
				! name[ 8 ] ||
				name === 'data-wp-interactive'
			) {
				continue;
			}
			const parsed = parseDirectiveName( name );
			if ( parsed ) {
				const { prefix, suffix } = parsed;
				directives[ prefix ] = directives[ prefix ] || [];
				directives[ prefix ].push( { suffix } );
			}
		}
		if ( getHtmlDirectiveStatus( directives ).isHtmlDirectiveElement ) {
			return current;
		}
		current = current.parentElement;
	}
	return null;
}

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

/**
 * Hydrates interactive islands outside HTML directive content and initializes
 * the router's initial vDOM. Content membership is checked for the full snapshot
 * before hydration can detach any fallback islands.
 *
 * @return A promise that resolves once all eligible islands are hydrated.
 */
export const hydrateRegions = async () => {
	const nodes = [
		...document.querySelectorAll( `[data-wp-interactive]` ),
	].filter(
		( node ) =>
			! node.parentElement ||
			! closestHtmlDirectiveElement( node.parentElement )
	);

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

	// Resolve the promise with the fully populated initialVdom after all regions are hydrated.
	resolveInitialVdom( initialVdom );
};
