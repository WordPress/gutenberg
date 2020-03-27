/**
 * External dependencies
 */
const { SyntaxKind } = require( 'typescript' );

const { hasExportModifier, hasDefaultModifier } = require( './has-modifier' );

/**
 * @typedef {import('typescript').Statement} Statement
 */

/**
 * @typedef ExportEntry
 *
 * @property {string} localName
 * @property {string} exportedName
 * @property {?string} module
 */

/**
 * Returns the export entry records of the given export statement.
 * Unlike [the standard](http://www.ecma-international.org/ecma-262/9.0/#exportentry-record),
 * the `importName` and the `localName` are merged together.
 *
 * @param {Statement} statement TypeScript AST node representing an export.
 *
 * @return {Array<ExportEntry>} Exported entry records. Example:
 * [ {
 *    localName: 'localName',
 *    exportName: 'exportedName',
 *    module: null,
 * } ]
 */
module.exports = function( statement ) {
	if ( hasExportModifier( statement ) ) {
		if ( hasDefaultModifier( statement ) ) {
			const getLocalName = ( s ) => {
				switch ( s.kind ) {
					case SyntaxKind.ClassDeclaration:
					case SyntaxKind.FunctionDeclaration:
					default:
						return s.name ? s.name.text : '*default*';
				}
			};

			return [
				{
					localName: getLocalName( statement ),
					exportName: 'default',
					module: null,
				},
			];
		}

		if ( statement.kind === SyntaxKind.VariableStatement ) {
			return statement.declarationList.declarations.map( ( decl ) => {
				return {
					localName: decl.name.text,
					exportName: decl.name.text,
					module: null,
				};
			} );
		}

		return [
			{
				localName: statement.name.text,
				exportName: statement.name.text,
				module: null,
			},
		];
	}

	if ( statement.kind === SyntaxKind.ExportAssignment ) {
		const getLocalName = ( s ) => {
			switch ( s.expression.kind ) {
				case SyntaxKind.Identifier:
					return s.expression.text;
				default:
					return '*default*';
			}
		};

		return [
			{
				localName: getLocalName( statement ),
				exportName: 'default',
				module: null,
			},
		];
	}

	// statement.kind === SyntaxKind.ExportDeclaration

	return statement.exportClause
		? // export { a, b } from './module'
		  statement.exportClause.elements.map( ( element ) => {
				return {
					localName: element.propertyName
						? element.propertyName.text
						: element.name.text,
					exportName: element.name.text,
					module: statement.moduleSpecifier
						? statement.moduleSpecifier.text
						: null,
				};
		  } )
		: // export * from './namespace-module';
		  [
				{
					localName: '*',
					exportName: null,
					module: statement.moduleSpecifier.text,
				},
		  ];
};
