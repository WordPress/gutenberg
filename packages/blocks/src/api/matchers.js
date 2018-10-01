/**
 * External dependencies
 */
export { attr, prop, html, text, query } from 'hpq';

/**
 * WordPress dependencies
 */
import { create } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
export { matcher as node } from './node';
export { matcher as children } from './children';

export function richText( selector, multilineTag ) {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		return create( {
			element: match,
			multilineTag,
		} );
	};
}
