/**
 * @typedef {Object} WPToken
 * @property {string}              namespace e.g. "core", "query", or "my-plugin"
 * @property {string}              name      e.g. "home_url", "featured-image", "my-token"
 * @property {Record<string, any>} value     defined by each token separately.
 * @property {string}              fallback  what to render if no matching token plugin available.
 * @property {string|null}         context   how token values should be escaped when rendered, e.g. "attribute" or "html".
 */

/**
 * @callback TokenReplacer
 * @param {WPToken} token The parsed token to replace.
 * @return {string} the replacement string.
 */

/**
 * Replaces dynamic tokens in a document with the return value
 * from their callback or with a fallback value if one exists.
 *
 * @param {TokenReplacer} tokenReplacer
 * @param {string}        input
 * @return {string}       output
 */
export const swapTokens = ( tokenReplacer, input ) => {
	return input.replace(
		new RegExp( '(#)?#([^#{])?{([^#]*)}#' ),
		( fullMatch, quoted, sigil, tokenContents ) => {
			if ( quoted ) {
				return fullMatch.slice( 1 );
			}

			const token = parseTokenContents( tokenContents );
			if ( ! token ) {
				return '';
			}

			return (
				tokenReplacer( withContext( token, sigil ) ) ?? token.fallback
			);
		}
	);
};

/**
 * Parses the inner contents of a token.
 *
 * @param {string} contents the inner contents of a token to parse.
 * @return {WPToken|null} the parsed token or null if invalid.
 */
const parseTokenContents = ( contents ) => {
	const matches = contents.match(
		/^(?:([a-z][a-z\d_-]*)\/)?([a-z\d_-]*)(?:=(.+))?$/i
	);

	if ( matches ) {
		const [ , rawNamespace, name, rawValue ] = matches;
		const namespace = rawNamespace || 'core';
		const value = rawValue ? jsonDecode( rawValue ) : null;

		return { namespace, name, value, fallback: '', context: null };
	}

	const tokenData = jsonDecode( `{${ contents }}` );
	if ( null === tokenData ) {
		return null;
	}

	const nameMatch = tokenData.token?.match(
		/^(?:([a-z][a-z\d_-]*)\/)?([a-z\d_-]*)$/i
	);
	if ( ! nameMatch ) {
		return null;
	}

	const [ , rawNamespace, name ] = nameMatch;
	const namespace = rawNamespace || 'core';
	const value = tokenData?.value ?? null;
	const fallback = tokenData?.fallback ?? '';

	return { namespace, name, value, fallback, context: null };
};

/**
 * Add appropriate context to token if given a recognized sigil.
 *
 * @param {WPToken} token input token to augment.
 * @param {string}  sigil identifies context.
 * @return {WPToken} the token with context, if available.
 */
const withContext = ( token, sigil ) => {
	switch ( sigil ) {
		case 'a':
			return { ...token, context: 'attribute' };

		case 'h':
			return { ...token, context: 'html' };

		case 'j':
			return { ...token, context: 'javascript' };

		default:
			return { ...token, context: null };
	}
};

/**
 * Attempt to parse augmented JSON.
 *
 * @param {string} s
 * @return {any} the parsed document or `null` if unable to parse.
 */
const jsonDecode = ( s ) => {
	try {
		return JSON.parse( s );
	} catch ( e ) {
		return null;
	}
};
