import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

type PendingRevision = {
	postType: string;
	postId: number | string;
	revisionId: number;
};

/**
 * Opens a revision queued with `openRevisionOfPost` once its post is the
 * current post.
 */
export function usePendingRevision() {
	const { pendingRevision, isPendingPostCurrent } = useSelect( ( select ) => {
		const editor = unlock( select( editorStore ) );
		const pending: PendingRevision | null = editor.getPendingRevision();
		return {
			pendingRevision: pending,
			isPendingPostCurrent:
				!! pending &&
				editor.getCurrentPostType() === pending.postType &&
				String( editor.getCurrentPostId() ) ===
					String( pending.postId ),
		};
	}, [] );
	const { openRevisionOfPost } = unlock( useDispatch( editorStore ) );

	useEffect( () => {
		if ( pendingRevision && isPendingPostCurrent ) {
			openRevisionOfPost( pendingRevision );
		}
	}, [ pendingRevision, isPendingPostCurrent, openRevisionOfPost ] );
}
