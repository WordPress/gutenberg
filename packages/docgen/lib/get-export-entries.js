/**
 * External dependencies
 */
const { get } = require( 'lodash' );

/**
 * Returns the export entry records of the given export statement.
 * Unlike [the standard](http://www.ecma-international.org/ecma-262/9.0/#exportentry-record),
 * the `importName` and the `localName` are merged together.
 *
 * @param {Object} token Espree node representing an export.
 *
 * @return {Array} Exported entry records. Example:
 * [ {
 *    localName: 'localName',
 *    exportName: 'exportedName',
 *    module: null,
 *    lineStart: 2,
 *    lineEnd: 3,
 * } ]
 */
module.exports = ( token ) => {
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
				default:
					name = get( t.declaration, [ 'id', 'name' ], '*default*' );
			}
			return name;
		};
		return [
			{
				localName: getLocalName( token ),
				exportName: 'default',
				module: null,
				lineStart: token.loc.start.line,
				lineEnd: token.loc.end.line,
			},
		];
	}

	if ( token.type === 'ExportAllDeclaration' ) {
		return [
			{
				localName: '*',
				exportName: null,
				module: token.source.value,
				lineStart: token.loc.start.line,
				lineEnd: token.loc.end.line,
			},
		];
	}

	const name = [];
	if ( token.declaration === null ) {
		token.specifiers.forEach( ( specifier ) =>
			name.push( {
				localName: specifier.local.name,
				exportName: specifier.exported.name,
				module: get( token.source, [ 'value' ], null ),
				lineStart: specifier.loc.start.line,
				lineEnd: specifier.loc.end.line,
			} )
		);
		return name;
	}

	switch ( token.declaration.type ) {
		case 'ClassDeclaration':
		case 'FunctionDeclaration':
			name.push( {
				localName: token.declaration.id.name,
				exportName: token.declaration.id.name,
				module: null,
				lineStart: token.declaration.loc.start.line,
				lineEnd: token.declaration.loc.end.line,
			} );
			break;

		case 'VariableDeclaration':
			token.declaration.declarations.forEach( ( declaration ) => {
				name.push( {
					localName: declaration.id.name,
					exportName: declaration.id.name,
					module: null,
					lineStart: token.declaration.loc.start.line,
					lineEnd: token.declaration.loc.end.line,
				} );
			} );
			break;
	}

	return name;
};
