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
			{ lifecycleScripts: { test: 'node -v' }, debug: true },
			spinner
		);

		expect( spinner.info ).toHaveBeenCalledWith(
			expect.stringMatching( /test Script:\nv[0-9]/ )
		);
	} );

	it( 'should throw LifecycleScriptError when process errors', async () => {
		try {
			await executeLifecycleScript(
				'test',
				{
					lifecycleScripts: {
						test: 'node -vvvvvvv',
					},
				},
				spinner
			);
		} catch ( error ) {
			expect( error ).toBeInstanceOf( LifecycleScriptError );
			expect( error.message ).toMatch( /test Error:\n.*bad option/ );
		}
	} );
} );
/* eslint-enable jest/no-conditional-expect */
