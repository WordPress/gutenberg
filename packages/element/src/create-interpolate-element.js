/**
 * Internal dependencies
 */
import { createElement, Fragment, isValidElement } from './react';

/**
 * External dependencies
 */
import { escapeRegExp, flatMap } from 'lodash';

const getHasPropValue = ( config ) => !! config.value;
const getHasChildren = ( config ) => !! config.hasChildren;

const getBalancedTagsExpression = ( searchString ) => new RegExp(
	escapeRegExp( `<${ searchString }>` ) +
		'(.*)' + escapeRegExp( `</${ searchString }>` )
);

const getSelfClosingTagExpression = ( searchString ) => new RegExp(
	escapeRegExp( `<${ searchString }/>` )
);

/**
 * Generates and returns the regular expression used for splitting a string
 *
 * @param {string} searchString  The search string serving as the base for the
 *                               expression.
 *
 * @return {RegExp}  The generated regular expression
 */
const getSplitRegEx = ( searchString ) => new RegExp( '(' + escapeRegExp( searchString ) + ')' );

/**
 * Generates a String.prototype.match value for the incoming arguments.
 *
 * @param {string} interpolatedString  The string the match is performed on.
 * @param {string} searchString				 The string used as the base for the
 *                                     search
 * @param {Object} conversionConfig    The configuration object for the
 *                                     interpolation being performed.
 *
 * @return {Array|null}	An array if there is a match or null if not.
 */
const getMatchFromString = (
	interpolatedString,
	searchString,
	conversionConfig
) => {
	// first try children reg ex. If there is a match, then return.
	const match = interpolatedString.match(
		getBalancedTagsExpression( searchString )
	);

	if ( match !== null ) {
		conversionConfig.hasChildren = true;
		return match;
	}

	// no children, so just return selfClosingTag match
	return interpolatedString.match( getSelfClosingTagExpression( searchString ) );
};

// index for keys
// This is external to `recursiveCreateElement` and reset in
// `createInterpolateElement` because of the recursion.
let keyIndex = -1;

/**
 * Used to recursively create elements from the interpolation string using the
 * conversion map.
 *
 * @param {string}  potentialElement  The interpolation string (or fragment)
 *                                    being processed.
 * @param {Array[]} conversionMap     The interpolation map used for converting
 *                                    the string to a react element.
 *
 * @return {Element|string|Array}  A react element, string or array.
 */
const recursiveCreateElement = ( potentialElement, conversionMap ) => {
	/**
	 * If the conversion map is not a valid array or empty then just return the
	 * element.
	 */
	if ( ! Array.isArray( conversionMap ) || ! conversionMap.length ) {
		return potentialElement;
	}
	const [ mapItem ] = conversionMap;
	const [ searchString, conversionConfig ] = mapItem;

	/**
	 * This short circuits the process if the conversion map has an invalid config.
	 */
	if ( ! searchString || ! conversionConfig ) {
		return potentialElement;
	}

	const match = getMatchFromString(
		potentialElement,
		searchString,
		conversionConfig
	);

	// if there is no match for this string, then that means it is not an element
	// so just return as is to be used as a direct child.
	if ( match === null ) {
		return potentialElement;
	}

	// if the full match returned equals the potential element, then we know
	// we can create the element and restart the conversion on any children if
	// necessary.
	if ( match[ 0 ] === potentialElement ) {
		// remove this item from the conversion map because it's no longer needed.
		conversionMap.shift();

		if ( getHasPropValue( conversionConfig ) ) {
			// if value is a react element, then need to wrap in Fragment with a key
			// to prevent key warnings.
			if ( isValidElement( conversionConfig.value ) ) {
				keyIndex++;
				return <Fragment key={ keyIndex }>{ conversionConfig.value }</Fragment>;
			}
			return conversionConfig.value;
		}
		keyIndex++;
		return getHasChildren( conversionConfig ) ?
			createElement(
				conversionConfig.tag,
				{ ...conversionConfig.props, key: keyIndex },
				recursiveCreateElement( match[ 1 ], conversionMap )
			) :
			createElement(
				conversionConfig.tag,
				{ ...conversionConfig.props, key: keyIndex }
			);
	}

	// still here, so we need to split on the full match and loop through each
	return flatMap(
		potentialElement.split( getSplitRegEx( match[ 0 ] ) )
			.filter( ( value ) => !! value ),
		( element ) => {
			return recursiveCreateElement( element, conversionMap );
		}
	);
};

/**
 * This reorders the conversionMap so that it's entries match the order of
 * elements in the string.
 *
 * This is necessary because the parser is order sensitive due to the potential
 * for nested elements (eg. <a>Some linked <em>and emphasized</em></a> string).
 * This ensures that the parsing will be done correctly yet still allow for the
 * consumer not to worry about order in the map.
 *
 * @param interpolatedString {string}  The string being parsed.
 * @param conversionMap      {Array}   The map being reordered
 *
 * @return {Array}  The new map in the correct order for the tags in the string.
 */
const reorderMapByElementOrder = ( interpolatedString, conversionMap ) => {
	// if length of map is only one then we can just return as is.
	if ( conversionMap.length === 1 ) {
		return conversionMap;
	}
	return conversionMap.sort( ( [ tagA ], [ tagB ] ) => {
		tagA = `<${ tagA }`;
		tagB = `<${ tagB }`;
		return interpolatedString.indexOf( tagA ) > interpolatedString.indexOf( tagB );
	} );
};

/**
 * This function creates an interpolated element from a passed in string with
 * specific tags matching how the string should be converted to an element via
 * the conversion map value.
 *
 * @example
 * For example, for the given string:
 *
 * "This is a <span>string</span> with <a>a link</a>, a self-closing
 * <CustomComponentB/> tag and a plain value <custom value/>"
 *
 * You would have something like this as the conversionMap value:
 *
 * ```js
 * {
 *     span: { tag: CustomComponent, props: {} },
 *     a: { tag: 'a', props: { href: 'https://github.com' } },
 *     CustomComponentB: { tag: CustomComponentB, props: {} },
 *     'custom value': { value: 'custom value' },
 * }
 * ```
 *
 * @param {string}  interpolatedString  The interpolation string to be parsed.
 * @param {Object}  conversionMap       The map used to convert the string to
 *                                      a react element.
 *
 * @return {Element}  A react element.
 */
const createInterpolateElement = ( interpolatedString, conversionMap ) => {
	keyIndex = -1;

	if ( ! isValidConversionMap( conversionMap ) ) {
		return interpolatedString;
	}

	// verify that the object isn't empty.
	conversionMap = Object.entries( conversionMap );
	if ( conversionMap.length === 0 ) {
		return interpolatedString;
	}

	return createElement(
		Fragment,
		{},
		recursiveCreateElement(
			interpolatedString,
			reorderMapByElementOrder( interpolatedString, conversionMap )
		),
	);
};

/**
 * Validate conversion map.
 *
 * A map is considered valid if it's an object and does not have length.
 *
 * @param conversionMap {Object}  The map being validated.
 *
 * @return boolean  True means the map is valid.
 */
const isValidConversionMap = ( conversionMap ) => {
	return typeof conversionMap === 'object' &&
		typeof conversionMap.length === 'undefined';
};

export default createInterpolateElement;
