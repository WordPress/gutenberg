/**
* External dependencies.
*/
const espree = require( 'espree' );
const doctrine = require( 'doctrine' );

/**
* Internal dependencies.
*/
const getNameDeclaration = require( './get-name-declaration' );
const getLeadingComments = require( './get-leading-comments' );

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
			jsdoc: doctrine.parse(
				getLeadingComments( token ),
				{ unwrap: true, recoverable: true }
			),
		} )
	);

	return intermediateRepresentation;
};
