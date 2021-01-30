/**
 * External dependencies
 */
const commentParser = require( 'comment-parser' );

/**
 * Internal dependencies
 */
const getLeadingComments = require( './get-leading-comments' );

/**
 * Function that takes an Espree token and returns
 * a object representing the leading JSDoc comment of the token,
 * if any.
 *
 * @param {Object} token Espree token.
 * @return {Object} Object representing the JSDoc comment.
 */
module.exports = ( token ) => {
	let jsdoc;
	const comments = getLeadingComments( token );
	if ( comments && /^\*\r?\n/.test( comments ) ) {
		jsdoc = commentParser.parse( `/*${ comments }*/`, {
			spacing: 'preserve',
		} )[ 0 ];
		jsdoc.tags = jsdoc.tags.map( ( tag ) => {
			return {
				...tag,
				description: tag.description.trim(),
			};
		} );
	}
	return jsdoc;
};
