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
import { isPlainObject } from 'is-plain-object';
import { paramCase as kebabCase } from 'change-case';

/**
 * WordPress dependencies
 */
import {
	escapeHTML,
	escapeAttribute,
	isValidAttributeName,
} from '@wordpress/escape-html';

/**
 * Internal dependencies
 */
import { createContext, Fragment, StrictMode, forwardRef } from './react';
import RawHTML from './raw-html';

/** @typedef {React.ReactElement} ReactElement */

const Context = createContext( undefined );
Context.displayName = 'ElementContext';

interface ComponentInstance {
	render: () => React.ReactNode;
	getChildContext?: () => Record< string, any >;
}

interface RawHTMLProps {
	children: string;
	[ key: string ]: any;
}

interface StyleObject {
	[ property: string ]: string | number | null | undefined;
}

interface HTMLProps {
	dangerouslySetInnerHTML?: {
		__html: string;
	};
	children?: React.ReactNode;
	value?: React.ReactNode;
	style?: StyleObject | string;
	className?: string;
	htmlFor?: string;
	[ key: string ]: any;
}

const { Provider, Consumer } = Context;

const ForwardRef = forwardRef( () => {
	return null;
} );

/**
 * Valid attribute types.
 */
const ATTRIBUTES_TYPES = new Set< string >( [ 'string', 'boolean', 'number' ] );

/**
 * Element tags which can be self-closing.
 */
const SELF_CLOSING_TAGS = new Set< string >( [
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
] );

/**
 * Boolean attributes are attributes whose presence as being assigned is
 * meaningful, even if only empty.
 *
 * See: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes
 * Extracted from: https://html.spec.whatwg.org/multipage/indices.html#attributes-3
 *
 * Object.keys( [ ...document.querySelectorAll( '#attributes-1 > tbody > tr' ) ]
 *     .filter( ( tr ) => tr.lastChild.textContent.indexOf( 'Boolean attribute' ) !== -1 )
 *     .reduce( ( result, tr ) => Object.assign( result, {
 *         [ tr.firstChild.textContent.trim() ]: true
 *     } ), {} ) ).sort();
 */
const BOOLEAN_ATTRIBUTES = new Set< string >( [
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
	'download',
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
	'playsinline',
	'readonly',
	'required',
	'reversed',
	'selected',
	'typemustmatch',
] );

/**
 * Enumerated attributes are attributes which must be of a specific value form.
 * Like boolean attributes, these are meaningful if specified, even if not of a
 * valid enumerated value.
 *
 * See: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#enumerated-attribute
 * Extracted from: https://html.spec.whatwg.org/multipage/indices.html#attributes-3
 *
 * Object.keys( [ ...document.querySelectorAll( '#attributes-1 > tbody > tr' ) ]
 *     .filter( ( tr ) => /^("(.+?)";?\s*)+/.test( tr.lastChild.textContent.trim() ) )
 *     .reduce( ( result, tr ) => Object.assign( result, {
 *         [ tr.firstChild.textContent.trim() ]: true
 *     } ), {} ) ).sort();
 *
 * Some notable omissions:
 *
 *  - `alt`: https://blog.whatwg.org/omit-alt
 */
const ENUMERATED_ATTRIBUTES = new Set< string >( [
	'autocapitalize',
	'autocomplete',
	'charset',
	'contenteditable',
	'crossorigin',
	'decoding',
	'dir',
	'draggable',
	'enctype',
	'formenctype',
	'formmethod',
	'http-equiv',
	'inputmode',
	'kind',
	'method',
	'preload',
	'scope',
	'shape',
	'spellcheck',
	'translate',
	'type',
	'wrap',
] );

/**
 * Set of CSS style properties which support assignment of unitless numbers.
 * Used in rendering of style properties, where `px` unit is assumed unless
 * property is included in this set or value is zero.
 *
 * Generated via:
 *
 * Object.entries( document.createElement( 'div' ).style )
 *     .filter( ( [ key ] ) => (
 *         ! /^(webkit|ms|moz)/.test( key ) &&
 *         ( e.style[ key ] = 10 ) &&
 *         e.style[ key ] === '10'
 *     ) )
 *     .map( ( [ key ] ) => key )
 *     .sort();
 */
