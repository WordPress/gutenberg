const ts = require( 'typescript' );
const { readFileSync } = require( 'fs' );

const { getExportStatements } = require( './get-export-statements' );

/**
 * Function that takes file path and returns compiled result
 *
 * @param {string} filePath the path to the file to be compiled
 */
module.exports = function( filePath ) {
	const options = {
		allowJs: true,
		target: ts.ScriptTarget.ES2020,
	};
	const host = ts.createCompilerHost( options, true );
	const raw = readFileSync( filePath ).toString();
	const code = raw
		// typescript interprets @wordpress in @example code as a JSDoc tag.
		// So, it should be replaced for the time being.
		.replace( /@wordpress/g, '__WORDPRESS_IMPORT__' )
		// When <caption>ES(5|Next)<\/caption> exists next to @example tag,
		// typescript cannot parse code correctly.
		// So, they're removed.
		.replace( /@example\s+<caption>ES(5|Next)<\/caption>/g, '@example' );
	const sF = ts.createSourceFile( filePath, code, options.target, true );

	host.getSourceFile = () => sF;
	host.readFile = () => code;

	const program = ts.createProgram( [ filePath ], options, host );

	const typeChecker = program.getTypeChecker();
	const sourceFile = program.getSourceFile( filePath );
	const exportStatements = getExportStatements( sourceFile );

	// Without the line below, sourceFile.fileName is set to
	// /gutenberg/node_modules/typescript/lib/lib.es2020.full.d.ts
	sourceFile.fileName = filePath;

	return {
		program,
		typeChecker,
		sourceFile,
		exportStatements,
	};
};
