/**
 * WordPress dependencies
 */
import { createElement, renderToString } from '@wordpress/element';

/**
 * Browser dependencies
 */
const { Node } = window;

/**
 * Transforms a WP Element to its corresponding HTML string.
 *
 * @param {WPElement} value Element.
 *
 * @return {string} HTML.
 */
export function elementToString( value ) {
	return renderToString( value );
}

/**
 * Transforms a value in a given format into string.
 *
 * @param {Array|string?}  value  DOM Elements.
 * @param {string} format Output format (string or element)
 *
 * @return {string} HTML output as string.
 */
export function valueToString( value, format ) {
	switch ( format ) {
		case 'string':
			return value || '';
		default:
			return elementToString( value );
	}
}

function walkChildren( node, mapFn ) {
	const result = [];

	let child = node.firstChild;
	while ( child ) {
		result.push( mapFn( child ) );
		child = child.next;
	}

	return result;
}

export function treeNodeToElement( node ) {
	switch ( node.type ) {
		case Node.TEXT_NODE:
			return node.value;

		default:
			return createElement(
				node.name,
				null,
				...walkChildren( node, treeNodeToElement )
			);
	}
}

/**
 * Transforms an array of DOM Elements to their corresponding WP element.
 *
 * @param {Array} value DOM Elements.
 *
 * @return {WPElement} WP Element.
 */
export function treeToElement( node ) {
	if ( ! node ) {
		return [];
	}

	return walkChildren( node, treeNodeToElement );
}

/**
 * Transforms an array of DOM Elements to their corresponding HTML string output.
 *
 * @param {Array}  value  DOM Elements.
 * @param {Editor} editor TinyMCE editor instance.
 *
 * @return {string} HTML.
 */
export function treeToString( tree ) {
	return renderToString( treeToElement( tree ) );
}

/**
 * Transforms an array of DOM Elements to the given format.
 *
 * @param {Array}  value  DOM Elements.
 * @param {string} format Output format (string or element)
 * @param {Editor} editor TinyMCE editor instance.
 *
 * @return {*} Output.
 */
export function treeToFormat( tree, format ) {
	switch ( format ) {
		case 'string':
			return treeToString( tree );
		default:
			return treeToElement( tree );
	}
}
