const DS_TOKEN_PREFIX = 'wpds-';
const wpdsTokensRegex = new RegExp( `(?:^|[^\\w])--${ DS_TOKEN_PREFIX }`, 'i' );

/**
 * Single-pass extraction that finds all `--prefix-*` tokens in a CSS value
 * string, classifying each occurrence as `var()`-wrapped or bare, and whether
 * it appears in a declaration position (i.e. followed by `:`).
 *
 * @param {string} value       - The CSS value string to search.
 * @param {string} [prefix=''] - Optional prefix to filter variables (e.g., 'wpds-').
 */
function collectTokenOccurrences( value, prefix = '' ) {
	const regex = new RegExp(
		`(?:^|[^\\w])(var\\(\\s*)?(--${ prefix }[\\w-]+)`,
		'g'
	);
	const occurrences = [];

	let match;
	while ( ( match = regex.exec( value ) ) !== null ) {
		occurrences.push( {
			token: match[ 2 ],
			bare: ! match[ 1 ],
			declaration: /^\s*:/.test( value.slice( regex.lastIndex ) ),
		} );
	}

	return occurrences;
}

/**
 * Returns the static string value for a literal-like node, or `undefined`
 * when the node does not contain one.
 *
 * @param {import('estree').Literal | import('estree').TemplateElement} node
 * @return {string | undefined} The static string value, or `undefined`
 *                              when the node does not contain one.
 */
function getStaticNodeValue( node ) {
	if ( ! node.value ) {
		return;
	}

	if ( typeof node.value === 'string' ) {
		return node.value;
	}

	if ( typeof node.value === 'object' && 'raw' in node.value ) {
		return node.value.cooked ?? node.value.raw;
	}
}

module.exports = {
	DS_TOKEN_PREFIX,
	collectTokenOccurrences,
	getStaticNodeValue,
	wpdsTokensRegex,
};
