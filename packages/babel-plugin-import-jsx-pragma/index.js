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
module.exports = function( babel ) {
	const { types: t } = babel;

	function getOptions( state ) {
		if ( ! state._options ) {
			state._options = Object.assign( {}, DEFAULT_OPTIONS, state.opts );
		}

		return state._options;
	}

	return {
		visitor: {
			JSXElement( path, state ) {
				if ( state.hasUndeclaredScopeVariable ) {
					return;
				}

				const { scopeVariable } = getOptions( state );
				state.hasUndeclaredScopeVariable = ! path.scope.hasBinding( scopeVariable );
			},
			Program: {
				exit( path, state ) {
					if ( ! state.hasUndeclaredScopeVariable ) {
						return;
					}

					const { scopeVariable, source, isDefault } = getOptions( state );

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
};
