import { __ } from '@wordpress/i18n';
import type { PostWithSlug } from './types';
import { getSlug } from './utils';

/*
 * The slug of a post.
 */
const SlugView = ( { item }: { item: PostWithSlug } ) => {
	// A draft without a slug or a title has no slug yet.
	return getSlug( item ) || __( 'None' );
};

export default SlugView;
