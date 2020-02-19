/** @format */

/**
 * External dependencies
 */
import { JETPACK_DATA_PATH } from '../jetpack/extensions/shared/get-jetpack-data';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

const contactInfo = '../jetpack/extensions/blocks/contact-info/editor.js';
const supportedJetpackBlocks = {
	'contact-info': {
		available: true
	}
};

const setInitialState = async ( {
   isJetpackActive = false,
   userData = null,
   siteFragment = null,
   blogId,
} ) => {
	let availableBlocks = {};
	if ( isJetpackActive ) {
		availableBlocks = supportedJetpackBlocks;//await apiFetch( { path: `/wp/v2/gutenberg/available-extensions` } );
	}
	const jetpackEditorInitialState = {
		available_blocks: availableBlocks,
		jetpack: {
			is_active: isJetpackActive,
		},
		siteFragment: siteFragment,
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

	const jetpackEditorInitialState = await setInitialState( jetpackState );

	//jetpackEditorInitialState.available_blocks
	console.log( 'requiring jetpack/contact-info' );
	require( contactInfo );
};

