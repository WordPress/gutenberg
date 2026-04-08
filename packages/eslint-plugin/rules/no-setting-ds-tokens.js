const DS_TOKEN_PREFIX = 'wpds-';
const wpdsDeclarationRegex = new RegExp(
	`(?:^|[^\\w])--${ DS_TOKEN_PREFIX }[\\w-]+\\s*:`,
	'i'
);

/**
 * @param {import('estree').Literal | import('estree').TemplateElement} node
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
				'Do not set CSS custom properties using the Design System tokens namespace (i.e. beginning with --wpds-*). Use `ThemeProvider` from `@wordpress/theme` instead.',
		},
	},
	create( context ) {
		const staticDeclarationAST = `:matches(Literal[value=${ wpdsDeclarationRegex }], TemplateLiteral[expressions.length=0] TemplateElement[value.raw=${ wpdsDeclarationRegex }])`;

		return {
			/** @param {import('estree').Property} node */
			'ObjectExpression > Property[key.value=/^--wpds-/]'( node ) {
				context.report( {
					node: node.key,
					messageId: 'disallowedSet',
				} );
			},
			/** @param {import('estree').Literal | import('estree').TemplateElement} node */
			[ staticDeclarationAST ]( node ) {
				const computedValue = getStaticNodeValue( node );

				if (
					computedValue &&
					wpdsDeclarationRegex.test( computedValue )
				) {
					context.report( {
						node,
						messageId: 'disallowedSet',
					} );
				}
			},
		};
	},
} );
