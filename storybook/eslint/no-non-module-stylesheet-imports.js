const STYLESHEET_EXTENSIONS = /\.(?:css|scss|sass)$/i;
const MODULE_STYLESHEET_EXTENSIONS = /\.module\.(?:css|scss|sass)$/i;
const BUILD_STYLE_SEGMENT = /(^|\/)build-style\//;
const NON_INJECTING_QUERIES = [ 'inline', 'raw', 'url' ];

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow Storybook imports of non-module stylesheets that inject into the preview document.',
			url: 'https://github.com/WordPress/gutenberg/blob/HEAD/storybook/eslint/no-non-module-stylesheet-imports.md',
		},
		schema: [],
		messages: {
			usePackageStylesMatcher:
				'Do not import package build-style stylesheets as a Vite side effect. Add a matcher in storybook/package-styles/config.js (and a *.lazy.scss wrapper if the package is missing), then drop this import.',
			useCssModule:
				'Import story styles as a CSS module so they do not leak across stories. If this is a package stylesheet, load it through storybook/package-styles/config.js instead.',
		},
	},
	create( context ) {
		function reportIfLeak( node, sourceValue ) {
			if ( typeof sourceValue !== 'string' ) {
				return;
			}

			const messageId = getLeakMessageId( sourceValue );
			if ( ! messageId ) {
				return;
			}

			context.report( {
				node,
				messageId,
			} );
		}

		function reportExportedModule( node ) {
			if ( ! node.source || node.exportKind === 'type' ) {
				return;
			}

			reportIfLeak( node, node.source.value );
		}

		return {
			ImportDeclaration( node ) {
				if ( node.importKind === 'type' ) {
					return;
				}

				reportIfLeak( node, node.source.value );
			},
			ImportExpression( node ) {
				reportIfLeak( node, getStaticModuleSpecifier( node.source ) );
			},
			ExportNamedDeclaration( node ) {
				reportExportedModule( node );
			},
			ExportAllDeclaration( node ) {
				reportExportedModule( node );
			},
		};
	},
};

function getLeakMessageId( sourceValue ) {
	const { pathname, queryKeys } = parseImportSource( sourceValue );

	if ( ! STYLESHEET_EXTENSIONS.test( pathname ) ) {
		return null;
	}

	if ( MODULE_STYLESHEET_EXTENSIONS.test( pathname ) ) {
		return null;
	}

	if (
		NON_INJECTING_QUERIES.some( ( query ) => queryKeys.includes( query ) )
	) {
		return null;
	}

	if ( BUILD_STYLE_SEGMENT.test( pathname ) ) {
		return 'usePackageStylesMatcher';
	}

	return 'useCssModule';
}

function getStaticModuleSpecifier( sourceNode ) {
	if ( sourceNode.type === 'Literal' ) {
		return sourceNode.value;
	}

	if (
		sourceNode.type === 'TemplateLiteral' &&
		sourceNode.expressions.length === 0
	) {
		return sourceNode.quasis[ 0 ]?.value.cooked;
	}

	return undefined;
}

function parseImportSource( sourceValue ) {
	const withoutHash = sourceValue.split( '#' )[ 0 ];
	const questionIndex = withoutHash.indexOf( '?' );
	const rawPathname =
		questionIndex === -1
			? withoutHash
			: withoutHash.slice( 0, questionIndex );
	const pathname = rawPathname.replaceAll( '\\', '/' );

	if ( questionIndex === -1 ) {
		return { pathname, queryKeys: [] };
	}

	const search = withoutHash.slice( questionIndex + 1 );
	const queryKeys = search
		.split( '&' )
		.map( ( pair ) => pair.split( '=' )[ 0 ] )
		.filter( Boolean );

	return { pathname, queryKeys };
}
