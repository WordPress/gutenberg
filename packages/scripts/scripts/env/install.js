/**
 * External dependencies
 */
const chalk = require( 'chalk' );

/**
 * Node dependencies
 */
const { env, exit, stdout } = require( 'process' );
const { normalize } = require( 'path' );
const { existsSync } = require( 'fs' );

/**
 * Internal dependencies
 */
const {
	buildWordPress,
	getManagedWordPressPath,
	hasArgInCLI,
	installManagedWordPress,
} = require( '../../utils' );

env.WP_DEVELOP_DIR = getManagedWordPressPath();

if ( hasArgInCLI( '--fast' ) ) {
	buildWordPress( true, true );
	return;
}

if ( existsSync( normalize( env.WP_DEVELOP_DIR + '/wp-config.php' ) ) ) {
	stdout.write( chalk`{white It looks like WordPress is already installed, please run {blue npm run env clean} for a fresh install, or run {blue npm run env start} to start the existing environment.}\n` );
	exit( 1 );
}

installManagedWordPress()
	.then( () => {
		buildWordPress( true, false );
	} );
