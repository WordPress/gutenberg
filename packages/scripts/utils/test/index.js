import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	test,
	vi,
} from 'vitest';
const require = createRequire( import.meta.url );
const currentDirectory = path.dirname( fileURLToPath( import.meta.url ) );
const crossSpawn = require( 'cross-spawn' );
const processUtils = require( '../process' );
const getArgsFromCLIMock = vi.spyOn( processUtils, 'getArgsFromCLI' );
const exitMock = vi.spyOn( processUtils, 'exit' );
const packageUtils = require( '../package' );
const getPackagePathMock = vi.spyOn( packageUtils, 'getPackagePath' );
const hasPackagePropMock = vi.spyOn( packageUtils, 'hasPackageProp' );
const fileUtils = require( '../file' );
const hasProjectFileMock = vi.spyOn( fileUtils, 'hasProjectFile' );
const fromProjectRootMock = vi.spyOn( fileUtils, 'fromProjectRoot' );
const fromConfigRootMock = vi.spyOn( fileUtils, 'fromConfigRoot' );
const crossSpawnMock = vi.spyOn( crossSpawn, 'sync' );
const {
	hasArgInCLI,
	hasProjectFile,
	getJestOverrideConfigFile,
	getWebpackArgs,
	spawnScript,
} = require( '../' );

afterAll( () => {
	vi.restoreAllMocks();
} );

