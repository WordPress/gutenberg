/**
 * External dependencies
 */
const yaml = require( 'js-yaml' );

/**
 * Node dependencies.
 */
const { existsSync, readFileSync, writeFileSync } = require( 'fs' );
const { normalize } = require( 'path' );
const { cwd, env, exit, stdout } = require( 'process' );
const { execSync } = require( 'child_process' );

/**
 * Internal dependencies
 */
const {
	fromConfigRoot,
	mergeYAMLConfigs,
} = require( '../../utils' );

const composeFile = normalize( `${ env.WP_DEVELOP_DIR }/docker-compose.override.yml` );
let compose = {};
if ( existsSync( composeFile ) ) {
	try {
		compose = yaml.safeLoad( readFileSync( composeFile, 'utf8' ) );
	} catch ( error ) {
		stdout.write( 'There was an error loading your docker-compose.override.yml file. Please fix or delete it, and try again.\n' );
		stdout.write( error.toString() );
		exit( 1 );
	}
}

const coreComposeFile = normalize( `${ env.WP_DEVELOP_DIR }/docker-compose.yml` );
if ( ! existsSync( coreComposeFile ) ) {
	stdout.write( "docker-compose.yml doesn't seem to exist. Are you sure WP_DEVELOP_DIR is a WordPress source directory?\n" );
	exit( 1 );
}

let coreCompose = {};
try {
	coreCompose = yaml.safeLoad( readFileSync( coreComposeFile, 'utf8' ) );
} catch ( error ) {
	stdout.write( 'There was an error loading your docker-compose.yml in your WordPress directory. Please revert any changes to it, and try again.\n' );
	stdout.write( error.toString() );
	exit( 1 );
}

const pluginMountDir = cwd();

const composeTemplateFile = env.npm_package_wp_env_docker_template ? normalize( cwd() + `/${ env.npm_package_wp_env_docker_template }` ) : fromConfigRoot( 'docker-compose.override.yml.template' );

const composeTemplate = readFileSync( composeTemplateFile, 'utf8' )
	.replace( /%PLUGIN_MOUNT_DIR%/gi, pluginMountDir )
	.replace( /%PLUGIN_INSTALL_DIR%/gi, env.npm_package_wp_env_plugin_dir );

let pluginCompose = {};
try {
	pluginCompose = yaml.safeLoad( composeTemplate );
} catch ( error ) {
	stdout.write( 'There was an error loading your docker-compose.override.yml.template file. Please revert any changes to it, and try again.\n' );
	stdout.write( error.toString() );
	exit( 1 );
}

stdout.write( 'Updating docker-compose.override.yml...\n' );

compose.version = coreCompose.version;

const mergedCompose = mergeYAMLConfigs( compose, pluginCompose, pluginMountDir );

writeFileSync( composeFile, yaml.safeDump( mergedCompose, { lineWidth: -1 } ) );

stdout.write( 'Restarting the WordPress environment...\n' );

execSync( 'npm run env:stop', { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
execSync( 'npm run env:start', { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
