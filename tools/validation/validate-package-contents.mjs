#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, posix, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const [ packagePath ] = process.argv.slice( 2 );

if ( ! packagePath ) {
	console.error(
		'Usage: node tools/validation/validate-package-contents.mjs <package-directory>'
	);
	process.exit( 1 );
}

const packageRoot = resolve( process.cwd(), packagePath );

const disallowedPathPatterns = [
	/(^|\/)(__fixtures__|__snapshots__|__tests__|fixtures|stories|test|tests)(\/|$)/,
	/(^|\/)[^/]+\.(spec|test)\.[^/]+$/,
	/(^|\/)[^/]+\.stories?\.[^/]+$/,
];

/** @typedef {{ bin?: string | Record<string, string>, exports?: unknown, main?: string, module?: string, name?: string, types?: string }} PackageJson */

/** @type {PackageJson} */
const packageJson = JSON.parse(
	readFileSync( join( packageRoot, 'package.json' ), 'utf8' )
);

/**
 * @param {string} path Package-relative path.
 * @return {string} Normalized package path.
 */
function normalizePackagePath( path ) {
	return path.replace( /^\.\//, '' );
}

/**
 * @param {string | undefined} path Package-relative type path.
 * @return {string[]} Normalized type declaration paths.
 */
function getTypePaths( path ) {
	if ( ! path ) {
		return [];
	}

	const normalizedPath = normalizePackagePath( path );

	if ( posix.extname( normalizedPath ) ) {
		return [ normalizedPath ];
	}

	return [ posix.join( normalizedPath, 'index.d.ts' ) ];
}

/**
 * @param {unknown} value Export map value.
 * @return {string[]} Export target paths.
 */
function getExportTargetPaths( value ) {
	if ( typeof value === 'string' ) {
		return [ normalizePackagePath( value ) ];
	}

	if ( Array.isArray( value ) ) {
		return value.flatMap( getExportTargetPaths );
	}

	if ( ! value || typeof value !== 'object' ) {
		return [];
	}

	return Object.values( value ).flatMap( getExportTargetPaths );
}

/**
 * @param {PackageJson['bin']} bin Package bin metadata.
 * @return {string[]} Bin target paths.
 */
function getBinTargetPaths( bin ) {
	if ( typeof bin === 'string' ) {
		return [ normalizePackagePath( bin ) ];
	}

	if ( ! bin || typeof bin !== 'object' ) {
		return [];
	}

	return Object.values( bin ).map( normalizePackagePath );
}

const packageTargetPaths = [
	...( packageJson.main ? [ normalizePackagePath( packageJson.main ) ] : [] ),
	...( packageJson.module
		? [ normalizePackagePath( packageJson.module ) ]
		: [] ),
	...getTypePaths( packageJson.types ),
	...getBinTargetPaths( packageJson.bin ),
	...getExportTargetPaths( packageJson.exports ),
];

const env = {
	...process.env,
	npm_config_cache:
		process.env.WORDPRESS_PACKAGE_NPM_CACHE ??
		process.env.WORDPRESS_THEME_NPM_CACHE ??
		join( tmpdir(), 'wordpress-package-npm-cache' ),
};

const npmExecPath = process.env.npm_execpath;
const packCommand = npmExecPath ? process.execPath : 'npm';
const packArgs = [
	...( npmExecPath ? [ npmExecPath ] : [] ),
	'pack',
	'--dry-run',
	'--json',
];

const packResult = spawnSync( packCommand, packArgs, {
	cwd: packageRoot,
	encoding: 'utf8',
	env,
	shell: ! npmExecPath && process.platform === 'win32',
} );

if ( packResult.error ) {
	throw packResult.error;
}

if ( packResult.status !== 0 ) {
	process.stderr.write( packResult.stdout ?? '' );
	process.stderr.write( packResult.stderr ?? '' );
	process.exit( packResult.status ?? 1 );
}

/** @type {Array<{ files: Array<{ path: string }> }>} */
const packs = JSON.parse( packResult.stdout );
const [ pack ] = packs;
const packedPaths = pack.files.map( ( { path } ) => path );
const packedPathSet = new Set( packedPaths );

const missingPackageTargetPaths = [ ...new Set( packageTargetPaths ) ].filter(
	( path ) => ! packedPathSet.has( path )
);
const disallowedPaths = packedPaths.filter( ( path ) =>
	disallowedPathPatterns.some( ( pattern ) => pattern.test( path ) )
);

if (
	packedPaths.length === 0 ||
	missingPackageTargetPaths.length ||
	disallowedPaths.length
) {
	if ( packedPaths.length === 0 ) {
		console.error( 'The package tarball does not include any files.' );
	}

	if ( missingPackageTargetPaths.length ) {
		console.error(
			[
				'The package tarball is missing package metadata targets:',
				...missingPackageTargetPaths.map( ( path ) => `- ${ path }` ),
			].join( '\n' )
		);
	}

	if ( disallowedPaths.length ) {
		console.error(
			[
				'The package tarball includes disallowed files:',
				...disallowedPaths.map( ( path ) => `- ${ path }` ),
			].join( '\n' )
		);
	}

	process.exit( 1 );
}

console.log(
	`Validated ${ packedPaths.length } packed files for ${
		packageJson.name ?? packageRoot
	}.`
);
