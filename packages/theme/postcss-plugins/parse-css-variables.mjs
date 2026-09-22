import valueParser from 'postcss-value-parser';

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

		if (
			nameNode?.type !== 'word' ||
			! nameNode.value.startsWith( '--' )
		) {
			return;
		}

		references.push( {
			name: nameNode.value,
			fallbackSeparator: node.nodes.find( isFallbackSeparator ),
			node,
		} );
	} );

	return { parsed, references };
}
