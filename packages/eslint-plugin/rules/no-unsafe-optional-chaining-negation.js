module.exports = /** @type {import('eslint').Rule.RuleModule} */ ( {
	meta: {
		type: 'problem',
		messages: {
			unsafeNegation:
				'Avoid unsafe negation of optional chaining expression',
		},
	},
	create( context ) {
		/**
		 * Map of UnaryExpression nodes skip for consideration, in case of a
		 * double-negation.
		 *
		 * @type {WeakMap<import('estree').UnaryExpression,boolean>}
		 */
		const skippedNodes = new WeakMap();

		return {
			/**
			 * @param {import('estree').UnaryExpression} node Matched node.
			 */
			UnaryExpression( node ) {
				if ( node.operator !== '!' || skippedNodes.has( node ) ) {
					return;
				}

				switch ( node.argument.type ) {
					// Ignore reason: Technically it's not a valid ESTree node,
					// since it's a result from `babel-eslint` parse including
					// newer language feature support.
					// @ts-ignore
					case 'OptionalMemberExpression':
						context.report( { node, messageId: 'unsafeNegation' } );
						break;

					case 'UnaryExpression':
						if ( node.argument.operator === '!' ) {
							skippedNodes.set( node.argument, true );
						}
						break;
				}
			},
		};
	},
} );
