#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Install repo-recommended VS Code settings.
 *
 * Cross-platform replacement for a shell script: invoked from `.vscode/tasks.json`
 * on folder open. Runs on Windows, macOS, and Linux without a POSIX shell.
 *
 * Exit codes:
 *   0: All is well (or user has custom settings we shouldn't touch)
 *   1: Repo settings template is missing
 *   2: Settings file creation failed
 */

import { readFileSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(
	dirname( fileURLToPath( import.meta.url ) ),
	'..',
	'..'
);
const templateFile = join( repoRoot, '.vscode', 'settings.dist.jsonc' );
const destFile = join( repoRoot, '.vscode', 'settings.json' );
const managedComment = '// This is a managed VS Code settings file.';

if ( ! existsSync( templateFile ) ) {
	console.error( 'Repo settings template is missing; aborting.' );
	process.exit( 1 );
}

const template = readFileSync( templateFile, 'utf8' );

if ( existsSync( destFile ) ) {
	const current = readFileSync( destFile, 'utf8' );
	if ( current === template ) {
		console.log( 'Managed settings are up to date; no changes needed.' );
		process.exit( 0 );
	}
	if ( ! current.startsWith( managedComment ) ) {
		console.log( 'Custom settings file; aborting.' );
		process.exit( 0 );
	}
}

try {
	copyFileSync( templateFile, destFile );
} catch ( err ) {
	console.error( 'Error copying settings into place!', err );
	process.exit( 2 );
}

if ( readFileSync( destFile, 'utf8' ) !== template ) {
	console.error( 'Error copying settings into place!' );
	process.exit( 2 );
}

console.log( 'Copied managed settings into place.' );
/* eslint-enable no-console */
