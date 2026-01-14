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
 *
 * Supports both simple components ('Button') and compound components
 * ('CircularOptionPicker.Option').
 */
const COMPONENTS_REQUIRING_40PX = [
	'BorderBoxControl',
	'BorderControl',
	'BoxControl',
	'Button',
	'ClipboardButton',
	'ComboboxControl',
	'CustomSelectControl',
	'FontAppearanceControl',
	'FontFamilyControl',
	'FontSizePicker',
	'FormTokenField',
	'IconButton',
	'InputControl',
	'LetterSpacingControl',
	'LineHeightControl',
	'NumberControl',
	'Radio',
	'RangeControl',
	'SelectControl',
	'TextControl',
	'TreeSelect',
	'ToggleGroupControl',
	'UnitControl',
];

/**
 * Components that can use the `render` prop as an alternative to __next40pxDefaultSize.
 */
const COMPONENTS_WITH_RENDER_EXEMPTION = [ 'FormFileUpload' ];

/**
 * Parse component entries into simple and compound components.
 *
 * @param {string[]} components - Array of component names (e.g., ['Button', 'CircularOptionPicker.Option'])
 * @return {{ simple: Set<string>, compound: Map<string, Set<string>> }}
 *         - simple: Set of simple component names
 *         - compound: Map of namespace -> Set of member names
 */
function parseComponentList( components ) {
	const simple = new Set();
	const compound = new Map();

	for ( const component of components ) {
		if ( component.includes( '.' ) ) {
			const [ namespace, member ] = component.split( '.' );
			if ( ! compound.has( namespace ) ) {
				compound.set( namespace, new Set() );
			}
			compound.get( namespace ).add( member );
		} else {
			simple.add( component );
		}
	}

	return { simple, compound };
}

// Parse component lists at module load time
const { simple: SIMPLE_COMPONENTS, compound: COMPOUND_COMPONENTS } =
	parseComponentList( COMPONENTS_REQUIRING_40PX );

const { simple: SIMPLE_RENDER_EXEMPTION, compound: COMPOUND_RENDER_EXEMPTION } =
	parseComponentList( COMPONENTS_WITH_RENDER_EXEMPTION );

/**
 * All simple tracked component names (for path-based detection).
 */
const ALL_SIMPLE_COMPONENTS = new Set( [
	...SIMPLE_COMPONENTS,
	...SIMPLE_RENDER_EXEMPTION,
] );

/**
 * All namespace names that have compound components.
 */
