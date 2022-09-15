/**
 * Internal dependencies
 */
const pkg = require( './package.json' );

/**
 * Babel plugin which transforms `warning` function calls to wrap within a
 * condition that checks if `process.env.NODE_ENV !== 'production'`.
 *
 * @param {import('@babel/core')} babel Current Babel object.
 *
 * @return {import('@babel/core').PluginObj} Babel plugin object.
 */
function babelPlugin( { types: t } ) {
	const seen = Symbol();

	const typeofProcessExpression = t.binaryExpression(
		'!==',
		t.unaryExpression( 'typeof', t.identifier( 'process' ), false ),
		t.stringLiteral( 'undefined' )
	);

	const processEnvExpression = t.memberExpression(
		t.identifier( 'process' ),
		t.identifier( 'env' ),
		false
	);

	const nodeEnvCheckExpression = t.binaryExpression(
		'!==',
		t.memberExpression(
			processEnvExpression,
			t.identifier( 'NODE_ENV' ),
			false
		),
		t.stringLiteral( 'production' )
	);

	const logicalExpression = t.logicalExpression(
		'&&',
		t.logicalExpression(
			'&&',
			typeofProcessExpression,
			processEnvExpression
		),
		nodeEnvCheckExpression
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
					// typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production" ? warning(argument) : void 0;
					node[ seen ] = true;
					path.replaceWith(
						t.ifStatement(
							logicalExpression,
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
