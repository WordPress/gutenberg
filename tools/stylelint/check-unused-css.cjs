#!/usr/bin/env node
'use strict';

/**
 * Wrapper around `check-unused-css` for the Gutenberg monorepo.
 *
 * The upstream CLI accepts a single directory and then globs every JS/TS file
 * under it (including `node_modules` and `build`). This wrapper discovers CSS
 * module scan roots so each invocation stays inside source trees, then runs
 * the checker once per root.
 */

const { spawnSync } = require( 'node:child_process' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const REPO_ROOT = path.join( __dirname, '../..' );

const SKIP_DIR_NAMES = new Set( [
	'.git',
	'build',
	'build-module',
	'build-style',
	'build-types',
	'coverage',
	'dist',
	'node_modules',
	'vendor',
] );

const DEFAULT_EXCLUDES = [
	'**/node_modules/**',
	'**/build/**',
	'**/build-module/**',
	'**/build-style/**',
	'**/build-types/**',
	'**/vendor/**',
	'**/test/fixtures/**',
	// Sass partials (`@use`'d by other modules, never imported from JS).
	'**/_*.module.{css,scss,sass}',
	// Shared primitives consumed via CSS Modules `composes`, which the checker
	// does not follow across files.
	'**/dropdown-motion.module.css',
	'**/overlay-chrome.module.css',
];

const CSS_MODULE_PATTERN = /\.module\.(css|scss|sass)$/;
const FLAG_WITH_VALUE = new Set( [ '--exclude', '-e' ] );

const userArgs = process.argv.slice( 2 );
const { forwarded, customTargets } = parseCliArgs( userArgs );
const targets = customTargets.length > 0 ? customTargets : discoverScanRoots();

if ( targets.length === 0 ) {
	process.stderr.write(
		'check-unused-css: no CSS module directories found.\n'
	);
	process.exit( 1 );
}

const bin = require.resolve( 'check-unused-css/dist/index.js' );
const excludeArgs = DEFAULT_EXCLUDES.flatMap( ( pattern ) => [
	'--exclude',
	pattern,
] );

let exitCode = 0;

for ( const target of targets ) {
	if ( targets.length > 1 ) {
		process.stdout.write( `\n==> ${ target }\n` );
	}

	const result = spawnSync(
		process.execPath,
		[ bin, target, ...excludeArgs, ...forwarded ],
		{
			cwd: REPO_ROOT,
			stdio: 'inherit',
		}
	);

	if ( result.error ) {
		throw result.error;
	}

	if ( result.status && result.status !== 0 && exitCode === 0 ) {
		exitCode = result.status;
	}
}

process.exit( exitCode );

/**
 * @param {string[]} args CLI arguments after the node/script path.
 * @return {{ forwarded: string[], customTargets: string[] }} Parsed args.
 */
function parseCliArgs( args ) {
	const flags = [];
	const paths = [];

	for ( let i = 0; i < args.length; i++ ) {
		const arg = args[ i ];

		if ( FLAG_WITH_VALUE.has( arg ) ) {
			flags.push( arg, args[ ++i ] );
			continue;
		}

		if ( arg.startsWith( '-' ) ) {
			flags.push( arg );
			continue;
		}

		paths.push( arg );
	}

	return { forwarded: flags, customTargets: paths };
}

/**
 * @return {string[]} Directories that contain CSS modules, relative to the repo root.
 */
function discoverScanRoots() {
	const cssFiles = [];
	collectCssModules( REPO_ROOT, cssFiles );

	const roots = new Set();

	for ( const absolutePath of cssFiles ) {
		const relativePath = path.relative( REPO_ROOT, absolutePath );

		if ( shouldSkipCssFile( relativePath ) ) {
			continue;
		}

		roots.add( getScanRoot( relativePath ) );
	}

	return [ ...roots ].sort();
}

/**
 * @param {string}   directory Absolute directory to walk.
 * @param {string[]} results   Collected CSS module paths.
 */
function collectCssModules( directory, results ) {
	let entries;

	try {
		entries = fs.readdirSync( directory, { withFileTypes: true } );
	} catch {
		return;
	}

	for ( const entry of entries ) {
		const entryPath = path.join( directory, entry.name );

		if ( entry.isDirectory() ) {
			if ( ! SKIP_DIR_NAMES.has( entry.name ) ) {
				collectCssModules( entryPath, results );
			}
			continue;
		}

		if ( entry.isFile() && CSS_MODULE_PATTERN.test( entry.name ) ) {
			results.push( entryPath );
		}
	}
}

/**
 * @param {string} relativePath Path relative to the repo root.
 * @return {boolean} Whether the CSS module should be ignored.
 */
function shouldSkipCssFile( relativePath ) {
	const parts = relativePath.split( path.sep );

	if (
		parts.includes( 'test' ) ||
		parts.includes( '__tests__' ) ||
		parts.includes( 'fixtures' )
	) {
		return true;
	}

	return path.basename( relativePath ).startsWith( '_' );
}

/**
 * @param {string} relativePath Path relative to the repo root.
 * @return {string} Directory to pass to `check-unused-css`.
 */
function getScanRoot( relativePath ) {
	const parts = relativePath.split( path.sep );
	const srcIndex = parts.indexOf( 'src' );

	if ( srcIndex !== -1 ) {
		return parts.slice( 0, srcIndex + 1 ).join( path.sep );
	}

	if ( parts[ 0 ] === 'widgets' || parts[ 0 ] === 'routes' ) {
		return parts.slice( 0, 2 ).join( path.sep );
	}

	return path.dirname( relativePath );
}
