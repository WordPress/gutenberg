#!/usr/bin/env node

/**
 * External dependencies
 */
import spawn from 'cross-spawn';
import path from 'path';
import { rimraf } from 'rimraf';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../..' );

const { values } = parseArgs( {
	options: {
		packages: { type: 'boolean', default: false },
		types: { type: 'boolean', default: false },
	},
	strict: false,
} );

if ( ! values.packages && ! values.types ) {
	console.error( 'Usage: node ./clean.mjs [--packages] [--types]' );
	process.exit( 1 );
}

/**
 * Remove paths matching the given globs, resolved from the repository root.
 *
 * @param {string[]} patterns Glob patterns.
 * @return {Promise<void>} Promise that resolves once the paths are removed.
 */
function remove( patterns ) {
	return rimraf( patterns, { glob: { cwd: ROOT_DIR, absolute: true } } );
}

if ( values.types ) {
	/*
	 * TypeScript tracks its own output through `.tsbuildinfo` files, so it has to
	 * remove those itself before the emitted directories are deleted.
	 */
	const { status } = spawn.sync( 'tsc', [ '--build', '--clean' ], {
		cwd: ROOT_DIR,
		stdio: 'inherit',
	} );

	if ( status !== 0 ) {
		process.exit( status ?? 1 );
	}

	await remove( [ 'packages/*/build-types' ] );
}

if ( values.packages ) {
	await remove( [
		'packages/*/{build,build-module,build-wp,build-style}',
		'build',
	] );
}
