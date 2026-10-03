import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
// @ts-expect-error No exported types.
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '../../store';
import { findAutosaveAnchors, type Autosave } from './find-autosave-anchors';

type NoteThread = {
	id: number;
	parent: number;
	blockClientId: string | null;
};

/**
 * Re-attaches orphaned notes to their blocks from the current user's
 * autosave.
 *
 * A note's link to its block (`metadata.noteId`) only persists when the post
 * is saved. When the user leaves without saving, the link can still be in
 * their autosave, which is where this recovers it from. Only the current
 * user's autosave is read, never anyone else's.
 *
 * It runs once, as soon as both the notes and the autosave have loaded. Notes
 * orphaned later in the session, eg. by deleting their block, are left alone.
 *
 * @param notes         Materialized note threads from `useNoteThreads`.
 * @param notesResolved Whether the notes have finished loading.
 */
export function useReattachOrphanedNotes(
	notes: NoteThread[],
	notesResolved: boolean
) {
	const registry = useRegistry();
	const { createNotice } = useDispatch( noticesStore );
	const hasRunRef = useRef( false );

	const { autosave, autosaveResolved } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		const { getAutosave, hasFetchedAutosaves, getCurrentUser } =
			select( coreStore );
		const postType = getCurrentPostType();
		const postId = getCurrentPostId();
		const userId = getCurrentUser()?.id;
		if ( ! postType || ! postId || ! userId ) {
			return { autosave: undefined, autosaveResolved: false };
		}
		return {
			autosave: getAutosave( postType, postId, userId ) as
				Autosave | undefined,
			autosaveResolved: hasFetchedAutosaves( postType, postId ),
		};
	}, [] );

	useEffect( () => {
		if ( hasRunRef.current || ! notesResolved || ! autosaveResolved ) {
			return;
		}
		hasRunRef.current = true;

		const orphanNoteIds = notes
			.filter( ( note ) => note.parent === 0 && ! note.blockClientId )
			.map( ( note ) => note.id );
		const { attributesByClientId, noteIds } = findAutosaveAnchors( {
			orphanNoteIds,
			autosave,
			postModifiedGmt: (
				registry.select( editorStore ).getCurrentPost() as {
					modified_gmt?: string;
				}
			 ).modified_gmt,
			blocks: registry.select( blockEditorStore ).getBlocks(),
		} );
		if ( ! noteIds.length ) {
			return;
		}

		const {
			__unstableMarkNextChangeAsNotPersistent,
			updateBlockAttributes,
		} = registry.dispatch( blockEditorStore );
		// Restoring the link isn't a user edit, so it gets no undo level.
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes(
			Object.keys( attributesByClientId ),
			attributesByClientId,
			{ uniqueByBlock: true }
		);
		createNotice( 'info', __( 'Notes reattached from an autosave.' ), {
			type: 'snackbar',
			isDismissible: true,
		} );
	}, [
		registry,
		createNotice,
		notes,
		notesResolved,
		autosave,
		autosaveResolved,
	] );
}
