import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(
	dirname( fileURLToPath( import.meta.url ) ),
	'../..'
);

const requiredPaths = [
	'CHANGELOG.md',
	'README.md',
	'package.json',
	'build-types/index.d.ts',
	'build-types/prebuilt/js/design-tokens.d.mts',
	'build-types/prebuilt/ts/token-types.d.ts',
	'build-types/stylelint-plugins/no-setting-wpds-custom-properties.d.mts',
	'build-types/stylelint-plugins/no-token-fallback-values.d.mts',
	'build-types/stylelint-plugins/no-unknown-ds-tokens.d.mts',
	'build-types/theme-provider.d.ts',
	'build-types/types.d.ts',
	'src/esbuild-plugins/esbuild-ds-token-fallbacks.mjs',
	'src/postcss-plugins/postcss-ds-token-fallbacks.mjs',
	'src/prebuilt/css/design-tokens.css',
	'src/prebuilt/js/design-token-fallbacks.mjs',
	'src/prebuilt/js/design-tokens.mjs',
	'src/stylelint-plugins/no-setting-wpds-custom-properties.mjs',
	'src/stylelint-plugins/no-token-fallback-values.mjs',
	'src/stylelint-plugins/no-unknown-ds-tokens.mjs',
	'src/vite-plugins/vite-ds-token-fallbacks.mjs',
];

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

const missingPaths = requiredPaths.filter(
	( path ) => ! packedPathSet.has( path )
);
const disallowedPaths = packedPaths.filter( ( path ) =>
	disallowedPathPatterns.some( ( pattern ) => pattern.test( path ) )
);
const missingLocalRequiredPaths = requiredPaths.filter(
	( path ) => ! existsSync( join( packageRoot, path ) )
);

if (
	missingPaths.length ||
	disallowedPaths.length ||
	missingLocalRequiredPaths.length
) {
	if ( missingPaths.length ) {
		console.error(
			[
				'The package tarball is missing required files:',
				...missingPaths.map( ( path ) => `- ${ path }` ),
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

	if ( missingLocalRequiredPaths.length ) {
		console.error(
			[
				'Required files are missing locally. Run the package build before validating package contents:',
				...missingLocalRequiredPaths.map( ( path ) => `- ${ path }` ),
			].join( '\n' )
		);
	}

	process.exit( 1 );
}

console.log(
	`Validated ${ packedPaths.length } packed files for @wordpress/theme.`
);
