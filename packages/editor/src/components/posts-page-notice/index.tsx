import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const NOTICE_ID = 'editor-posts-page-notice';

/**
 * Warns that the page being edited is the one that shows the latest posts,
 * the posts page chosen in the reading settings.
 *
 * The post editor gets this notice from the server, which adds it before the
 * editor loads. The site editor moves from one page to another without
 * loading again, so this adds the notice while the posts page is the post
 * being edited, and removes it once the editor moves on. It renders nothing.
 */
export default function PostsPageNotice() {
	const isPostsPage = useSelect(
		( select ) =>
			unlock( select( coreStore ) ).getPostsPageId() ===
			String( select( editorStore ).getCurrentPostId() ),
		[]
	);
	const { createWarningNotice, removeNotice } = useDispatch( noticesStore );

	useEffect( () => {
		if ( ! isPostsPage ) {
			return;
		}
		createWarningNotice(
			__(
				'You are currently editing the page that shows your latest posts.'
			),
			{ id: NOTICE_ID, isDismissible: false }
		);
		return () => {
			removeNotice( NOTICE_ID );
		};
	}, [ isPostsPage, createWarningNotice, removeNotice ] );

	return null;
}
