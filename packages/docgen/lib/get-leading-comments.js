/**
 * External dependencies
 */
const { last } = require( 'lodash' );

/**
 * Function that returns the leading comment
 * of a Espree node.
 *
 * @param {import('@babel/core').Node} declaration Espree node to inspect
 *
 * @return {string | undefined} Leading comment or undefined if there is none.
 */
module.exports = ( declaration ) => {
	let comments;
	if ( declaration.leadingComments ) {
		const lastComment = last( declaration.leadingComments );
		if ( lastComment ) {
			comments = lastComment.value;
		}
	}
	return comments;
};
