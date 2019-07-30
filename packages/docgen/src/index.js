/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { last } = require( 'lodash' );

/**
 * Internal dependencies
 */
const engine = require( './engine' );
const defaultMarkdownFormatter = require( './markdown' );
const isSymbolPrivate = require( './is-symbol-private' );

/**
 * Helpers functions.
 */

const relativeToAbsolute = ( basePath, relativePath ) => {
	const target = path.join( path.dirname( basePath ), relativePath );
	if ( path.extname( target ) === '.js' ) {
		return target;
	}
	let targetFile = target + '.js';
	if ( fs.existsSync( targetFile ) ) {
		return targetFile;
	}
	targetFile = path.join( target, 'index.js' );
	if ( fs.existsSync( targetFile ) ) {
		return targetFile;
	}
	process.stderr.write( '\nRelative path does not exists.' );
	process.stderr.write( '\n' );
	process.stderr.write( `\nBase: ${ basePath }` );
	process.stderr.write( `\nRelative: ${ relativePath }` );
	process.stderr.write( '\n\n' );
	process.exit( 1 );
};

const getIRFromRelativePath = ( rootDir, basePath ) => ( relativePath ) => {
	if ( ! relativePath.startsWith( '.' ) ) {
		return [];
	}
	const absolutePath = relativeToAbsolute( basePath, relativePath );
	const result = processFile( rootDir, absolutePath );
	return result.ir || undefined;
};

const processFile = ( rootDir, inputFile ) => {
	try {
		const data = fs.readFileSync( inputFile, 'utf8' );
		currentFileStack.push( inputFile );
		const relativePath = path.relative( rootDir, inputFile );
		const result = engine( relativePath, data, getIRFromRelativePath( rootDir, last( currentFileStack ) ) );
		currentFileStack.pop();
		return result;
	} catch ( e ) {
		process.stderr.write( `\n${ e }` );
		process.stderr.write( '\n\n' );
		process.exit( 1 );
	}
};

const runCustomFormatter = ( customFormatterFile, rootDir, doc, symbols, headingTitle ) => {
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

// To keep track of file being processed.
const currentFileStack = [];

module.exports = function( sourceFile, options ) {
	// Input: process CLI args, prepare files, etc
	const processDir = process.cwd();
	if ( sourceFile === undefined ) {
		process.stderr.write( '\n' );
		process.stderr.write( 'No source file provided' );
		process.stderr.write( '\n\n' );
		process.exit( 1 );
	}
	sourceFile = path.join( processDir, sourceFile );

	const debugMode = options.debug ? true : false;

	const inputBase = path.join(
		path.dirname( sourceFile ),
		path.basename( sourceFile, path.extname( sourceFile ) )
	);
	const ast = inputBase + '-ast.json';
	const tokens = inputBase + '-exports.json';
	const ir = inputBase + '-ir.json';
	const doc = options.output ?
		path.join( processDir, options.output ) :
		inputBase + '-api.md';

	// Process
	const result = processFile( processDir, sourceFile );
	const filteredIR = result.ir.filter( ( symbol ) => {
		if ( isSymbolPrivate( symbol ) ) {
			return false;
		}

		if ( options.ignore ) {
			return ! symbol.name.match( options.ignore );
		}

		return true;
	} );

	// Ouput
	if ( result === undefined ) {
		process.stdout.write( '\nFile was processed, but contained no ES6 module exports:' );
		process.stdout.write( `\n${ sourceFile }` );
		process.stdout.write( '\n\n' );
		process.exit( 0 );
	}

	if ( options.formatter ) {
		runCustomFormatter( path.join( processDir, options.formatter ), processDir, doc, filteredIR, 'API' );
	} else {
		defaultMarkdownFormatter( options, processDir, doc, filteredIR, 'API' );
	}

	if ( debugMode ) {
		fs.writeFileSync( ir, JSON.stringify( result.ir ) );
		fs.writeFileSync( tokens, JSON.stringify( result.tokens ) );
		fs.writeFileSync( ast, JSON.stringify( result.ast ) );
	}

	process.exit( 0 );
};
