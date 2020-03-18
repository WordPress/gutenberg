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

const setJetpackData = async ( {
	isJetpackActive = false,
	userData = null,
	siteFragment = null,
	blogId,
} ) => {
	const availableBlocks = supportedJetpackBlocks;
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

	const jetpackData = await setJetpackData( jetpackState );

	require( '../jetpack/extensions/editor' );

	return jetpackData;
};
