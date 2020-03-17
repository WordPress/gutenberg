/**
 * External dependencies
 */
const { SourceFile, SyntaxKind } = require( 'typescript' );

const { hasExportKeyword } = require( './has-keyword' );

/**
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

		return hasExportKeyword( statement );
	} );
}

module.exports = {
	getExportStatements,
};
