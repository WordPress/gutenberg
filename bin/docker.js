/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );
const { env } = require( 'process' );
const { normalize } = require( 'path' );

/* eslint-disable no-console */

if ( ! env.WP_DEVELOP_DIR ) {
	console.log( 'Please ensure the WP_DEVELOP_DIR environment variable is set to your WordPress Development directory before running this script.' );
	return;
}

// Execute any docker-compose command passed to this script, in the WordPress Docker environment.
execSync( 'docker-compose ' + process.argv.slice( 2 ).join( ' ' ), { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );

/* eslint-enable no-console */
