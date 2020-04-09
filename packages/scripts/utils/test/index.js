/**
 * External dependencies
 */
import crossSpawn from 'cross-spawn';

/**
 * Internal dependencies
 */
import { spawnScript } from '../';
import { exit as exitMock } from '../process';

jest.mock( '../process', () => {
	const module = require.requireActual( '../process' );

	jest.spyOn( module, 'exit' );

	return module;
} );

describe( 'utils', () => {
	const crossSpawnMock = jest.spyOn( crossSpawn, 'sync' );

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
