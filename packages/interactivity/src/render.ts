/**
 * External dependencies
 */
import { render } from 'preact';
import { batch } from '@preact/signals';

/**
 * Internal dependencies
 */
import { toVdom } from './vdom';
import { getRegionRootFragment } from './hydration';

/**
 * Renders server-rendered HTML that has been inserted into the live DOM after
 * the initial page load, processing all Interactivity API directives on it.
 *
 * The element(s) MUST already be attached to the DOM — the root-fragment
 * mechanism requires a parent element. Multiple elements must be contiguous
 * siblings under the same parent (the fragment's insertion anchor is the last
 * element's next sibling); otherwise call once per element.
 *
 * Calling again with the same element updates it in place (preact diffs against
 * the previous render): no duplicate listeners, no remount. Only the passed
 * element(s) are processed — siblings and any enclosing router region are
 * untouched. Not supported during initial hydration or an in-flight navigation.
 *
 * @example
 * ```js
 * import { renderElement } from '@wordpress/interactivity';
 *
 * const res = await fetch( '/my-plugin/card' );
 * const doc = new DOMParser().parseFromString( await res.text(), 'text/html' );
 * const card = doc.body.firstElementChild;
 * feedList.insertBefore( card, feedList.firstChild );
 * renderElement( card );
 * ```
 *
 * @param element Element (or contiguous siblings) to render.
 */
export function renderElement( element: Element | Element[] ): void {
	const nodes = Array.isArray( element ) ? element : [ element ];
	if ( ! nodes.length ) {
		return;
	}
	for ( const node of nodes ) {
		if ( ! node.parentElement || ! node.isConnected ) {
			throw new Error(
				'renderElement(): the element must be attached to the DOM first.'
			);
		}
	}
	batch( () => {
		render(
			nodes.map( ( node ) => toVdom( node ) ),
			getRegionRootFragment( nodes )
		);
	} );
}
