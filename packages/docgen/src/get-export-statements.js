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
 *   - export default ClassDeclaration;
 *   - export default fnDeclaration;
 *
 * ExportDeclaration:
 *   - export { a, b } from 'c'
 *   - export { myDeclaration };
 *   - export * from './module';
 *   - export { default as moduleName } from './module-code';
 *   - export { bar as quux, myDefault as default }
 *
 * hasExportModifier
 *   - export const x = 42
 *   - export default class {}
 *   - export default class ClassDeclaration {}
 *   - export default function() {}
 *   - export default function myDeclaration() {}
 *   - export class MyDeclaration {}
 *   - export function myDeclaration() {}
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
