/**
* External dependencies.
*/
const espree = require( 'espree' );

/**
* Internal dependencies.
*/
const getNameDeclaration = require( './get-name-declaration' );
const getJSDoc = require( './get-jsdoc' );

module.exports = function( code ) {
	const ast = espree.parse( code, {
		attachComment: true,
		ecmaVersion: 2018,
		sourceType: 'module',
	} );

	const tokens = ast.body.filter(
		( node ) => [ 'ExportNamedDeclaration', 'ExportDefaultDeclaration', 'ExportAllDeclaration' ].some( ( declaration ) => declaration === node.type )
	);

	const intermediateRepresentation = tokens.map(
		( token ) => ( {
			name: getNameDeclaration( token ),
			jsdoc: getJSDoc( ast, token ),
		} )
	);

	return intermediateRepresentation;
};