const CSS_PROPERTIES_SUPPORTS_UNITLESS = new Set< string >( [
	'animation',
	'animationIterationCount',
	'baselineShift',
	'borderImageOutset',
	'borderImageSlice',
	'borderImageWidth',
	'columnCount',
	'cx',
	'cy',
	'fillOpacity',
	'flexGrow',
	'flexShrink',
	'floodOpacity',
	'fontWeight',
	'gridColumnEnd',
	'gridColumnStart',
	'gridRowEnd',
	'gridRowStart',
	'lineHeight',
	'opacity',
	'order',
	'orphans',
	'r',
	'rx',
	'ry',
	'shapeImageThreshold',
	'stopOpacity',
	'strokeDasharray',
	'strokeDashoffset',
	'strokeMiterlimit',
	'strokeOpacity',
	'strokeWidth',
	'tabSize',
	'widows',
	'x',
	'y',
	'zIndex',
	'zoom',
] );

/**
 * Returns true if the specified string is prefixed by one of an array of
 * possible prefixes.
 * @param string
 * @param prefixes
 */
export function hasPrefix( string: string, prefixes: string[] ): boolean {
	return prefixes.some( ( prefix ) => string.indexOf( prefix ) === 0 );
}

/**
 * Returns true if the given prop name should be ignored in attributes
 * serialization, or false otherwise.
 * @param attribute
 */
function isInternalAttribute( attribute: string ): boolean {
	return 'key' === attribute || 'children' === attribute;
}

/**
 * Returns the normal form of the element's attribute value for HTML.
 * @param attribute
 * @param value
 */
function getNormalAttributeValue( attribute: string, value: any ): any {
	switch ( attribute ) {
		case 'style':
			return renderStyle( value );
	}

	return value;
}

/**
 * This is a map of all SVG attributes that have dashes. Map(lower case prop => dashed lower case attribute).
 * We need this to render e.g strokeWidth as stroke-width.
 *
 * List from: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute.
 */
const SVG_ATTRIBUTE_WITH_DASHES_LIST: Record< string, string > = [
	'accentHeight',
	'alignmentBaseline',
	'arabicForm',
	'baselineShift',
	'capHeight',
	'clipPath',
	'clipRule',
	'colorInterpolation',
	'colorInterpolationFilters',
	'colorProfile',
	'colorRendering',
	'dominantBaseline',
	'enableBackground',
	'fillOpacity',
	'fillRule',
	'floodColor',
	'floodOpacity',
	'fontFamily',
	'fontSize',
	'fontSizeAdjust',
	'fontStretch',
	'fontStyle',
	'fontVariant',
	'fontWeight',
	'glyphName',
	'glyphOrientationHorizontal',
	'glyphOrientationVertical',
	'horizAdvX',
	'horizOriginX',
	'imageRendering',
	'letterSpacing',
	'lightingColor',
	'markerEnd',
	'markerMid',
	'markerStart',
	'overlinePosition',
	'overlineThickness',
	'paintOrder',
	'panose1',
	'pointerEvents',
	'renderingIntent',
	'shapeRendering',
	'stopColor',
	'stopOpacity',
	'strikethroughPosition',
	'strikethroughThickness',
	'strokeDasharray',
	'strokeDashoffset',
	'strokeLinecap',
	'strokeLinejoin',
	'strokeMiterlimit',
	'strokeOpacity',
	'strokeWidth',
	'textAnchor',
	'textDecoration',
	'textRendering',
	'underlinePosition',
	'underlineThickness',
	'unicodeBidi',
	'unicodeRange',
	'unitsPerEm',
	'vAlphabetic',
	'vHanging',
	'vIdeographic',
	'vMathematical',
	'vectorEffect',
	'vertAdvY',
	'vertOriginX',
	'vertOriginY',
	'wordSpacing',
	'writingMode',
	'xmlnsXlink',
	'xHeight',
].reduce(
	( map, attribute ) => {
		// The keys are lower-cased for more robust lookup.
		map[ attribute.toLowerCase() ] = attribute;
		return map;
	},
	{} as Record< string, string >
);

