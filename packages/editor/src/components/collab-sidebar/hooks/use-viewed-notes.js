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

	// `useEntityProp`'s own fetch uses the default (view) context, which
	// strips custom meta fields like `viewed_notes` from the response
	// entirely. Entity records are normalized per (kind, name, id) though,
	// not per query — so priming a fetch with `context: 'edit'` here merges
	// `meta` into the same shared record `useEntityProp` reads from below.
	useSelect(
		( select ) =>
			currentUserId &&
			select( coreStore ).getEntityRecord(
				'root',
				'user',
				currentUserId,
				{ context: 'edit' }
			),
		[ currentUserId ]
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
			if ( ! postId || ! noteIds.length || ! currentUserId ) {
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

			// Same id (currentUserId) as used above for useEntityProp —
			// mismatched ids between the edit and the save silently drop
			// the write, which was the original bug in this hook.
			saveEditedEntityRecord( 'root', 'user', currentUserId );
		},
		[
			postId,
			seenIds,
			meta,
			setMeta,
			saveEditedEntityRecord,
			currentUserId,
		]
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
