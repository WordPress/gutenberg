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
		last = getRootPropertyValue( last );
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
	if ( ! hasVariable( declaration ) ) return undefined;

	const [ prop, value ] = getPropValue( declaration );

	return value ? `${ prop }:${ value }` : undefined;
}
