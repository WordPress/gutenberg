/**
 * External dependencies.
 */
const doctrine = require( 'doctrine' );

/**
 * Internal dependencies.
 */
const getLeadingComments = require( './get-leading-comments' );

module.exports = function( token ) {
	let jsdoc;
	const comments = getLeadingComments( token );
	if ( comments && comments.startsWith( '*\n' ) ) {
		jsdoc = doctrine.parse( comments, { unwrap: true, recoverable: true } );
	}
	return jsdoc;
};
