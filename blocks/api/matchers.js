/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * External dependencies
 */
import { domreact } from '@wordpress/utils';
export { attr, prop, html, text, query } from 'hpq';

export const children = ( selector ) => {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		if ( match ) {
			return domreact.nodeListToReact( match.childNodes || [], createElement );
		}

		return [];
	};
};

export const node = ( selector ) => {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		return domreact.nodeToReact( match, createElement );
	};
};
