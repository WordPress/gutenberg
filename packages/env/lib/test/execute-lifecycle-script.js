'use strict';
/**
 * External dependencies
 */
const { execSync } = require( 'child_process' );

/**
 * Internal dependencies
 */
const {
	LifecycleScriptError,
	executeLifecycleScript,
} = require( '../execute-lifecycle-script' );

jest.mock( 'child_process', () => ( {
	execSync: jest.fn(),
} ) );

describe( 'executeLifecycleScript', () => {
	const spinner = {
		info: jest.fn(),
	};

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should do nothing without event option', () => {
		executeLifecycleScript(
			'test',
			{ lifecycleScripts: { test: null } },
			spinner
		);

		expect( spinner.info ).not.toHaveBeenCalled();
	} );

	it( 'should run event option and print output without extra whitespace', () => {
		execSync.mockReturnValue( 'Test   \n' );

		executeLifecycleScript(
			'test',
			{ lifecycleScripts: { test: 'Test' } },
			spinner
		);

		expect( execSync ).toHaveBeenCalled();
		expect( execSync.mock.calls[ 0 ][ 0 ] ).toEqual( 'Test' );
		expect( spinner.info ).toHaveBeenCalledWith( 'test:\nTest' );
	} );

	it( 'should print nothing if event returns no output', () => {
		execSync.mockReturnValue( '' );

		executeLifecycleScript(
			'test',
			{ lifecycleScripts: { test: 'Test' } },
			spinner
		);

		expect( execSync ).toHaveBeenCalled();
		expect( execSync.mock.calls[ 0 ][ 0 ] ).toEqual( 'Test' );
		expect( spinner.info ).not.toHaveBeenCalled();
	} );

	it( 'should throw LifecycleScriptError when process errors', () => {
		execSync.mockImplementation( ( command ) => {
			expect( command ).toEqual( 'Test' );
			throw { stderr: 'Something bad happened.' };
		} );

		expect( () =>
			executeLifecycleScript(
				'test',
				{ lifecycleScripts: { test: 'Test' } },
				spinner
			)
		).toThrow(
			new LifecycleScriptError( 'test', 'Something bad happened.' )
		);
	} );
} );