describe( 'utils', () => {
	describe( 'hasArgInCLI', () => {
		beforeAll( () => {
			getArgsFromCLIMock.mockReturnValue( [
				'-a',
				'--b',
				'--config=test',
			] );
		} );

		afterAll( () => {
			getArgsFromCLIMock.mockReset();
		} );

		test( 'should return false when no args passed', () => {
			getArgsFromCLIMock.mockReturnValueOnce( [] );

			expect( hasArgInCLI( '--no-args' ) ).toBe( false );
		} );

		test( 'should return false when checking for unrecognized arg', () => {
			expect( hasArgInCLI( '--non-existent' ) ).toBe( false );
		} );

		test( 'should return true when CLI arg found', () => {
			expect( hasArgInCLI( '-a' ) ).toBe( true );
			expect( hasArgInCLI( '--b' ) ).toBe( true );
			expect( hasArgInCLI( '--config' ) ).toBe( true );
		} );
	} );

	describe( 'hasProjectFile', () => {
		test( 'should return false for the current directory and unknown file', () => {
			getPackagePathMock.mockReturnValueOnce( currentDirectory );

			expect( hasProjectFile( 'unknown-file.name' ) ).toBe( false );
		} );

		test( 'should return true for the current directory and this file', () => {
			getPackagePathMock.mockReturnValueOnce( currentDirectory );

			expect( hasProjectFile( 'index.js' ) ).toBe( true );
		} );
	} );

	describe( 'getJestOverrideConfigFile', () => {
		beforeEach( () => {
			getArgsFromCLIMock.mockReturnValue( [] );
			hasPackagePropMock.mockReturnValue( false );
			hasProjectFileMock.mockReturnValue( false );
			fromProjectRootMock.mockImplementation(
				( filePath ) => '/p/' + filePath
			);
			fromConfigRootMock.mockImplementation(
				( filePath ) => '/c/' + filePath
			);
		} );

		afterEach( () => {
			getArgsFromCLIMock.mockReset();
			hasPackagePropMock.mockReset();
			hasProjectFileMock.mockReset();
			fromProjectRootMock.mockReset();
			fromConfigRootMock.mockReset();
		} );

		it( 'should return undefined if --config flag is present', () => {
			getArgsFromCLIMock.mockReturnValue( [ '--config=test' ] );

			expect( getJestOverrideConfigFile( 'e2e' ) ).toBe( undefined );
		} );

		it( 'should return undefined if -c flag is present', () => {
			getArgsFromCLIMock.mockReturnValue( [ '-c=test' ] );

			expect( getJestOverrideConfigFile( 'e2e' ) ).toBe( undefined );
		} );

		it( 'should return variant project configuration if present', () => {
			hasProjectFileMock.mockImplementation(
				( file ) => file === 'jest-e2e.config.js'
			);

			expect( getJestOverrideConfigFile( 'e2e' ) ).toBe(
				'/p/jest-e2e.config.js'
			);
		} );

		it( 'should return undefined if jest.config.js available', () => {
			hasProjectFileMock.mockImplementation(
				( file ) => file === 'jest.config.js'
			);

			expect( getJestOverrideConfigFile( 'e2e' ) ).toBe( undefined );
		} );

		it( 'should return undefined if jest.config.json available', () => {
			hasProjectFileMock.mockImplementation(
				( file ) => file === 'jest.config.json'
			);

			expect( getJestOverrideConfigFile( 'e2e' ) ).toBe( undefined );
		} );

		it( 'should return undefined if jest package directive specified', () => {
			hasPackagePropMock.mockImplementation(
				( prop ) => prop === 'jest'
			);

			expect( getJestOverrideConfigFile( 'e2e' ) ).toBe( undefined );
		} );

		it( 'should return default configuration if nothing available', () => {
			expect( getJestOverrideConfigFile( 'e2e' ) ).toBe(
				'/c/jest-e2e.config.js'
			);

			expect( getJestOverrideConfigFile( 'unit' ) ).toBe(
				'/c/jest-unit.config.js'
			);
		} );
	} );

	describe( 'getWebpackArgs', () => {
		beforeEach( () => {
			hasProjectFileMock.mockReturnValue( false );
			fromProjectRootMock.mockImplementation(
				( filePath ) => '/p/' + filePath
			);
			fromConfigRootMock.mockImplementation(
				( filePath ) => '/c/' + filePath
			);
		} );

		afterEach( () => {
			getArgsFromCLIMock.mockReset();
			hasProjectFileMock.mockReset();
			fromProjectRootMock.mockReset();
			fromConfigRootMock.mockReset();
			delete process.env.WP_ENTRY;
		} );

		it.each( [ 'js', 'jsx', 'ts', 'tsx' ] )(
			'removes the .%s extension from direct build entry names',
			( extension ) => {
				getArgsFromCLIMock.mockReturnValue( [
					`entry.${ extension }`,
				] );

				getWebpackArgs();

				expect( JSON.parse( process.env.WP_ENTRY ) ).toEqual( {
					entry: `/p/entry.${ extension }`,
				} );
			}
		);
	} );

	describe( 'spawnScript', () => {
		const scriptName = 'test-unit-js';

		beforeAll( () => {
			exitMock.mockImplementation( ( code ) => {
				throw new Error( `Exit code: ${ code }.` );
			} );
		} );

		afterAll( () => {
			exitMock.mockReset();
		} );

		test( 'should exit when no script name provided', () => {
			expect( () => spawnScript() ).toThrow( 'Exit code: 1.' );
			expect( console ).toHaveLoggedWith( 'Script name is missing.' );
		} );

		test( 'should exit when an unknown script name provided', () => {
			expect( () => spawnScript( 'unknown-script' ) ).toThrow(
				'Exit code: 1.'
			);
			expect( console ).toHaveLoggedWith(
				'Unknown script "unknown-script". Perhaps you need to update @wordpress/scripts?'
			);
		} );

		test( 'should exit when the script failed because of SIGKILL signal', () => {
			crossSpawnMock.mockReturnValueOnce( { signal: 'SIGKILL' } );

			expect( () => spawnScript( scriptName ) ).toThrow(
				'Exit code: 1.'
			);
			expect( console ).toHaveLogged();
		} );

		test( 'should exit when the script failed because of SIGTERM signal', () => {
			crossSpawnMock.mockReturnValueOnce( { signal: 'SIGTERM' } );

			expect( () => spawnScript( scriptName ) ).toThrow(
				'Exit code: 1.'
			);
			expect( console ).toHaveLogged();
		} );

		test( 'should pass inspect args to node', () => {
			crossSpawnMock.mockReturnValueOnce( { status: 0 } );

			expect( () =>
				spawnScript( scriptName, [], [ '--inspect-brk' ] )
			).toThrow( 'Exit code: 0.' );
			expect( crossSpawnMock ).toHaveBeenCalledWith(
				'node',
				[ '--inspect-brk', expect.stringContaining( scriptName ) ],
				{ stdio: 'inherit' }
			);
		} );

		test( 'should pass script args to the script', () => {
			crossSpawnMock.mockReturnValueOnce( { status: 0 } );

			expect( () =>
				spawnScript( scriptName, [ '--runInBand' ] )
			).toThrow( 'Exit code: 0.' );
			expect( crossSpawnMock ).toHaveBeenCalledWith(
				'node',
				[ expect.stringContaining( scriptName ), '--runInBand' ],
				{ stdio: 'inherit' }
			);
		} );

		test( 'should finish successfully when the script properly executed', () => {
			crossSpawnMock.mockReturnValueOnce( { status: 0 } );

			expect( () => spawnScript( scriptName ) ).toThrow(
				'Exit code: 0.'
			);
			expect( crossSpawnMock ).toHaveBeenCalledWith(
				'node',
				[ expect.stringContaining( scriptName ) ],
				{ stdio: 'inherit' }
			);
		} );

		test( 'should finish successfully when the script properly executed with args', () => {
			crossSpawnMock.mockReturnValueOnce( { status: 0 } );
			const args = [ '-a', '--bbb', '-c=ccccc' ];

			expect( () => spawnScript( scriptName, args ) ).toThrow(
				'Exit code: 0.'
			);
			expect( crossSpawnMock ).toHaveBeenCalledWith(
				'node',
				[ expect.stringContaining( scriptName ), ...args ],
				{ stdio: 'inherit' }
			);
		} );
	} );
} );
