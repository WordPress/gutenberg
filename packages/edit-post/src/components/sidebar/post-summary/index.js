/**
 * WordPress dependencies
 */
import {
	usePostTypeSupportCheck,
	usePostExcerptCheck,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PostSummaryTitle from './title';
import PostSummaryExcerpt from './excerpt';

export default function PostSummary() {
	const hasPostTitle = usePostTypeSupportCheck( 'title' );
	const hasPostExcerpt = usePostExcerptCheck();
	return (
		( hasPostTitle || hasPostExcerpt ) && (
			<div className="edit-post-post-summary">
				{ hasPostTitle && <PostSummaryTitle /> }
				{ hasPostExcerpt && <PostSummaryExcerpt /> }
			</div>
		)
	);
}
