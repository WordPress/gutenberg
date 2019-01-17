/**
* External dependencies.
*/
const espree = require( 'espree' );

/**
* Internal dependencies.
*/
const getIntermediateRepresentation = require( './get-intermediate-representation' );

module.exports = function( code ) {
	const ast = espree.parse( code, {
		attachComment: true,
		ecmaVersion: 2018,
		sourceType: 'module',
	} );

	const tokens = ast.body.filter(
		( node ) => [
			'ExportNamedDeclaration',
			'ExportDefaultDeclaration',
			'ExportAllDeclaration',
		].some( ( declaration ) => declaration === node.type )
	);

	const intermediateRepresentation = tokens.map(
		( token ) => getIntermediateRepresentation( ast, token )
	);

	return intermediateRepresentation;
};
