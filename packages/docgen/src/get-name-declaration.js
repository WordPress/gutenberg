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
		const getLocalName = ( t ) => {
			let name;
			switch ( t.declaration.type ) {
				case 'Identifier':
					name = t.declaration.name;
					break;
				case 'AssignmentExpression':
					name = t.declaration.left.name;
					break;
				//case 'FunctionDeclaration'
				//case 'ClassDeclaration'
				default:
					name = get( t.declaration, [ 'id', 'name' ], '*default*' );
			}
			return name;
		};
		return [ {
			importName: null,
			localName: getLocalName( token ),
			exportName: 'default',
			module: null,
		} ];
	}

	if ( token.type === 'ExportAllDeclaration' ) {
		return [ {
			importName: '*',
			localName: null,
			exportName: null,
			module: token.source.value,
		} ];
	}

	const name = [];
	if ( token.declaration === null ) {
		token.specifiers.forEach( ( specifier ) => name.push( specifier.local.name ) );
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
