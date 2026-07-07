#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const usage = [
	'Usage: node tools/validation/validate-package-contents.mjs <package-directory> [options]',
	'Options:',
	'  --attw-profile <profile>',
	'  --attw-exclude-entrypoint <entrypoint>',
	'  --attw-ignore-rule <rule>',
].join( '\n' );

let parsedArgs;

try {
	parsedArgs = parseArgs( {
		allowPositionals: true,
		options: {
			'attw-profile': {
				type: 'string',
			},
			'attw-exclude-entrypoint': {
				multiple: true,
				type: 'string',
			},
			'attw-ignore-rule': {
				multiple: true,
				type: 'string',
			},
		},
	} );
} catch ( error ) {
	console.error( error.message );
	console.error( usage );
	process.exit( 1 );
}

const [ packagePath, ...extraPositionals ] = parsedArgs.positionals;

if ( ! packagePath || extraPositionals.length ) {
	console.error( usage );
	process.exit( 1 );
}

const packageRoot = resolve( process.cwd(), packagePath );
const require = createRequire( import.meta.url );
const attwPackagePath = require.resolve( '@arethetypeswrong/cli/package.json' );
const attwCliPath = join( dirname( attwPackagePath ), 'dist/index.js' );

const attwOptions = {
	profile: parsedArgs.values[ 'attw-profile' ] ?? 'strict',
	excludedEntryPoints: parsedArgs.values[ 'attw-exclude-entrypoint' ] ?? [],
	ignoredRules: parsedArgs.values[ 'attw-ignore-rule' ] ?? [],
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

/**
 * @return {Record<string, unknown> | undefined} Package export map.
 */
function getPackageExportsMap() {
	if (
		! packageJson.exports ||
		typeof packageJson.exports !== 'object' ||
		Array.isArray( packageJson.exports )
	) {
		return;
	}

	return packageJson.exports;
}

const env = {
	...process.env,
	npm_config_cache:
		process.env.WORDPRESS_PACKAGE_NPM_CACHE ??
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
	rmSync( packDirectory, { force: true, recursive: true } );
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
const packageExports = getPackageExportsMap();
const missingAttwExcludedEntryPoints = attwOptions.excludedEntryPoints.filter(
	( entryPoint ) =>
		! packageExports || ! Object.hasOwn( packageExports, entryPoint )
);
// attw does not model non-JavaScript entry points like CSS. Keep explicit
// exclusions honest by checking only the package targets skipped by attw.
const missingAttwExcludedTargetPaths = attwOptions.excludedEntryPoints
	.flatMap( ( entryPoint ) => {
		if ( ! packageExports ) {
			return [];
		}

		const exportValue = packageExports[ entryPoint ];

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
	missingAttwExcludedEntryPoints.length ||
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

	if ( missingAttwExcludedEntryPoints.length ) {
		console.error(
			[
				'The package exports do not include entry points excluded from attw:',
				...missingAttwExcludedEntryPoints.map(
					( entryPoint ) => `- ${ entryPoint }`
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
	missingAttwExcludedEntryPoints.length ||
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
