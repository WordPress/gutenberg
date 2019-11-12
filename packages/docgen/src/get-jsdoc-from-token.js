/**
 * External dependencies.
 */
const doctrine = require( 'doctrine' );

/**
 * Internal dependencies.
 */
const getLeadingComments = require( './get-leading-comments' );
const getTypeAsString = require( './get-type-as-string' );

/**
 * Function that takes an Espree token and returns
 * a object representing the leading JSDoc comment of the token,
 * if any.
 *
 * @param {Object} token Espree token.
 * @return {Object} Object representing the JSDoc comment.
 */
module.exports = function( token ) {
	let jsdoc;
	const comments = getLeadingComments( token );
	if ( comments && /^\*\r?\n/.test( comments ) ) {
		jsdoc = doctrine.parse( comments, {
			unwrap: true,
			recoverable: true,
			sloppy: true,
		} );
		jsdoc.tags = jsdoc.tags.map( ( tag ) => {
			if ( tag.type ) {
				tag.type = getTypeAsString( tag.type );
			}
			return tag;
		} );
	}
	return jsdoc;
};
