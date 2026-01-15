const { hasTruthyJsxAttribute } = require( '../utils' );

/**
 * Enforces that specific components from @wordpress/components include the
 * `__next40pxDefaultSize` prop.
 *
 * @type {import('eslint').Rule.RuleModule}
 */

/**
 * Components that require the __next40pxDefaultSize prop.
 * These can be exempted if they have a non-default `size` prop.
 */
const COMPONENTS_REQUIRING_40PX = new Set( [
	'BorderBoxControl',
	'BorderControl',
	'BoxControl',
	'Button',
	'ComboboxControl',
	'CustomSelectControl',
	'FontAppearanceControl',
	'FontFamilyControl',
	'FontSizePicker',
	'FormTokenField',
	'InputControl',
	'LetterSpacingControl',
	'LineHeightControl',
	'NumberControl',
	'RangeControl',
	'SelectControl',
	'TextControl',
	'ToggleGroupControl',
	'UnitControl',
] );

/**
 * Components that can use the `render` prop as an alternative to __next40pxDefaultSize.
 */
const COMPONENTS_WITH_RENDER_EXEMPTION = new Set( [ 'FormFileUpload' ] );

/**
 * All tracked component names for path-based detection.
 */
const ALL_TRACKED_COMPONENTS = new Set( [
	...COMPONENTS_REQUIRING_40PX,
	...COMPONENTS_WITH_RENDER_EXEMPTION,
] );

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
			missingProp:
				'{{ component }} should have the `__next40pxDefaultSize` prop when using the default size.',
			missingPropFormFileUpload:
				'FormFileUpload should have the `__next40pxDefaultSize` prop to opt-in to the new default size.',
		},
	},
	create( context ) {
		const checkLocalImports =
			context.options[ 0 ]?.checkLocalImports ?? false;

		// Track local names of components imported from @wordpress/components
		// Map: localName -> importedName
		const trackedImports = new Map();

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

		/**
		 * Try to infer component name from import path.
		 * e.g., '../button' -> 'Button', '../input-control' -> 'InputControl'
		 *
		 * @param {string} source - The import source path
		 * @return {string|null} The inferred component name or null
		 */
		function inferComponentNameFromPath( source ) {
			// Get the last segment of the path
			const lastSegment = source.split( '/' ).pop();
			if ( ! lastSegment ) {
				return null;
			}

			// Convert kebab-case to PascalCase
			const pascalCase = lastSegment
				.split( '-' )
				.map(
					( part ) => part.charAt( 0 ).toUpperCase() + part.slice( 1 )
				)
				.join( '' );

			// Check if it's one of our tracked components
			if ( ALL_TRACKED_COMPONENTS.has( pascalCase ) ) {
				return pascalCase;
			}

			return null;
		}

		/**
		 * Check if the `size` prop has a non-default value.
		 *
		 * @param {Array} attributes - JSX attributes array
		 * @return {boolean} Whether size has a non-default value
		 */
		function hasNonDefaultSize( attributes ) {
			const sizeAttr = attributes.find(
				( a ) =>
					a.type === 'JSXAttribute' &&
					a.name &&
					a.name.name === 'size'
			);

			if ( ! sizeAttr ) {
				return false;
			}

			// String value like `size="small"` or `size="compact"`
			if (
				sizeAttr.value &&
				sizeAttr.value.type === 'Literal' &&
				typeof sizeAttr.value.value === 'string'
			) {
				return sizeAttr.value.value !== 'default';
			}

			// Expression - could be non-default, so don't report
			if (
				sizeAttr.value &&
				sizeAttr.value.type === 'JSXExpressionContainer'
			) {
				return true;
			}

			return false;
		}

		/**
		 * Check if the `render` prop exists.
		 *
		 * @param {Array} attributes - JSX attributes array
		 * @return {boolean} Whether render prop exists
		 */
		function hasRenderProp( attributes ) {
			return attributes.some(
				( a ) =>
					a.type === 'JSXAttribute' &&
					a.name &&
					a.name.name === 'render'
			);
		}

		return {
			ImportDeclaration( node ) {
				const source = node.source.value;

				if ( ! shouldTrackImportSource( source ) ) {
					return;
				}

				// Handle named imports
				node.specifiers.forEach( ( specifier ) => {
					if ( specifier.type !== 'ImportSpecifier' ) {
						return;
					}

					const importedName = specifier.imported.name;
					const localName = specifier.local.name;

					// Track components that require the prop
					if (
						COMPONENTS_REQUIRING_40PX.has( importedName ) ||
						COMPONENTS_WITH_RENDER_EXEMPTION.has( importedName )
					) {
						trackedImports.set( localName, importedName );
					}
				} );

				// Handle default imports when checking local imports
				// e.g., import InputControl from '../input-control'
				if ( checkLocalImports ) {
					node.specifiers.forEach( ( specifier ) => {
						if ( specifier.type === 'ImportDefaultSpecifier' ) {
							const localName = specifier.local.name;
							const inferredName =
								inferComponentNameFromPath( source );
							if ( inferredName ) {
								trackedImports.set( localName, inferredName );
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
				const importedName = trackedImports.get( elementName );

				// Only check if this is a tracked component from @wordpress/components
				if ( ! importedName ) {
					return;
				}

				const attributes = node.attributes;

				// Check if __next40pxDefaultSize has a truthy value
				if (
					hasTruthyJsxAttribute( attributes, '__next40pxDefaultSize' )
				) {
					return;
				}

				// Handle FormFileUpload special case
				if ( COMPONENTS_WITH_RENDER_EXEMPTION.has( importedName ) ) {
					// FormFileUpload is valid if it has a `render` prop
					if ( hasRenderProp( attributes ) ) {
						return;
					}

					context.report( {
						node,
						messageId: 'missingPropFormFileUpload',
					} );
					return;
				}

				// For other components, check if size prop has a non-default value
				if ( hasNonDefaultSize( attributes ) ) {
					return;
				}

				context.report( {
					node,
					messageId: 'missingProp',
					data: {
						component: importedName,
					},
				} );
			},
		};
	},
};
