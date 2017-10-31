/**
 * External dependencies
 */
export { attr, prop, html, text, query } from 'hpq';

/**
 * Internal dependencies
 */
import { createSimpleNode, createSimpleNodeList } from './simple-dom';

export const children = ( selector, filter ) => {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		if ( match ) {
			return createSimpleNodeList( match.childNodes || [], filter );
		}

		return [];
	};
};

export const node = ( selector, filter ) => {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		return createSimpleNode( match, filter );
	};
};
