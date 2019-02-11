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
const formatter = require( './formatter' );

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
	process.stdout.write( '\nRelative path does not exists.' );
	process.stdout.write( '\n' );
	process.stdout.write( `\nBase: ${ basePath }` );
	process.stdout.write( `\nRelative: ${ relativePath }` );
	process.stdout.write( '\n\n' );
	process.exit( 1 );
};

const getIRFromRelativePath = ( rootDir, basePath ) => ( relativePath ) => {
	if ( ! relativePath.startsWith( './' ) ) {
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
		currentFileStack.pop( inputFile );
		return result;
	} catch ( e ) {
		process.stdout.write( `\n${ e }` );
		process.stdout.write( '\n\n' );
		process.exit( 1 );
	}
};

/**
 * Start up processing.
 */

const optionator = require( 'optionator' )( {
	prepend: 'Usage: node <path-to-docgen> <relative-path-to-entry-point>',
	options: [ {
		option: 'output',
		alias: 'o',
		type: 'String',
		description: 'Markdown file to contain API docs',
	}, {
		option: 'debug',
		type: 'Boolean',
		default: false,
		description: 'run in debug mode, which outputs intermediate files',
	} ],
} );

const options = optionator.parseArgv( process.argv );

// Input: process CLI args, prepare files, etc
const processDir = process.cwd();
let sourceFile = options._[ 0 ];
if ( sourceFile === undefined ) {
	process.stdout.write( '\n' );
	process.stdout.write( optionator.generateHelp() );
	process.stdout.write( '\n\n' );
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
const currentFileStack = []; // To keep track of file being processed.
const result = processFile( processDir, sourceFile );

// Ouput
if ( result === undefined ) {
	process.stdout.write( '\nFile was processed, but contained no ES6 module exports:' );
	process.stdout.write( `\n${ sourceFile }` );
	process.stdout.write( '\n\n' );
	process.exit( 0 );
}

fs.writeFileSync( doc, formatter( processDir, doc, result.ir ) );
if ( debugMode ) {
	fs.writeFileSync( ir, JSON.stringify( result.ir ) );
	fs.writeFileSync( tokens, JSON.stringify( result.tokens ) );
	fs.writeFileSync( ast, JSON.stringify( result.ast ) );
}
