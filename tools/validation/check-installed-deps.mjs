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
const CACHE_FILE = path.join(
	ROOT,
	'node_modules',
	'.check-installed-deps.cache.json'
);

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

/*
 * Fast path: skip the full check if neither lockfile has changed since the
 * last successful run. Both files' mtimes are written into a cache file
 * inside node_modules (so a fresh install wipes it). `--verbose` always
 * forces a fresh check so debug output reflects the current state.
 */
const currentMtimes = {
	lockfile: fs.statSync( LOCKFILE ).mtimeMs,
	hiddenLockfile: fs.statSync( HIDDEN_LOCKFILE ).mtimeMs,
};

if ( ! verbose ) {
	let cached;
	try {
		cached = JSON.parse( fs.readFileSync( CACHE_FILE, 'utf8' ) );
	} catch {
		cached = null;
	}
	if (
		cached &&
		cached.lockfile === currentMtimes.lockfile &&
		cached.hiddenLockfile === currentMtimes.hiddenLockfile
	) {
		console.log( '\n   ✔ All good.' );
		process.exit( 0 );
	}
}

const lock = JSON.parse( fs.readFileSync( LOCKFILE, 'utf8' ) );
const hidden = JSON.parse( fs.readFileSync( HIDDEN_LOCKFILE, 'utf8' ) );

const lockPkgs = lock.packages || {};
const hiddenPkgs = hidden.packages || {};

const reportedMismatches = [];
const MAX_REPORTED = 5;
let totalMismatches = 0;

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

	let mismatch;
	if ( ! installed ) {
		/*
		 * Optional deps may be skipped by npm on the current platform
		 * (e.g. macOS-only fsevents on Linux). Don't flag them as missing.
		 * Real drift on an optional dep would still be caught below as
		 * an integrity mismatch.
		 */
		if ( info.optional ) {
			continue;
		}
		mismatch = `missing: ${ pkgPath }`;
	} else if ( installed.integrity !== info.integrity ) {
		mismatch = `integrity mismatch: ${ pkgPath }`;
	}

	if ( ! mismatch ) {
		continue;
	}

	totalMismatches++;
	if ( reportedMismatches.length < MAX_REPORTED ) {
		reportedMismatches.push( mismatch );
	}
}

if ( totalMismatches > 0 ) {
	const detailLines = reportedMismatches.map( ( m ) => `\t${ m }` );
	if ( totalMismatches > reportedMismatches.length ) {
		detailLines.push(
			`\t... and ${ totalMismatches - reportedMismatches.length } more.`
		);
	}
	fail(
		`Mismatches found: ${ totalMismatches }`,
		detailLines.join( os.EOL )
	);
}

try {
	fs.writeFileSync( CACHE_FILE, JSON.stringify( currentMtimes ) );
} catch {
	// Cache write failure is not fatal — we'll just re-check next time.
}

console.log( '\n   ✔ All good.' );
