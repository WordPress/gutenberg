'use strict';
/* eslint-disable jest/no-conditional-expect */
/**
 * Internal dependencies
 */
const {
	LifecycleScriptError,
	executeLifecycleScript,
} = require( '../execute-lifecycle-script' );

describe( 'executeLifecycleScript', () => {
	const spinner = {
		info: jest.fn(),
	};

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should do nothing without event option when debugging', async () => {
		await executeLifecycleScript(
			'test',
			{ lifecycleScripts: { test: null }, debug: true },
			spinner
		);

		expect( spinner.info ).not.toHaveBeenCalled();
	} );

	it( 'should run event option and print output when debugging', async () => {
		await executeLifecycleScript(
			'test',
			{ lifecycleScripts: { test: 'echo "Test \n"' }, debug: true },
			spinner
		);

		expect( spinner.info ).toHaveBeenCalledWith( 'test Script:\nTest' );
	} );

	it( 'should throw LifecycleScriptError when process errors', async () => {
		try {
			await executeLifecycleScript(
				'test',
				{
					lifecycleScripts: {
						test: 'echo "test error" 1>&2 && false',
					},
				},
				spinner
			);
		} catch ( error ) {
			expect( error ).toEqual(
				new LifecycleScriptError( 'test', 'test error' )
			);
		}
	} );
} );
/* eslint-enable jest/no-conditional-expect */
