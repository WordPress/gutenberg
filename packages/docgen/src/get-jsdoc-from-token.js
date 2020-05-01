/**
 * External dependencies.
 */
const parse = require( 'comment-parser' );

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
		jsdoc = parse( comments );
	}
	return jsdoc;
};
