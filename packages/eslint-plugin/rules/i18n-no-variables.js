/**
 * Internal dependencies
 */
const { TRANSLATION_FUNCTIONS } = require( '../utils' );

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			invalidArgument:
				'Translate function arguments must be string literals.',
		},
		fixable: 'code',
	},
	create( context ) {
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

		return {
			CallExpression( node ) {
				const { callee, arguments: args } = node;

				const functionName =
					callee.property && callee.property.name
						? callee.property.name
						: callee.name;

				if ( ! TRANSLATION_FUNCTIONS.includes( functionName ) ) {
					return;
				}

				const functionArgs = [ args[ 0 ] ];

				if ( [ '_n', '_nx', '_x' ].includes( functionName ) ) {
					functionArgs.push( args[ 1 ] );
				}

				if ( [ '_nx' ].includes( functionName ) ) {
					functionArgs.push( args[ 3 ] );
				}

				for ( const arg of functionArgs ) {
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
