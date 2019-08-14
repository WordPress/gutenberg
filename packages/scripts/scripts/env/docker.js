/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );
const { env, exit, stdout } = require( 'process' );
const { normalize } = require( 'path' );

if ( ! env.WP_DEVELOP_DIR ) {
	stdout.write( 'Please ensure the WP_DEVELOP_DIR environment variable is set to your WordPress Development directory before running this script.' );
	exit( 1 );
}

// Execute any docker-compose command passed to this script, in the WordPress Docker environment.
execSync( 'docker-compose ' + process.argv.slice( 2 ).join( ' ' ), { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
