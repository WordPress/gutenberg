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

const composeTemplate = readFileSync( fromConfigRoot( 'docker-compose.override.yml.template' ), 'utf8' )
	.replace( /%PLUGIN_MOUNT_DIR%/gi, pluginMountDir );

const pluginCompose = yaml.safeLoad( composeTemplate );

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
	Object.keys( newConfig ).forEach( ( key ) => {
		if ( ! originalConfig[ key ] ) {
			originalConfig[ key ] = newConfig[ key ];
		} else if ( newConfig[ key ] instanceof Array ) {
			newConfig[ key ].forEach( ( element ) => {
				if ( element.startsWith( pluginMountDir ) && element.includes( ':' ) ) {
					const mountDir = element.split( ':' )[ 0 ];
					const index = originalConfig[ key ].findIndex( ( volume ) => {
						return volume.startsWith( `${ mountDir }:` );
					} );
					if ( index > -1 ) {
						originalConfig[ key ][ index ] = element;
					} else {
						originalConfig[ key ].push( element );
					}
				}
			} );
		} else if ( newConfig[ key ] instanceof Object ) {
			originalConfig[ key ] = mergeConfigs( originalConfig[ key ], newConfig[ key ] );
		} else {
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
