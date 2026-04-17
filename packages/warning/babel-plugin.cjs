/**
 * Internal dependencies
 */
const pkg = require( './package.json' );

/**
 * Babel plugin which transforms `warning` function calls to wrap within a
 * condition that checks if `SCRIPT_DEBUG === true`.
 *
 * @param {import('@babel/core')} babel Current Babel object.
 *
 * @return {import('@babel/core').PluginObj} Babel plugin object.
 */
function babelPlugin( { types: t } ) {
	const seen = Symbol();

	const scriptDebugCheckExpression = t.binaryExpression(
		'===',
		t.memberExpression(
			t.identifier( 'globalThis' ),
			t.identifier( 'SCRIPT_DEBUG' )
		),
		t.booleanLiteral( true )
	);

	return {
		visitor: {
			ImportDeclaration( path, state ) {
				const { node } = path;
				const isThisPackageImport =
					node.source.value.indexOf( pkg.name ) !== -1;

				if ( ! isThisPackageImport ) {
					return;
				}

				const defaultSpecifier = node.specifiers.find(
					( specifier ) => specifier.type === 'ImportDefaultSpecifier'
				);

				if ( defaultSpecifier && defaultSpecifier.local ) {
					const { name } = defaultSpecifier.local;
					state.callee = name;
				}
			},
			CallExpression( path, state ) {
				const { node } = path;

				// Ignore if it's already been processed.
				if ( node[ seen ] ) {
					return;
				}

				const name = state.callee || state.opts.callee;

				if ( path.get( 'callee' ).isIdentifier( { name } ) ) {
					// Turns this code:
					// warning(argument);
					// into this:
					// typeof SCRIPT_DEBUG !== 'undefined' && SCRIPT_DEBUG === true ? warning(argument) : void 0;
					node[ seen ] = true;
					path.replaceWith(
						t.ifStatement(
							scriptDebugCheckExpression,
							t.blockStatement( [
								t.expressionStatement( node ),
							] )
						)
					);
				}
			},
		},
	};
}

module.exports = babelPlugin;
