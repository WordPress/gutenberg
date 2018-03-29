/**
 * Parts of this source were derived and modified from fast-react-render,
 * released under the MIT license.
 *
 * https://github.com/alt-j/fast-react-render
 *
 * Copyright (c) 2016 Andrey Morozov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * External dependencies
 */
import { flow, includes, castArray, kebabCase } from 'lodash';

/**
 * Valid attribute types.
 *
 * @type {String[]}
 */
const ATTRIBUTES_TYPES = [
	'string',
	'boolean',
	'number',
];

/**
 * Element tags which can be self-closing.
 *
 * @type {String[]}
 */
const SELF_CLOSING_TAGS = [
	'area',
	'base',
	'br',
	'col',
	'command',
	'embed',
	'hr',
	'img',
	'input',
	'keygen',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
];

/**
 * Boolean attributes are attributes whose presence as being assigned is
 * meaningful, even if only empty.
 *
 * See: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes
 * Extracted from: https://html.spec.whatwg.org/multipage/indices.html#attributes-3
 *
 * [ ...document.querySelectorAll( '#attributes-1 > tbody > tr' ) ]
 *     .filter( ( tr ) => tr.lastChild.textContent.indexOf( 'Boolean attribute' ) !== -1 )
 *     .map( ( tr ) => tr.firstChild.textContent.trim() )
 *
 * @type {Array}
 */
const BOOLEAN_ATTRIBUTES = [
	'allowfullscreen',
	'allowpaymentrequest',
	'allowusermedia',
	'async',
	'autofocus',
	'autoplay',
	'checked',
	'controls',
	'default',
	'defer',
	'disabled',
	'formnovalidate',
	'hidden',
	'ismap',
	'itemscope',
	'loop',
	'multiple',
	'muted',
	'nomodule',
	'novalidate',
	'open',
	'open',
	'playsinline',
	'readonly',
	'required',
	'reversed',
	'selected',
	'typemustmatch',
];

/**
 * Enumerated attributes are attributes which must be of a specific value form.
 * Like boolean attributes, these are meaningful if specified, even if not of a
 * valid enumerated value.
 *
 * See: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#enumerated-attribute
 * Extracted from: https://html.spec.whatwg.org/multipage/indices.html#attributes-3
 *
 * [ ...document.querySelectorAll( '#attributes-1 > tbody > tr' ) ]
 *     filter( ( tr ) => /("(.+?)";?\s*)+/.test( tr.lastChild.textContent ) )
 *     .map( ( tr ) => tr.firstChild.textContent.trim() )
 *
 * Some notable omissions:
 *
 *  - `alt`: https://blog.whatwg.org/omit-alt
 *
 * @type {Array}
 */
const ENUMERATED_ATTRIBUTES = [
	'autocomplete',
	'contenteditable',
	'crossorigin',
	'dir',
	'dir',
	'draggable',
	'enctype',
	'formenctype',
	'formmethod',
	'inputmode',
	'kind',
	'method',
	'preload',
	'sandbox',
	'scope',
	'shape',
	'spellcheck',
	'step',
	'translate',
	'type',
	'type',
	'workertype',
	'wrap',
];

/**
 * Set of named pattern pairs for use in escaping replacements.
 *
 * @type {Object}
 */
