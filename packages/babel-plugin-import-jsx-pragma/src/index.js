/**
 * Default options for the plugin.
 *
 * @property {string}  scopeVariable Name of variable required to be in scope
 *                                   for use by the JSX pragma. For the default
 *                                   pragma of React.createElement, the React
 *                                   variable must be within scope.
 * @property {string}  source        The module from which the scope variable
 *                                   is to be imported when missing.
 * @property {boolean} isDefault     Whether the scopeVariable is the default
 *                                   import of the source module.
 */
const DEFAULT_OPTIONS = {
	scopeVariable: 'React',
	source: 'react',
	isDefault: true,
};

/**
 * Babel transform plugin for automatically injecting an import to be used as
 * the pragma for the React JSX Transform plugin.
 *
 * @see http://babeljs.io/docs/en/babel-plugin-transform-react-jsx
 *
 * @param {Object} babel Babel instance.
 *
 * @return {Object} Babel transform plugin.
 */
export default function( babel ) {
	const { types: t } = babel;

	let _options;

	let hasJSX, hasImportedScopeVariable;

	function getOptions( options ) {
		if ( ! _options ) {
			_options = {
				...DEFAULT_OPTIONS,
				...options,
			};
		}

		return _options;
	}

	return {
		visitor: {
			JSXElement() {
				hasJSX = true;
			},
			ImportDeclaration( path, state ) {
				if ( hasImportedScopeVariable ) {
					return;
				}

				const { scopeVariable, isDefault } = getOptions( state.opts );

				// The module source isn't verified, since if at least the
				// required variable is within scope, its assumed to be
				// compatible with the targeted transform, and otherwise would
				// conflict as a duplicate import if introduced separately.

				hasImportedScopeVariable = path.node.specifiers.some( ( specifier ) => {
					switch ( specifier.type ) {
						case 'ImportSpecifier':
							return (
								! isDefault &&
								specifier.imported.name === scopeVariable
							);

						case 'ImportDefaultSpecifier':
							return isDefault;
					}
				} );
			},
			Program: {
				enter() {
					_options = null;
					hasJSX = false;
					hasImportedScopeVariable = false;
				},
				exit( path, state ) {
					if ( ! hasJSX || hasImportedScopeVariable ) {
						return;
					}

					const { scopeVariable, source, isDefault } = getOptions( state.opts );

					let specifier;
					if ( isDefault ) {
						specifier = t.importDefaultSpecifier(
							t.identifier( scopeVariable )
						);
					} else {
						specifier = t.importSpecifier(
							t.identifier( scopeVariable ),
							t.identifier( scopeVariable )
						);
					}

					const importDeclaration = t.importDeclaration(
						[ specifier ],
						t.stringLiteral( source )
					);

					path.unshiftContainer( 'body', importDeclaration );
				},
			},
		},
	};
}
