/**
 * WordPress dependencies
 */
import type { AnyItem } from '@wordpress/dataviews';

type PostStatus =
	| 'published'
	| 'draft'
	| 'pending'
	| 'private'
	| 'future'
	| 'auto-draft'
	| 'trash';

export interface Post extends AnyItem {
	status: PostStatus;
}
