#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const [ packagePath, ...args ] = process.argv.slice( 2 );

if ( ! packagePath ) {
	console.error(
		[
			'Usage: node tools/validation/validate-package-contents.mjs <package-directory> [options]',
			'Options:',
			'  --attw-profile <profile>',
			'  --attw-exclude-entrypoint <entrypoint>',
			'  --attw-ignore-rule <rule>',
		].join( '\n' )
	);
	process.exit( 1 );
}

const packageRoot = resolve( process.cwd(), packagePath );
const require = createRequire( import.meta.url );
const attwPackagePath = require.resolve( '@arethetypeswrong/cli/package.json' );
const attwCliPath = join( dirname( attwPackagePath ), 'dist/index.js' );

const attwOptions = {
	profile: 'strict',
	excludedEntryPoints: [],
	ignoredRules: [],
};

const disallowedPathPatterns = [
	/(^|\/)(__fixtures__|__snapshots__|__tests__|fixtures|stories|test|tests)(\/|$)/,
	/(^|\/)[^/]+\.(spec|test)\.[^/]+$/,
	/(^|\/)[^/]+\.stories?\.[^/]+$/,
];

/** @typedef {{ exports?: unknown, name?: string }} PackageJson */

/** @type {PackageJson} */
const packageJson = JSON.parse(
	readFileSync( join( packageRoot, 'package.json' ), 'utf8' )
);

for ( let index = 0; index < args.length; index++ ) {
	const arg = args[ index ];
	const value = args[ index + 1 ];

	if ( ! value || value.startsWith( '--' ) ) {
		console.error( `Missing value for ${ arg }.` );
		process.exit( 1 );
	}

	switch ( arg ) {
		case '--attw-profile':
			attwOptions.profile = value;
			break;
		case '--attw-exclude-entrypoint':
			attwOptions.excludedEntryPoints.push( value );
			break;
		case '--attw-ignore-rule':
			attwOptions.ignoredRules.push( value );
			break;
		default:
			console.error( `Unknown option: ${ arg }.` );
			process.exit( 1 );
	}

	index++;
}

/**
 * @param {unknown} value Export map value.
 * @return {string[]} Export target paths.
 */
function getExportTargets( value ) {
	if ( typeof value === 'string' ) {
		return [ value ];
	}

	if ( Array.isArray( value ) ) {
		return value.flatMap( getExportTargets );
	}

	if ( ! value || typeof value !== 'object' ) {
		return [];
	}

	return Object.values( value ).flatMap( getExportTargets );
}

/**
 * @param {string} path Package-relative path.
 * @return {string} Normalized package path.
 */
function normalizePackagePath( path ) {
	return path.replace( /^\.\//, '' );
}

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
	'--json',
];

const packDirectory = mkdtempSync(
	join( tmpdir(), 'wordpress-package-contents-' )
);

packArgs.push( '--pack-destination', packDirectory );

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
	rmSync( packDirectory, { force: true, recursive: true } );
	process.exit( packResult.status ?? 1 );
}

/** @type {Array<{ filename: string, files: Array<{ path: string }> }>} */
const packs = JSON.parse( packResult.stdout );
const [ pack ] = packs;
const packedPaths = pack.files.map( ( { path } ) => path );
const packedPathSet = new Set( packedPaths );
const tarballPath = join( packDirectory, pack.filename );

const disallowedPaths = packedPaths.filter( ( path ) =>
	disallowedPathPatterns.some( ( pattern ) => pattern.test( path ) )
);
// attw does not model non-JavaScript entry points like CSS. Keep explicit
// exclusions honest by checking only the package targets skipped by attw.
const missingAttwExcludedTargetPaths = attwOptions.excludedEntryPoints
	.flatMap( ( entryPoint ) => {
		if (
			! packageJson.exports ||
			typeof packageJson.exports !== 'object' ||
			Array.isArray( packageJson.exports )
		) {
			return [];
		}

		const exportValue = packageJson.exports[ entryPoint ];

		return getExportTargets( exportValue )
			.filter( ( target ) => target.startsWith( './' ) )
			.map( normalizePackagePath );
	} )
	.filter( ( path ) => ! packedPathSet.has( path ) );

const attwArgs = [
	attwCliPath,
	tarballPath,
	'--format',
	'table',
	'--no-color',
	'--no-emoji',
	'--no-summary',
	'--profile',
	attwOptions.profile,
];

if ( attwOptions.excludedEntryPoints.length ) {
	attwArgs.push(
		'--exclude-entrypoints',
		...attwOptions.excludedEntryPoints
	);
}

if ( attwOptions.ignoredRules.length ) {
	attwArgs.push( '--ignore-rules', ...attwOptions.ignoredRules );
}

const attwResult = spawnSync( process.execPath, attwArgs, {
	cwd: packageRoot,
	encoding: 'utf8',
} );

if ( attwResult.error ) {
	rmSync( packDirectory, { force: true, recursive: true } );
	throw attwResult.error;
}

if (
	packedPaths.length === 0 ||
	disallowedPaths.length ||
	missingAttwExcludedTargetPaths.length
) {
	if ( packedPaths.length === 0 ) {
		console.error( 'The package tarball does not include any files.' );
	}

	if ( disallowedPaths.length ) {
		console.error(
			[
				'The package tarball includes disallowed files:',
				...disallowedPaths.map( ( path ) => `- ${ path }` ),
			].join( '\n' )
		);
	}

	if ( missingAttwExcludedTargetPaths.length ) {
		console.error(
			[
				'The package tarball is missing targets for entry points excluded from attw:',
				...missingAttwExcludedTargetPaths.map(
					( path ) => `- ${ path }`
				),
			].join( '\n' )
		);
	}
}

if ( attwResult.status !== 0 ) {
	process.stderr.write( attwResult.stdout ?? '' );
	process.stderr.write( attwResult.stderr ?? '' );
}

rmSync( packDirectory, { force: true, recursive: true } );

if (
	packedPaths.length === 0 ||
	disallowedPaths.length ||
	missingAttwExcludedTargetPaths.length ||
	attwResult.status !== 0
) {
	process.exit( attwResult.status || 1 );
}

console.log(
	`Validated ${ packedPaths.length } packed files for ${
		packageJson.name ?? packageRoot
	}.`
);