/**
 * This is a map of all case-sensitive SVG attributes. Map(lowercase key => proper case attribute).
 * The keys are lower-cased for more robust lookup.
 * Note that this list only contains attributes that contain at least one capital letter.
 * Lowercase attributes don't need mapping, since we lowercase all attributes by default.
 */
const CASE_SENSITIVE_SVG_ATTRIBUTES: Record< string, string > = [
	'allowReorder',
	'attributeName',
	'attributeType',
	'autoReverse',
	'baseFrequency',
	'baseProfile',
	'calcMode',
	'clipPathUnits',
	'contentScriptType',
	'contentStyleType',
	'diffuseConstant',
	'edgeMode',
	'externalResourcesRequired',
	'filterRes',
	'filterUnits',
	'glyphRef',
	'gradientTransform',
	'gradientUnits',
	'kernelMatrix',
	'kernelUnitLength',
	'keyPoints',
	'keySplines',
	'keyTimes',
	'lengthAdjust',
	'limitingConeAngle',
	'markerHeight',
	'markerUnits',
	'markerWidth',
	'maskContentUnits',
	'maskUnits',
	'numOctaves',
	'pathLength',
	'patternContentUnits',
	'patternTransform',
	'patternUnits',
	'pointsAtX',
	'pointsAtY',
	'pointsAtZ',
	'preserveAlpha',
	'preserveAspectRatio',
	'primitiveUnits',
	'refX',
	'refY',
	'repeatCount',
	'repeatDur',
	'requiredExtensions',
	'requiredFeatures',
	'specularConstant',
	'specularExponent',
	'spreadMethod',
	'startOffset',
	'stdDeviation',
	'stitchTiles',
	'suppressContentEditableWarning',
	'suppressHydrationWarning',
	'surfaceScale',
	'systemLanguage',
	'tableValues',
	'targetX',
	'targetY',
	'textLength',
	'viewBox',
	'viewTarget',
	'xChannelSelector',
	'yChannelSelector',
].reduce(
	( map, attribute ) => {
		// The keys are lower-cased for more robust lookup.
		map[ attribute.toLowerCase() ] = attribute;
		return map;
	},
	{} as Record< string, string >
);

/**
 * This is a map of all SVG attributes that have colons.
 * Keys are lower-cased and stripped of their colons for more robust lookup.
 */
const SVG_ATTRIBUTES_WITH_COLONS: Record< string, string > = [
	'xlink:actuate',
	'xlink:arcrole',
	'xlink:href',
	'xlink:role',
	'xlink:show',
	'xlink:title',
	'xlink:type',
	'xml:base',
	'xml:lang',
	'xml:space',
	'xmlns:xlink',
].reduce(
	( map, attribute ) => {
		map[ attribute.replace( ':', '' ).toLowerCase() ] = attribute;
		return map;
	},
	{} as Record< string, string >
);

/**
 * Returns the normal form of the element's attribute name for HTML.
 * @param attribute
 */
function getNormalAttributeName( attribute: string ): string {
	switch ( attribute ) {
		case 'htmlFor':
			return 'for';

		case 'className':
			return 'class';
	}
	const attributeLowerCase = attribute.toLowerCase();

	if ( CASE_SENSITIVE_SVG_ATTRIBUTES[ attributeLowerCase ] ) {
		return CASE_SENSITIVE_SVG_ATTRIBUTES[ attributeLowerCase ];
	} else if ( SVG_ATTRIBUTE_WITH_DASHES_LIST[ attributeLowerCase ] ) {
		return kebabCase(
			SVG_ATTRIBUTE_WITH_DASHES_LIST[ attributeLowerCase ]
		);
	} else if ( SVG_ATTRIBUTES_WITH_COLONS[ attributeLowerCase ] ) {
		return SVG_ATTRIBUTES_WITH_COLONS[ attributeLowerCase ];
	}

	return attributeLowerCase;
}

