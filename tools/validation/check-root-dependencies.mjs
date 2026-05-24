#!/usr/bin/env node

/**
 * Fails when a PR adds new entries to `dependencies` or `devDependencies` in
 * the root package.json. New dependencies should be declared in the workspace
 * that uses them — under `tools/` or `test/` — not at the repo root.
 *
 * See docs/contributors/code/workspace-development.md.
 *
 * Usage:
 *   node tools/validation/check-root-dependencies.mjs --base <ref>
 *
 * The base ref defaults to `origin/trunk` when not provided.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT = path.resolve( __dirname, '../..' );
const ROOT_PACKAGE_JSON = path.join( ROOT, 'package.json' );
const FIELDS = [ 'dependencies', 'devDependencies' ];
const GUIDE_URL =
	'https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/workspace-development.md';

let baseRef;
try {
	baseRef = parseArgs( {
		options: {
			base: { type: 'string', default: 'origin/trunk' },
		},
	} ).values.base;
} catch ( error ) {
	console.error( `error: ${ error.message }` );
	process.exit( 2 );
}

function readDeps( source, json ) {
	const result = {};
	for ( const field of FIELDS ) {
		result[ field ] = json[ field ] || {};
	}
	return { source, ...result };
}

function readHeadDeps() {
	const json = JSON.parse( fs.readFileSync( ROOT_PACKAGE_JSON, 'utf8' ) );
	return readDeps( 'HEAD', json );
}

function readBaseDeps() {
	let text;
	try {
		text = execFileSync( 'git', [ 'show', `${ baseRef }:package.json` ], {
			encoding: 'utf8',
			stdio: [ 'ignore', 'pipe', 'pipe' ],
		} );
	} catch ( error ) {
		console.error(
			`error: unable to read package.json at base ref "${ baseRef }": ${ error.message.trim() }`
		);
		process.exit( 2 );
	}
	return readDeps( baseRef, JSON.parse( text ) );
}

const head = readHeadDeps();
const base = readBaseDeps();

const added = [];
for ( const field of FIELDS ) {
	for ( const name of Object.keys( head[ field ] ) ) {
		if ( ! ( name in base[ field ] ) ) {
			added.push( { field, name } );
		}
	}
}

if ( added.length === 0 ) {
	console.log( '✔ No new root dependencies.' );
	process.exit( 0 );
}

const list = added
	.map( ( { field, name } ) => `  - ${ name } (${ field })` )
	.join( '\n' );

console.error( `
✖ New dependencies were added to the root package.json:

${ list }

It is recommended to declare dependencies in the workspace that uses them, not at the repo root.
Add the dependency to an existing workspace under tools/ or test/, or create a new workspace if no existing one fits.

See: ${ GUIDE_URL }
` );
process.exit( 1 );
