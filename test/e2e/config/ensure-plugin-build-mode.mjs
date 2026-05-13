/**
 * External dependencies
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const E2E_CONFIG_DIR = dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = join( E2E_CONFIG_DIR, '..', '..', '..' );
const BUILD_MODE_CORE = 'core';
const BUILD_MODE_MISSING = 'missing';
const BUILD_MODE_PLUGIN = 'plugin';
const BUILD_MODE_UNKNOWN = 'unknown';

export const BUILD_MODE = Object.freeze( {
	CORE: BUILD_MODE_CORE,
	MISSING: BUILD_MODE_MISSING,
	PLUGIN: BUILD_MODE_PLUGIN,
	UNKNOWN: BUILD_MODE_UNKNOWN,
} );

function readExistingFile( file ) {
	return existsSync( file ) ? readFileSync( file, 'utf8' ) : '';
}

function getBuildFiles( rootDir ) {
	return {
		constantsFile: join( rootDir, 'build', 'constants.php' ),
		routesFile: join( rootDir, 'build', 'routes.php' ),
	};
}

export function getBuildMode( rootDir = ROOT_DIR ) {
	const { constantsFile, routesFile } = getBuildFiles( rootDir );
	const constants = readExistingFile( constantsFile );
	const routes = readExistingFile( routesFile );
	const hasPluginModeMarkers =
		constants.includes( 'plugin_dir_url( __FILE__ )' ) &&
		routes.includes( 'function gutenberg_register_page_routes(' );

	if ( hasPluginModeMarkers ) {
		return BUILD_MODE_PLUGIN;
	}

	if (
		constants.includes( "includes_url( 'build/' )" ) ||
		routes.includes( 'function wp_register_page_routes(' )
	) {
		return BUILD_MODE_CORE;
	}

	if ( ! existsSync( constantsFile ) || ! existsSync( routesFile ) ) {
		return BUILD_MODE_MISSING;
	}

	return BUILD_MODE_UNKNOWN;
}

function getPreflightMessage( buildMode ) {
	if ( buildMode === BUILD_MODE_CORE ) {
		return 'Detected a WordPress-Core-mode Gutenberg build before e2e startup. Rebuilding the ignored build artifacts for the Gutenberg plugin.';
	}

	if ( buildMode === BUILD_MODE_MISSING ) {
		return 'Detected missing Gutenberg build artifacts before e2e startup. Building the ignored artifacts for the Gutenberg plugin.';
	}

	return 'Detected Gutenberg build artifacts before e2e startup that do not clearly match plugin mode. Rebuilding the ignored artifacts for the Gutenberg plugin.';
}

export class BuildPreflightError extends Error {
	constructor( message, exitCode = 1 ) {
		super( message );
		this.name = 'BuildPreflightError';
		this.exitCode = exitCode;
	}
}

export function ensurePluginBuildMode( {
	rootDir = ROOT_DIR,
	spawn = spawnSync,
	env = process.env,
	stdout = process.stdout,
} = {} ) {
	const buildModeBefore = getBuildMode( rootDir );

	if ( buildModeBefore === BUILD_MODE_PLUGIN ) {
		return {
			buildModeBefore,
			buildModeAfter: buildModeBefore,
			rebuilt: false,
		};
	}

	stdout.write( getPreflightMessage( buildModeBefore ) );
	stdout.write( '\n' );

	const build = spawn(
		'npm',
		[
			'run',
			'build',
			'--',
			'--skip-types',
			'--base-url=plugin_dir_url( __FILE__ )',
		],
		{
			cwd: rootDir,
			env: {
				...env,
				IS_GUTENBERG_PLUGIN: 'true',
				IS_WORDPRESS_CORE: 'false',
			},
			stdio: 'inherit',
		}
	);

	if ( build.status !== 0 ) {
		throw new BuildPreflightError(
			'The Gutenberg e2e build preflight failed while rebuilding plugin-mode artifacts.',
			build.status ?? 1
		);
	}

	const buildModeAfter = getBuildMode( rootDir );

	if ( buildModeAfter !== BUILD_MODE_PLUGIN ) {
		throw new BuildPreflightError(
			'The Gutenberg e2e build preflight completed, but build/routes.php or build/constants.php still does not look like a plugin-mode build.'
		);
	}

	return {
		buildModeBefore,
		buildModeAfter,
		rebuilt: true,
	};
}

function isMainModule() {
	return process.argv[ 1 ]
		? import.meta.url === pathToFileURL( process.argv[ 1 ] ).href
		: false;
}

if ( isMainModule() ) {
	try {
		ensurePluginBuildMode();
	} catch ( error ) {
		process.stderr.write( error.message );
		process.stderr.write( '\n' );
		process.exit( error.exitCode ?? 1 );
	}
}
