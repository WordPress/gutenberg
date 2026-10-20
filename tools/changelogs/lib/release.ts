import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';
import { previewUnreleasedFragments } from './preview.ts';

const require = createRequire( import.meta.url );

/**
 * Executes a Changie command using the bundled binary.
 *
 * @param args     Arguments passed to Changie.
 * @param repoRoot Path to the Gutenberg repo root.
 * @return Execution result with stdout, stderr, and exit code.
 */
export function execChangie(
	args: string[],
	repoRoot: string = process.cwd()
) {
	const changiePkgPath = require.resolve( 'changie/package.json' );
	const changiePkg = require( changiePkgPath );
	const changieBin = path.resolve(
		path.dirname( changiePkgPath ),
		changiePkg.bin.changie
	);

	return spawnSync( 'node', [ changieBin, ...args ], {
		cwd: repoRoot,
		encoding: 'utf8',
	} );
}

/**
 * Batches an explicit release for an opted-in Changie package.
 *
 * @param packageName Target package directory name (e.g. 'components').
 * @param version     Explicit version to batch.
 * @param repoRoot    Path to the Gutenberg repo root.
 */
export function batchChangiePackage(
	packageName: string,
	version: string,
	repoRoot: string = process.cwd()
) {
	const normalized = packageName
		.replace( /^@wordpress\//, '' )
		.replace( /^packages\//, '' );
	const res = execChangie(
		[ 'batch', version, '--project', normalized ],
		repoRoot
	);
	if ( res.status !== 0 ) {
		throw new Error(
			`changie batch failed for ${ normalized }: ${ res.stderr || res.stdout }`
		);
	}
}

/**
 * Merges all Changie release files into package CHANGELOG.md files.
 *
 * @param repoRoot Path to the Gutenberg repo root.
 */
export function mergeChangieChangelogs( repoRoot: string = process.cwd() ) {
	const res = execChangie( [ 'merge' ], repoRoot );
	if ( res.status !== 0 ) {
		throw new Error(
			`changie merge failed: ${ res.stderr || res.stdout }`
		);
	}
}

/**
 * Generates an in-memory representation of pending Unreleased lines for a Changie package,
 * compatible with calculateVersionBumpFromChangelog().
 *
 * @param packageName Target package name.
 * @param repoRoot    Path to the Gutenberg repo root.
 * @return Array of changelog lines.
 */
export function getChangieUnreleasedLines(
	packageName: string,
	repoRoot: string = process.cwd()
): string[] {
	const normalized = packageName
		.replace( /^@wordpress\//, '' )
		.replace( /^packages\//, '' );
	const preview = previewUnreleasedFragments( normalized, repoRoot );
	return preview.split( /\r?\n/ );
}
