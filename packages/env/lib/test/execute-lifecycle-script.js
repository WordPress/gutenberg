import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const {
	LifecycleScriptError,
	executeLifecycleScript,
} = require( '../execute-lifecycle-script' );

describe( 'executeLifecycleScript', () => {
	const spinner = {
		info: vi.fn(),
	};

	afterEach( () => {
		vi.clearAllMocks();
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
