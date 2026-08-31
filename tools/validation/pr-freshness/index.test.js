/* global expect, test */
const { spawnSync } = require( 'node:child_process' );
const { join } = require( 'node:path' );

const cliPath = join( __dirname, 'index.mjs' );

/**
 * Runs the CLI with the given arguments and environment overrides.
 *
 * @param {string[]}               args Command-line arguments.
 * @param {Record<string, string>} env  Environment variable overrides.
 * @return {{ status: number | null, stderr: string, stdout: string }} Result.
 */
function run( args, env = {} ) {
	const { status, stderr, stdout } = spawnSync(
		'node',
		[ cliPath, ...args ],
		{
			encoding: 'utf8',
			env: {
				...process.env,
				GITHUB_REPOSITORY: '',
				GITHUB_TOKEN: '',
				...env,
			},
		}
	);
	return { status, stderr, stdout };
}

test( 'prints usage without requiring credentials', () => {
	const { status, stderr } = run( [] );
	expect( status ).toBe( 1 );
	expect( stderr ).toContain( 'Usage: pr-freshness' );
	expect( stderr ).not.toContain( 'GITHUB_REPOSITORY' );
} );

test( 'rejects an unknown subcommand with usage', () => {
	const { status, stderr } = run( [ 'frobnicate' ] );
	expect( status ).toBe( 1 );
	expect( stderr ).toContain( 'Usage: pr-freshness' );
} );

test( 'rejects a non-boolean --force value without requiring credentials', () => {
	const { status, stderr } = run( [ 'move-baseline', '--force=maybe' ] );
	expect( status ).toBe( 1 );
	expect( stderr ).toContain( '--force accepts only' );
	expect( stderr ).not.toContain( 'GITHUB_REPOSITORY' );
} );

test( 'rejects a negative --bootstrap-window', () => {
	const { status, stderr } = run( [ 'fanout', '--bootstrap-window=-1' ] );
	expect( status ).toBe( 1 );
	expect( stderr ).toContain( '--bootstrap-window' );
} );

test( 'requires credentials only for a valid subcommand', () => {
	const { status, stderr } = run( [ 'fanout', '--mode=flip' ] );
	expect( status ).toBe( 1 );
	expect( stderr ).toContain(
		'GITHUB_REPOSITORY and GITHUB_TOKEN must be set.'
	);
} );
