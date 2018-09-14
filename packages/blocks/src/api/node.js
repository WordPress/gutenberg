/**
 * WordPress dependencies
 */
import {
	toHTMLString,
	createValue,
} from '@wordpress/rich-text-structure';
import deprecated from '@wordpress/deprecated';

/**
 * A representation of a single node within a block's rich text value. If
 * representing a text node, the value is simply a string of the node value.
 * As representing an element node, it is an object of:
 *
 * 1. `type` (string): Tag name.
 * 2. `props` (object): Attributes and children array of WPBlockNode.
 *
 * @typedef {string|Object} WPBlockNode
 */

/**
 * Given a single node and a node type (e.g. `'br'`), returns true if the node
 * corresponds to that type, false otherwise.
 *
 * @param {WPBlockNode} node Block node to test
 * @param {string} type      Node to type to test against.
 *
 * @return {boolean} Whether node is of intended type.
 */
function isNodeOfType( node, type ) {
	return node && node.type === type;
}

/**
 * Given a DOM Element or Text node, returns an equivalent block node. Throws
 * if passed any node type other than element or text.
 *
 * @throws {TypeError} If non-element/text node is passed.
 *
 * @param {Node} domNode DOM node to convert.
 *
 * @return {WPBlockNode} Block node equivalent to DOM node.
 */
export function fromDOM( domNode ) {
	deprecated( 'wp.blocks.node.fromDOM', {
		alternative: 'wp.richTextStructure.createValue',
		plugin: 'Gutenberg',
		version: '3.9',
	} );

	return createValue( domNode );
}

/**
 * Given a block node, returns its HTML string representation.
 *
 * @param {WPBlockNode} node Block node to convert to string.
 *
 * @return {string} String HTML representation of block node.
 */
export function toHTML( node ) {
	deprecated( 'wp.blocks.node.toHTML', {
		alternative: 'wp.richTextStructure.toHTMLString',
		plugin: 'Gutenberg',
		version: '3.9',
	} );

	return toHTMLString( node );
}

/**
 * Given a selector, returns an hpq matcher generating a WPBlockNode value
 * matching the selector result.
 *
 * @param {string} selector DOM selector.
 *
 * @return {Function} hpq matcher.
 */
export function matcher( selector ) {
	deprecated( 'wp.blocks.node.matcher', {
		alternative: 'wp.blocks.children.matcher with multiline property',
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
}

export default {
	isNodeOfType,
	fromDOM,
	toHTML,
	matcher,
};
