#!/usr/bin/env node
/**
 * Tells whether `build/` was made from the source as it is now. The build
 * writes a hash of the source next to its output; running this file compares
 * it with the source now and warns when they differ.
 */
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import {
	copyFileSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../..'
);
const STAMP_PATH = path.join( ROOT_DIR, 'build', '.source-hash' );

// The files `wp-build --watch` rebuilds on.
const SOURCE = [
	':(glob)packages/*/src/**',
	':(glob)routes/**',
	':(glob)widgets/**',
	':(glob,exclude)**/__mocks__/**',
	':(glob,exclude)**/__tests__/**',
	':(glob,exclude)**/test/**',
	':(glob,exclude)**/storybook/**',
	':(glob,exclude)**/stories/**',
	':(glob,exclude)**/*.spec.*',
	':(glob,exclude)**/*.test.*',
];

/**
 * Hashes the source files as they are on disk, edits and new files included,
 * by adding them to a copy of git's index.
 *
 * @return The hash.
 */
export function hashSource(): string {
	const git = ( args: string[], env?: NodeJS.ProcessEnv ) =>
		execFileSync( 'git', args, {
			cwd: ROOT_DIR,
			encoding: 'utf8',
			env: { ...process.env, ...env },
		} );
	const tempDir = mkdtempSync( path.join( tmpdir(), 'build-stamp-' ) );
	const index = path.join( tempDir, 'index' );
	try {
		copyFileSync(
			path.resolve(
				ROOT_DIR,
				git( [ 'rev-parse', '--git-path', 'index' ] ).trim()
			),
			index
		);
		git( [ 'add', '--all', '--', ...SOURCE ], { GIT_INDEX_FILE: index } );
		return createHash( 'sha1' )
			.update(
				git( [ 'ls-files', '--stage', '--', ...SOURCE ], {
					GIT_INDEX_FILE: index,
				} )
			)
			.digest( 'hex' );
	} finally {
		rmSync( tempDir, { recursive: true } );
	}
}

/**
 * Records that `build/` was made from the source with this hash.
 *
 * @param hash From `hashSource()`, taken before the build read the source.
 */
export function writeBuildStamp( hash: string ) {
	writeFileSync( STAMP_PATH, hash );
}

if ( process.argv[ 1 ] === fileURLToPath( import.meta.url ) ) {
	let stamp: string | undefined;
	try {
		stamp = readFileSync( STAMP_PATH, 'utf8' );
	} catch {}
	if ( stamp !== hashSource() ) {
		console.warn(
			'⚠️  The build is older than the source. Run `npm run build`, or wait for `npm run dev` to finish rebuilding.'
		);
	}
}
