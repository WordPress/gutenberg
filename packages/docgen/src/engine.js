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

	const exportDeclarations = ast.body.filter(
		( node ) => [ 'ExportNamedDeclaration', 'ExportDefaultDeclaration', 'ExportAllDeclaration' ].some( ( declaration ) => declaration === node.type )
	);

	const intermediateRepresentation = exportDeclarations.map(
		( exportDeclaration ) => ( {
			name: getNameDeclaration( exportDeclaration.declaration ),
			jsdoc: doctrine.parse(
				getLeadingComments( exportDeclaration ),
				{ unwrap: true, recoverable: true }
			),
		} )
	);

	return intermediateRepresentation;
};
