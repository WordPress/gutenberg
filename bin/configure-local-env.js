/**
 * External dependencies
 */
const yaml = require( 'js-yaml' );

/**
 * Node dependencies.
 */
const { existsSync, readFileSync, writeFileSync } = require( 'fs' );
const { normalize } = require( 'path' );
const { cwd, env } = require( 'process' );
const { execSync } = require( 'child_process' );

/* eslint-disable no-console */

if ( ! env.WP_DEVELOP_DIR ) {
	console.log( 'Please ensure the WP_DEVELOP_DIR environment variable is set to your WordPress Development directory before running this script.' );
	return;
}

const composeFile = normalize( `${ env.WP_DEVELOP_DIR }/docker-compose.override.yml` );
let compose = {};
if ( existsSync( composeFile ) ) {
	try {
		compose = yaml.safeLoad( readFileSync( composeFile, 'utf8' ) );
	} catch ( e ) {
		console.log( 'There was an error loading your docker-compose.override.yml file. Please fix or delete it, and try again.' );
		console.log( e );
		return;
	}
}

const coreComposeFile = normalize( `${ env.WP_DEVELOP_DIR }/docker-compose.yml` );
if ( ! existsSync( coreComposeFile ) ) {
	console.log( "docker-compose.yml doesn't seem to exist. Are you sure WP_DEVELOP_DIR is a WordPress source directory?" );
	return;
}

let coreCompose = {};
try {
	coreCompose = yaml.safeLoad( readFileSync( coreComposeFile, 'utf8' ) );
} catch ( e ) {
	console.log( 'There was an error loading your docker-compose.yml in your WordPress directory. Please revert any  changes to it, and try again.' );
	console.log( e );
	return;
}

console.log( 'Updating docker-compose.override.yml...' );

compose.version = coreCompose.version;

if ( ! compose.services ) {
	compose.services = {};
}

const services = [ 'wordpress-develop', 'php', 'cli', 'phpunit' ];

services.forEach( ( service ) => {
	if ( ! compose.services[ service ] ) {
		compose.services[ service ] = {};
	}

	if ( ! compose.services[ service ].volumes ) {
		compose.services[ service ].volumes = [];
	}

	const index = compose.services[ service ].volumes.findIndex( ( volume ) => {
		return volume.endsWith( '/plugins/gutenberg' );
	} );

	const gutenbergVolume = ( service === 'phpunit' ) ?
		normalize( cwd() ) + ':/wordpress-develop/${LOCAL_DIR-src}/wp-content/plugins/gutenberg' :
		normalize( cwd() ) + ':/var/www/${LOCAL_DIR-src}/wp-content/plugins/gutenberg';

	if ( index > -1 ) {
		compose.services[ service ].volumes[ index ] = gutenbergVolume;
	} else {
		compose.services[ service ].volumes.append( gutenbergVolume );
	}

	if ( service === 'wordpress-develop' || service === 'php' ) {
		const testPluginsIndex = compose.services[ service ].volumes.findIndex( ( volume ) => {
			return volume.endsWith( '/plugins/gutenberg-test-plugins' );
		} );

		const testPluginsVolume = normalize( cwd() + '/packages/e2e-tests/plugins' ) + ':/var/www/${LOCAL_DIR-src}/wp-content/plugins/gutenberg-test-plugins';

		if ( testPluginsIndex > -1 ) {
			compose.services[ service ].volumes[ testPluginsIndex ] = testPluginsVolume;
		} else {
			compose.services[ service ].volumes.append( testPluginsVolume );
		}

		const muPluginsIndex = compose.services[ service ].volumes.findIndex( ( volume ) => {
			return volume.endsWith( '/mu-plugins' );
		} );

		const muPluginsVolume = normalize( cwd() + '/packages/e2e-tests/mu-plugins' ) + ':/var/www/${LOCAL_DIR-src}/wp-content/mu-plugins';

		if ( muPluginsIndex > -1 ) {
			compose.services[ service ].volumes[ muPluginsIndex ] = muPluginsVolume;
		} else {
			compose.services[ service ].volumes.append( muPluginsVolume );
		}
	}
} );

writeFileSync( composeFile, yaml.safeDump( compose, { lineWidth: -1 } ) );

console.log( 'Restarting the WordPress environment...' );

execSync( 'npm run env:stop', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
execSync( 'npm run env:start', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );

/* eslint-enable no-console */
