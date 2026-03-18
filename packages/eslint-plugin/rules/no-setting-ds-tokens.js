module.exports = /** @type {import('eslint').Rule.RuleModule} */ ( {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow setting any CSS custom property beginning with --wpds-',
		},
		schema: [],
		messages: {
			disallowedSet:
				'Do not set CSS custom properties using the Design System tokens namespace (i.e. beginning with --wpds-*).',
		},
	},
	create( context ) {
		return {
			/** @param {import('estree').Property} node */
			'ObjectExpression > Property[key.value=/^--wpds-/]'( node ) {
				context.report( {
					node: node.key,
					messageId: 'disallowedSet',
				} );
			},
		};
	},
} );
