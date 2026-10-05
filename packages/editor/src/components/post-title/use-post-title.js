import { useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import { EDITOR_INTENT_SUGGEST } from '../../store/constants';
import { unlock } from '../../lock-unlock';
import { diffRevisionHTML } from '../post-revisions-preview/block-diff';
import { useSuggestionSession } from '../suggestion-mode/suggestion-session';

/**
 * Custom hook for managing the post title in the editor.
 *
 * In the revisions preview, `useEntityProp` already returns the revision's
 * title. When changes are shown, it is returned with inline diff marks against
 * the previous revision, matching how the revision's blocks are marked. The
 * setter is a no-op there, so the title cannot be edited.
 *
 * In Suggest intent the setter never writes the post: the edit is held in the
 * suggestion overlay as a proposed title (saved as a note by the auto-saver),
 * and the proposed title is what the field shows.
 *
 * @return {Object} An object containing the current title, a function to update the title, and whether a title suggestion is pending.
 */
export default function usePostTitle() {
	const { postType, postId, previousTitle, isSuggesting } = useSelect(
		( select ) => {
			const {
				getCurrentPostType,
				getCurrentPostId,
				isRevisionsMode,
				isShowingRevisionDiff,
				getPreviousRevision,
				getEditorIntent,
			} = unlock( select( editorStore ) );
			const isDiffing = isRevisionsMode() && isShowingRevisionDiff();

			return {
				postType: getCurrentPostType(),
				postId: getCurrentPostId(),
				isSuggesting: getEditorIntent() === EDITOR_INTENT_SUGGEST,
				// The oldest revision has nothing to compare against, so its whole
				// title reads as added.
				previousTitle: isDiffing
					? ( getPreviousRevision()?.title?.raw ?? '' )
					: undefined,
			};
		},
		[]
	);

	const [ title, setEntityTitle ] = useEntityProp(
		'postType',
		postType,
		'title',
		postId
	);

	// The title is not a block, so its proposal has no marker to live in; it
	// is the one proposal the session holds in memory.
	const { postTitleProposal, setPostTitleProposal } = useSuggestionSession();
	const proposedTitle =
		isSuggesting && postTitleProposal
			? postTitleProposal.proposed
			: undefined;
	const isSuggestionPending =
		proposedTitle !== undefined &&
		proposedTitle !== postTitleProposal.baseline;

	const setTitle = useCallback(
		( newTitle ) => {
			if ( ! isSuggesting ) {
				setEntityTitle( newTitle );
				return;
			}
			// The baseline is captured on the first edit and kept after.
			setPostTitleProposal( {
				baseline: postTitleProposal?.baseline ?? title,
				proposed: newTitle,
			} );
		},
		[
			isSuggesting,
			setEntityTitle,
			setPostTitleProposal,
			postTitleProposal,
			title,
		]
	);

	const shownTitle = proposedTitle ?? title;
	const value = useMemo(
		() =>
			previousTitle === undefined
				? shownTitle
				: diffRevisionHTML( shownTitle, previousTitle ),
		[ shownTitle, previousTitle ]
	);

	return { title: value, setTitle, isSuggestionPending };
}
