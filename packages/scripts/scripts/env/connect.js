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
const { fromConfigRoot } = require( '../../utils' );

const composeFile = normalize( `${ env.WP_DEVELOP_DIR }/docker-compose.override.yml` );
let compose = {};
if ( existsSync( composeFile ) ) {
	try {
		compose = yaml.safeLoad( readFileSync( composeFile, 'utf8' ) );
	} catch ( e ) {
		stdout.write( 'There was an error loading your docker-compose.override.yml file. Please fix or delete it, and try again.\n' );
		stdout.write( e.toString() );
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
} catch ( e ) {
	stdout.write( 'There was an error loading your docker-compose.yml in your WordPress directory. Please revert any changes to it, and try again.\n' );
	stdout.write( e.toString() );
	exit( 1 );
}

const pluginMountDir = normalize( cwd() );

const composeTemplateFile = env.npm_package_wp_env_docker_template ? normalize( cwd() + `/${ env.npm_package_wp_env_docker_template }` ) : fromConfigRoot( 'docker-compose.override.yml.template' );

const composeTemplate = readFileSync( composeTemplateFile, 'utf8' )
	.replace( /%PLUGIN_MOUNT_DIR%/gi, pluginMountDir )
	.replace( /%PLUGIN_INSTALL_DIR%/gi, env.npm_package_wp_env_plugin_dir );

let pluginCompose = {};
try {
	pluginCompose = yaml.safeLoad( composeTemplate );
} catch ( e ) {
	stdout.write( 'There was an error loading your docker-compose.override.yml.template file. Please revert any changes to it, and try again.\n' );
	stdout.write( e.toString() );
	exit( 1 );
}

stdout.write( 'Updating docker-compose.override.yml...\n' );

compose.version = coreCompose.version;

/**
 * Merges two YAML configs together.
 *
 * All new data from newConfig will be added to originalConfig. When arrays in newConfig look like lists of volume
 * mount instructions, it will attempt to replace items that mount from the same location. This allows the config
 * to be safely updated, and it'll be reflected in the updated config.
 *
 * @param {Object} originalConfig The original config object that we're overwriting.
 * @param {Object} newConfig      A new config object to merge into originalConfig.
 * @return {Object} The merged config object.
 */
function mergeConfigs( originalConfig, newConfig ) {
	// Loop through each element of newConfig, and test what should be done with them.
	Object.keys( newConfig ).forEach( ( key ) => {
		if ( ! originalConfig[ key ] ) {
			// If the originalConfig object doesn't have this element, we can just add it.
			originalConfig[ key ] = newConfig[ key ];
		} else if ( newConfig[ key ] instanceof Array ) {
			// If the newConfig element is an array, we need to try and merge them.
			// This is intended to merge Docker volume configs, which exist in the form:
			// /path/to/local/dir:/path/to/container/dir:config:stuff

			// Build an array from the original config, with items that belong to this plugin removed.
			const cleanOriginal = originalConfig[ key ].filter( ( element ) => {
				return ! element.startsWith( pluginMountDir );
			} );

			// Append the newConfig to the remaining config.
			originalConfig[ key ] = [ ...cleanOriginal, ...newConfig[ key ] ];
		} else if ( newConfig[ key ] instanceof Object ) {
			// If the newConfig element is an object, we need to recursively merge it.
			originalConfig[ key ] = mergeConfigs( originalConfig[ key ], newConfig[ key ] );
		} else {
			// Any other data types are overwritten by the newConfig.
			originalConfig[ key ] = newConfig[ key ];
		}
	} );

	return originalConfig;
}

const mergedCompose = mergeConfigs( compose, pluginCompose );

writeFileSync( composeFile, yaml.safeDump( mergedCompose, { lineWidth: -1 } ) );

stdout.write( 'Restarting the WordPress environment...\n' );

execSync( 'npm run env:stop', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
execSync( 'npm run env:start', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
