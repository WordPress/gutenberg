/**
 * External dependencies
 */
const { first, get } = require( 'lodash' );

/**
 * Returns the assigned name for a given declaration node type, or undefined if
 * it cannot be determined.
 *
 * @param {Object} declaration Declaration node.
 *
 * @return {?string} Exported declaration name.
 */
module.exports = function( declaration ) {
	let declarator;
	switch ( declaration.type ) {
		case 'FunctionDeclaration':
			declarator = declaration;
			break;

		case 'VariableDeclaration':
			declarator = first( declaration.declarations );
	}

	if ( declarator ) {
		return get( declarator, [ 'id', 'name' ], 'default export' );
	}
};
