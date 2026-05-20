/**
 * External dependencies
 */
import { paramCase as kebabCase } from 'change-case';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { downloadBlob } from '@wordpress/blob';
import type { Post, PostType } from './types';

/**
 * Export a reusable block as a JSON file.
 *
 * @param id - The ID of the reusable block to export
 */
async function exportReusableBlock( id: number ): Promise< void > {
	const postType = await apiFetch< PostType >( {
		path: `/wp/v2/types/wp_block`,
	} );

	const post = await apiFetch< Post >( {
		path: `/wp/v2/${ postType.rest_base }/${ id }?context=edit`,
	} );

	const title = post.title.raw;
	const content = post.content.raw;
	const syncStatus = post.wp_pattern_sync_status;

	const fileContent = JSON.stringify(
		{
			__file: 'wp_block',
			title,
			content,
			syncStatus,
		},
		null,
		2
	);

	const fileName = kebabCase( title ) + '.json';

	downloadBlob( fileName, fileContent, 'application/json' );
}

export default exportReusableBlock;
