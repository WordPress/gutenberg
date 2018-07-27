/**
 * External dependencies
 */
import { omitBy } from 'lodash';
import { nodeListToReact } from 'dom-react';

/**
 * WordPress dependencies
 */
import { createElement, renderToString } from '@wordpress/element';
import { children } from '@wordpress/blocks';

const { TEXT_NODE, ELEMENT_NODE } = window.Node;

/**
 * Zero-width space character used by TinyMCE as a caret landing point for
 * inline boundary nodes.
 *
 * @see tinymce/src/core/main/ts/text/Zwsp.ts
 *
 * @type {string}
 */
const TINYMCE_ZWSP = '\uFEFF';

/**
 * Regular expression matching TinyMCE zero-width space character globally.
 *
 * @type {RegExp}
 */
const REGEXP_TINYMCE_ZWSP = new RegExp( TINYMCE_ZWSP, 'g' );

/**
 * Returns true if the given attribute name is a TinyMCE internal temporary
 * attribute which should not be included in the serialized output, or false
 * otherwise. Would use the given editor's serializer as basis for determining
 * temporary attributes, but fails to include attributes like `data-mce-src`.
 *
 * @param {string} attributeName Attribute name to test.
 *
 * @return {boolean} Whether attribute is an internal temporary attribute.
 */
export function isTinyMCEInternalAttribute( attributeName ) {
	return attributeName.indexOf( 'data-mce-' ) === 0;
}

/**
 * Returns true if the given HTMLElement is a TinyMCE bogus element. During
 * serialization, a bogus element should be skipped.
 *
 * @param {HTMLElement} element Element to test.
 *
 * @return {boolean} Whether element is a TinyMCE bogus element.
 */
export function isTinyMCEBogusElement( element ) {
	return element.getAttribute( 'data-mce-bogus' ) === 'all';
}

/**
 * Returns true if the given HTMLElement is a TinyMCE bogus wrapper. During
 * serialization, a bogus wrapper should be substituted with its childrens'
 * content.
 *
 * @param {HTMLElement} element Element to test.
 *
 * @return {boolean} Whether element is a TinyMCE bogus wrapper.
 */
export function isTinyMCEBogusWrapperElement( element ) {
	return (
		element.hasAttribute( 'data-mce-bogus' ) &&
		! isTinyMCEBogusElement( element )
	);
}

/**
 * Given a text node, returns its node value with any TinyMCE internal zero-
 * width space characters omitted.
 *
 * @param {Text} node Text node from which to derive value.
 *
 * @return {string} Cleaned text node value.
 */
export function getCleanTextNodeValue( node ) {
	const { nodeValue } = node;
	return nodeValue.replace( REGEXP_TINYMCE_ZWSP, '' );
}

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
	if ( ! value ) {
		return '';
	}

	switch ( format ) {
		case 'string':
			return value;

		case 'element':
			return elementToString( value );

		case 'children':
			return children.toHTML( value );
	}
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
export function createTinyMCEElement( type, props, ...elementChildren ) {
	if ( props[ 'data-mce-bogus' ] === 'all' ) {
		return null;
	}

	if ( props.hasOwnProperty( 'data-mce-bogus' ) ) {
		return elementChildren;
	}

	return createElement(
		type,
		omitBy( props, ( _, key ) => key.indexOf( 'data-mce-' ) === 0 ),
		...elementChildren
	);
}

/**
 * Given an HTMLElement from a TinyMCE editor body element, returns equivalent
 * WPBlockChildren value. The element may undergo some preprocessing to remove
 * temporary or internal elements and attributes.
 *
 * @param {HTMLElement} element TinyMCE DOM element.
 *
 * @return {WPBlockChildren} WPBlockChildren equivalent value to element.
 */
export function createBlockChildrenFromTinyMCEElement( element ) {
	const attributes = {};
	for ( let i = 0; i < element.attributes.length; i++ ) {
		const { name, value } = element.attributes[ i ];

		if ( ! isTinyMCEInternalAttribute( name ) ) {
			attributes[ name ] = value;
		}
	}

	return {
		type: element.nodeName.toLowerCase(),
		props: {
			...attributes,
			children: domToBlockChildren( element.childNodes ),
		},
	};
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
 * Given an array of HTMLElement from a TinyMCE editor body element, returns an
 * equivalent WPBlockChildren value. The element may undergo some preprocessing
 * to remove temporary or internal elements and attributes.
 *
 * @param {Array} value TinyMCE DOM elements.
 *
 * @return {WPBlockChildren} WPBlockChildren equivalent value to element.
 */
export function domToBlockChildren( value ) {
	const result = [];

	for ( let i = 0; i < value.length; i++ ) {
		let node = value[ i ];
		switch ( node.nodeType ) {
			case TEXT_NODE:
				node = getCleanTextNodeValue( node );
				if ( node.length ) {
					result.push( node );
				}
				break;

			case ELEMENT_NODE:
				if ( isTinyMCEBogusElement( node ) ) {
					break;
				}

				if ( ! isTinyMCEBogusWrapperElement( node ) ) {
					result.push( createBlockChildrenFromTinyMCEElement( node ) );
				} else if ( node.hasChildNodes() ) {
					result.push( ...domToBlockChildren( node.childNodes ) );
				}
				break;
		}
	}

	return result;
}

/**
 * Transforms an array of DOM Elements to their corresponding HTML string output.
 *
 * @param {Array} value DOM Elements.
 *
 * @return {string} HTML.
 */
export function domToString( value ) {
	return children.toHTML( domToBlockChildren( value ) );
}

/**
 * Transforms an array of DOM Elements to the given format.
 *
 * @param {Array}  value  DOM Elements.
 * @param {string} format Output format (string or element)
 *
 * @return {*} Output.
 */
export function domToFormat( value, format ) {
	switch ( format ) {
		case 'string':
			return domToString( value );

		case 'element':
			return domToElement( value );

		case 'children':
			return domToBlockChildren( value );
	}
}
