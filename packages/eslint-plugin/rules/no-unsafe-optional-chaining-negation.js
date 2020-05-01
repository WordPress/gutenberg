module.exports = /** @type {import('eslint').Rule.RuleModule} */ ( {
	meta: {
		type: 'problem',
		messages: {
			unsafeNegation:
				'Avoid unsafe negation of optional chaining expression',
		},
	},
	create( context ) {
		return {
			/**
			 * @param {import('estree').UnaryExpression} node Matched node.
			 */
			UnaryExpression( node ) {
				if (
					node.operator === '!' &&
					// Ignore reason: Technically it's not a valid ESTree node,
					// since it's a result from `babel-eslint` parse including
					// newer language feature support.
					// @ts-ignore
					node.argument.type === 'OptionalMemberExpression'
				) {
					context.report( { node, messageId: 'unsafeNegation' } );
				}
			},
		};
	},
} );
