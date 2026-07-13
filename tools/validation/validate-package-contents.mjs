#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const [ packagePath, ...extraArgs ] = process.argv.slice( 2 );

if ( ! packagePath || extraArgs.length ) {
	console.error(
		'Usage: node tools/validation/validate-package-contents.mjs <package-directory>'
	);
	process.exit( 1 );
}

const packageRoot = resolve( process.cwd(), packagePath );
const packageJson = JSON.parse(
	readFileSync( join( packageRoot, 'package.json' ), 'utf8' )
);
const npmExecPath = process.env.npm_execpath;
const packResult = spawnSync(
	npmExecPath ? process.execPath : 'npm',
	[
		...( npmExecPath ? [ npmExecPath ] : [] ),
		'pack',
		'--dry-run',
		'--json',
	],
	{
		cwd: packageRoot,
		encoding: 'utf8',
		env: {
			...process.env,
			npm_config_cache:
				process.env.WORDPRESS_PACKAGE_NPM_CACHE ??
				join( tmpdir(), 'wordpress-package-npm-cache' ),
		},
		shell: ! npmExecPath && process.platform === 'win32',
	}
);

if ( packResult.error ) {
	throw packResult.error;
}

if ( packResult.status !== 0 ) {
	process.stderr.write( packResult.stdout ?? '' );
	process.stderr.write( packResult.stderr ?? '' );
	process.exit( packResult.status ?? 1 );
}

const [ pack ] = JSON.parse( packResult.stdout );
const packedPaths = pack.files.map( ( { path } ) => path );
const packedPathSet = new Set( packedPaths );
const disallowedPathPatterns = [
	/(^|\/)(__fixtures__|__snapshots__|__tests__|fixtures|stories|test|tests)(\/|$)/,
	/(^|\/)[^/]+\.(spec|test)\.[^/]+$/,
	/(^|\/)[^/]+\.stor(?:y|ies)\.[^/]+$/,
];
const disallowedPaths = packedPaths.filter( ( path ) =>
	disallowedPathPatterns.some( ( pattern ) => pattern.test( path ) )
);

/**
 * @param {unknown} value Export map value.
 * @return {string[]} Concrete local export target paths.
 */
function getLocalExportTargets( value ) {
	if ( typeof value === 'string' ) {
		return value.startsWith( './' ) && ! value.includes( '*' )
			? [ value.slice( 2 ) ]
			: [];
	}

	if ( Array.isArray( value ) ) {
		return value.flatMap( getLocalExportTargets );
	}

	if ( ! value || typeof value !== 'object' ) {
		return [];
	}

	return Object.values( value ).flatMap( getLocalExportTargets );
}

const missingExportTargets = getLocalExportTargets(
	packageJson.exports
).filter( ( path ) => ! packedPathSet.has( path ) );

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

if ( missingExportTargets.length ) {
	console.error(
		[
			'The package tarball is missing exported targets:',
			...missingExportTargets.map( ( path ) => `- ${ path }` ),
		].join( '\n' )
	);
}

if (
	packedPaths.length === 0 ||
	disallowedPaths.length ||
	missingExportTargets.length
) {
	process.exit( 1 );
}

console.log(
	`Validated ${ packedPaths.length } packed files for ${
		packageJson.name ?? packageRoot
	}.`
);
