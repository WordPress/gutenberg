const path = require( 'path' );
const { spawnSync } = require( 'child_process' );

const cliPath = path.resolve( __dirname, '../cli.js' );
/*
 * Resolve from this file: an `-e` script resolves requires from the cwd,
 * which is the repo root under Jest and has no `commander` installed.
 */
const commanderPath = require.resolve( 'commander' );
const script = `
	const { Command } = require( ${ JSON.stringify( commanderPath ) } );
	const { run } = require( ${ JSON.stringify( cliPath ) } );
	const program = new Command();
	program.command( 'reject' ).action( async () => {
		await Promise.resolve();
		throw new Error( 'Unable to generate the changelog.' );
	} );
	run( [ 'node', 'release-cli', 'reject' ], program );
`;

function runRejectedCommand( debug = false ) {
	return spawnSync( process.execPath, [ '-e', script ], {
		encoding: 'utf8',
		env: {
			...process.env,
			DEBUG: debug ? '1' : '',
		},
	} );
}

describe( 'release CLI', () => {
	it( 'waits for rejected async commands and reports a clean failure', () => {
		const result = runRejectedCommand();

		expect( result.status ).toBe( 1 );
		expect( result.stdout ).toBe( '' );
		expect( result.stderr ).toBe( 'Unable to generate the changelog.\n' );
	} );

	it( 'prints the stack to stderr when debugging is enabled', () => {
		const result = runRejectedCommand( true );

		expect( result.status ).toBe( 1 );
		expect( result.stdout ).toBe( '' );
		expect( result.stderr ).toMatch(
			/^Error: Unable to generate the changelog\.\n\s+at /
		);
	} );
} );