/**
 * Returns the normal form of the style property name for HTML.
 *
 * - Converts property names to kebab-case, e.g. 'backgroundColor' → 'background-color'
 * - Leaves custom attributes alone, e.g. '--myBackgroundColor' → '--myBackgroundColor'
 * - Converts vendor-prefixed property names to -kebab-case, e.g. 'MozTransform' → '-moz-transform'
 * @param property
 */
function getNormalStylePropertyName( property: string ): string {
	if ( property.startsWith( '--' ) ) {
		return property;
	}

	if ( hasPrefix( property, [ 'ms', 'O', 'Moz', 'Webkit' ] ) ) {
		return '-' + kebabCase( property );
	}

	return kebabCase( property );
}

/**
 * Returns the normal form of the style property value for HTML. Appends a
 * default pixel unit if numeric, not a unitless property, and not zero.
 * @param property
 * @param value
 */
function getNormalStylePropertyValue(
	property: string,
	value: any
): string | number {
	if (
		typeof value === 'number' &&
		0 !== value &&
		! hasPrefix( property, [ '--' ] ) &&
		! CSS_PROPERTIES_SUPPORTS_UNITLESS.has( property )
	) {
		return value + 'px';
	}

	return value;
}

/**
 * Serializes a React element to string.
 * @param element
 * @param context
 * @param legacyContext
 */
export function renderElement(
	element: React.ReactNode,
	context?: any,
	legacyContext: Record< string, any > = {}
): string {
	if ( null === element || undefined === element || false === element ) {
		return '';
	}

	if ( Array.isArray( element ) ) {
		return renderChildren( element, context, legacyContext );
	}

	switch ( typeof element ) {
		case 'string':
			return escapeHTML( element );

		case 'number':
			return element.toString();
	}

	const { type, props } = element as {
		type?: any;
		props?: any;
	};

	switch ( type ) {
		case StrictMode:
		case Fragment:
			return renderChildren( props.children, context, legacyContext );

		case RawHTML:
			const { children, ...wrapperProps } = props as RawHTMLProps;

			return renderNativeComponent(
				! Object.keys( wrapperProps ).length ? null : 'div',
				{
					...wrapperProps,
					dangerouslySetInnerHTML: { __html: children },
				},
				context,
				legacyContext
			);
	}

	switch ( typeof type ) {
		case 'string':
			return renderNativeComponent( type, props, context, legacyContext );

		case 'function':
			if (
				type.prototype &&
				typeof type.prototype.render === 'function'
			) {
				return renderComponent( type, props, context, legacyContext );
			}

			return renderElement(
				type( props, legacyContext ),
				context,
				legacyContext
			);
	}

	switch ( type && type.$$typeof ) {
		case Provider.$$typeof:
			return renderChildren( props.children, props.value, legacyContext );

		case Consumer.$$typeof:
			return renderElement(
				props.children( context || type._currentValue ),
				context,
				legacyContext
			);

		case ForwardRef.$$typeof:
			return renderElement(
				type.render( props ),
				context,
				legacyContext
			);
	}

	return '';
}

/**
 * Serializes a native component type to string.
 * @param type
 * @param props
 * @param context
 * @param legacyContext
 */
