import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const webpack = require( 'webpack' );
const SharedOutputCleanPlugin = require( '..' );

const keep = /^(fonts|images)\//;

function writeFiles( root, files ) {
	for ( const [ file, content ] of Object.entries( files ) ) {
		const filePath = path.join( root, file );
		fs.mkdirSync( path.dirname( filePath ), { recursive: true } );
		fs.writeFileSync( filePath, content );
	}
}

function listFiles( root ) {
	return fs
		.readdirSync( root, { recursive: true, withFileTypes: true } )
		.filter( ( entry ) => entry.isFile() )
		.map( ( entry ) =>
			path
				.relative( root, path.join( entry.parentPath, entry.name ) )
				.split( path.sep )
				.join( '/' )
		)
		.sort();
}

// Holds a compiler back after it compiles, so the other compiler reaches `emit` first.
const delayPlugin = {
	apply: ( compiler ) =>
		compiler.hooks.afterCompile.tapPromise(
			'DelayPlugin',
			() => new Promise( ( resolve ) => setTimeout( resolve, 300 ) )
		),
};

function run( compiler ) {
	return new Promise( ( resolve, reject ) => {
		compiler.run( ( error, stats ) =>
			error ? reject( error ) : resolve( stats )
		);
	} );
}

describe( 'SharedOutputCleanPlugin', () => {
	let root;
	let outputPath;

	function createCompilers( entries, { delayModule = false } = {} ) {
		const plugin = new SharedOutputCleanPlugin( { keep } );
		const createConfig = ( entry, plugins ) => ( {
			mode: 'production',
			context: root,
			entry,
			output: { path: outputPath },
			plugins: [ plugin, ...plugins ],
		} );

		return webpack( [
			createConfig( entries.script, [] ),
			createConfig( entries.module, delayModule ? [ delayPlugin ] : [] ),
		] );
	}

	beforeEach( () => {
		root = fs.mkdtempSync(
			path.join( os.tmpdir(), 'shared-output-clean-plugin-' )
		);
		outputPath = path.join( root, 'build' );
		writeFiles( root, {
			'src/index.js': 'console.log( "index" );',
			'src/view.js': 'console.log( "view" );',
			'build/one/index.js': '',
			'build/one/view.js': '',
			'build/one/.gitkeep': '',
			'build/fonts/font.woff': '',
			'build/stale.js': '',
		} );
	} );

	afterEach( () => {
		fs.rmSync( root, { recursive: true, force: true } );
	} );

	it( 'removes stale files and keeps the output of every compiler', async () => {
		const compiler = createCompilers( {
			script: { 'two/index': './src/index.js' },
			module: { 'two/view': './src/view.js' },
		} );

		await run( compiler );

		expect( listFiles( outputPath ) ).toEqual( [
			'fonts/font.woff',
			'one/.gitkeep',
			'two/index.js',
			'two/view.js',
		] );
	} );

	it( 'keeps the output of a compiler that cleaned before the other one started', async () => {
		const compiler = createCompilers( {
			script: { 'two/index': './src/index.js' },
			module: { 'two/view': './src/view.js' },
		} );
		const [ scriptCompiler, moduleCompiler ] = compiler.compilers;

		await run( moduleCompiler );
		await run( scriptCompiler );

		expect( listFiles( outputPath ) ).toEqual( [
			'fonts/font.woff',
			'one/.gitkeep',
			'two/index.js',
			'two/view.js',
		] );
	} );

	it( 'removes nothing when a compiler fails to emit', async () => {
		writeFiles( root, { 'src/broken.js': 'console.log( ;' } );
		const compiler = createCompilers(
			{
				script: { 'two/index': './src/index.js' },
				module: { 'two/view': './src/broken.js' },
			},
			{ delayModule: true }
		);

		const stats = await run( compiler );

		expect( stats.hasErrors() ).toBe( true );
		expect( listFiles( outputPath ) ).toEqual( [
			'fonts/font.woff',
			'one/.gitkeep',
			'one/index.js',
			'one/view.js',
			'stale.js',
			'two/index.js',
		] );
	} );
} );
