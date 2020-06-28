/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { getCurrentPostType, getPostType } from './post-type';

export async function getDocumentLabel() {
	const currentPostType = await getCurrentPostType();
	const postType = await getPostType( currentPostType );
	return get( postType, [ 'labels', 'singular_name' ], 'Document' );
}
