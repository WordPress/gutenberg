/**
 * Components tracked by this rule.
 *
 * @type {Set<string>}
 */
const TRACKED_COMPONENTS = new Set( [ 'Link', 'Text', 'VisuallyHidden' ] );

/**
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Prevent render-prop composition orders that silently remove semantics.',
			url: 'https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/no-unsafe-render-order.md',
		},
		schema: [
			{
				type: 'object',
				properties: {
					checkLocalImports: {
						type: 'boolean',
						description:
							'When true, also checks tracked components imported from relative paths.',
					},
				},
				additionalProperties: false,
			},
		],
		messages: {
			visuallyHiddenOrder:
				'Do not pass `VisuallyHidden` via `render`. Make `VisuallyHidden` the outer component instead.',
			linkTextOrder:
				'Use `Text` as the outer component and pass `Link` via `render` so the resulting element stays an `<a>`.',
		},
	},

	create( context ) {
		const checkLocalImports =
			context.options[ 0 ]?.checkLocalImports ?? false;
		const trackedImports = new Map();

		/**
		 * @param {string} source
		 * @return {boolean} Whether the import should be tracked.
		 */
		function shouldTrackImportSource( source ) {
			if ( source === '@wordpress/ui' ) {
				return true;
			}

			if ( checkLocalImports ) {
				return source.startsWith( '.' ) || source.startsWith( '/' );
			}

			return false;
		}

		/**
		 * @param {import('estree-jsx').JSXIdentifier|import('estree-jsx').JSXMemberExpression} node
		 * @return {string|null} Tracked component name or null.
		 */
		function resolveTrackedJsxName( node ) {
			if ( node.type !== 'JSXIdentifier' ) {
				return null;
			}

			return trackedImports.get( node.name ) ?? null;
		}

		/**
		 * @param {Array}  attributes    JSX attributes to inspect.
		 * @param {string} attributeName Attribute name to match.
		 * @return {import('estree-jsx').JSXAttribute|undefined} Matching attribute.
		 */
		function getJsxAttribute( attributes, attributeName ) {
			return attributes.find(
				( attribute ) =>
					attribute.type === 'JSXAttribute' &&
					attribute.name?.name === attributeName
			);
		}

		/**
		 * @param {Array} attributes
		 * @return {string|null} Resolved JSX name inside `render={ <... /> }`.
		 */
		function getRenderedComponentName( attributes ) {
			const renderAttribute = getJsxAttribute( attributes, 'render' );

			if (
				! renderAttribute?.value ||
				renderAttribute.value.type !== 'JSXExpressionContainer' ||
				renderAttribute.value.expression.type !== 'JSXElement'
			) {
				return null;
			}

			return resolveTrackedJsxName(
				renderAttribute.value.expression.openingElement.name
			);
		}

		return {
			ImportDeclaration( node ) {
				const source = node.source.value;

				if (
					typeof source !== 'string' ||
					! shouldTrackImportSource( source )
				) {
					return;
				}

				node.specifiers.forEach( ( specifier ) => {
					if ( specifier.type === 'ImportSpecifier' ) {
						const importedName = specifier.imported.name;

						if ( TRACKED_COMPONENTS.has( importedName ) ) {
							trackedImports.set(
								specifier.local.name,
								importedName
							);
						}
					}
				} );
			},

			JSXOpeningElement( node ) {
				const renderedComponentName = getRenderedComponentName(
					node.attributes
				);

				if ( renderedComponentName === 'VisuallyHidden' ) {
					context.report( {
						node,
						messageId: 'visuallyHiddenOrder',
					} );
					return;
				}

				const elementName = resolveTrackedJsxName( node.name );

				if (
					elementName === 'Link' &&
					renderedComponentName === 'Text'
				) {
					context.report( {
						node,
						messageId: 'linkTextOrder',
					} );
				}
			},
		};
	},
};
