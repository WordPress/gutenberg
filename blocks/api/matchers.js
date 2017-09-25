/**
 * External dependencies
 */
import { nodeListToReact, nodeToReact } from 'dom-react';
import { omit } from 'lodash';
export { attr, prop, html, text, query } from 'hpq';

function toArray( ...args ) {
	return [ toElement( ...args ) ];
}

function toElement( type, props, ...children ) {
	return [ type, omit( props, 'key' ), ...children ];
}

export const children = ( selector ) => {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		if ( match ) {
			return nodeListToReact( match.childNodes || [], toArray );
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

		return nodeToReact( match, toElement );
	};
};
