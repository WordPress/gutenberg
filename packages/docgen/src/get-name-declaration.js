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
 * @return {Array} Exported declaration names.
 */
module.exports = function( token ) {
	if ( token.type === 'ExportDefaultDeclaration' ) {
		return [ 'default export' ];
	}

	if ( token.type === 'ExportAllDeclaration' ) {
		return [ 'TODO' ]; // need to look up in dependency
	}

	const name = [];
	if ( token.declaration === null ) {
		name.push( first( token.specifiers ).local.name );
		return name;
	}

	switch ( token.declaration.type ) {
		case 'ClassDeclaration':
		case 'FunctionDeclaration':
			name.push( token.declaration.id.name );
			break;

		case 'VariableDeclaration':
			name.push( get( first( token.declaration.declarations ), [ 'id', 'name' ] ) );
			break;

		case 'Identifier':
			name.push( token.declaration.name );
			break;
	}

	return name;
};
