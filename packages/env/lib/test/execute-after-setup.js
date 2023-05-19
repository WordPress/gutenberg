'use strict';
/**
 * External dependencies
 */
const { execSync } = require( 'child_process' );

/**
 * Internal dependencies
 */
const {
	AfterSetupError,
	executeAfterSetup,
} = require( '../execute-after-setup' );

jest.mock( 'child_process', () => ( {
	execSync: jest.fn(),
} ) );

describe( 'executeAfterSetup', () => {
	const spinner = {
		info: jest.fn(),
	};

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should do nothing without afterSetup option', () => {
		executeAfterSetup( { afterSetup: null }, spinner );

		expect( spinner.info ).not.toHaveBeenCalled();
	} );

	it( 'should run afterSetup option and print output without extra whitespace', () => {
		execSync.mockReturnValue( 'Test   \n' );

		executeAfterSetup( { afterSetup: 'Test Setup' }, spinner );

		expect( execSync ).toHaveBeenCalled();
		expect( execSync.mock.calls[ 0 ][ 0 ] ).toEqual( 'Test Setup' );
		expect( spinner.info ).toHaveBeenCalledWith( 'After Setup:\nTest' );
	} );

	it( 'should print nothing if afterSetup returns no output', () => {
		execSync.mockReturnValue( '' );

		executeAfterSetup( { afterSetup: 'Test Setup' }, spinner );

		expect( execSync ).toHaveBeenCalled();
		expect( execSync.mock.calls[ 0 ][ 0 ] ).toEqual( 'Test Setup' );
		expect( spinner.info ).not.toHaveBeenCalled();
	} );

	it( 'should throw AfterSetupError when process errors', () => {
		execSync.mockImplementation( ( command ) => {
			expect( command ).toEqual( 'Test Setup' );
			throw { stderr: 'Something bad happened.' };
		} );

		expect( () =>
			executeAfterSetup( { afterSetup: 'Test Setup' }, spinner )
		).toThrow(
			new AfterSetupError( 'After Setup:\nSomething bad happened.' )
		);
	} );
} );
