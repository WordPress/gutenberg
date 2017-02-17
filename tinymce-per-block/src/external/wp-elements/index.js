/**
 * External dependencies
 */
import { render as baseRender } from 'preact';

export { h as createElement, Component } from 'preact';

/**
 * Render element to target DOM node.
 *
 * This implementation is copied essentially verbatim from `preact-compat`:
 *  - Source: https://github.com/developit/preact-compat
 *  - License: MIT (https://choosealicense.com/licenses/mit/)
 *
 * @param  {VNode} element wp-elements Element
 * @param  {Node}  target  Target DOM node
 */
export function render( element, target ) {
	let previous = target && target._wpElementsRendered;

	// Ignore impossible previous renders
	if ( previous && previous.parentNode !== target ) {
		previous = null;
	}

	// Default to first Element child
	if ( ! previous ) {
		previous = target.children[ 0 ];
	}

	// Remove unaffected siblings
	for ( const sibling of target.childNodes ) {
		if ( sibling === previous ) {
			continue;
		}

		target.removeChild( sibling );
	}

	const out = baseRender( element, target, previous );
	if ( target ) {
		target._wpElementsRendered = out;
	}
}
