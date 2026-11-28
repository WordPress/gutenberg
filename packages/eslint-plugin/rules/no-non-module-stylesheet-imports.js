const STYLESHEET_EXTENSIONS = /\.(?:css|scss|sass)$/i;
const MODULE_STYLESHEET_EXTENSIONS = /\.module\.(?:css|scss|sass)$/i;

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow importing non-module stylesheets from JavaScript files.',
			url: 'https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/no-non-module-stylesheet-imports.md',
		},
		schema: [],
		messages: {
			noNonModuleStylesheet:
				'Import non-module stylesheets through the package stylesheet entry point instead of JavaScript. If you want to import from JavaScript, use a CSS module.',
		},
	},
	create( context ) {
		return {
			ImportDeclaration( node ) {
				if ( typeof node.source.value !== 'string' ) {
					return;
				}

				const importPath = stripQueryAndHash( node.source.value );
				if ( ! STYLESHEET_EXTENSIONS.test( importPath ) ) {
					return;
				}

				if ( MODULE_STYLESHEET_EXTENSIONS.test( importPath ) ) {
					return;
				}

				context.report( {
					node,
					messageId: 'noNonModuleStylesheet',
				} );
			},
		};
	},
};

/**
 * @param {string} importPath Import source path.
 * @return {string} Import source path without query or hash suffixes.
 */
function stripQueryAndHash( importPath ) {
	return importPath.replace( /[?#].*$/, '' );
}
