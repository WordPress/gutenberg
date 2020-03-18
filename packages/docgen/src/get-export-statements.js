/**
 * External dependencies
 */
const { SourceFile, SyntaxKind } = require( 'typescript' );

const { hasExportModifier } = require( './has-modifier' );

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

		return hasExportModifier( statement );
	} );
}

module.exports = {
	getExportStatements,
};
