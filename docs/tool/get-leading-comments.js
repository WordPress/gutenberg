/**
 * External dependencies.
 */
const { last } = require( 'lodash' );

module.exports = function( declaration ) {
	if ( declaration.leadingComments ) {
		return last( declaration.leadingComments ).value;
	}
	return '*\n * Undocumented declaration\n ';
};
