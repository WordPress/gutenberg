const {
	createPrivateApisState,
	trackPrivateApisSpecifier,
	isUnlockCall,
	getPropertyName,
	getUnlockDestructuring,
} = require( '../utils/private-apis' );

const THEME_PACKAGE = '@wordpress/theme';
const THEME_PROVIDER = 'ThemeProvider';

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow accessing ThemeProvider through @wordpress/theme private APIs.',
			url: 'https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/no-private-theme-provider.md',
		},
		schema: [],
		messages: {
			noPrivateThemeProvider:
				'Accessing `ThemeProvider` through `@wordpress/theme` private APIs is deprecated. Import `ThemeProvider` from `@wordpress/theme` instead.',
		},
	},
	create( context ) {
		const privateApisState = createPrivateApisState();

		function getUnlockSource( node ) {
			if ( ! isUnlockCall( node, context.sourceCode ) ) {
				return null;
			}

			const privateApisIdentifier = node.arguments[ 0 ];
			if ( privateApisIdentifier.type !== 'Identifier' ) {
				return null;
			}

			return (
				privateApisState.privateApisSources.get(
					privateApisIdentifier.name
				) || null
			);
		}

		return {
			/** @param {import('estree').ImportDeclaration} node */
			ImportDeclaration( node ) {
				if ( node.source.value !== THEME_PACKAGE ) {
					return;
				}

				node.specifiers.forEach( ( specifier ) => {
					if ( specifier.type !== 'ImportSpecifier' ) {
						return;
					}

					trackPrivateApisSpecifier(
						privateApisState,
						specifier,
						THEME_PACKAGE,
						true
					);
				} );
			},
			/** @param {import('estree').VariableDeclarator} node */
			VariableDeclarator( node ) {
				const unlockDestructuring = getUnlockDestructuring(
					node,
					context.sourceCode,
					privateApisState
				);
				if (
					! unlockDestructuring ||
					unlockDestructuring.source !== THEME_PACKAGE
				) {
					return;
				}

				unlockDestructuring.properties.forEach( ( property ) => {
					if ( getPropertyName( property.key ) !== THEME_PROVIDER ) {
						return;
					}

					context.report( {
						node: property.key,
						messageId: 'noPrivateThemeProvider',
					} );
				} );
			},
			/** @param {import('estree').MemberExpression} node */
			MemberExpression( node ) {
				if (
					getPropertyName( node.property ) !== THEME_PROVIDER ||
					getUnlockSource( node.object ) !== THEME_PACKAGE
				) {
					return;
				}

				context.report( {
					node: node.property,
					messageId: 'noPrivateThemeProvider',
				} );
			},
		};
	},
};
