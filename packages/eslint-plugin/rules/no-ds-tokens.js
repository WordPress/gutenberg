const DS_TOKEN_PREFIX = 'wpds-';

const wpdsTokensRegex = new RegExp( `(?:^|[^\\w])--${ DS_TOKEN_PREFIX }`, 'i' );

module.exports = /** @type {import('eslint').Rule.RuleModule} */ ( {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow any usage of --wpds-* CSS custom properties',
		},
		schema: [],
		messages: {
			disallowed:
				'Design System tokens (--wpds-*) should not be used in this context.',
		},
	},
	create( context ) {
		const selector = `:matches(Literal[value=${ wpdsTokensRegex }], TemplateLiteral TemplateElement[value.raw=${ wpdsTokensRegex }])`;
		return {
			/** @param {import('estree').Literal | import('estree').TemplateElement} node */
			[ selector ]( node ) {
				context.report( {
					node,
					messageId: 'disallowed',
				} );
			},
		};
	},
} );
