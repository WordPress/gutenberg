import { cleanForSlug } from '@wordpress/url';
import { getItemTitle } from '../../shared/title/get-item-title';
import type { PostWithSlug } from './types';

/**
 * The slug of a post: the slug if one is set, otherwise the slug derived from
 * the current title, which is what WordPress uses when the post is published.
 * Empty for a post with neither.
 *
 * The server-generated slug isn't used: it comes from the saved title, so it
 * lags behind title edits, and for a new post it comes from the `Auto Draft`
 * placeholder.
 *
 * @param item The post.
 * @return The slug.
 */
export const getSlug = ( item: PostWithSlug ): string => {
	if ( typeof item !== 'object' ) {
		return '';
	}

	return item.slug || cleanForSlug( getItemTitle( item, '' ) );
};
