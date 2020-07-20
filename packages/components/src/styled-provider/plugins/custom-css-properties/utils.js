const { getComputedStyle } = window;

const htmlRootNode = document?.documentElement;
const rootComputedStyles = htmlRootNode && getComputedStyle( htmlRootNode );

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
 * Interprets and retrieves the CSS property and value of a declaration rule.
 *
 * @param {string} declaration A CSS declaration rule to parse.
 * @return {Array<string, ?string>} [prop, value] parsed from the declaration.
 */
function getPropValue( declaration ) {
	/*
	 * Split declaration based on var() usage. This is to accomodate nested
	 * CSS var() scenarios.
	 */
	const entries = declaration.replace( / /g, '' ).split( 'var(' );
	// Get the last entry. This is fallback value (if defined).
	let last = entries.pop();

	// Get + sanitize the CSS property.
	let [ prop ] = entries;
	prop = prop.replace( ':', '' );

	/*
	 * This regex removes the ending parentheses from the "last" entry.
	 *
	 * To support nested var(), we need to adjust the regex count targeting
	 * the ending parentheses based on the number of starting "var(" that
	 * appear in our entries.
	 */
	const regex = new RegExp( `((\\\)){${ entries.length }})$`, 'gi' );
	last = last.replace( regex, '' );

	/*
	 * Lastly, we'll attempt to use the fallback value (if provided).
	 * Otherwise, we'll attempt to grab the custom CSS property attached
	 * to :root (document.documentElement).
	 */
	if ( last.includes( ',' ) ) {
		// Sanitize the fallback
		last = last.split( ',' )[ 1 ];
	} else {
		// Attempt to get value from :root
		last = rootComputedStyles?.getPropertyValue( last );
	}

	return [ prop, last ];
}

/**
 * Interprets and retrieves the CSS fallback value of a declaration rule.
 *
 * @param {string} declaration A CSS declaration rule to parse.
 * @return {string} A CSS declaration rule with a fallback (if applicable).
 */
export function getFallbackDeclaration( declaration ) {
	const [ prop, value ] = getPropValue( declaration );

	return value && `${ prop }:${ value }`;
}
