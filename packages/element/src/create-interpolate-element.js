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

/**
 * Transforms a given string value into a collection of html like tags.
 *
 * @example
 *
 * If you provide `something` as the tagString, this will return:
 *
 * ```js
 * const tags = getTagsFromString( 'something' );
 * const tagsAre = tags === [
 *     '<something>',
 *     '</something>',
 *     '<something/>',
 * ];
 * ```
 *
 * @param {string} tagString  Something like `a%1`.
 *
 * @return {string[]} The generated tags for the given string.
 */
export const getTagsFromString = ( tagString ) => {
	return [
		`<${ tagString }>`,
		`</${ tagString }>`,
		`<${ tagString }/>`,
	];
};

/**
 * Generates and returns the regular expression for the given type.
 *
 * @param {Array}		tags          Array of tags to use for the reg ex
 * @param {string}  searchString  The search string serving as the base for the
 *                                expression.
 * @param {string}	type					What type of regEx to return.
 *
 * @return {RegExp}  The generated regular expression.
 */
const getRegEx = ( tags, searchString, type ) => {
	let pattern;
	const [ openTag, closeTag, selfClosingTag ] = tags;
	switch ( type ) {
		case 'children':
			pattern = escapeRegExp( openTag ) + '(.*)' + escapeRegExp( closeTag );
			break;
		case 'propValue':
			pattern = escapeRegExp( searchString );
			break;
		default:
			pattern = escapeRegExp( selfClosingTag );
	}
	return new RegExp( pattern );
};

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
	const tags = getTagsFromString( searchString );
	// first try children reg ex.  If there is a match, then return.
	const match = interpolatedString.match(
		getRegEx( tags, searchString, 'children' )
	);
	if ( match !== null ) {
		conversionConfig.hasChildren = true;
		return match;
	}
	// no children, try matching on another pattern and return.
	const regEx = getHasPropValue( conversionConfig ) ?
		getRegEx( tags, searchString, 'propValue' ) :
		getRegEx( tags, searchString );
	return interpolatedString.match( regEx );
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
	const [ mapItem ] = conversionMap.slice( 0, 1 );
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
 * This function creates an interpolated element from a passed in string with
 * specific tags matching how the string should be converted to an element via
 * the conversion map value.
 *
 * @example
 * For example, for the given string:
 *
 * "This is a <span%1>string</span%1> with <a%1>a link</a%1>, a self-closing
 * %1$s tag and a plain value %2$s"
 *
 * You would have something like this as the conversionMap value:
 *
 * ```js
 * {
 *     'span%1': { tag: CustomComponent, props: {} },
 *     'a%1': { tag: 'a', props: { href: 'https://github.com' } },
 *     '%1$s': { tag: CustomComponentB, props: {} },
 *     '%2$s': { value: 'custom value' },
 * }
 * ```
 *
 * @param {string}  interpolatedString  The interpolation string to be parsed.
 * @param {Object} conversionMap        The map used to convert the string to
 *                                      a react element.
 *
 * @return {Element}  A react element.
 */
const createInterpolateElement = ( interpolatedString, conversionMap ) => {
	keyIndex = -1;
	return createElement(
		Fragment,
		{},
		recursiveCreateElement(
			interpolatedString,
			Object.entries( conversionMap )
		),
	);
};

export default createInterpolateElement;
