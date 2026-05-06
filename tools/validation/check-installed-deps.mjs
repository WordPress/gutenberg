#!/usr/bin/env node

/**
 * Verifies that node_modules is in sync with package-lock.json by comparing
 * `package-lock.json` against `node_modules/.package-lock.json` (npm's hidden
 * lockfile, written on every install to record the actual installed tree).
 *
 * Exits non-zero with a hint to run `npm install` if the trees diverge.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT = path.resolve( __dirname, '../..' );
const LOCKFILE = path.join( ROOT, 'package-lock.json' );
const HIDDEN_LOCKFILE = path.join( ROOT, 'node_modules', '.package-lock.json' );

const verbose = process.argv.includes( '--verbose' );

function fail( summary, details = '' ) {
	let msg = `\n   ⚠️  Dependencies are out of sync: ${ summary }`;
	if ( verbose && details ) {
		msg += os.EOL + details;
	}
	console.error( msg );
	process.exit( 1 );
}

if ( ! fs.existsSync( HIDDEN_LOCKFILE ) ) {
	fail(
		'node_modules is missing or incomplete.',
		`\t${ path.relative( ROOT, HIDDEN_LOCKFILE ) } not found.`
	);
}

const lock = JSON.parse( fs.readFileSync( LOCKFILE, 'utf8' ) );
const hidden = JSON.parse( fs.readFileSync( HIDDEN_LOCKFILE, 'utf8' ) );

const lockPkgs = lock.packages || {};
const hiddenPkgs = hidden.packages || {};

const mismatches = [];
const MAX_REPORTED = 5;

for ( const [ pkgPath, info ] of Object.entries( lockPkgs ) ) {
	/*
	 * Skip entries without an `integrity` field — these are the root project
	 * and workspace/link packages (file: or workspace: refs), which aren't
	 * fetched from a registry and have no installed counterpart to verify.
	 */
	if ( ! info.integrity ) {
		continue;
	}

	const installed = hiddenPkgs[ pkgPath ];

	/*
	 * Optional dependencies legitimately go uninstalled on platforms they
	 * don't apply to (e.g. macOS-only fsevents on Linux). Only flag a missing
	 * optional package if the hidden lockfile records it with a different
	 * integrity — that would indicate a real drift, not a platform skip.
	 */
	if ( ! installed ) {
		if ( ! info.optional ) {
			mismatches.push( `missing: ${ pkgPath }` );
		}
		continue;
	}

	if ( installed.integrity !== info.integrity ) {
		mismatches.push( `version mismatch: ${ pkgPath }` );
	}

	if ( mismatches.length >= MAX_REPORTED ) {
		break;
	}
}

if ( mismatches.length > 0 ) {
	const count = mismatches.length;
	fail(
		`Mismatches found: ${ count }`,
		mismatches.map( ( m ) => `\t${ m }` ).join( os.EOL )
	);
}

console.log( '\n   ✔ All good.' );
