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
		option: 'debug',
		type: 'Boolean',
		default: false,
		description: 'run in debug mode, which outputs intermediate files',
	} ],
} );

const options = optionator.parseArgv( process.argv );

// Prepare input
const processDir = process.cwd();
let initialInputFile = options._[ 0 ];
if ( initialInputFile === undefined ) {
	process.stdout.write( '\n' );
	process.stdout.write( optionator.generateHelp() );
	process.stdout.write( '\n\n' );
	process.exit( 1 );
}
initialInputFile = path.join( processDir, initialInputFile );

const debugMode = options.debug ? true : false;

// Process
const currentFileStack = []; // To keep track of file being processed.
const result = processFile( processDir, initialInputFile );

// Ouput
const inputBase = path.join(
	path.dirname( initialInputFile ),
	path.basename( initialInputFile, path.extname( initialInputFile ) )
);
const doc = inputBase + '-api.md';
const ir = inputBase + '-ir.json';
const tokens = inputBase + '-exports.json';
const ast = inputBase + '-ast.json';

if ( result === undefined ) {
	process.stdout.write( '\nFile was processed, but contained no ES6 module exports:' );
	process.stdout.write( `\n${ initialInputFile }` );
	process.stdout.write( '\n\n' );
	process.exit( 0 );
}

fs.writeFileSync( doc, formatter( result.ir ) );
if ( debugMode ) {
	fs.writeFileSync( ir, JSON.stringify( result.ir ) );
	fs.writeFileSync( tokens, JSON.stringify( result.tokens ) );
	fs.writeFileSync( ast, JSON.stringify( result.ast ) );
}
