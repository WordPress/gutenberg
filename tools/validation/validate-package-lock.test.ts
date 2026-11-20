import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, test } from 'vitest';

const validatorPath = fileURLToPath(
	new URL( 'validate-package-lock.cjs', import.meta.url )
);

const temporaryRoots: string[] = [];

afterEach( () => {
	for ( const root of temporaryRoots.splice( 0 ) ) {
		rmSync( root, { force: true, recursive: true } );
	}
} );

/**
 * Writes a lockfile holding the given `packages` entries and runs the
 * validator against it.
 *
 * @param packages Lockfile `packages` entries, keyed by path.
 * @return Exit status and combined output.
 */
function validate( packages: Record< string, Record< string, unknown > > ) {
	const root = mkdtempSync( join( tmpdir(), 'validate-package-lock-' ) );
	temporaryRoots.push( root );
	const lockfilePath = join( root, 'package-lock.json' );
	writeFileSync(
		lockfilePath,
		JSON.stringify( { lockfileVersion: 3, packages } )
	);

	const result = spawnSync(
		process.execPath,
		[ validatorPath, lockfilePath ],
		{
			encoding: 'utf8',
		}
	);
	return {
		status: result.status,
		output: result.stdout + result.stderr,
	};
}

test( 'passes when caniuse-lite resolves to one version', () => {
	const { status } = validate( {
		'': {},
		'node_modules/caniuse-lite': { version: '1.0.30001810' },
		'node_modules/browserslist': { version: '4.28.0' },
	} );

	expect( status ).toBe( 0 );
} );

test( 'fails when caniuse-lite resolves to more than one version', () => {
	const { status, output } = validate( {
		'': {},
		'node_modules/caniuse-lite': { version: '1.0.30001810' },
		'node_modules/browserslist/node_modules/caniuse-lite': {
			version: '1.0.30001148',
		},
	} );

	expect( status ).toBe( 1 );
	expect( output ).toContain( '1.0.30001810' );
	expect( output ).toContain( '1.0.30001148' );
	expect( output ).toContain(
		'node_modules/browserslist/node_modules/caniuse-lite'
	);
} );

test( 'ignores caniuse-lite version ranges in a package dependencies field', () => {
	const { status } = validate( {
		'': {},
		'node_modules/caniuse-lite': { version: '1.0.30001810' },
		'node_modules/browserslist': {
			version: '4.28.0',
			dependencies: { 'caniuse-lite': '^1.0.30001702' },
		},
	} );

	expect( status ).toBe( 0 );
} );

test( 'does not flag other packages that appear in several versions', () => {
	const { status } = validate( {
		'': {},
		'node_modules/caniuse-lite': { version: '1.0.30001810' },
		'node_modules/semver': { version: '7.7.0' },
		'node_modules/foo/node_modules/semver': { version: '6.3.1' },
	} );

	expect( status ).toBe( 0 );
} );

test( 'still rejects a package with "resolved": false', () => {
	const { status, output } = validate( {
		'': {},
		'node_modules/caniuse-lite': {
			version: '1.0.30001810',
			resolved: false,
		},
	} );

	expect( status ).toBe( 1 );
	expect( output ).toContain( 'Invalid resolved dependency' );
} );
