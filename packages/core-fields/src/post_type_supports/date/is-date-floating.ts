import type { PostWithDate } from './types';

/**
 * Whether the post has no date of its own yet and publishes immediately: a
 * draft or pending post whose date was reset (`null`), or still follows its
 * modified date, as the server keeps it while it floats.
 *
 * @param item The post.
 * @return Whether the date floats.
 */
export function isDateFloating( item: PostWithDate ): boolean {
	if (
		! [ 'draft', 'auto-draft', 'pending' ].includes( item.status ?? '' )
	) {
		return false;
	}
	return item.date === null || item.date === item.modified;
}
