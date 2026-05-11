const { hasTruthyJsxAttribute } = require( '../utils' );

/**
 * Enforces that Button from @wordpress/components includes `accessibleWhenDisabled`
 * when `disabled` is set.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
	meta: {
		type: 'problem',
		schema: [
			{
				type: 'object',
				properties: {
					checkLocalImports: {
						type: 'boolean',
						description:
							'When true, also checks components imported from relative paths (for use inside @wordpress/components package).',
					},
				},
				additionalProperties: false,
			},
		],
		messages: {
			missingAccessibleWhenDisabled:
				'`disabled` used without the `accessibleWhenDisabled` prop. Disabling a control without maintaining focusability can cause accessibility issues, by hiding their presence from screen reader users, or preventing focus from returning to a trigger element. (Ignore this error if you truly mean to disable.)',
		},
	},
	create( context ) {
		const checkLocalImports =
			context.options[ 0 ]?.checkLocalImports ?? false;

		// Track local names of Button imported from @wordpress/components
		const wpComponentsButtons = new Set();

		/**
		 * Check if the import source should be tracked.
		 *
		 * @param {string} source - The import source path
		 * @return {boolean} Whether to track imports from this source
		 */
		function shouldTrackImportSource( source ) {
			if ( source === '@wordpress/components' ) {
				return true;
			}

			// When checkLocalImports is enabled, also track relative imports
			if ( checkLocalImports ) {
				return source.startsWith( '.' ) || source.startsWith( '/' );
			}

			return false;
		}

		return {
			ImportDeclaration( node ) {
				if ( ! shouldTrackImportSource( node.source.value ) ) {
					return;
				}

				node.specifiers.forEach( ( specifier ) => {
					if ( specifier.type !== 'ImportSpecifier' ) {
						return;
					}

					const importedName = specifier.imported.name;
					if ( importedName === 'Button' ) {
						// Track the local name (handles aliased imports)
						wpComponentsButtons.add( specifier.local.name );
					}
				} );

				// Also handle default imports when checking local imports
				// e.g., import Button from './button'
				if ( checkLocalImports ) {
					node.specifiers.forEach( ( specifier ) => {
						if ( specifier.type === 'ImportDefaultSpecifier' ) {
							const localName = specifier.local.name;
							// Check if the import path suggests it's a Button component
							const source = node.source.value;
							if (
								source.endsWith( '/button' ) ||
								source.endsWith( '/Button' )
							) {
								wpComponentsButtons.add( localName );
							}
						}
					} );
				}
			},

			JSXOpeningElement( node ) {
				// Only check simple JSX element names (not member expressions)
				if ( node.name.type !== 'JSXIdentifier' ) {
					return;
				}

				const elementName = node.name.name;

				// Only check if this is a Button from @wordpress/components
				if ( ! wpComponentsButtons.has( elementName ) ) {
					return;
				}

				if ( ! hasTruthyJsxAttribute( node.attributes, 'disabled' ) ) {
					return;
				}

				const hasAccessibleWhenDisabled = node.attributes.some(
					( attr ) =>
						attr.type === 'JSXAttribute' &&
						attr.name &&
						attr.name.name === 'accessibleWhenDisabled'
				);

				if ( ! hasAccessibleWhenDisabled ) {
					context.report( {
						node,
						messageId: 'missingAccessibleWhenDisabled',
					} );
				}
			},
		};
	},
};
