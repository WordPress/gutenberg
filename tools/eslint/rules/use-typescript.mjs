/**
 * Reports every JavaScript file it runs on. The config scopes it to the
 * packages that are TypeScript only, so only new files fail: the existing
 * ones stay in suppressions.json until they are converted.
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Require TypeScript files in packages that are TypeScript only.',
		},
		schema: [],
		messages: {
			useTypeScript:
				'This package is TypeScript only. Create the file as .ts or .tsx instead.',
		},
	},
	create( context ) {
		return {
			Program( node ) {
				context.report( { node, messageId: 'useTypeScript' } );
			},
		};
	},
};
