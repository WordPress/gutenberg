/** @format */

/**
 * External dependencies
 */
/**
 * Internal dependencies
 */
import { JETPACK_DATA_PATH } from '../jetpack/extensions/shared/get-jetpack-data';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

const supportedJetpackBlocks = {
	'contact-info': {
		available: true,
	},
};

const setInitialState = async ( {
	isJetpackActive = false,
	userData = null,
	siteFragment = null,
	blogId,
} ) => {
	let availableBlocks = {};
	if ( isJetpackActive ) {
		console.log( 'Fetching /wpcom/v2/gutenberg/available-extensions' );
		try {
			availableBlocks = await apiFetch( { path: `/wpcom/v2/gutenberg/available-extensions` } );
		} catch ( error ) {
			console.warn( 'Error while fetching available extensions', error );
			// manually set availableBlocks while WP REST API auth is being worked on
			availableBlocks = supportedJetpackBlocks;
		}
	}
	const jetpackEditorInitialState = {
		available_blocks: availableBlocks,
		jetpack: {
			is_active: isJetpackActive,
		},
		siteFragment,
		tracksUserData: userData,
		wpcomBlogId: blogId,
	};
	global.window[ JETPACK_DATA_PATH ] = jetpackEditorInitialState;
	return jetpackEditorInitialState;
};

export default async ( jetpackState ) => {
	if ( ! jetpackState.isJetpackActive ) {
		return;
	}

	require( '../jetpack/extensions/editor' );

	return setInitialState( jetpackState );
};
