'use strict';
/**
 * Internal dependencies
 */
const cli = require( '../lib/cli' );
const env = require( '../lib/env' );

/**
 * Mocked dependencies
 */
jest.mock( 'ora', () => () => ( {
	start() {
		return { text: '', succeed: jest.fn(), fail: jest.fn() };
	},
} ) );
jest.mock( '../lib/env', () => ( {
	start: jest.fn( Promise.resolve.bind( Promise ) ),
	stop: jest.fn( Promise.resolve.bind( Promise ) ),
	clean: jest.fn( Promise.resolve.bind( Promise ) ),
	ValidationError: jest.requireActual( '../lib/env' ).ValidationError,
} ) );

describe( 'env cli', () => {
	beforeEach( jest.clearAllMocks );

	it( 'parses start commands.', () => {
		cli().parse( [ 'start' ] );
		const { spinner } = env.start.mock.calls[ 0 ][ 0 ];
		expect( spinner.text ).toBe( '' );
	} );

	it( 'parses stop commands.', () => {
		cli().parse( [ 'stop' ] );
		const { spinner } = env.stop.mock.calls[ 0 ][ 0 ];
		expect( spinner.text ).toBe( '' );
	} );

	it( 'parses clean commands for the default environment.', () => {
		cli().parse( [ 'clean' ] );
		const { environment, spinner } = env.clean.mock.calls[ 0 ][ 0 ];
		expect( environment ).toBe( 'tests' );
		expect( spinner.text ).toBe( '' );
	} );
	it( 'parses clean commands for all environments.', () => {
		cli().parse( [ 'clean', 'all' ] );
		const { environment, spinner } = env.clean.mock.calls[ 0 ][ 0 ];
		expect( environment ).toBe( 'all' );
		expect( spinner.text ).toBe( '' );
	} );
	it( 'parses clean commands for the development environment.', () => {
		cli().parse( [ 'clean', 'development' ] );
		const { environment, spinner } = env.clean.mock.calls[ 0 ][ 0 ];
		expect( environment ).toBe( 'development' );
		expect( spinner.text ).toBe( '' );
	} );
	it( 'parses clean commands for the tests environment.', () => {
		cli().parse( [ 'clean', 'tests' ] );
		const { environment, spinner } = env.clean.mock.calls[ 0 ][ 0 ];
		expect( environment ).toBe( 'tests' );
		expect( spinner.text ).toBe( '' );
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
		/* eslint-disable no-console */
		env.start.mockRejectedValueOnce( {
			message: 'failure message',
			out: 'failure message',
			exitCode: 2,
		} );
		const consoleError = console.error;
		console.error = jest.fn();
		const processExit = process.exit;
		process.exit = jest.fn();

		cli().parse( [ 'start' ] );
		const { spinner } = env.start.mock.calls[ 0 ][ 0 ];
		await env.start.mock.results[ 0 ].value.catch( () => {} );

		expect( spinner.fail ).toHaveBeenCalledWith( 'failure message' );
		expect( console.error ).toHaveBeenCalled();
		expect( process.exit ).toHaveBeenCalledWith( 2 );
		console.error = consoleError;
		process.exit = processExit;
		/* eslint-enable no-console */
	} );
	it( 'handles failed commands with errors.', async () => {
		/* eslint-disable no-console */
		env.start.mockRejectedValueOnce( { err: 'failure error' } );
		const consoleError = console.error;
		console.error = jest.fn();
		const processExit = process.exit;
		process.exit = jest.fn();

		cli().parse( [ 'start' ] );
		const { spinner } = env.start.mock.calls[ 0 ][ 0 ];
		await env.start.mock.results[ 0 ].value.catch( () => {} );

		expect( spinner.fail ).toHaveBeenCalledWith( 'failure error' );
		expect( console.error ).toHaveBeenCalled();
		expect( process.exit ).toHaveBeenCalledWith( 1 );
		console.error = consoleError;
		process.exit = processExit;
		/* eslint-enable no-console */
	} );
} );
