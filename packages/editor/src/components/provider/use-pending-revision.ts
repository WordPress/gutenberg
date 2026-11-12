import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

type PendingRevision = {
	postType: string;
	postId: number | string;
	revisionId: number;
	fromPostType?: string;
	fromPostId?: number | string;
};

function isSamePost(
	postType: string | undefined,
	postId: number | string | undefined,
	otherPostType: string | undefined,
	otherPostId: number | string | undefined
) {
	return (
		postType === otherPostType && String( postId ) === String( otherPostId )
	);
}

/**
 * Opens a revision queued with `openRevisionOfPost` once its post is the
 * current post.
 *
 * If the editor ends up on any other post, the navigation that queued the
 * revision never reached its post, so the revision is dropped. Otherwise it
 * would open unasked on a later visit to that post.
 */
export function usePendingRevision() {
	const { pendingRevision, currentPostType, currentPostId } = useSelect(
		( select ) => {
			const editor = unlock( select( editorStore ) );
			return {
				pendingRevision:
					editor.getPendingRevision() as PendingRevision | null,
				currentPostType: editor.getCurrentPostType() as
					string | undefined,
				currentPostId: editor.getCurrentPostId() as
					number | string | undefined,
			};
		},
		[]
	);
	const { openRevisionOfPost, clearPendingRevision } = unlock(
		useDispatch( editorStore )
	);

	useEffect( () => {
		if ( ! pendingRevision || ! currentPostType || ! currentPostId ) {
			return;
		}
		if (
			isSamePost(
				currentPostType,
				currentPostId,
				pendingRevision.postType,
				pendingRevision.postId
			)
		) {
			openRevisionOfPost( pendingRevision );
			return;
		}
		// Still on the post the request came from: the navigation hasn't
		// happened yet.
		if (
			isSamePost(
				currentPostType,
				currentPostId,
				pendingRevision.fromPostType,
				pendingRevision.fromPostId
			)
		) {
			return;
		}
		clearPendingRevision();
	}, [
		pendingRevision,
		currentPostType,
		currentPostId,
		openRevisionOfPost,
		clearPendingRevision,
	] );
}
