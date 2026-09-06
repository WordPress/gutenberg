const {
	DS_TOKEN_PREFIX,
	collectTokenOccurrences,
	getStaticNodeValue,
	wpdsTokensRegex,
} = require( '../utils/ds-token-utils' );

const wpdsDeclarationRegex = new RegExp(
	`(?:^|[^\\w])--${ DS_TOKEN_PREFIX }[\\w-]+\\s*:`,
	'i'
);
const dynamicDeclarationStartRegex = new RegExp(
	`--${ DS_TOKEN_PREFIX }[\\w-]*$`
);
const dynamicDeclarationEndRegex = /^[\w-]*\s*:/;

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
		const dynamicTemplateLiteralAST = `TemplateLiteral[expressions.length>0]:has(TemplateElement[value.raw=${ wpdsTokensRegex }])`;

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
				context.report( {
					node,
					messageId: 'disallowedSet',
				} );
			},
			/** @param {import('estree').TemplateLiteral} node */
			[ dynamicTemplateLiteralAST ]( node ) {
				for ( let index = 0; index < node.quasis.length; index++ ) {
					const quasi = node.quasis[ index ];
					const value = getStaticNodeValue( quasi );
					const nextValue = node.quasis[ index + 1 ]
						? getStaticNodeValue( node.quasis[ index + 1 ] )
						: undefined;

					if ( ! value ) {
						continue;
					}
					const hasStaticDeclaration = collectTokenOccurrences(
						value,
						DS_TOKEN_PREFIX
					).some( ( { declaration } ) => declaration );
					const hasSplitDeclaration =
						! quasi.tail &&
						dynamicDeclarationStartRegex.test( value ) &&
						nextValue &&
						dynamicDeclarationEndRegex.test( nextValue );

					if ( hasStaticDeclaration || hasSplitDeclaration ) {
						context.report( {
							node,
							messageId: 'disallowedSet',
						} );
						return;
					}
				}
			},
		};
	},
} );
