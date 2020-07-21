/**
 * External dependencies
 */
import { fill } from 'lodash';
import memoize from 'memize';

const VAR_REG_EXP = new RegExp( /var\(.*?\)[ \) ]*/, 'g' );

const { getComputedStyle } = window;
const htmlRootNode = document?.documentElement;

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
const rootComputedStyles = htmlRootNode && getComputedStyle( htmlRootNode );

/**
 * Retrieves the custom CSS variable from the :root selector.
 *
 * @param {string} key The CSS variable property to retrieve.
 * @return {?string} The value of the CSS variable.
 */
function getRootPropertyValue( key ) {
	// Otherwise, we'll attempt to get the CSS variable from :root.
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
function sanitizeParens( value ) {
	const parenStartCount = value.match( /\(/g )?.length || 0;
	const parenEndCount = value.match( /\)/g )?.length || 0;

	const parenAppendCound = parenStartCount - parenEndCount;
	const parenTrimCount = parenEndCount - parenStartCount;

	let result;

	if ( parenStartCount > parenEndCount ) {
		// We need to append ) to the end if there are any missing.
		const collection = Array( parenAppendCound );
		const append = fill( collection, ')' ).join( '' );
		result = `${ value }${ append }`;
	} else {
		// Otherwise, we need to trim the extra parens at the end.
		const trimRegExp = new RegExp( `((\\\)){${ parenTrimCount }})$`, 'gi' );
		result = value.replace( trimRegExp, '' );
	}

	return result;
}

/**
 * Interprets and retrieves the CSS property and value of a declaration rule.
 *
 * @param {string} declaration A CSS declaration rule to parse.
 * @return {Array<string, ?string>} [prop, value] parsed from the declaration.
 */
function getPropValue( declaration ) {
	let hasFallbackValue = false;
	// Start be separating (and preparing) the prop and value from the declaration.
	let [ prop, ...value ] = declaration.replace( / /g, '' ).split( ':' );
	prop = prop?.trim();
	value = value.join( '' );

	// Cloning the original value. We'll mutate this one (if there are variables).
	let transformedValue = `${ value }`;
	const matches = transformedValue.match( VAR_REG_EXP ) || [];

	for ( const match of matches ) {
		// Splitting again allows us to traverse through nested vars().
		const entries = match.split( 'var(' ).filter( Boolean );
		let fallback;

		for ( const entry of entries ) {
			const parsedValue = sanitizeParens( entry );
			const [ customProp, customFallback ] = parsedValue.split( ',' );

			if ( customFallback !== undefined ) {
				// We'll use the fallback value if defined.
				fallback = customFallback;
			} else {
				// Otherwise, we'll attempt to get the CSS variable from :root.
				fallback = getRootPropertyValue( customProp );
			}

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
		// Retrieve the fallback a CSS variable is used in this declaration.
		if ( hasVariable( declaration ) ) {
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
			return [ ...styles, fallback, declaration ];
		}
		// If no CSS variable is used, we return the declaration untouched.
		return [ ...styles, declaration ];
	}, [] );

	/*
	 * We'll rejoin our declarations with a ; separator.
	 * Note: We need to add a ; at the end for stylis to interpret correctly.
	 */
	return `${ parsed.join( ';' ) };`;
}

export const memoizedTransformContent = memoize( transformContent );
