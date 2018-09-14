/**
 * WordPress dependencies
 */
import { createValue } from '@wordpress/rich-text-structure';
import deprecated from '@wordpress/deprecated';

/**
 * External dependencies
 */
export { attr, prop, html, text, query } from 'hpq';

export const children = ( selector, multiline ) => {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		return createValue( match, multiline );
	};
};

export const node = ( selector ) => {
	deprecated( 'node matcher', {
		alternative: 'children matcher with multiline property',
		plugin: 'Gutenberg',
		version: '3.9',
	} );

	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		const record = createValue( match );

		record._deprecatedMultilineTag = match.nodeName.toLowerCase();

		return record;
	};
};
