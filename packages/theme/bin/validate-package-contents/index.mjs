import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(
	dirname( fileURLToPath( import.meta.url ) ),
	'../..'
);

const disallowedPathPatterns = [
	/(^|\/)(__fixtures__|__snapshots__|__tests__|fixtures|stories|test|tests)(\/|$)/,
	/(^|\/)[^/]+\.(spec|test)\.[^/]+$/,
	/(^|\/)[^/]+\.stories?\.[^/]+$/,
	/^build-types\/color-ramps\//,
	/^build-types\/context\.d\.ts(\.map)?$/,
	/^build-types\/postcss-plugins\//,
	/^build-types\/use-theme-provider-styles\.d\.ts(\.map)?$/,
	/^src\/style\.module\.css$/,
];

/** @typedef {{ exports?: unknown, main?: string, module?: string, types?: string }} PackageJson */

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

	if ( ! value || typeof value !== 'object' || Array.isArray( value ) ) {
		return [];
	}

	return Object.values( value ).flatMap( getExportTargetPaths );
}

const packageTargetPaths = [
	...( packageJson.main ? [ normalizePackagePath( packageJson.main ) ] : [] ),
	...( packageJson.module
		? [ normalizePackagePath( packageJson.module ) ]
		: [] ),
	...getTypePaths( packageJson.types ),
	...getExportTargetPaths( packageJson.exports ),
];

const env = {
	...process.env,
	npm_config_cache:
		process.env.WORDPRESS_THEME_NPM_CACHE ??
		join( tmpdir(), 'wordpress-theme-npm-cache' ),
};
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const packResult = spawnSync( npmCommand, [ 'pack', '--dry-run', '--json' ], {
	cwd: packageRoot,
	encoding: 'utf8',
	env,
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
	`Validated ${ packedPaths.length } packed files for @wordpress/theme.`
);
