/**
 * Node dependencies.
 */
const { env, cwd } = require( 'process' );
const { normalize } = require( 'path' );

/**
 * Internal dependencies
 */
const {
	buildWordPress,
	installManagedWordPress,
} = require( '../../utils' );

env.WP_DEVELOP_DIR = normalize( cwd() + '/wordpress' );

installManagedWordPress()
	.then( () => {
		buildWordPress( false, false );
	} );
