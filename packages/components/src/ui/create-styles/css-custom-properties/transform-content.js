/**
 * External dependencies
 */
import memoize from 'memize';

/**
 * Internal dependencies
 */
import { getPropValue } from './get-prop-value';
import { hasVariable, isCustomProperty } from './utils';

/**
 * Interprets and retrieves the CSS fallback value of a declaration rule.
 *
 * @param {string} declaration A CSS declaration rule to parse.
 * @param {import('./create-root-store').RootStore} rootStore A store for CSS root variables.
 * @return {string | undefined} A CSS declaration rule with a fallback (if applicable).
 */
export function getFallbackDeclaration( declaration, rootStore ) {
	if ( ! hasVariable( declaration ) && ! isCustomProperty( declaration ) )
		return undefined;

	const [ prop, value ] = getPropValue( declaration, rootStore );

	return value ? [ prop, value ].join( ':' ) : undefined;
}

/**
 * Parses the incoming content from stylis to add fallback CSS values for
 * variables.
 *
 * @param {string} content Stylis content to parse.
 * @param {import('./create-root-store').RootStore} rootStore A store for CSS root variables.
 * @return {string | undefined} The transformed content with CSS variable fallbacks.
 */
export function baseTransformContent( content, rootStore ) {
	/*
	 * Attempts to deconstruct the content to retrieve prop/value
	 * CSS declaration pairs.
	 *
	 * Before:
	 * 'background-color:var(--bg, black); font-size:14px;'
	 *
	 * After:
	 * ['background-color:var(--bg, black)', ' font-size:14px']
	 */
	const declarations = content.split( ';' ).filter( Boolean );
	let didTransform = false;

	/*
	 * With the declaration collection, we'll iterate over every declaration
	 * to provide fallbacks (if applicable.)
	 */
	const parsed = declarations.reduce( (
		/** @type {string[]} */ styles,
		/** @type {string} */ declaration
	) => {
		// If no CSS variable is used, we return the declaration untouched.
		if ( ! hasVariable( declaration ) ) {
			return [ ...styles, declaration ];
		}
		// Retrieve the fallback a CSS variable is used in this declaration.
		const fallback = getFallbackDeclaration( declaration, rootStore );
		/*
		 * Prepend the fallback in our styles set.
		 *
		 * Before:
		 * [
		 * 	 ...styles,
		 *   'background-color:var(--bg, black);'
		 * ]
		 *
		 * After:
		 * [
		 * 	 ...styles,
		 *   'background:black;',
		 *   'background-color:var(--bg, black);'
		 * ]
		 */
		if ( fallback ) {
			didTransform = true;

			return [ ...styles, fallback, declaration ];
		}
		return [ ...styles, declaration ];
	}, [] );

	/*
	 * We'll rejoin our declarations with a ; separator.
	 * Note: We need to add a ; at the end for stylis to interpret correctly.
	 */
	const result = parsed.join( ';' ).concat( ';' );

	// We only want to return a value if we're able to locate a fallback value.
	return didTransform ? result : undefined;
}

export const transformContent = memoize( baseTransformContent );
