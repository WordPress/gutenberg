import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
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
 * @return {Object} An object containing the current title and a function to update the title.
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
		postId
	);

	const value = useMemo(
		() =>
			previousTitle === undefined
				? title
				: diffRevisionHTML( title, previousTitle ),
		[ title, previousTitle ]
	);

	return { title: value, setTitle };
}
