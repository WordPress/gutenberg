/**
 * External dependencies
 */
import memoize from 'memize';

/**
 * Internal dependencies
 */
import {
	VAR_REG_EXP,
	getRootPropertyValue,
	hasVariable,
	sanitizeParens,
} from './utils';

/**
 * Interprets and retrieves the CSS property and value of a declaration rule.
 *
 * @param {string} declaration A CSS declaration rule to parse.
 * @return {Array<string, ?string>} [prop, value] parsed from the declaration.
 */
function getPropValue( declaration ) {
	let hasFallbackValue = false;
	// Start be separating (and preparing) the prop and value from the declaration.
	let [ prop, value ] = declaration.replace( / /g, '' ).split( /:/ );

	// Cloning the original value. We'll mutate this one (if there are variables).
	let transformedValue = value;
	const matches = transformedValue.match( VAR_REG_EXP ) || [];

	for ( const match of matches ) {
		// Splitting again allows us to traverse through nested vars().
		const entries = match.split( 'var(' ).filter( Boolean );
		let fallback;

		for ( const entry of entries ) {
			const parsedValue = sanitizeParens( entry );
			const [ customProp, customFallback ] = parsedValue.split( ',' );

			// Attempt to get the CSS variable from :root. Otherwise, use the provided fallback.
			fallback = getRootPropertyValue( customProp ) || customFallback;

			if ( fallback ) {
				hasFallbackValue = true;
				/*
				 * If a valid fallback value is discovered, we'll replace it in
				 * our temporary transformedValue.
				 */
				transformedValue = transformedValue.replace( match, fallback );
			}
		}
	}

	// We only want to return a value if we're able to locate a fallback value.
	value = hasFallbackValue ? sanitizeParens( transformedValue ) : undefined;

	return [ prop, value ];
}

/**
 * Interprets and retrieves the CSS fallback value of a declaration rule.
 *
 * @param {string} declaration A CSS declaration rule to parse.
 * @return {?string} A CSS declaration rule with a fallback (if applicable).
 */
export function getFallbackDeclaration( declaration ) {
	if ( ! hasVariable( declaration ) ) return undefined;

	const [ prop, value ] = getPropValue( declaration );

	return value ? `${ prop }:${ value }` : undefined;
}

/**
 * Parses the incoming content from stylis to add fallback CSS values for
 * variables.
 *
 * @param {string} content Stylis content to parse.
 * @return {string} The transformed content with CSS variable fallbacks.
 */
export function transformContent( content ) {
	/*
	 * Attempts to deconstruct the content to retrieve prop/value
	 * CSS declaration pairs.
	 *
	 * Example:
	 * background-color:var(--bg, black); font-size:14px;
	 *
	 * Becomes...
	 * ["background-color:var(--bg, black)", " font-size:14px"]
	 */
	const declarations = content.split( ';' ).filter( Boolean );

	/*
	 * With the declaration collection, we'll iterate over every declaration
	 * to provide fallbacks (if applicable.)
	 */
	const parsed = declarations.reduce( ( styles, declaration ) => {
		// If no CSS variable is used, we return the declaration untouched.
		if ( ! hasVariable( declaration ) ) {
			return [ ...styles, declaration ];
		}
		// Retrieve the fallback a CSS variable is used in this declaration.
		const fallback = getFallbackDeclaration( declaration );
		/*
		 * Prepend the fallback in our styles set.
		 *
		 * Example:
		 * [
		 * 	 ...styles,
		 *   'background-color:var(--bg, black);'
		 * ]
		 *
		 * Becomes...
		 * [
		 * 	 ...styles,
		 *   'background:black;',
		 *   'background-color:var(--bg, black);'
		 * ]
		 */
		if ( fallback ) {
			return [ ...styles, fallback, declaration ];
		}
		return [ ...styles, declaration ];
	}, [] );

	/*
	 * We'll rejoin our declarations with a ; separator.
	 * Note: We need to add a ; at the end for stylis to interpret correctly.
	 */
	return parsed.join( ';' ).concat( ';' );
}

export const memoizedTransformContent = memoize( transformContent );
