/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { getCurrentPostType, getPostType } from './post-type';

/**
 * Get Document settings tab label in sidebar.
 *
 * @return {string} Label string for Document settings tab in sidebar.
 */
export async function getDocumentLabel() {
	const currentPostType = await getCurrentPostType();
	const postType = await getPostType( currentPostType );
	return get( postType, [ 'labels', 'singular_name' ], 'Document' );
}
