/**
 * Internal dependencies
 */
import { hasArgInCLI, hasProjectFile } from '../';
import { getPackagePath as getPackagePathMock } from '../package';
import { getArgsFromCLI as getArgsFromCLIMock } from '../process';

jest.mock( '../package', () => {
	const module = require.requireActual( '../package' );

	jest.spyOn( module, 'getPackagePath' );

	return module;
} );
jest.mock( '../process', () => {
	const module = require.requireActual( '../process' );

	jest.spyOn( module, 'getArgsFromCLI' );

	return module;
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
			getPackagePathMock.mockReturnValueOnce( __dirname );

			expect( hasProjectFile( 'unknown-file.name' ) ).toBe( false );
		} );

		test( 'should return true for the current directory and this file', () => {
			getPackagePathMock.mockReturnValueOnce( __dirname );

			expect( hasProjectFile( 'index.js' ) ).toBe( true );
		} );
	} );
} );
