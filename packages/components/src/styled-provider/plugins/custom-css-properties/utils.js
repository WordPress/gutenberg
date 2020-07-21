/**
 * External dependencies
 */
import { repeat } from 'lodash';

export const VAR_REG_EXP = new RegExp( /var\(.*?\)[ \) ]*/, 'g' );

const htmlRootNode = document?.documentElement;

// Detects native CSS varialble support
// https://github.com/jhildenbiddle/css-vars-ponyfill/blob/master/src/index.js
export const isNativeSupport = window?.CSS?.supports( '(--a: 0)' );

/*
 * Caching the computedStyle instance for document.documentElement.
 * We do this so to prevent additional getComputedStyle calls, which greatly
 * improves performance. We use the .getPropertyValue() method from this
 * reference to retrieve CSS variable values.
 *
 * Although the instance is cached, the values retrieved by .getPropertyValue()
 * are up to date. This is important in cases where global :root variables
 * are updated.
 */
const rootComputedStyles =
	htmlRootNode && window.getComputedStyle( htmlRootNode );

/**
 * Retrieves the custom CSS variable from the :root selector.
 *
 * @param {string} key The CSS variable property to retrieve.
 * @return {?string} The value of the CSS variable.
 */
export function getRootPropertyValue( key ) {
	// We'll attempt to get the CSS variable from :root.
	let rootStyles = rootComputedStyles;

	if ( process.env.NODE_ENV === 'test' ) {
		/*
		 * The cached rootComputedStyles does not retrieve the latest values
		 * in our environment (JSDOM). In that case, we'll create a fresh
		 * instance computedStyles on the root HTML element.
		 */
		rootStyles = window.getComputedStyle( document.documentElement );
	}

	return rootStyles?.getPropertyValue( key )?.trim();
}

/**
 * Checks to see if a CSS declaration rule uses var().
 *
 * @param {string} declaration  A CSS declaration rule.
 * @return {boolean} Result of whether declaration contains a CSS variable.
 */
export function hasVariable( declaration ) {
	return declaration.includes( 'var(' );
}

/**
 * Appends or trims parens from a value.
 *
 * @param {string} value Value to sanitize.
 * @return {string} The sanitized value
 */
export function sanitizeParens( value ) {
	const parenStartCount = value.match( /\(/g )?.length || 0;
	const parenEndCount = value.match( /\)/g )?.length || 0;

	const parenAppendCound = parenStartCount - parenEndCount;
	const parenTrimCount = parenEndCount - parenStartCount;

	let result;

	if ( parenStartCount > parenEndCount ) {
		// We need to append ) to the end if there are any missing.
		const append = repeat( ')', parenAppendCound );
		result = `${ value }${ append }`;
	} else {
		// Otherwise, we need to trim the extra parens at the end.
		const trimRegExp = new RegExp( `((\\\)){${ parenTrimCount }})$`, 'gi' );
		result = value.replace( trimRegExp, '' );
	}

	return result;
}
