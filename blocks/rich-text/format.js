/**
 * External dependencies
 */
import { omitBy, map } from 'lodash';
import { nodeListToReact } from 'dom-react';

/**
 * WordPress dependencies
 */
import { createElement, renderToString } from '@wordpress/element';

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
 * Transforms a string HTML to its corresponding WP element.
 *
 * @param {string} value HTML.
 *
 * @return {WPElement} Element.
 */
export function stringToElement( value ) {
	if ( ! value ) {
		return [];
	}
	const domElement = document.createElement( 'div' );
	domElement.innerHTML = value;

	return domToElement( domElement.childNodes );
}

/**
 * Strips out TinyMCE specific attributes and nodes from a WPElement
 *
 * @param {string} type    Element type
 * @param {Object} props   Element Props
 * @param {Array} children Element Children
 *
 * @return {Element} WPElement.
 */
export function createTinyMCEElement( type, props, ...children ) {
	if ( props[ 'data-mce-bogus' ] === 'all' ) {
		return null;
	}

	if ( props.hasOwnProperty( 'data-mce-bogus' ) ) {
		return children;
	}

	return createElement(
		type,
		omitBy( props, ( _, key ) => key.indexOf( 'data-mce-' ) === 0 ),
		...children
	);
}

/**
 * Transforms an array of DOM Elements to their corresponding WP element.
 *
 * @param {Array} value DOM Elements.
 *
 * @return {WPElement} WP Element.
 */
export function domToElement( value ) {
	return nodeListToReact( value || [], createTinyMCEElement );
}

/**
 * Transforms an array of DOM Elements to their corresponding HTML string output.
 *
 * @param {Array} value DOM Elements.
 *
 * @return {string} HTML.
 */
export function domToString( value ) {
	return map( value, element => element.outerHTML ).join( '' );
}
