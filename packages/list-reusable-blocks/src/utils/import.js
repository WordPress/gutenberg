/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { readTextFile } from './file';

/**
 * Import a reusable block from a JSON file.
 *
 * @param {File} file File.
 * @return {Promise} Promise returning the imported reusable block.
 */
async function importReusableBlock( file ) {
	const fileContent = await readTextFile( file );
	let parsedContent;
	try {
		parsedContent = JSON.parse( fileContent );
	} catch ( e ) {
		throw new Error( 'Invalid JSON file' );
	}
	if (
		parsedContent.__file !== 'wp_block' ||
		! parsedContent.title ||
		! parsedContent.content ||
		typeof parsedContent.title !== 'string' ||
		typeof parsedContent.content !== 'string' ||
		( parsedContent.syncStatus &&
			typeof parsedContent.syncStatus !== 'string' )
	) {
		throw new Error( 'Invalid pattern JSON file' );
	}
	const postType = await apiFetch( { path: `/wp/v2/types/wp_block` } );
	const reusableBlock = await apiFetch( {
		path: `/wp/v2/${ postType.rest_base }`,
		data: {
			title: parsedContent.title,
			content: parsedContent.content,
			status: 'publish',
			meta:
				parsedContent.syncStatus === 'unsynced'
					? { wp_pattern_sync_status: parsedContent.syncStatus }
					: undefined,
		},
		method: 'POST',
	} );

	return reusableBlock;
}

export default importReusableBlock;
