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
 * The base ref defaults to `origin/trunk`. The diff is computed against the
 * merge-base of HEAD and the base ref (matching how PR diffs work), so changes
 * that landed on the base branch after this branch diverged don't produce
 * false positives. Moves between dependency fields (e.g. devDependencies →
 * dependencies) are not flagged.
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

function git( args, errorContext ) {
	try {
		return execFileSync( 'git', args, {
			encoding: 'utf8',
			stdio: [ 'ignore', 'pipe', 'pipe' ],
		} ).trim();
	} catch ( error ) {
		console.error( `error: ${ errorContext }: ${ error.message.trim() }` );
		process.exit( 2 );
	}
}

// Build a map of dependency name → first field it appears in. Membership is
// what matters, so a name listed in multiple fields collapses to one entry.
function depNames( pkg ) {
	const result = new Map();
	for ( const field of FIELDS ) {
		for ( const name of Object.keys( pkg[ field ] || {} ) ) {
			if ( ! result.has( name ) ) {
				result.set( name, field );
			}
		}
	}
	return result;
}

const mergeBase = git(
	[ 'merge-base', 'HEAD', baseRef ],
	`unable to compute merge-base between HEAD and "${ baseRef }"`
);

const baseJson = JSON.parse(
	git(
		[ 'show', `${ mergeBase }:package.json` ],
		`unable to read package.json at merge-base ${ mergeBase }`
	)
);
const headJson = JSON.parse( fs.readFileSync( ROOT_PACKAGE_JSON, 'utf8' ) );

const baseNames = depNames( baseJson );
const headNames = depNames( headJson );

const added = [];
for ( const [ name, field ] of headNames ) {
	if ( ! baseNames.has( name ) ) {
		added.push( { name, field } );
	}
}

if ( added.length === 0 ) {
	console.log( '✔ No new root dependencies.' );
	process.exit( 0 );
}

const list = added
	.map( ( { name, field } ) => `  - ${ name } (${ field })` )
	.join( '\n' );

console.error( `
✖ New dependencies were added to the root package.json:

${ list }

Please declare dependencies in the workspace that uses them, not at the repo root — add the dependency to an existing workspace under tools/ or test/, or create a new workspace if no existing one fits.

See: ${ GUIDE_URL }
` );
process.exit( 1 );
