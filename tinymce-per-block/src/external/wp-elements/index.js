/**
 * External dependencies
 */
import { render as baseRender } from 'preact';

export { h as createElement, Component } from 'preact';

export function render( element, target ) {
	let previous = target && target._preactCompatRendered;

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
		target._preactCompatRendered = out;
	}

	if ( out ) {
		return out._component;
	}

	return out.base;
}
