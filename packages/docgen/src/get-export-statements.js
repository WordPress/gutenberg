/**
 * External dependencies
 */
const { SourceFile, SyntaxKind } = require( 'typescript' );

/**
 * Internal dependencies
 */
const { hasExportModifier } = require( './has-modifier' );

/**
 * ExportAssignment
 *   - export default 3
 *
 * ExportDeclaration:
 *   - export { a, b } from 'c'
 *
 * hasExportModifier
 *   - export const x = 42
 *
 * @param {SourceFile} sourceFile
 */
function getExportStatements( sourceFile ) {
	return sourceFile.statements.filter( ( statement ) => {
		if (
			statement.kind === SyntaxKind.ExportAssignment ||
			statement.kind === SyntaxKind.ExportDeclaration
		) {
			return true;
		}

		return hasExportModifier( statement );
	} );
}

module.exports = {
	getExportStatements,
};
