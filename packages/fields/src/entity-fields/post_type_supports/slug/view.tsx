import { useState } from '@wordpress/element';
import type { PostWithSlug } from './types';
import { getSlug } from './utils';

/*
 * The slug of a post. It keeps the first slug in state rather than in a ref read during render.
 */
const SlugView = ( { item }: { item: PostWithSlug } ) => {
	const slug = getSlug( item );
	// The slug the post had first, shown while the slug is emptied.
	const [ originalSlug ] = useState( slug );

	const slugToDisplay = slug || originalSlug;

	return `${ slugToDisplay }`;
};

export default SlugView;
