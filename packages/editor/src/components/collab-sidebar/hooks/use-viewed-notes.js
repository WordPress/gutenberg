/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

export function useViewedNotes( postId ) {
	const currentUserId = useSelect(
		( select ) => select( coreStore ).getCurrentUser()?.id,
		[]
	);

	const viewedIds = useSelect(
		( select ) =>
			postId
				? unlock( select( coreStore ) ).getViewedNoteIds( postId )
				: [],
		[ postId ]
	);

	const { markNotesViewed: dispatchMarkNotesViewed } = unlock(
		useDispatch( coreStore )
	);

	const seenIds = useMemo(
		() => new Set( viewedIds.map( String ) ),
		[ viewedIds ]
	);

	const markNotesViewed = useCallback(
		( noteIds = [] ) => {
			if ( ! postId || ! noteIds?.length ) {
				return;
			}
			dispatchMarkNotesViewed( postId, noteIds );
		},
		[ postId, dispatchMarkNotesViewed ]
	);

	const isNoteUnread = useCallback(
		( noteId, authorId ) => {
			if ( authorId === currentUserId ) {
				return false;
			}
			return ! seenIds.has( String( noteId ) );
		},
		[ seenIds, currentUserId ]
	);

	return { isNoteUnread, markNotesViewed };
}
