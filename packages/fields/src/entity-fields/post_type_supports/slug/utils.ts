import { cleanForSlug } from '@wordpress/url';
import { getItemTitle } from '../../shared/title/get-item-title';
import type { PostWithSlug } from './types';

/**
 * The slug of a post, or the one WordPress would generate for it.
 *
 * @param item The post.
 * @return The slug.
 */
export const getSlug = ( item: PostWithSlug ): string => {
	if ( typeof item !== 'object' ) {
		return '';
	}

	return (
		item.slug ||
		item.generated_slug ||
		cleanForSlug( getItemTitle( item ) ) ||
		( item.id?.toString() ?? '' )
	);
};
