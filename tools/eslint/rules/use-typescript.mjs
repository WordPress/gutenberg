/**
 * Reports every JavaScript file it runs on. The config scopes it to the
 * trees where new files must be TypeScript, so only new files fail: the
 * existing ones stay in suppressions.json until they are converted.
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Require new files to be TypeScript.',
		},
		schema: [],
		messages: {
			useTypeScript:
				'New files in this package must be TypeScript: use .ts, .tsx, .mts or .cts.',
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