const ALL_NAMESPACES = new Set( [
	...COMPOUND_COMPONENTS.keys(),
	...COMPOUND_RENDER_EXEMPTION.keys(),
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

		// Track local names of simple components: localName -> importedName
		const trackedSimpleImports = new Map();

		// Track local names of namespaces (for compound components): localName -> importedNamespace
		const trackedNamespaceImports = new Map();

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

			// Check if it's one of our tracked simple components
			if ( ALL_SIMPLE_COMPONENTS.has( pascalCase ) ) {
				return pascalCase;
			}

			// Check if it's a tracked namespace
			if ( ALL_NAMESPACES.has( pascalCase ) ) {
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

		/**
		 * Check if a component has a render exemption.
		 *
		 * @param {string}      importedName - The original imported component name
		 * @param {string|null} memberName   - The member name for compound components, or null
		 * @return {boolean} Whether this component has a render exemption
		 */
		function hasRenderExemption( importedName, memberName ) {
			if ( memberName ) {
				// Compound component: check if namespace.member has exemption
				const members = COMPOUND_RENDER_EXEMPTION.get( importedName );
				return members?.has( memberName ) ?? false;
			}
			// Simple component
			return SIMPLE_RENDER_EXEMPTION.has( importedName );
		}

		/**
		 * Check if the `variant` prop has the value "link".
		 * Button with variant="link" doesn't need __next40pxDefaultSize.
		 *
		 * @param {Array} attributes - JSX attributes array
		 * @return {boolean} Whether variant is "link"
		 */
		function hasLinkVariant( attributes ) {
			const variantAttr = attributes.find(
				( a ) =>
					a.type === 'JSXAttribute' &&
					a.name &&
					a.name.name === 'variant'
			);

			if ( ! variantAttr ) {
				return false;
			}

			// String value like `variant="link"`
			if (
				variantAttr.value &&
				variantAttr.value.type === 'Literal' &&
				variantAttr.value.value === 'link'
			) {
				return true;
			}

			return false;
		}

		/**
		 * Report the missing prop error.
		 *
		 * @param {Object}      node         - The AST node
		 * @param {string}      importedName - The original imported component name
		 * @param {string|null} memberName   - The member name for compound components, or null
		 * @param {Array}       attributes   - JSX attributes array
		 */
		function reportIfMissing( node, importedName, memberName, attributes ) {
			// Check if __next40pxDefaultSize has a truthy value
			if (
				hasTruthyJsxAttribute( attributes, '__next40pxDefaultSize' )
			) {
				return;
			}

			const fullComponentName = memberName
				? `${ importedName }.${ memberName }`
				: importedName;

			// Handle render exemption (like FormFileUpload)
			if ( hasRenderExemption( importedName, memberName ) ) {
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

			// Button with variant="link" doesn't need __next40pxDefaultSize
			if ( importedName === 'Button' && hasLinkVariant( attributes ) ) {
				return;
			}

			context.report( {
				node,
				messageId: 'missingProp',
				data: {
					component: fullComponentName,
				},
			} );
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

					// Track simple components
					if (
						SIMPLE_COMPONENTS.has( importedName ) ||
						SIMPLE_RENDER_EXEMPTION.has( importedName )
					) {
						trackedSimpleImports.set( localName, importedName );
					}

					// Track namespaces for compound components
					if ( ALL_NAMESPACES.has( importedName ) ) {
						trackedNamespaceImports.set( localName, importedName );
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
								if (
									ALL_SIMPLE_COMPONENTS.has( inferredName )
								) {
									trackedSimpleImports.set(
										localName,
										inferredName
									);
								}
								if ( ALL_NAMESPACES.has( inferredName ) ) {
									trackedNamespaceImports.set(
										localName,
										inferredName
									);
								}
								return;
							}

							// Support patterns like `import Button from '.';`
							// (common in component folder index files).
							// If the local name matches a tracked component, treat it as such.
							if ( ALL_SIMPLE_COMPONENTS.has( localName ) ) {
								trackedSimpleImports.set(
									localName,
									localName
								);
							}
							if ( ALL_NAMESPACES.has( localName ) ) {
								trackedNamespaceImports.set(
									localName,
									localName
								);
							}
						}
					} );
				}
			},

			JSXOpeningElement( node ) {
				const attributes = node.attributes;

				// Handle simple components: <Button />
				if ( node.name.type === 'JSXIdentifier' ) {
					const elementName = node.name.name;
					const importedName =
						trackedSimpleImports.get( elementName );

					if ( importedName ) {
						reportIfMissing( node, importedName, null, attributes );
					}
					return;
				}

				// Handle compound components: <CircularOptionPicker.Option />
				if ( node.name.type === 'JSXMemberExpression' ) {
					// Only handle single-level member expressions (Namespace.Member)
					if ( node.name.object.type !== 'JSXIdentifier' ) {
						return;
					}

					const objectName = node.name.object.name;
					const memberName = node.name.property.name;

					const importedNamespace =
						trackedNamespaceImports.get( objectName );

					if ( ! importedNamespace ) {
						return;
					}

					// Check if this namespace.member combination is tracked
					const trackedMembers =
						COMPOUND_COMPONENTS.get( importedNamespace ) ||
						COMPOUND_RENDER_EXEMPTION.get( importedNamespace );

					if ( ! trackedMembers?.has( memberName ) ) {
						return;
					}

					reportIfMissing(
						node,
						importedNamespace,
						memberName,
						attributes
					);
				}
			},
		};
	},
};
