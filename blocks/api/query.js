/**
 * External dependencies
 */
import { nodeListToReact } from 'dom-react';
import {
	attr as originalAttr,
	prop as originalProp,
	html as originalHtml,
	text as originalText,
	query as originalQuery
} from 'hpq';
import { reduce } from 'lodash';

export const originalChildren = ( selector ) => {
	return ( node ) => {
		let match = node;

		if ( selector ) {
			match = node.querySelector( selector );
		}

		if ( match ) {
			return nodeListToReact( match.childNodes || [], wp.element.createElement );
		}

		return [];
	};
};

const addDescriptor = ( description ) => ( memo ) => {
	return Object.assign( memo, description );
};

// Source descriptors
// Each one of these functions defines how to retrieve the attribute value
//
//  - the descriptor sets "source: content" and a parse function for attributes parsed from block content
//  - the descriptor sets "source: metadata" and an attribute name for attributes stored in the block comment
const attr = ( ...args ) => addDescriptor( { source: 'content', parse: originalAttr( ...args ) } );
const prop = ( ...args ) => addDescriptor( { source: 'content', parse: originalProp( ...args ) } );
const html = ( ...args ) => addDescriptor( { source: 'content', parse: originalHtml( ...args ) } );
const text = ( ...args ) => addDescriptor( { source: 'content', parse: originalText( ...args ) } );
const children = ( ...args ) => addDescriptor( { source: 'content', parse: originalChildren( ...args ) } );
const metadata = ( name ) => addDescriptor( { source: 'metadata', name } );
const query = ( selector, descriptor ) => {
	return addDescriptor( {
		source: 'content',
		parse: originalQuery( selector, descriptor.__description.parse )
	} );
};

/**
 * Takes an argument description and returns a chainable API to describe the current attribute
 *
 * @param  {?Object} description The argument description
 *
 * @return {Object}              descriptors chainable API
 */
const getChainableAPI = ( description ) => {
	return reduce( { attr, prop, html, text, query, children, metadata }, ( memo, fct, key ) => {
		const wrappedFct = ( ...args ) => {
			const accumulator = fct( ...args );
			const newDescription = accumulator( description || {} );
			return {
				...getChainableAPI( newDescription ),
				__description: newDescription
			};
		};

		memo[ key ] = wrappedFct;
		return memo;
	}, {} );
};

export default getChainableAPI();
