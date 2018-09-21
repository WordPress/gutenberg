/**
 * WordPress dependencies
 */
import {
	concat as richTextConcat,
	toHTMLString,
	createValue,
} from '@wordpress/rich-text-value';
import deprecated from '@wordpress/deprecated';

/**
 * A representation of a block's rich text value.
 *
 * @typedef {WPBlockNode[]} WPBlockChildren
 */

/**
 * Given block children, returns an array of block nodes.
 *
 * @param {WPBlockChildren} children Block children object to convert.
 *
 * @return {Array<WPBlockNode>} An array of individual block nodes.
 */
function getChildrenArray( children ) {
	deprecated( 'wp.blocks.children.getChildrenArray', {
		alternative: 'wp.richTextValue.createValue',
		plugin: 'Gutenberg',
		version: '4.2',
	} );

	// The fact that block children are compatible with the element serializer
	// is merely an implementation detail that currently serves to be true, but
	// should not be mistaken as being a guarantee on the external API.
	return children;
}

/**
 * Given two or more block nodes, returns a new block node representing a
 * concatenation of its values.
 *
 * @param {...WPBlockChildren} blockNodes Block nodes to concatenate.
 *
 * @return {WPBlockChildren} Concatenated block node.
 */
export function concat( ...children ) {
	deprecated( 'wp.blocks.children.concat', {
		alternative: 'wp.richTextValue.concat',
		plugin: 'Gutenberg',
		version: '4.2',
	} );

	return richTextConcat( ...children );
}

/**
 * Given an iterable set of DOM nodes, returns equivalent block children.
 * Ignores any non-element/text nodes included in set.
 *
 * @param {Iterable.<Node>} domNodes Iterable set of DOM nodes to convert.
 *
 * @return {WPBlockChildren} Block children equivalent to DOM nodes.
 */
export function fromDOM( domNodes ) {
	deprecated( 'wp.blocks.children.fromDOM', {
		alternative: 'wp.richTextValue.createValue',
		plugin: 'Gutenberg',
		version: '4.2',
	} );

	if ( domNodes.length === 0 ) {
		return createValue();
	}

	return createValue( domNodes[ 0 ].parentNode );
}

/**
 * Given a block node, returns its HTML string representation.
 *
 * @param {WPBlockChildren} children Block node(s) to convert to string.
 *
 * @return {string} String HTML representation of block node.
 */
export function toHTML( children ) {
	deprecated( 'wp.blocks.children.toHTML', {
		alternative: 'wp.richTextValue.toHTMLString',
		plugin: 'Gutenberg',
		version: '4.2',
	} );

	return toHTMLString( children );
}

/**
 * Given a selector, returns an hpq matcher generating a WPBlockChildren value
 * matching the selector result.
 *
 * @param {string} selector     DOM selector.
 * @param {string} multilineTag Multiline tag.
 *
 * @return {Function} hpq matcher.
 */
export function matcher( selector, multilineTag ) {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		return createValue( match, multilineTag );
	};
}

export default {
	concat,
	getChildrenArray,
	fromDOM,
	toHTML,
	matcher,
};
