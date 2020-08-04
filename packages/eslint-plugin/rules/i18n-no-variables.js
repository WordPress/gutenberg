/**
 * Internal dependencies
 */
const {
	TRANSLATION_FUNCTIONS,
	getTranslateFunctionName,
	getTranslateFunctionArgs,
} = require( '../utils' );

function isAcceptableLiteralNode( node ) {
	if ( 'BinaryExpression' === node.type ) {
		return (
			'+' === node.operator &&
			isAcceptableLiteralNode( node.left ) &&
			isAcceptableLiteralNode( node.right )
		);
	}

	if ( 'TemplateLiteral' === node.type ) {
		// Backticks are fine, but if there's any interpolation in it,
		// that's a problem
		return node.expressions.length === 0;
	}

	return 'Literal' === node.type;
}

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			invalidArgument:
				'Translate function arguments must be string literals.',
		},
	},
	create( context ) {
		return {
			CallExpression( node ) {
				const { callee, arguments: args } = node;

				const functionName = getTranslateFunctionName( callee );

				if ( ! TRANSLATION_FUNCTIONS.has( functionName ) ) {
					return;
				}

				const candidates = getTranslateFunctionArgs(
					functionName,
					args
				);

				for ( const arg of candidates ) {
					if ( isAcceptableLiteralNode( arg ) ) {
						continue;
					}

					context.report( {
						node,
						messageId: 'invalidArgument',
					} );
				}
			},
		};
	},
};
