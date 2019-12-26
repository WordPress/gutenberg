const pkg = require( '../package.json' );

function babelPlugin( { types: t } ) {
	const seen = Symbol();

	const binaryExpression = t.binaryExpression(
		'!==',
		t.memberExpression(
			t.memberExpression( t.identifier( 'process' ), t.identifier( 'env' ), false ),
			t.identifier( 'NODE_ENV' ),
			false
		),
		t.stringLiteral( 'production' )
	);

	return {
		visitor: {
			ImportDeclaration( path, state ) {
				const { node } = path;
				const isThisPackageImport = node.source.value.indexOf( pkg.name ) !== -1;

				if ( ! isThisPackageImport ) {
					return;
				}

				const defaultSpecifier = node.specifiers.find(
					( specifier ) => specifier.type === 'ImportDefaultSpecifier'
				);

				const { name } = defaultSpecifier.local;

				state.callee = name;
			},
			CallExpression( path, state ) {
				const { node } = path;

				// Ignore if it's already been processed
				if ( node[ seen ] ) {
					return;
				}

				const name = state.callee || state.opts.callee;

				if ( path.get( 'callee' ).isIdentifier( { name } ) ) {
					// Turns this code:
					// warning(condition, argument, argument);
					// into this:
					// process.env.NODE_ENV !== "production" ? warning(condition, argument, argument) : void 0;
					node[ seen ] = true;
					path.replaceWith(
						t.ifStatement(
							binaryExpression,
							t.blockStatement( [ t.expressionStatement( node ) ] )
						)
					);
				}
			},
		},
	};
}

module.exports = babelPlugin;
