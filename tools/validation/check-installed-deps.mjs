#!/usr/bin/env node

/**
 * Verifies that node_modules is in sync with package-lock.json by comparing
 * `package-lock.json` against `node_modules/.package-lock.json` (npm's hidden
 * lockfile, written on every install to record the actual installed tree).
 *
 * Works with both the hoisted and isolated layouts.
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

/*
 * Fast path: skip the full check if neither lockfile has changed since the
 * last successful run. Both files' mtimes are written into a cache file
 * inside node_modules (so a fresh install wipes it).
 */
let currentMtimes;
try {
	const [ lockStat, hiddenStat ] = await Promise.all( [
		fs.promises.stat( LOCKFILE ),
		fs.promises.stat( HIDDEN_LOCKFILE ),
	] );
	currentMtimes = {
		lockfile: lockStat.mtimeMs,
		hiddenLockfile: hiddenStat.mtimeMs,
	};
} catch ( err ) {
	if ( err.code === 'ENOENT' && err.path === HIDDEN_LOCKFILE ) {
		fail(
			'node_modules is missing or incomplete.',
			`\t${ path.relative( ROOT, HIDDEN_LOCKFILE ) } not found.`
		);
	}
	throw err;
}

let needsCheck = true;
try {
	const cached = JSON.parse(
		await fs.promises.readFile( CACHE_FILE, 'utf8' )
	);
	if (
		cached.lockfile === currentMtimes.lockfile &&
		cached.hiddenLockfile === currentMtimes.hiddenLockfile
	) {
		needsCheck = false;
	}
} catch {
	// No cache or unreadable — fall through to a full check.
}

if ( needsCheck ) {
	const [ lockText, hiddenText ] = await Promise.all( [
		fs.promises.readFile( LOCKFILE, 'utf8' ),
		fs.promises.readFile( HIDDEN_LOCKFILE, 'utf8' ),
	] );
	const lock = JSON.parse( lockText );
	const hidden = JSON.parse( hiddenText );

	const lockPkgs = lock.packages || {};
	const hiddenPkgs = hidden.packages || {};

	// The package name is the path segment after the final `node_modules/`.
	const NM = 'node_modules/';
	const packageName = ( pkgPath ) => {
		const i = pkgPath.lastIndexOf( NM );
		return i === -1 ? pkgPath : pkgPath.slice( i + NM.length );
	};

	/*
	 * Index installed packages by `name@version` → set of `resolved` sources.
	 */
	const installedByKey = new Map();
	for ( const [ pkgPath, info ] of Object.entries( hiddenPkgs ) ) {
		if ( info.link || ! info.version ) {
			continue;
		}
		const key = `${ packageName( pkgPath ) }@${ info.version }`;
		if ( ! installedByKey.has( key ) ) {
			installedByKey.set( key, new Set() );
		}
		installedByKey.get( key ).add( info.resolved );
	}

	const reportedMismatches = [];
	const MAX_REPORTED = 5;
	let totalMismatches = 0;

	for ( const [ pkgPath, info ] of Object.entries( lockPkgs ) ) {
		/*
		 * Skip entries without an `integrity` field — these are the root
		 * project and workspace/link packages (file: or workspace: refs),
		 * which aren't fetched from a registry and have no installed
		 * counterpart to verify.
		 */
		if ( ! info.integrity ) {
			continue;
		}

		// Optional/extraneous deps may legitimately not be installed.
		if ( info.optional || info.extraneous ) {
			continue;
		}

		/*
		 * Match by name@version. For aliases `info.name` is the real name
		 */
		const leaf = packageName( pkgPath );
		const resolvedSet =
			installedByKey.get( `${ info.name || leaf }@${ info.version }` ) ||
			installedByKey.get( `${ leaf }@${ info.version }` );

		let mismatch;
		if ( ! resolvedSet ) {
			mismatch = `missing: ${ pkgPath }`;
		} else if ( info.resolved && ! resolvedSet.has( info.resolved ) ) {
			mismatch = `source mismatch: ${ pkgPath }`;
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
				`\t... and ${
					totalMismatches - reportedMismatches.length
				} more.`
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
}

console.log( '\n   ✔ All good.' );
