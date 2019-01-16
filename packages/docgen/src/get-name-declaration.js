/**
 * External dependencies
 */
const { first, get } = require( 'lodash' );

/**
 * Returns the assigned name for a given declaration node type,
 * or undefined if it cannot be determined.
 *
 * @param {Object} declaration Declaration node.
 *
 * @return {?string} Exported declaration name.
 */
module.exports = function( declaration ) {
	let name;
	switch ( declaration.type ) {
		case 'FunctionDeclaration':
			name = get( declaration, [ 'id', 'name' ], 'default export' );
			break;

		case 'VariableDeclaration':
			name = get( first( declaration.declarations ), [ 'id', 'name' ], 'default export' );
			break;

		case 'Identifier':
			name = declaration.name;
			break;
	}

	return name;
};
