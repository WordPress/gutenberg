/**
 * External dependencies
 */
import { createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import glob from 'fast-glob';

const CACHE_VERSION = 1;
const CACHE_DIR = '.cache/build-scripts';
const CACHE_FILE = 'build-state.json';

const INPUT_PATTERNS = [
	'package.json',
	'package-lock.json',
	'tsconfig*.json',
	'*.config.*',
	'.browserslistrc',
	'packages/*/package.json',
	'packages/*/src/**',
	'packages/*/bin/**',
	'packages/*/lib/**',
	'packages/*/templates/**',
	'packages/*/tokens/**',
	'packages/*/tsconfig*.json',
	'packages/*/*.config.*',
	'routes/**',
	'widgets/**',
	'tools/build-scripts/**',
	'tools/react-19/**',
];

const IGNORE_PATTERNS = [
	'**/.cache/**',
	'**/node_modules/**',
	'**/build/**',
	'**/build-module/**',
	'**/build-style/**',
	'**/build-types/**',
	'**/build-wp/**',
	'**/.content-entry.js',
];

const COMMON_OUTPUTS = [
	'build/build.php',
	'build/scripts.php',
	'build/modules.php',
	'build/styles.php',
	'build/scripts/registry.php',
	'build/modules/registry.php',
	'build/styles/registry.php',
	'build/scripts/block-library/blocks-manifest.php',
	'build/scripts/edit-widgets/blocks/blocks-manifest.php',
	'build/scripts/widgets/blocks/blocks-manifest.php',
	'packages/block-editor/build-module/index.mjs',
	'packages/block-library/build-module/index.mjs',
	'packages/components/build-module/index.mjs',
	'packages/dataviews/build-module/index.mjs',
	'packages/theme/build/prebuilt/js/design-tokens.cjs',
];

const BUILD_OUTPUTS = [ 'packages/dataviews/build-wp/index.js' ];

const TYPE_OUTPUTS = [
	'packages/block-editor/build-types/index.d.ts',
	'packages/block-library/build-types/index.d.ts',
	'packages/components/build-types/index.d.ts',
];

function cacheFilePath( rootDir ) {
	return path.join( rootDir, CACHE_DIR, CACHE_FILE );
}

function getEnvValue( key ) {
	return process.env[ key ];
}

async function fileExists( filename ) {
	try {
		await access( filename, fsConstants.F_OK );
		return true;
	} catch {
		return false;
	}
}

async function readCache( rootDir ) {
	try {
		const cache = JSON.parse( await readFile( cacheFilePath( rootDir ) ) );
		return cache.version === CACHE_VERSION
			? cache
			: { version: CACHE_VERSION };
	} catch {
		return { version: CACHE_VERSION };
	}
}

async function writeCache( rootDir, cache ) {
	const cachePath = cacheFilePath( rootDir );
	await mkdir( path.dirname( cachePath ), { recursive: true } );
	await writeFile( cachePath, `${ JSON.stringify( cache, null, '\t' ) }\n` );
}

async function hasRequiredOutputs( rootDir, { cacheKey, buildTypes } ) {
	const outputs = [ ...COMMON_OUTPUTS ];

	if ( cacheKey.startsWith( 'build:' ) ) {
		outputs.push( ...BUILD_OUTPUTS );
	}

	if ( buildTypes ) {
		outputs.push( ...TYPE_OUTPUTS );
	}

	return (
		await Promise.all(
			outputs.map( ( output ) =>
				fileExists( path.join( rootDir, output ) )
			)
		)
	).every( Boolean );
}

export async function getBuildFingerprint( rootDir, metadata = {} ) {
	const hash = createHash( 'sha256' );
	const files = await glob( INPUT_PATTERNS, {
		cwd: rootDir,
		absolute: false,
		dot: true,
		ignore: IGNORE_PATTERNS,
		onlyFiles: true,
		unique: true,
	} );

	files.sort();

	hash.update(
		JSON.stringify( {
			version: CACHE_VERSION,
			metadata,
			env: {
				IS_GUTENBERG_PLUGIN: getEnvValue( 'IS_GUTENBERG_PLUGIN' ),
				IS_WORDPRESS_CORE: getEnvValue( 'IS_WORDPRESS_CORE' ),
				npm_package_config_IS_GUTENBERG_PLUGIN:
					process.env.npm_package_config_IS_GUTENBERG_PLUGIN,
				npm_package_config_IS_WORDPRESS_CORE:
					process.env.npm_package_config_IS_WORDPRESS_CORE,
			},
			node: process.version,
		} )
	);

	for ( const file of files ) {
		const fullPath = path.join( rootDir, file );
		const fileStat = await stat( fullPath );
		hash.update( file );
		hash.update( String( fileStat.size ) );
		hash.update( await readFile( fullPath ) );
	}

	return hash.digest( 'hex' );
}

export async function isBuildCacheValid(
	rootDir,
	{ cacheKey, buildTypes = false, metadata = {} }
) {
	if ( process.env.GUTENBERG_BUILD_CACHE === 'NEVER' ) {
		return false;
	}

	const cache = await readCache( rootDir );
	if ( ! cache[ cacheKey ] ) {
		return false;
	}

	if ( ! ( await hasRequiredOutputs( rootDir, { cacheKey, buildTypes } ) ) ) {
		return false;
	}

	const fingerprint = await getBuildFingerprint( rootDir, {
		cacheKey,
		buildTypes,
		...metadata,
	} );

	return cache[ cacheKey ]?.fingerprint === fingerprint;
}

export async function writeBuildCache(
	rootDir,
	{ cacheKey, buildTypes = false, metadata = {} }
) {
	if ( process.env.GUTENBERG_BUILD_CACHE === 'NEVER' ) {
		return;
	}

	const cache = await readCache( rootDir );
	cache.version = CACHE_VERSION;
	if ( cacheKey.startsWith( 'build:' ) ) {
		delete cache[ 'dev:runtime' ];
	} else if ( cacheKey.startsWith( 'dev:' ) ) {
		delete cache[ 'build:runtime' ];
		delete cache[ 'build:types' ];
	}
	cache[ cacheKey ] = {
		fingerprint: await getBuildFingerprint( rootDir, {
			cacheKey,
			buildTypes,
			...metadata,
		} ),
		createdAt: new Date().toISOString(),
	};
	await writeCache( rootDir, cache );
}
