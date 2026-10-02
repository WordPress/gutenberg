import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	// @ts-expect-error No exported types
} from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';
import { removeNoteIdFromMetadata } from '../collab-sidebar/utils';
import { useSuggestionsProvider } from './provider';
import { useSuggestionOverlay } from './overlay-context';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

/**
 * Trash the notes created for a suggestion gesture that was abandoned before
 * its marker was written, and drop their ids from the block's note linkage.
 *
 * Every keyboard opens its note before it writes the marker, so a gesture
 * abandoned in that window (the caret moved, the intent changed, the second
 * request of a type-over failed) leaves a pending note with nothing to
 * accept or reject. The garbage collector never trashes an anchor it has not
 * observed, so the note would stay in the sidebar for good unless the gesture
 * that opened it cleans up.
 *
 * Best-effort: a failed trash is already surfaced by `deleteSuggestion`'s own
 * notice.
 *
 * @return Cleanup function taking the block's client id and the note ids.
 */
export default function useAbandonedNoteCleanup() {
	const { getBlockAttributes } = useSelect( blockEditorStore );
	const {
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent: markNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const { deleteSuggestion } = useSuggestionsProvider();
	const { requestInterceptorBypass } = useSuggestionOverlay();

	return useCallback(
		async ( clientId: string, ids: any[] ) => {
			const noteIds = ids.filter( Boolean );
			if ( noteIds.length === 0 ) {
				return;
			}
			let metadata = getBlockAttributes( clientId )?.metadata;
			for ( const id of noteIds ) {
				metadata = removeNoteIdFromMetadata( metadata, id );
			}
			requestInterceptorBypass( clientId );
			/*
			 * The linkage is bookkeeping, not a user edit, and must never take
			 * an undo level of its own: on a retraction path that level would
			 * pop first, restoring a `noteId` that points at a note this call
			 * is about to trash, instead of undoing the user's edit.
			 */
			markNextChangeAsNotPersistent?.( { history: 'ignore' } );
			updateBlockAttributes( clientId, {
				metadata: cleanEmptyObject( metadata ),
			} );
			for ( const id of noteIds ) {
				try {
					await deleteSuggestion( { commentId: id } );
				} catch {
					// `deleteSuggestion` surfaces its own notice.
				}
			}
		},
		[
			getBlockAttributes,
			updateBlockAttributes,
			markNextChangeAsNotPersistent,
			requestInterceptorBypass,
			deleteSuggestion,
		]
	);
}
