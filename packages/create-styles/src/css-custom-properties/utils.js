/**
 * External dependencies
 */
import { repeat } from 'lodash';

export const VAR_REG_EXP = new RegExp( /var\(.*?\)[ ) ]*/, 'g' );

/**
 * Checks to see if a CSS declaration rule is a CSS variable (e.g. --font: 14px)
 *
 * @param {string} declaration  A CSS declaration rule.
 * @return {boolean} Result of whether declaration is a CSS variable.
 */
export function isCustomProperty( declaration ) {
	return declaration.indexOf( '--' ) === 0;
}

/**
 * Checks to see if a CSS declaration rule uses var().
 *
 * @param {string} declaration  A CSS declaration rule.
 * @return {boolean} Result of whether declaration contains a CSS variable.
 */
export function hasVariable( declaration ) {
	return declaration?.includes?.( 'var(' );
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
		const trimRegExp = new RegExp( `((\\)){${ parenTrimCount }})$`, 'gi' );
		result = value.replace( trimRegExp, '' );
	}

	return result?.trim();
}
