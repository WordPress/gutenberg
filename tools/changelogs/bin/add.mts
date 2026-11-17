#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadChangieConfig } from '../lib/config.ts';
import { validateFragment } from '../lib/validate.ts';

const require = createRequire( import.meta.url );
const changiePkgPath = require.resolve( 'changie/package.json' );
const changiePkg = require( changiePkgPath );
const changieBin = path.resolve(
	path.dirname( changiePkgPath ),
	changiePkg.bin.changie
);

/**
 * Creates fragments with Changie and validates new or updated files.
 *
 * @param args     Arguments passed to Changie.
 * @param repoRoot Repository root.
 * @return Exit status.
 */
export function run(
	args: string[],
	repoRoot = path.resolve( import.meta.dirname, '../../..' )
): number {
	const config = loadChangieConfig( repoRoot );
	const directory = path.resolve(
		repoRoot,
		config.changesDir || '.changes',
		config.unreleasedDir || 'unreleased'
	);
	const before = new Map< string, string >();
	if ( fs.existsSync( directory ) ) {
		for ( const file of fs
			.readdirSync( directory )
			.filter( ( name ) => name.endsWith( '.yaml' ) ) ) {
			before.set(
				file,
				fs.readFileSync( path.join( directory, file ), 'utf8' )
			);
		}
	}
	const result = spawnSync( 'node', [ changieBin, 'new', ...args ], {
		stdio: 'inherit',
		cwd: repoRoot,
	} );
	if ( result.error ) {
		throw result.error;
	}
	if ( result.status !== 0 ) {
		return result.status ?? 1;
	}
	let hasErrors = false;
	if ( fs.existsSync( directory ) ) {
		for ( const file of fs
			.readdirSync( directory )
			.filter( ( name ) => name.endsWith( '.yaml' ) ) ) {
			const filePath = path.join( directory, file );
			const content = fs.readFileSync( filePath, 'utf8' );
			if ( before.get( file ) === content ) {
				continue;
			}
			for ( const error of validateFragment(
				filePath,
				content,
				{},
				repoRoot
			) ) {
				console.error( error );
				hasErrors = true;
			}
		}
	}
	return hasErrors ? 1 : 0;
}

if (
	process.argv[ 1 ] &&
	import.meta.url === pathToFileURL( path.resolve( process.argv[ 1 ] ) ).href
) {
	process.exitCode = run( process.argv.slice( 2 ) );
}
