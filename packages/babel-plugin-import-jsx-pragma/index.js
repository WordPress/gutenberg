/**
 * Default options for the plugin.
 *
 * @property {string}  scopeVariable     Name of variable required to be in scope
 *                                       for use by the JSX pragma. For the default
 *                                       pragma of React.createElement, the React
 *                                       variable must be within scope.
 * @property {string}  scopeVariableFrag Name of variable required to be in scope
 *                                       for use by the Fragment pragma.
 * @property {string}  source            The module from which the scope variable
 *                                       is to be imported when missing.
 * @property {boolean} isDefault         Whether the scopeVariable is the default
 *                                       import of the source module.
 */
const DEFAULT_OPTIONS = {
	scopeVariable: 'React',
	scopeVariableFrag: null,
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
			JSX( path, state ) {
				if ( state.hasUndeclaredScopeVariable ) {
					return;
				}

				const { scopeVariable } = getOptions( state );
				state.hasUndeclaredScopeVariable = ! path.scope.hasBinding( scopeVariable );
			},
			JSXFragment( path, state ) {
				if ( state.hasUndeclaredScopeVariableFrag ) {
					return;
				}

				const { scopeVariableFrag } = getOptions( state );
				if ( scopeVariableFrag === null ) {
					return;
				}

				state.hasUndeclaredScopeVariableFrag = ! path.scope.hasBinding( scopeVariableFrag );
			},
			Program: {
				exit( path, state ) {
					const { scopeVariable, scopeVariableFrag, source, isDefault } = getOptions( state );

					let scopeVariableSpecifier;
					let scopeVariableFragSpecifier;

					if ( state.hasUndeclaredScopeVariable ) {
						if ( isDefault ) {
							scopeVariableSpecifier = t.importDefaultSpecifier( t.identifier( scopeVariable ) );
						} else {
							scopeVariableSpecifier = t.importSpecifier(
								t.identifier( scopeVariable ),
								t.identifier( scopeVariable )
							);
						}
					}

					if ( state.hasUndeclaredScopeVariableFrag ) {
						scopeVariableFragSpecifier = t.importSpecifier(
							t.identifier( scopeVariableFrag ),
							t.identifier( scopeVariableFrag )
						);
					}

					const importDeclarationSpecifiers = [
						scopeVariableSpecifier,
						scopeVariableFragSpecifier,
					].filter( Boolean );
					if ( importDeclarationSpecifiers.length ) {
						const importDeclaration = t.importDeclaration(
							importDeclarationSpecifiers,
							t.stringLiteral( source )
						);

						path.unshiftContainer( 'body', importDeclaration );
					}
				},
			},
		},
	};
};
