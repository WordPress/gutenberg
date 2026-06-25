import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(
	dirname( fileURLToPath( import.meta.url ) ),
	'../..'
);

const disallowedPathPatterns = [
	/(^|\/)__snapshots__(\/|$)/,
	/(^|\/)fixtures(\/|$)/,
	/(^|\/)stories(\/|$)/,
	/(^|\/)test(\/|$)/,
	/^build-types\/color-ramps\//,
	/^build-types\/context\.d\.ts(\.map)?$/,
	/^build-types\/postcss-plugins\//,
	/^build-types\/use-theme-provider-styles\.d\.ts(\.map)?$/,
	/^src\/style\.module\.css$/,
];

const env = {
	...process.env,
	npm_config_cache:
		process.env.WORDPRESS_THEME_NPM_CACHE ??
		join( tmpdir(), 'wordpress-theme-npm-cache' ),
};

const packResult = spawnSync( 'npm', [ 'pack', '--dry-run', '--json' ], {
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

const missingMandatoryPaths = [ 'package.json' ].filter(
	( path ) => ! packedPathSet.has( path )
);
const disallowedPaths = packedPaths.filter( ( path ) =>
	disallowedPathPatterns.some( ( pattern ) => pattern.test( path ) )
);

if (
	packedPaths.length === 0 ||
	missingMandatoryPaths.length ||
	disallowedPaths.length
) {
	if ( packedPaths.length === 0 ) {
		console.error( 'The package tarball does not include any files.' );
	}

	if ( missingMandatoryPaths.length ) {
		console.error(
			[
				'The package tarball is missing mandatory npm package files:',
				...missingMandatoryPaths.map( ( path ) => `- ${ path }` ),
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