export function renderNativeComponent(
	type: string | null,
	props: HTMLProps,
	context?: any,
	legacyContext: Record< string, any > = {}
): string {
	let content = '';
	if ( type === 'textarea' && props.hasOwnProperty( 'value' ) ) {
		// Textarea children can be assigned as value prop. If it is, render in
		// place of children. Ensure to omit so it is not assigned as attribute
		// as well.
		content = renderChildren( props.value, context, legacyContext );
		const { value, ...restProps } = props;
		props = restProps;
	} else if (
		props.dangerouslySetInnerHTML &&
		typeof props.dangerouslySetInnerHTML.__html === 'string'
	) {
		// Dangerous content is left unescaped.
		content = props.dangerouslySetInnerHTML.__html;
	} else if ( typeof props.children !== 'undefined' ) {
		content = renderChildren( props.children, context, legacyContext );
	}

	if ( ! type ) {
		return content;
	}

	const attributes = renderAttributes( props );

	if ( SELF_CLOSING_TAGS.has( type ) ) {
		return '<' + type + attributes + '/>';
	}

	return '<' + type + attributes + '>' + content + '</' + type + '>';
}

/**
 * Serializes a non-native component type to string.
 * @param Component
 * @param props
 * @param context
 * @param legacyContext
 */
export function renderComponent(
	Component: React.ComponentClass,
	props: Record< string, any >,
	context?: any,
	legacyContext: Record< string, any > = {}
): string {
	const instance = new Component( props, legacyContext ) as ComponentInstance;

	if ( typeof instance.getChildContext === 'function' ) {
		Object.assign( legacyContext, instance.getChildContext() );
	}

	const html = renderElement( instance.render(), context, legacyContext );

	return html;
}

/**
 * Serializes an array of children to string.
 * @param children
 * @param context
 * @param legacyContext
 */
function renderChildren(
	children: React.ReactNode,
	context?: any,
	legacyContext: Record< string, any > = {}
): string {
	let result = '';

	const childrenArray = Array.isArray( children ) ? children : [ children ];

	for ( let i = 0; i < childrenArray.length; i++ ) {
		const child = childrenArray[ i ];

		result += renderElement( child, context, legacyContext );
	}

	return result;
}

/**
 * Renders a props object as a string of HTML attributes.
 * @param props
 */
export function renderAttributes( props: Record< string, any > ): string {
	let result = '';

	for ( const key in props ) {
		const attribute = getNormalAttributeName( key );
		if ( ! isValidAttributeName( attribute ) ) {
			continue;
		}

		let value = getNormalAttributeValue( key, props[ key ] );

		// If value is not of serializable type, skip.
		if ( ! ATTRIBUTES_TYPES.has( typeof value ) ) {
			continue;
		}

		// Don't render internal attribute names.
		if ( isInternalAttribute( key ) ) {
			continue;
		}

		const isBooleanAttribute = BOOLEAN_ATTRIBUTES.has( attribute );

		// Boolean attribute should be omitted outright if its value is false.
		if ( isBooleanAttribute && value === false ) {
			continue;
		}

		const isMeaningfulAttribute =
			isBooleanAttribute ||
			hasPrefix( key, [ 'data-', 'aria-' ] ) ||
			ENUMERATED_ATTRIBUTES.has( attribute );

		// Only write boolean value as attribute if meaningful.
		if ( typeof value === 'boolean' && ! isMeaningfulAttribute ) {
			continue;
		}

		result += ' ' + attribute;

		// Boolean attributes should write attribute name, but without value.
		// Mere presence of attribute name is effective truthiness.
		if ( isBooleanAttribute ) {
			continue;
		}

		if ( typeof value === 'string' ) {
			value = escapeAttribute( value );
		}

		result += '="' + value + '"';
	}

	return result;
}

/**
 * Renders a style object as a string attribute value.
 * @param style
 */
export function renderStyle( style: StyleObject | string ): string | undefined {
	// Only generate from object, e.g. tolerate string value.
	if ( ! isPlainObject( style ) ) {
		return style as string;
	}

	let result: string | undefined;

	const styleObj = style as StyleObject;
	for ( const property in styleObj ) {
		const value = styleObj[ property ];
		if ( null === value || undefined === value ) {
			continue;
		}

		if ( result ) {
			result += ';';
		} else {
			result = '';
		}

		const normalName = getNormalStylePropertyName( property );
		const normalValue = getNormalStylePropertyValue( property, value );
		result += normalName + ':' + normalValue;
	}

	return result;
}

export default renderElement;
