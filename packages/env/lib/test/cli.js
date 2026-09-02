import { createRequire } from 'node:module';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const oraPath = require.resolve( 'ora' );
const originalOra = require( oraPath );
const createSpinner = vi.fn( () => {
	const spinner = { text: '', succeed: vi.fn(), fail: vi.fn() };
	spinner.start = () => spinner;
	return spinner;
} );
require.cache[ oraPath ].exports = createSpinner;
const envPath = require.resolve( '../env' );
const originalEnv = require( envPath );
const env = {
	start: vi.fn( Promise.resolve.bind( Promise ) ),
	stop: vi.fn( Promise.resolve.bind( Promise ) ),
	reset: vi.fn( Promise.resolve.bind( Promise ) ),
	clean: vi.fn( Promise.resolve.bind( Promise ) ),
	run: vi.fn( Promise.resolve.bind( Promise ) ),
	destroy: vi.fn( Promise.resolve.bind( Promise ) ),
	cleanup: vi.fn( Promise.resolve.bind( Promise ) ),
	ValidationError: originalEnv.ValidationError,
	LifecycleScriptError: originalEnv.LifecycleScriptError,
};
require.cache[ envPath ].exports = env;
const processExit = vi.spyOn( process, 'exit' ).mockImplementation( () => {} );
const cli = require( '../cli' );
afterAll( () => {
	require.cache[ oraPath ].exports = originalOra;
	require.cache[ envPath ].exports = originalEnv;
	processExit.mockRestore();
	delete require.cache[ require.resolve( '../cli' ) ];
} );

