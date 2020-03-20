const ts = require( 'typescript' );

const { getExportStatements } = require( './get-export-statements' );

/**
 * Function that takes file path and returns compiled result
 *
 * @param {string} filePath the path to the file to be compiled
 */
module.exports = function( filePath ) {
	const program = ts.createProgram( [ filePath ], {
		allowJs: true,
		target: ts.ScriptTarget.ES2020,
	} );

	const typeChecker = program.getTypeChecker();
	const sourceFile = program.getSourceFile( filePath );
	const exportStatements = getExportStatements( sourceFile );

	return {
		program,
		typeChecker,
		sourceFile,
		exportStatements,
	};
};
