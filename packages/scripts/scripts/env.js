/**
 * Node dependencies.
 */
const { env, exit, stdout } = require( 'process' );

/**
 * Internal dependencies
 */
const {
	getArgsFromCLI,
	spawnScript,
} = require( '../utils' );

if ( ! env.WP_DEVELOP_DIR ) {
	stdout.write( 'Please ensure the WP_DEVELOP_DIR environment variable is set to your WordPress Development directory before running this script.' );
	exit( 1 );
}

const args = getArgsFromCLI();

if ( ! args.length ) {
	stdout.write( 'Environment command required.' );
	exit( 1 );
}

const command = args.shift();

spawnScript( `env/${ command }`, args );
