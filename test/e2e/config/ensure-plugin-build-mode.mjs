/**
 * External dependencies
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const E2E_CONFIG_DIR = dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = join( E2E_CONFIG_DIR, '..', '..', '..' );
const CONSTANTS_FILE = join( ROOT_DIR, 'build', 'constants.php' );
const ROUTES_FILE = join( ROOT_DIR, 'build', 'routes.php' );

function readExistingFile( file ) {
	return existsSync( file ) ? readFileSync( file, 'utf8' ) : '';
}

function isCoreModeBuild() {
	const constants = readExistingFile( CONSTANTS_FILE );
	const routes = readExistingFile( ROUTES_FILE );

	return (
		constants.includes( "includes_url( 'build/' )" ) ||
		routes.includes( 'function wp_register_page_routes(' )
	);
}

function isPluginModeBuild() {
	const constants = readExistingFile( CONSTANTS_FILE );
	const routes = readExistingFile( ROUTES_FILE );

	return (
		constants.includes( 'plugin_dir_url( __FILE__ )' ) &&
		routes.includes( 'function gutenberg_register_page_routes(' )
	);
}

if ( isCoreModeBuild() ) {
	process.stdout.write(
		'Detected a WordPress-Core-mode Gutenberg build before e2e startup. Rebuilding the ignored build artifacts for the Gutenberg plugin.'
	);
	process.stdout.write( '\n' );

	const build = spawnSync(
		'npm',
		[
			'run',
			'build',
			'--',
			'--skip-types',
			'--base-url=plugin_dir_url( __FILE__ )',
		],
		{
			cwd: ROOT_DIR,
			env: {
				...process.env,
				IS_GUTENBERG_PLUGIN: 'true',
				IS_WORDPRESS_CORE: 'false',
			},
			stdio: 'inherit',
		}
	);

	if ( build.status !== 0 ) {
		process.exit( build.status ?? 1 );
	}

	if ( ! isPluginModeBuild() ) {
		process.stderr.write(
			'The Gutenberg e2e build preflight completed, but build/routes.php or build/constants.php still does not look like a plugin-mode build.'
		);
		process.stderr.write( '\n' );
		process.exit( 1 );
	}
}
