/**
 * External dependencies
 */
import { pick, kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { download } from './file';

/**
 * Export a reusable block as a JSON file.
 *
 * @param {number} id
 */
async function exportReusableBlock( id ) {
	const postType = await apiFetch( { path: `/wp/v2/types/wp_block` } );
	const reusableBlock = await apiFetch( { path: `/wp/v2/${ postType.rest_base }/${ id }` } );
	const fileContent = JSON.stringify( {
		__file: 'wp_block',
		...pick( reusableBlock, [ 'title', 'content' ] ),
	}, null, 2 );
	const fileName = kebabCase( reusableBlock.title ) + '.json';

	download( fileName, fileContent, 'application/json' );
}

export default exportReusableBlock;
