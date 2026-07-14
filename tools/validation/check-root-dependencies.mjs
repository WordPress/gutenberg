#!/usr/bin/env node

/**
 * Fails when a PR adds new entries to `dependencies` or `devDependencies` in
 * the root package.json. New dependencies should be declared in the workspace
 * that uses them (e.g. under `packages/`, `tools/`, or `test/`), not at the
 * repo root.
 *
 * See docs/contributors/code/workspace-development.md.
 *
 * Usage:
 *   node tools/validation/check-root-dependencies.mjs --base <ref>
 *
 * The base ref defaults to `origin/trunk`. The diff is computed against the
 * merge-base of HEAD and the base ref (matching how PR diffs work), so changes
 * that landed on the base branch after this branch diverged don't produce
 * false positives. On a shallow checkout it falls back to the base ref, which
 * on a pull_request merge ref is the merge-base anyway. Moves between
 * dependency fields (e.g. devDependencies → dependencies) are not flagged.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import SimpleGit from 'simple-git';

const ROOT = path.resolve( import.meta.dirname, '../..' );
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

const git = SimpleGit( ROOT );

async function tryGit( fn, errorContext ) {
	try {
		return await fn();
	} catch ( error ) {
		const message = String( error?.message ?? error ).trim();
		console.error( `error: ${ errorContext }: ${ message }` );
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

/*
 * Use the merge-base, or the base ref directly when it's unreachable (shallow
 * checkout). simple-git returns "" instead of throwing for no common ancestor;
 * guard against it so `git show` never reads the index.
 */
let compareRef = baseRef;
try {
	const mergeBase = await git.raw( [ 'merge-base', 'HEAD', baseRef ] );
	if ( mergeBase.trim() ) {
		compareRef = mergeBase.trim();
	}
} catch {
	// Shallow checkout: no shared history. Use the base ref directly.
}

const baseJson = JSON.parse(
	await tryGit(
		() => git.show( [ `${ compareRef }:package.json` ] ),
		`unable to read package.json at ${ compareRef }`
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

Please declare dependencies in the workspace that uses them, not at the repo root. Add the dependency to an existing workspace (e.g. under packages/, tools/, or test/), or create a new one if no existing workspace fits.

See: ${ GUIDE_URL }
` );
process.exit( 1 );
