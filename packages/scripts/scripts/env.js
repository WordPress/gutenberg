/**
 * Node dependencies.
 */
const { env, exit, stdout, cwd } = require( 'process' );
const { normalize } = require( 'path' );
const { existsSync } = require( 'fs' );

/**
 * Internal dependencies
 */
const {
	getArgsFromCLI,
	spawnScript,
} = require( '../utils' );

const args = getArgsFromCLI();

if ( ! args.length ) {
	stdout.write( 'Environment command required.\n' );
	exit( 1 );
}

const command = args.shift();

if ( ! env.WP_DEVELOP_DIR && command !== 'install' ) {
	if ( existsSync( normalize( cwd() + '/wordpress/wp-config-sample.php' ) ) ) {
		env.WP_DEVELOP_DIR = cwd() + '/wordpress';
		env.MANAGED_WP = true;
	} else {
		stdout.write( 'Please ensure the WP_DEVELOP_DIR environment variable is set to your WordPress Development directory before running this script.\n' );
		exit( 1 );
	}
}

spawnScript( `env/${ command }`, args );
