/**
 * External dependencies
 */
const path = require( 'path' );
const { spawnSync } = require( 'child_process' );

describe( 'release CLI', () => {
	it( 'waits for rejected async commands and reports a clean failure', () => {
		const cliPath = path.resolve( __dirname, '../cli.js' );
		const script = `
			const { Command } = require( 'commander' );
			const { run } = require( ${ JSON.stringify( cliPath ) } );
			const program = new Command();
			program.command( 'reject' ).action( async () => {
				await Promise.resolve();
				throw new Error( 'Unable to generate the changelog.' );
			} );
			run( [ 'node', 'release-cli', 'reject' ], program );
		`;

		const result = spawnSync( process.execPath, [ '-e', script ], {
			encoding: 'utf8',
		} );

		expect( result.status ).toBe( 1 );
		expect( result.stdout ).toBe( '' );
		expect( result.stderr ).toBe( 'Unable to generate the changelog.\n' );
	} );
} );
