const PATTERN = /--wp-components-color-/;

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow `--wp-components-color-*` variables outside the packages that own them.',
		},
		schema: [],
		messages: {
			noComponentsColorVariables:
				'`--wp-components-color-*` variables will be removed. Use semantic WPDS design tokens (`--wpds-*`) instead, and `ThemeProvider` from `@wordpress/theme` to customize colors.',
		},
	},
	create( context ) {
		function check( node, value ) {
			if ( typeof value === 'string' && PATTERN.test( value ) ) {
				context.report( {
					node,
					messageId: 'noComponentsColorVariables',
				} );
			}
		}

		return {
			Literal( node ) {
				check( node, node.value );
			},
			TemplateElement( node ) {
				check( node, node.value.cooked );
			},
		};
	},
};
