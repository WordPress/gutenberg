// External dependencies
import { AppRegistry } from 'react-native';

// Setting up environment
import './globals';

const gutenbergSetup = () => {
	const apiFetch = require( '@wordpress/api-fetch' ).default;
	const wpData = require( '@wordpress/data' );

	// wp-api-fetch
	apiFetch.use( apiFetch.createRootURLMiddleware( 'https://public-api.wordpress.com/' ) );

	// wp-data
	const userId = 1;
	const storageKey = 'WP_DATA_USER_' + userId;
	wpData.use( wpData.plugins.persistence, { storageKey: storageKey } );
	wpData.use( wpData.plugins.controls );
};

const editorSetup = () => {
	const wpBlockLibrary = require( '@wordpress/block-library' );
	const wpBlocks = require( '@wordpress/blocks' );
	const registerCoreBlocks = wpBlockLibrary.registerCoreBlocks;
	const registerBlockType = wpBlocks.registerBlockType;
	const setUnregisteredTypeHandlerName = wpBlocks.setUnregisteredTypeHandlerName;
	const unregisterBlockType = wpBlocks.unregisterBlockType;
	const UnsupportedBlock = require( './block-types/unsupported-block' );

	// register and setup blocks
	registerCoreBlocks();
	registerBlockType( UnsupportedBlock.name, UnsupportedBlock.settings );
	setUnregisteredTypeHandlerName( UnsupportedBlock.name );

	// disable Code and More blocks for release
	if ( ! __DEV__ ) {
		unregisterBlockType( 'core/code' );
		unregisterBlockType( 'core/more' );
	}
};

export function setupApp() {
	gutenbergSetup();
	editorSetup();

	// Making sure the environment is set up before loading any Component
	AppRegistry.registerComponent( 'gutenberg', () => require( './app/App' ).default );
}
