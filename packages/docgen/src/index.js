/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const compile = require( './compile' );
const getIntermediateRepresentation = require( './get-intermediate-representation' );
const defaultMarkdownFormatter = require( './markdown' );
const isSymbolPrivate = require( './is-symbol-private' );

/**
 * Helpers functions.
 */

const runCustomFormatter = (
	customFormatterFile,
	rootDir,
	doc,
	symbols,
	headingTitle
) => {
	try {
		const customFormatter = require( customFormatterFile );
		const output = customFormatter( rootDir, doc, symbols, headingTitle );
		fs.writeFileSync( doc, output );
	} catch ( e ) {
		process.stderr.write( `\n${ e }` );
		process.stderr.write( '\n\n' );
		process.exit( 1 );
	}
	return 'custom formatter';
};

module.exports = function( sourceFilePath, options ) {
	// Input: process CLI args, prepare files, etc
	const processDir = process.cwd();
	if ( sourceFilePath === undefined ) {
		process.stderr.write( '\n' );
		process.stderr.write( 'No source file provided' );
		process.stderr.write( '\n\n' );
		process.exit( 1 );
	}
	sourceFilePath = path.join( processDir, sourceFilePath );

	const debugMode = options.debug ? true : false;

	const inputBase = path.join(
		path.dirname( sourceFilePath ),
		path.basename( sourceFilePath, path.extname( sourceFilePath ) )
	);
	const doc = options.output
		? path.join( processDir, options.output )
		: inputBase + '-api.md';

	// Process
	const { sourceFile, exportStatements } = compile( sourceFilePath );

	if ( exportStatements.length === 0 ) {
		process.stdout.write(
			'\nFile was processed, but contained no ES6 module exports:'
		);
		process.stdout.write( `\n${ sourceFilePath }` );
		process.stdout.write( '\n\n' );
		process.exit( 0 );
	}

	const ir = getIntermediateRepresentation(
		sourceFilePath,
		exportStatements,
		sourceFile
	);

	const filteredIR = ir.filter( ( symbol ) => {
		if ( isSymbolPrivate( symbol ) ) {
			return false;
		}

		if ( options.ignore ) {
			return ! symbol.name.match( options.ignore );
		}

		return true;
	} );

	if ( options.formatter ) {
		runCustomFormatter(
			path.join( processDir, options.formatter ),
			processDir,
			doc,
			filteredIR,
			'API'
		);
	} else {
		defaultMarkdownFormatter( options, processDir, doc, filteredIR, 'API' );
	}

	if ( debugMode ) {
		const ast = inputBase + '-ast.json';
		const tokens = inputBase + '-exports.json';
		const irFile = inputBase + '-ir.json';

		fs.writeFileSync( irFile, JSON.stringify( ir ) );
		fs.writeFileSync( tokens, JSON.stringify( exportStatements ) );
		fs.writeFileSync( ast, JSON.stringify( sourceFile ) );
	}

	process.exit( 0 );
};
