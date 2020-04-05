/**
 * External dependencies
 */
const { sync: commandExistsSync } = require( 'command-exists' );

/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );
const { env, exit, cwd, stdout } = require( 'process' );
const { normalize } = require( 'path' );
const { existsSync } = require( 'fs' );

/**
 * Internal dependencies
 */
const { buildWordPress, downloadWordPressZip } = require( '../../utils' );
const { hasArgInCLI } = require( '../../utils' );

env.WP_DEVELOP_DIR = normalize( cwd() + '/wordpress' );

if ( hasArgInCLI( '--fast' ) ) {
	buildWordPress( true, true );
	return;
}

if ( existsSync( normalize( cwd() + '/wordpress/wp-config-sample.php' ) ) ) {
	stdout.write(
		'It looks like WordPress is already installed, please delete the `wordpress` directory for a fresh install, or run `npm run env start` to start the existing environment.\n'
	);
	exit( 1 );
}

if ( commandExistsSync( 'git' ) ) {
	execSync(
		'git clone --depth=1 git://develop.git.wordpress.org/ wordpress',
		{
			stdio: 'inherit',
		}
	);
	buildWordPress( true, false );
} else {
	stdout.write(
		"Git isn't available. Switching to downloading a zip version.\n"
	);
	downloadWordPressZip().then( () => {
		buildWordPress( true, false );
	} );
}
