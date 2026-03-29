const { types: babelTypes } = require( '@babel/core' );

/**
 * @typedef {Object} ExportEntryRecord
 * @property {string?} localName  the local name for the export, if any
 * @property {string?} exportName the export name for the export, if any
 * @property {string?} module     the module of the export, if any
 * @property {number}  lineStart  the starting line of the export
 * @property {number}  lineEnd    the ending line of the export
 */

/**
 * Returns the export entry records of the given export statement.
 * Unlike [the standard](http://www.ecma-international.org/ecma-262/9.0/#exportentry-record),
 * the `importName` and the `localName` are merged together.
 *
 * @param {import('@babel/types').Node} token Espree node representing an export.
 *
 * @return {ExportEntryRecord[]} Exported entry records. Example:
 * [ {
 *    localName: 'localName',
 *    exportName: 'exportedName',
 *    module: null,
 *    lineStart: 2,
 *    lineEnd: 3,
 * } ]
 */
module.exports = ( token ) => {
	if ( babelTypes.isExportDefaultDeclaration( token ) ) {
		/**
		 *
		 * @param {import('@babel/types').ExportDefaultDeclaration} t
		 * @return {string} the local name of the export
		 */
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
					name = t.declaration.id?.name ?? '*default*';
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

	if ( babelTypes.isExportAllDeclaration( token ) ) {
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
	if ( ! token.declaration ) {
		token.specifiers.forEach( ( specifier ) =>
			name.push( {
				localName: specifier.local?.name,
				exportName: specifier.exported.name,
				module: token.source?.value ?? null,
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
