import { EventEmitter } from 'node:events';
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

	it( 'includes all stderr when the process fails', async () => {
		const childProcess = new EventEmitter();
		childProcess.stdout = new EventEmitter();
		childProcess.stderr = new EventEmitter();

		const childProcessModule = require( 'node:child_process' );
		const exec = vi
			.spyOn( childProcessModule, 'exec' )
			.mockReturnValue( childProcess );
		const modulePath = require.resolve( '../execute-lifecycle-script' );
		delete require.cache[ modulePath ];
		const {
			LifecycleScriptError: MockedLifecycleScriptError,
			executeLifecycleScript: executeLifecycleScriptWithMock,
		} = require( modulePath );

		try {
			const execution = executeLifecycleScriptWithMock(
				'test',
				{ lifecycleScripts: { test: 'failing-command' } },
				spinner
			);

			childProcess.stderr.emit( 'data', 'first line\n' );
			childProcess.emit( 'exit', 1 );
			childProcess.stderr.emit( 'data', 'last line\n' );
			childProcess.emit( 'close', 1 );

			await expect( execution ).rejects.toMatchObject( {
				event: 'test',
				message: 'test Error:\nfirst line\nlast line',
			} );
			await expect( execution ).rejects.toBeInstanceOf(
				MockedLifecycleScriptError
			);
		} finally {
			exec.mockRestore();
			delete require.cache[ modulePath ];
		}
	} );
} );
