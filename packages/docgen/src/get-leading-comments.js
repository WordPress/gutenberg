/**
 * External dependencies.
 */
const { last } = require( 'lodash' );

/**
 * Function that returns the leading comment
 * of a Espree node.
 *
 * @param {Object} declaration Espree node to inspect
 *
 * @return {?string} Leading comment or undefined if there is none.
 */
module.exports = function( declaration ) {
	let comments;
	if ( declaration.leadingComments ) {
		comments = last( declaration.leadingComments ).value;
	}
	return comments;
};