describe( 'env cli', () => {
	beforeEach( vi.clearAllMocks );

	it( 'parses start commands.', () => {
		cli().parse( [ 'start' ] );
		const { spinner, autoPort } = env.start.mock.calls[ 0 ][ 0 ];
		expect( spinner.text ).toBe( '' );
		expect( autoPort ).toBeUndefined();
	} );

	it( 'parses start commands with --auto-port.', () => {
		cli().parse( [ 'start', '--auto-port' ] );
		const { autoPort } = env.start.mock.calls[ 0 ][ 0 ];
		expect( autoPort ).toBe( true );
	} );

	it( 'parses start commands with --no-auto-port.', () => {
		cli().parse( [ 'start', '--no-auto-port' ] );
		const { autoPort } = env.start.mock.calls[ 0 ][ 0 ];
		expect( autoPort ).toBe( false );
	} );

	it( 'parses stop commands.', () => {
		cli().parse( [ 'stop' ] );
		const { spinner } = env.stop.mock.calls[ 0 ][ 0 ];
		expect( spinner.text ).toBe( '' );
	} );

	it( 'parses reset commands for the default environment.', () => {
		cli().parse( [ 'reset' ] );
		const { environment, spinner } = env.reset.mock.calls[ 0 ][ 0 ];
		expect( environment ).toBe( 'development' );
		expect( spinner.text ).toBe( '' );
	} );
	it( 'parses reset commands for all environments.', () => {
		cli().parse( [ 'reset', 'all' ] );
		const { environment, spinner } = env.reset.mock.calls[ 0 ][ 0 ];
		expect( environment ).toBe( 'all' );
		expect( spinner.text ).toBe( '' );
	} );
	it( 'parses reset commands for the development environment.', () => {
		cli().parse( [ 'reset', 'development' ] );
		const { environment, spinner } = env.reset.mock.calls[ 0 ][ 0 ];
		expect( environment ).toBe( 'development' );
		expect( spinner.text ).toBe( '' );
	} );
	it( 'parses reset commands for the tests environment.', () => {
		cli().parse( [ 'reset', 'tests' ] );
		const { environment, spinner } = env.reset.mock.calls[ 0 ][ 0 ];
		expect( environment ).toBe( 'tests' );
		expect( spinner.text ).toBe( '' );
	} );

	it( 'parses clean (deprecated) commands for the default environment.', () => {
		cli().parse( [ 'clean' ] );
		const { environment, spinner } = env.clean.mock.calls[ 0 ][ 0 ];
		expect( environment ).toBe( 'development' );
		expect( spinner.text ).toBe( '' );
	} );

	it( 'parses run commands without arguments.', () => {
		cli().parse( [ 'run', 'tests-wordpress', 'test' ] );
		const { container, command, spinner } = env.run.mock.calls[ 0 ][ 0 ];
		expect( container ).toBe( 'tests-wordpress' );
		expect( command ).toStrictEqual( [ 'test' ] );
		expect( spinner.text ).toBe( '' );
	} );
	it( 'parses run commands with variadic arguments.', () => {
		cli().parse( [ 'run', 'tests-wordpress', 'test', 'test1', '--test2' ] );
		const { container, command, spinner } = env.run.mock.calls[ 0 ][ 0 ];
		expect( container ).toBe( 'tests-wordpress' );
		expect( command ).toStrictEqual( [ 'test', 'test1', '--test2' ] );
		expect( spinner.text ).toBe( '' );
	} );

	it( 'parses destroy commands.', () => {
		cli().parse( [ 'destroy' ] );
		const { spinner, scripts, force } = env.destroy.mock.calls[ 0 ][ 0 ];
		expect( spinner.text ).toBe( '' );
		expect( scripts ).toBe( true );
		expect( force ).toBe( false );
	} );
	it( 'parses destroy commands with --force flag.', () => {
		cli().parse( [ 'destroy', '--force' ] );
		const { force } = env.destroy.mock.calls[ 0 ][ 0 ];
		expect( force ).toBe( true );
	} );

	it( 'parses cleanup commands.', () => {
		cli().parse( [ 'cleanup' ] );
		const { spinner, scripts, force } = env.cleanup.mock.calls[ 0 ][ 0 ];
		expect( spinner.text ).toBe( '' );
		expect( scripts ).toBe( true );
		expect( force ).toBe( false );
	} );
	it( 'parses cleanup commands with --force flag.', () => {
		cli().parse( [ 'cleanup', '--force' ] );
		const { force } = env.cleanup.mock.calls[ 0 ][ 0 ];
		expect( force ).toBe( true );
	} );

	it( 'handles successful commands with messages.', async () => {
		env.start.mockResolvedValueOnce( 'success message' );
		cli().parse( [ 'start' ] );
		const { spinner } = env.start.mock.calls[ 0 ][ 0 ];
		await env.start.mock.results[ 0 ].value;
		expect( spinner.succeed ).toHaveBeenCalledWith(
			expect.stringMatching( /^success message \(in \d+s \d+ms\)$/ )
		);
	} );
	it( 'handles successful commands with spinner text.', async () => {
		env.start.mockResolvedValueOnce();
		cli().parse( [ 'start' ] );
		const { spinner } = env.start.mock.calls[ 0 ][ 0 ];
		spinner.text = 'success spinner text';
		await env.start.mock.results[ 0 ].value;
		expect( spinner.succeed ).toHaveBeenCalledWith(
			expect.stringMatching( /^success spinner text \(in \d+s \d+ms\)$/ )
		);
	} );

	it( 'handles failed commands with messages.', async () => {
		env.start.mockRejectedValueOnce( {
			message: 'failure message',
		} );
		const consoleError = vi
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		cli().parse( [ 'start' ] );
		const { spinner } = env.start.mock.calls[ 0 ][ 0 ];
		await env.start.mock.results[ 0 ].value.catch( () => {} );

		expect( spinner.fail ).toHaveBeenCalledWith( 'failure message' );
		expect( consoleError ).toHaveBeenCalled();
		expect( processExit ).toHaveBeenCalledWith( 1 );
		consoleError.mockRestore();
	} );
	it( 'handles failed docker commands with errors.', async () => {
		env.start.mockRejectedValueOnce( {
			err: 'failure error',
			out: 'message',
			exitCode: 1,
		} );
		const stdout = vi
			.spyOn( process.stdout, 'write' )
			.mockImplementation( () => true );
		const stderr = vi
			.spyOn( process.stderr, 'write' )
			.mockImplementation( () => true );

		cli().parse( [ 'start' ] );
		const { spinner } = env.start.mock.calls[ 0 ][ 0 ];
		await env.start.mock.results[ 0 ].value.catch( () => {} );

		expect( spinner.fail ).toHaveBeenCalledWith(
			'Error while running docker compose command.'
		);
		expect( stdout ).toHaveBeenCalledWith( 'message' );
		expect( stderr ).toHaveBeenCalledWith( 'failure error' );
		expect( processExit ).toHaveBeenCalledWith( 1 );
		stdout.mockRestore();
		stderr.mockRestore();
	} );
} );
