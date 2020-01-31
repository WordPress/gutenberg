/**
 * External dependencies
 */
const { sync: commandExistsSync } = require( 'command-exists' );

/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );
const { env, cwd, stdout } = require( 'process' );
const { normalize } = require( 'path' );

/**
 * Internal dependencies
 */
const { buildWordPress, downloadWordPressZip } = require( '../../utils' );

env.WP_DEVELOP_DIR = normalize( cwd() + '/wordpress' );

if ( commandExistsSync( 'git' ) ) {
	execSync( 'git pull', { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
	buildWordPress( false, false );
} else {
	stdout.write(
		"Git isn't available. Switching to downloading a zip version.\n"
	);
	downloadWordPressZip().then( () => {
		buildWordPress( false, false );
	} );
}
