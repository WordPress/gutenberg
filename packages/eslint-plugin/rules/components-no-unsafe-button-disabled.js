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
		 * Check if an attribute exists and has a truthy value.
		 *
		 * @param {Array}  attributes - JSX attributes array
		 * @param {string} attrName   - Attribute name to check
		 * @return {boolean} Whether the attribute has a truthy value
		 */
		function hasTruthyAttribute( attributes, attrName ) {
			const attr = attributes.find(
				( a ) =>
					a.type === 'JSXAttribute' &&
					a.name &&
					a.name.name === attrName
			);

			if ( ! attr ) {
				return false;
			}

			// Boolean attribute without value (e.g., `disabled`)
			if ( attr.value === null ) {
				return true;
			}

			// Expression like `disabled={true}` or `disabled={false}`
			if (
				attr.value.type === 'JSXExpressionContainer' &&
				attr.value.expression.type === 'Literal'
			) {
				return attr.value.expression.value !== false;
			}

			// String value - truthy if not empty
			if ( attr.value.type === 'Literal' ) {
				return Boolean( attr.value.value );
			}

			// For any other expression (variables, etc.), assume it could be truthy
			return true;
		}

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

				if ( ! hasTruthyAttribute( node.attributes, 'disabled' ) ) {
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
