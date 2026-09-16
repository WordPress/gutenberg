const STYLESHEET_EXTENSIONS = /\.(?:css|scss|sass)$/i;
const MODULE_STYLESHEET_EXTENSIONS = /\.module\.(?:css|scss|sass)$/i;
const BUILD_STYLE_SEGMENT = /(^|\/)build-style\//;

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow side-effect imports of package build-style stylesheets from Storybook stories.',
			url: 'https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/no-storybook-build-style-imports.md',
		},
		schema: [],
		messages: {
			usePackageStylesMatcher:
				'Do not import package build-style stylesheets as a Vite side effect. Add a matcher in storybook/package-styles/config.js (and a *.lazy.scss wrapper if the package is missing), then drop this import.',
		},
	},
	create( context ) {
		function reportIfLeak( node, sourceValue ) {
			if ( typeof sourceValue !== 'string' ) {
				return;
			}

			if ( classifyBuildStyleImport( sourceValue ).status === 'leak' ) {
				context.report( {
					node,
					messageId: 'usePackageStylesMatcher',
				} );
			}
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
		};
	},
};

function classifyBuildStyleImport( sourceValue ) {
	const { pathname, queryKeys } = parseImportSource( sourceValue );

	if ( ! STYLESHEET_EXTENSIONS.test( pathname ) ) {
		return { status: 'not-this-rule' };
	}

	if ( MODULE_STYLESHEET_EXTENSIONS.test( pathname ) ) {
		return { status: 'not-this-rule' };
	}

	if ( ! BUILD_STYLE_SEGMENT.test( pathname ) ) {
		return { status: 'not-this-rule' };
	}

	if ( queryKeys.includes( 'inline' ) ) {
		return { status: 'allowed-query', pathname, query: 'inline' };
	}

	if ( queryKeys.includes( 'raw' ) ) {
		return { status: 'allowed-query', pathname, query: 'raw' };
	}

	return { status: 'leak', pathname };
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
