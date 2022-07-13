/**
 * WordPress dependencies
 */
import { PostTypeSupportCheck, PostExcerptCheck } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PostSummaryTitle from './title';
import PostSummaryExcerpt from './excerpt';

export default function PostSummary() {
	return (
		<div className="edit-post-post-summary">
			<PostTypeSupportCheck supportKeys="title">
				<PostSummaryTitle />
			</PostTypeSupportCheck>
			<PostExcerptCheck>
				<PostSummaryExcerpt />
			</PostExcerptCheck>
		</div>
	);
}
