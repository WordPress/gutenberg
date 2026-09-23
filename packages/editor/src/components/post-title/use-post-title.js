import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { diffRevisionHTML } from '../post-revisions-preview/block-diff';

/**
 * Custom hook for managing the post title in the editor.
 *
 * In the revisions preview, `useEntityProp` already returns the revision's
 * title. When changes are shown, it is returned with inline diff marks against
 * the previous revision, matching how the revision's blocks are marked. The
 * setter is a no-op there, so the title cannot be edited.
 *
 * @return {Object} An object containing the current title, a function to update the title, and a function that ends the current undo run.
 */
export default function usePostTitle() {
	const { postType, postId, previousTitle } = useSelect( ( select ) => {
		const {
			getCurrentPostType,
			getCurrentPostId,
			isRevisionsMode,
			isShowingRevisionDiff,
			getPreviousRevision,
		} = unlock( select( editorStore ) );
		const isDiffing = isRevisionsMode() && isShowingRevisionDiff();

		return {
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
			// The oldest revision has nothing to compare against, so its whole
			// title reads as added.
			previousTitle: isDiffing
				? ( getPreviousRevision()?.title?.raw ?? '' )
				: undefined,
		};
	}, [] );

	const [ title, setTitle ] = useEntityProp(
		'postType',
		postType,
		'title',
		postId,
		{ isCached: true }
	);
	const { __unstableCreateUndoLevel } = useDispatch( coreStore );
	// Typing merges into one undo level until a second passes without input,
	// matching block attributes edited through `RichText`.
	const endUndoRun = useDebounce( __unstableCreateUndoLevel, 1000 );
	const setTitleAndEndRunLater = useCallback(
		( newTitle ) => {
			setTitle( newTitle );
			endUndoRun();
		},
		[ setTitle, endUndoRun ]
	);

	const value = useMemo(
		() =>
			previousTitle === undefined
				? title
				: diffRevisionHTML( title, previousTitle ),
		[ title, previousTitle ]
	);

	return {
		title: value,
		setTitle: setTitleAndEndRunLater,
		// For the input's blur, so a pending run end cannot fire later and end
		// the run of whatever is edited next.
		endUndoRun: endUndoRun.flush,
	};
}