const REPLACEMENTS = {
	/**
	 * Pattern pair to replace ambiguous ampersand with encoded ampersand. Not
	 * strictly faithful to the specification, instead opting to a mix of HTML4
	 * and HTML5, substituting encoded ampersand where ampersand is standalone
	 * or an invalid character reference sequence (not ending with semicolon).
	 *
	 * @link https://w3c.github.io/html/syntax.html#ambiguous-ampersand
	 * @link https://w3c.github.io/html/syntax.html#character-references
	 * @link https://mathiasbynens.be/notes/ambiguous-ampersands
	 *
	 * @type {Array}
	 */
	ambiguousAmpersand: [ /&(?!#?[a-z0-9]+;)/gi, '&amp;' ],

	/**
	 * Pattern pair replacing "literal U+0022 QUOTATION MARK characters" with
	 * encoded quotation mark.
	 *
	 * @type {Array}
	 */
	quotationMark: [ /"/g, '&quot;' ],

	/**
	 * Pattern pair replacing "U+003C LESS-THAN SIGN (<)" with
	 * encoded quotation mark.
	 *
	 * @type {Array}
	 */
	lessThanSign: [ /</g, '&lt;' ],
};

function createReplacer( replacements ) {
	return flow( replacements.map( ( replacement ) => {
		const [ pattern, substitute ] = replacement;
		return ( value ) => value.replace( pattern, substitute );
	} ) );
}

/**
 * Returns an escaped attribute value.
 *
 * @link https://w3c.github.io/html/syntax.html#elements-attributes
 *
 * "[...] the text cannot contain an ambiguous ampersand [...] must not contain
 * any literal U+0022 QUOTATION MARK characters (")"
 *
 * @param {string} value Attribute value.
 *
 * @return {string} Escaped attribute value.
 */
const escapeAttribute = createReplacer( [
	REPLACEMENTS.ambiguousAmpersand,
	REPLACEMENTS.quotationMark,
] );

/**
 * Returns an escaped HTML element value.
 *
 * @link https://w3c.github.io/html/syntax.html#writing-html-documents-elements
 * @link https://w3c.github.io/html/syntax.html#ambiguous-ampersand
 *
 * "the text must not contain the character U+003C LESS-THAN SIGN (<) or an
 * ambiguous ampersand."
 *
 * @param {string} value Element value.
 *
 * @return {string} Escaped HTML element value.
 */
const escapeHTML = createReplacer( [
	REPLACEMENTS.lessThanSign,
	REPLACEMENTS.ambiguousAmpersand,
] );

/**
 * Returns true if the specified string is prefixed by one of an array of
 * possible prefixes.
 *
 * @param {string}   string   String to check.
 * @param {string[]} prefixes Possible prefixes.
 *
 * @return {boolean} Whether string has prefix.
 */
function hasPrefixes( string, prefixes ) {
	return prefixes.some( ( prefix ) => string.indexOf( prefix ) === 0 );
}

/**
 * Returns true if the given argument can be inferred to be a props object.
 *
 * @param {*} object Object to test.
 *
 * @return {boolean} Whether object is props.
 */
function isPropsLike( object ) {
	return object && object.constructor === Object && ! ( '$$typeof' in object );
}

/**
 * Returns true if the given prop name should be ignored in attributes
 * serialization, or false otherwise.
 *
 * @param {string} attribute Attribute to check.
 *
 * @return {boolean} Whether attribute should be ignored.
 */
function shouldIgnoreAttribute( attribute ) {
	return 'key' === attribute || 'children' === attribute;
}

/**
 * Serializes a React element to string.
 *
 * @param {WPElement} element Element to serialize.
 * @param {?Object}   context Context object.
 *
 * @return {string} Serialized element.
 */
function renderElement( element, context = {} ) {
	if ( null === element || undefined === element || false === element ) {
		return '';
	}

	if ( Array.isArray( element ) ) {
		if ( isPropsLike( element[ 1 ] ) ) {
			const [ type, props, children ] = element;
			return renderElement( { type, props: { ...props, children } }, context );
		}

		return element.map( ( childElement ) => (
			renderElement( childElement, context )
		) ).join( '' );
	}

	if ( typeof element === 'string' ) {
		return element;
	}

	if ( typeof element === 'number' ) {
		return element.toString();
	}

	const { type, props } = element;

	if ( typeof type === 'string' ) {
		return renderNativeComponent( type, props, context );
	} else if ( typeof type === 'function' ) {
		if ( type.prototype && typeof type.prototype.render === 'function' ) {
			return renderComponent( type, props, context );
		}

		return renderElement( type( props, context ), context );
	}

	return '';
}

/**
 * Serializes a native component type to string.
 *
 * @param {string}  type    Native component type to serialize.
 * @param {Object}  props   Props object.
 * @param {?Object} context Context object.
 *
 * @return {string} Serialized element.
 */
function renderNativeComponent( type, props, context = {} ) {
	let content = '';
	if ( type === 'textarea' ) {
		content = renderChildren( [ props.value ], context );
	} else if ( props.dangerouslySetInnerHTML ) {
		content = props.dangerouslySetInnerHTML.__html;
	} else if ( typeof props.children !== 'undefined' ) {
		content = renderChildren( castArray( props.children ), context );
	}

	const attributes = renderAttributes( props );

	if ( includes( SELF_CLOSING_TAGS, type ) ) {
		return '<' + type + attributes + '/>' + content;
	}

	return '<' + type + attributes + '>' + content + '</' + type + '>';
}

/**
 * Serializes a non-native component type to string.
 *
 * @param {Function} Component Component type to serialize.
 * @param {Object}   props     Props object.
 * @param {?Object}  context   Context object.
 *
 * @return {string} Serialized element
 */
function renderComponent( Component, props, context = {} ) {
	const instance = new Component( props, context );

	if ( typeof instance.componentWillMount === 'function' ) {
		instance.componentWillMount();
	}

	if ( typeof instance.getChildContext === 'function' ) {
		Object.assign( context, instance.getChildContext() );
	}

	const html = renderElement( instance.render(), context );

	return html;
}

/**
 * Serializes an array of children to string.
 *
 * @param {Array}   children Children to serialize.
 * @param {?Object} context  Context object.
 *
 * @return {string} Serialized children.
 */
function renderChildren( children, context = {} ) {
	let result = '';

	for ( let i = 0; i < children.length; i++ ) {
		const child = children[ i ];

		if ( typeof child === 'string' ) {
			result += escapeHTML( child );
		} else if ( Array.isArray( child ) ) {
			if ( isPropsLike( child[ 1 ] ) ) {
				result += renderElement( child, context );
			} else {
				result += renderChildren( child, context );
			}
		} else if ( typeof child === 'object' && child ) {
			result += renderElement( child, context );
		} else if ( typeof child === 'number' ) {
			result += child;
		}
	}

	return result;
}

/**
 * Renders a props object as a string of HTML attributes.
 *
 * @param {Object} props Props object.
 *
 * @return {string} Attributes string.
 */
function renderAttributes( props ) {
	let result = '';

	for ( const key in props ) {
		const value = key === 'style' ? renderStyle( props[ key ] ) : props[ key ];

		const isBooleanAttribute = (
			( typeof value === 'boolean' && hasPrefixes( key, [ 'data-', 'aria-' ] ) ) ||
			includes( BOOLEAN_ATTRIBUTES, key )
		);

		const isAsIsRenderAttribute = (
			isBooleanAttribute ||
			'src' === key ||
			includes( ENUMERATED_ATTRIBUTES, key )
		);

		if ( ( ! value && ! isAsIsRenderAttribute ) || shouldIgnoreAttribute( key ) ||
				! includes( ATTRIBUTES_TYPES, typeof value ) ) {
			continue;
		}

		let attribute = key;
		if ( key === 'htmlFor' ) {
			attribute = 'for';
		} else if ( key === 'className' ) {
			attribute = 'class';
		}

		result += ' ' + attribute;

		if ( typeof value !== 'boolean' || isBooleanAttribute ) {
			result += '="' + ( typeof value === 'string' ? escapeAttribute( value ) : value ) + '"';
		}
	}

	return result;
}

/**
 * Renders a style object as a string attribute value.
 *
 * @param {Object} style Style object.
 *
 * @return {string} Style attribute value.
 */
function renderStyle( style ) {
	let result = '';

	for ( const property in style ) {
		const value = style[ property ];
		if ( null === value || undefined === value ) {
			continue;
		}

		if ( result ) {
			result += ';';
		}

		result += kebabCase( property ) + ':' + value;
	}

	return result;
}

export default renderElement;
