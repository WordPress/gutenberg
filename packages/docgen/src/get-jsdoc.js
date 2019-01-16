/**
 * External dependencies.
 */
const doctrine = require( 'doctrine' );
const { first } = require( 'lodash' );

/**
 * Internal dependencies.
 */
const getLeadingComments = require( './get-leading-comments' );
const getNameDeclaration = require( './get-name-declaration' );

const getJSDoc = ( token ) => {
	let jsdoc;
	const comments = getLeadingComments( token );
	if ( comments ) {
		jsdoc = doctrine.parse( comments, { unwrap: true, recoverable: true } );
	}
	return jsdoc;
};

module.exports = function( ast, token ) {
	let jsdoc = getJSDoc( token );
	const name = getNameDeclaration( token );
	// TODO: 'default export' is tangling getNameDeclaration and this module
	if ( jsdoc === undefined && name !== 'default export' ) {
		const candidates = ast.body.filter( ( node ) => {
			return ( node.type === 'FunctionDeclaration' && node.id.name === name ) ||
				( node.type === 'VariableDeclaration' && first( node.declarations ).id.name === name );
		} );
		if ( candidates.length === 1 ) {
			jsdoc = getJSDoc( candidates[ 0 ] );
		}
	}

	if ( jsdoc === undefined ) {
		jsdoc = '*\n * Undocumented declaration\n ';
	}

	return jsdoc;
};
