/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';

const VIEWED_NOTES_META_KEY = 'viewed_notes';

/**
 * Tracks which note/reply ids the current user has viewed per post,
 * persisted in a single registered user-meta field (`viewed_notes`),
 * read/written entirely through core-data — no direct REST calls.
 *
 * @param {number} postId
 * @return {Object} { isNoteUnread, markNotesViewed }
 */
export function useViewedNotes( postId ) {
	const currentUserId = useSelect(
		( select ) => select( coreStore ).getCurrentUser()?.id,
		[]
	);

	const [ meta, setMeta ] = useEntityProp(
		'root',
		'user',
		'meta',
		currentUserId
	);
	const { saveEditedEntityRecord } = useDispatch( coreStore );

	const seenIds = useMemo( () => {
		const postMap = meta?.[ VIEWED_NOTES_META_KEY ]?.[ postId ];
		return new Set( ( postMap ?? [] ).map( String ) );
	}, [ meta, postId ] );

	const markNotesViewed = useCallback(
		( noteIds = [] ) => {
			if ( ! postId || ! noteIds.length ) {
				return;
			}

			const nextIds = new Set( seenIds );
			let hasNew = false;
			for ( const id of noteIds ) {
				const idStr = String( id );
				if ( ! nextIds.has( idStr ) ) {
					nextIds.add( idStr );
					hasNew = true;
				}
			}

			if ( ! hasNew ) {
				return;
			}

			setMeta( {
				...meta,
				[ VIEWED_NOTES_META_KEY ]: {
					...( meta?.[ VIEWED_NOTES_META_KEY ] ?? {} ),
					[ postId ]: Array.from( nextIds ),
				},
			} );

			// Persist to the server immediately (core-data already debounces saves).
			saveEditedEntityRecord( 'root', 'user', 'me' );
		},
		[ postId, seenIds, meta, setMeta, saveEditedEntityRecord ]
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
