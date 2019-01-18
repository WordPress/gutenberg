/**
 * External dependencies
 */
const { first, get } = require( 'lodash' );

/**
 * Returns the assigned name for a given export node type,
 * or undefined if it cannot be determined.
 *
 * @param {Object} token Espree node.
 *
 * @return {?string} Exported declaration name.
 */
module.exports = function( token ) {
	if ( token.type === 'ExportDefaultDeclaration' ) {
		return 'default export';
	}

	if ( token.type === 'ExportAllDeclaration' ) {
		return 'TODO'; // need to look up in dependency
	}

	if ( token.declaration === null ) {
		return first( token.specifiers ).local.name;
	}

	let name;
	switch ( token.declaration.type ) {
		case 'ClassDeclaration':
		case 'FunctionDeclaration':
			name = token.declaration.id.name;
			break;

		case 'VariableDeclaration':
			name = get( first( token.declaration.declarations ), [ 'id', 'name' ] );
			break;

		case 'Identifier':
			name = token.declaration.name;
			break;
	}

	return name;
};
