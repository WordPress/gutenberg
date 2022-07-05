/**
 * @typedef {Object} WPToken
 * @property {string}              namespace  e.g. "core", "query", or "my-plugin"
 * @property {string}              name       e.g. "home_url", "featured-iamge", "my-token"
 * @property {Record<string, any>} value      defined by each token separately.
 * @property {string}              fallback   what to render if no matching token plugin available.
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
		new RegExp( '(#)?#{([^#]*)}#' ),
		( fullMatch, quoted, tokenContents ) => {
			if ( quoted ) {
				return fullMatch.slice(1);
			}

			const token = parseTokenContents( tokenContents );
			if ( ! token ) {
				return '';
			}

			return tokenReplacer( token ) ?? token.fallback;
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

		return { namespace, name, value, fallback: '' }
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

	return { namespace, name, value, fallback };
};

const jsonDecode = ( s ) => JSON.parse( s );
