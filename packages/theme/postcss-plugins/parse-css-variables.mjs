import valueParser from 'postcss-value-parser';

/**
 * Decode CSS escapes without changing the source nodes used for serialization.
 *
 * @param {string} identifier A CSS identifier's source spelling.
 * @return {string} The decoded identifier.
 */
function decodeIdentifier( identifier ) {
	return identifier.replace(
		/\\(?:([\da-f]{1,6})(?:\r\n|[ \t\n\r\f])?|([^\n\r\f]))/gi,
		( match, hex, character ) => {
			if ( ! hex ) {
				return character;
			}
			const codePoint = parseInt( hex, 16 );
			return codePoint === 0 ||
				codePoint > 0x10ffff ||
				( codePoint >= 0xd800 && codePoint <= 0xdfff )
				? '\uFFFD'
				: String.fromCodePoint( codePoint );
		}
	);
}

/**
 * @param {import('postcss-value-parser').Node} node A parsed value node.
 * @return {node is import('postcss-value-parser').DivNode} Whether the node separates a fallback value.
 */
function isFallbackSeparator( node ) {
	return node.type === 'div' && node.value === ',';
}

/**
 * Parse the custom property references in CSS `var()` functions.
 *
 * String, URL, and comment contents are not treated as CSS functions.
 *
 * @param {string} value A CSS declaration value.
 * @return {{ parsed: import('postcss-value-parser').ParsedValue, references: Array<{ name: string, fallbackSeparator: import('postcss-value-parser').DivNode | undefined, node: import('postcss-value-parser').FunctionNode }> }} The parsed value and its custom property references.
 */
export function parseCSSVariableReferences( value ) {
	const parsed = valueParser( value );
	/** @type {Array<{ name: string, fallbackSeparator: import('postcss-value-parser').DivNode | undefined, node: import('postcss-value-parser').FunctionNode }>} */
	const references = [];

	parsed.walk( ( node ) => {
		if ( node.type !== 'function' || node.value !== 'var' ) {
			return;
		}

		const nameNode = node.nodes.find(
			( child ) => child.type !== 'space' && child.type !== 'comment'
		);

		if ( nameNode?.type !== 'word' ) {
			return;
		}

		// A hexadecimal escape's terminating whitespace can split an identifier
		// across value-parser nodes. Read the whole identifier from its source.
		const spelling = value
			.slice( nameNode.sourceIndex )
			.match(
				/^(?:[\w\u0080-\uFFFF-]|\\(?:[\da-f]{1,6}(?:\r\n|[ \t\n\r\f])?|[^\n\r\f]))+/i
			)?.[ 0 ];
		const name = decodeIdentifier( spelling ?? '' );
		if ( ! name.startsWith( '--' ) ) {
			return;
		}

		references.push( {
			name,
			fallbackSeparator: node.nodes.find( isFallbackSeparator ),
			node,
		} );
	} );

	return { parsed, references };
}
