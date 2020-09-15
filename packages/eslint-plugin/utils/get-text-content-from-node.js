/**
 * Returns the actual text content from an argument passed to a translation function.
 *
 * @see eslint-plugin-wpcalypso
 *
 * @param {Object} node A Literal, TemplateLiteral or BinaryExpression (+) node
 * @return {string|boolean} The concatenated string or false.
 */
function getTextContentFromNode( node ) {
	if ( 'Literal' === node.type ) {
		return node.value;
	}

	if ( 'BinaryExpression' === node.type && '+' === node.operator ) {
		const left = getTextContentFromNode( node.left );
		const right = getTextContentFromNode( node.right );

		if ( left === false || right === false ) {
			return false;
		}

		return left + right;
	}

	if ( node.type === 'TemplateLiteral' ) {
		return node.quasis.map( ( quasis ) => quasis.value.raw ).join( '' );
	}

	return false;
}

module.exports = {
	getTextContentFromNode,
};
