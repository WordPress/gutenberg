/**
 * Internal dependencies
 */
import { isValidElement, Fragment } from '../../../react';
import { getTags, getFormatToken } from './tag-tokens';
import { resetTokenCount } from './token-count';
import {
	addPropValueToInterpolateMap,
	resetInterpolateMap,
	addElementToInterpolateMap,
} from './interpolate-map';

const VARIABLE_PROPS_PATTERN = /%%(.*)%%/;

/**
 * Returns whether the provided node value has children.
 *
 * @param {Object} node
 *
 * @return {boolean}  If true, then the provided value has children.
 */
const hasChildren = ( node ) => {
	if ( ! node ) {
		return false;
	}
	return node &&
		( !! node.children || !! ( node.props && node.props.children ) );
};

/**
 * Function converting the provided element to a string.
 *
 * @param {*}      element
 * @param {Object} mainProps  The main props from the the wrapping component
 *
 * @todo Might need to implement handling for non-supported element types.
 *
 * @return {string} The element represented as a string.
 */
const convertElementToString = ( element, mainProps = {} ) => {
	if ( Array.isArray( element ) ) {
		return convertChildrenToString( element, mainProps );
	}

	switch ( typeof element ) {
		case 'string':
			return convertStringElement( element, mainProps );
		case 'number':
			return element.toString();
	}

	if ( ! isValidElement( element ) ) {
		return '';
	}

	const { type, props } = element;

	// if Fragment, then do children
	if ( type === Fragment ) {
		return convertChildrenToString( props.children, mainProps );
	}

	switch ( typeof type ) {
		// native element
		case 'string':
			return convertNativeComponentToString( type, props, mainProps );
		case 'function':
			// custom element which will not get drilled down into.
			return convertCustomComponentToString( type, props, mainProps );
	}
};

/**
 * Receives "children" and processes to convert to a string.
 *
 * @param {*}      children  Children may be an array or a string.
 * @param {Object} mainProps The props object passed through from the main
 *                           component wrapper.
 * @return {string} The final rendered string.
 */
const convertChildrenToString = ( children, mainProps ) => {
	let result = '';

	if ( ! Array.isArray( children ) ) {
		result += convertElementToString( children, mainProps );
		return result;
	}

	for ( let i = 0; i < children.length; i++ ) {
		const child = children[ i ];
		result += convertElementToString( child, mainProps );
	}

	return result;
};

/**
 * Converts an element that is a string.
 *
 * This handles processing potential embedded special prop value tags (%%tag%%)
 * in the string
 *
 * @param {string}  element
 * @param {Object}  mainProps  The props object passed through from the main
 *                             component wrapper.
 * @return {string} The final string value.
 */
const convertStringElement = ( element, mainProps ) => {
	// replace any dynamic values %%something%% with a sprintf style placeholder
	const splitString = element.split( new RegExp( '(%%.*%%)' ) );
	if ( splitString.length === 1 ) {
		return element;
	}
	return convertElementToString(
		splitString.flatMap( ( value ) => {
			const match = value.match( VARIABLE_PROPS_PATTERN );
			if ( Array.isArray( match ) ) {
				if ( match.length > 1 && typeof match[ 1 ] !== 'undefined' ) {
					value = getFormatToken( 'sprintf' );
					if ( typeof mainProps[ match[ 1 ] ] === 'undefined' ) {
						//@todo throw invariant warning here instead and just return the token
						throw new Error( 'main props does not have a value for the token' );
					}
					addPropValueToInterpolateMap( value, mainProps[ match[ 1 ] ] );
				}
			}
			return value;
		} ),
		mainProps
	);
};

/**
 * Converts an element that is a custom component to a string representation
 *
 * A common use-case will be to create interpolation strings for translators.
 * Since translators might not realize a custom component should not be
 * translated, this uses variants of the `<span>` tag as placeholders as those
 * will be more universally recognized as html content that should not be
 * touched.
 *
 * @param {WPElement} type       The custom type to be converted.
 * @param {Object}    props      The props on the component being converted.
 * @param {Object}    mainProps  The props object passed through from the main
 *                               component wrapper
 *
 * @return {string}  The final string value
 */
const convertCustomComponentToString = ( type, props, mainProps ) => {
	const withChildren = hasChildren( props );
	if ( withChildren ) {
		const [ searchString, openTag, closeTag ] = getTags( 'span' );
		addElementToInterpolateMap(
			searchString,
			type,
			{ ...props, children: '' },
			withChildren
		);
		return openTag + convertElementToString( props.children, mainProps ) + closeTag;
	}

	// self closing tag so let's just use a sprintf format token for this component
	const token = getFormatToken();
	addElementToInterpolateMap(
		token,
		type,
		props,
		false,
	);
	return token;
};

/**
 * Converts a native html element to a string representation.
 *
 * @param {string} type
 * @param {Object} props
 * @param {Object} mainProps  The props object passed through from the main
 *                            component wrapper
 *
 * @return {string} The final string value
 */
const convertNativeComponentToString = ( type, props, mainProps ) => {
	const withChildren = hasChildren( props );
	const [ searchString, openTag, closeTag, selfClosingTag ] = getTags( type );
	addElementToInterpolateMap(
		searchString,
		type,
		{ ...props, children: '' },
		withChildren
	);
	return withChildren ?
		openTag + convertElementToString( props.children, mainProps ) + closeTag :
		selfClosingTag;
};

/**
 * Receives an element and converts it to a string representation for interpolate
 * logic.
 *
 * This is a companion to `createInterpolateElement`. The string prepped here
 * along with the map generated during the conversion and exposed on
 * `getInterpolateMap` can be fed to `createInterpolateElement` to create the
 * React Element.
 *
 * The following conversions are performed as a part of the process:
 *
 * - Native elements (<a>, <p>, <strong> etc) are represented in the string
 *   tokenized by the count in the string.
 * - Custom components are represented in the string by a tokenized `<span>`
 *   element. Self closing components are represented by a sprintf type format
 *   token.
 * - `%%tag%%` type strings are converted to sprintf type format tokens but the
 *   `tag` must be a prop key on main props passed in to this function.  So for
 *   example, if the token was `%%special%%` then it's expected that
 *   `mainProps.special` would exist.  This allows for substituting dynamic
 *   values at runtime.
 *
 * @example
 *
 * The following JSX expression:
 *
 * This is a string with a special value: %%special%%. There is also a
 * <a href={ url }>link with <em>emphasis</em></a>. Finally, <a href={ url2 }>
 * another link with a <CustomComponent>custom component</CustomComponent></a>
 *
 * Would be converted to:
 *
 * 'This is a string with a special value: %1$s. There is also a <a%1>link
 * with <em%1>emphasis</em%1></a%1>. Finally, <a%2>another link with a
 * <span%1>custom component</span%1></a%2>'
 *
 * @param {WPElement} element   The element to convert.
 * @param {Object}    mainProps The main props from the wrapping component.
 *
 * @return {string}   The converted string
 */
const createInterpolateString = ( element, mainProps ) => {
	resetTokenCount();
	resetInterpolateMap();
	return convertElementToString( element, mainProps );
};

export default createInterpolateString;
