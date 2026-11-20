import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { rimrafSync } from 'rimraf';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const resolveBin = require( 'resolve-bin' );
const crossSpawn = require( 'cross-spawn' );
const utils = require( '../../utils' );
const webpackArgs = [ '--config', 'webpack config.js' ];

describe.each( [ 'build', 'start' ] )( '%s script', ( scriptName ) => {
	const scriptPath = require.resolve( `../${ scriptName }` );
	let workingDirectory;
	let outputPath;
	let exitMock;

	const runScript = () => {
		delete require.cache[ scriptPath ];
		require( scriptPath );
	};

	beforeEach( () => {
		workingDirectory = fs.mkdtempSync(
			path.join( os.tmpdir(), 'wp-scripts-webpack-' )
		);
		outputPath = path.join( workingDirectory, 'arguments.json' );
		const webpackPath = path.join( workingDirectory, 'webpack entry.js' );
		// Like an entry point inside a PnP archive, this file cannot be executed directly.
		fs.writeFileSync(
			webpackPath,
			`require( 'node:fs' ).writeFileSync(
				${ JSON.stringify( outputPath ) },
				JSON.stringify( process.argv.slice( 2 ) )
			);
			process.exit( Number( process.env.WP_SCRIPTS_TEST_EXIT_CODE ) || 0 );`,
			{ mode: 0o644 }
		);

		vi.spyOn( resolveBin, 'sync' ).mockReturnValue( webpackPath );
		vi.spyOn( utils, 'getWebpackArgs' ).mockImplementation( () => [
			...webpackArgs,
		] );
		vi.spyOn( utils, 'hasArgInCLI' ).mockReturnValue( false );
		exitMock = vi.spyOn( process, 'exit' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		delete require.cache[ scriptPath ];
		rimrafSync( workingDirectory );
	} );

	it( 'runs a non-executable webpack entry point and forwards arguments', () => {
		runScript();

		expect( exitMock ).toHaveBeenCalledWith( 0 );
		expect( JSON.parse( fs.readFileSync( outputPath, 'utf8' ) ) ).toEqual(
			scriptName === 'start' ? [ 'watch', ...webpackArgs ] : webpackArgs
		);
	} );

	if ( scriptName === 'start' ) {
		it.each( [
			[ '--no-watch', [] ],
			[ '--hot', [ 'serve' ] ],
		] )( 'supports %s', ( flag, command ) => {
			utils.hasArgInCLI.mockImplementation( ( arg ) => arg === flag );

			runScript();

			expect( exitMock ).toHaveBeenCalledWith( 0 );
			expect(
				JSON.parse( fs.readFileSync( outputPath, 'utf8' ) )
			).toEqual( [ ...command, ...webpackArgs ] );
		} );
	}

	it( 'returns the webpack exit code when compilation fails', () => {
		vi.stubEnv( 'WP_SCRIPTS_TEST_EXIT_CODE', '2' );

		runScript();

		expect( exitMock ).toHaveBeenCalledWith( 2 );
	} );

	it( 'fails when the webpack process cannot be started', () => {
		vi.spyOn( crossSpawn, 'sync' ).mockReturnValue( { status: null } );

		runScript();

		expect( exitMock ).toHaveBeenCalledWith( 1 );
	} );
} );
