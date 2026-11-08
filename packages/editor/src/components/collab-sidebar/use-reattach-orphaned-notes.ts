import { useEffect, useRef } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { findNoteAnchors, type NoteAnchorSnapshot } from './find-note-anchors';

interface NoteThread {
	id: number;
	parent: number;
	blockClientId: string | null;
	meta?: { _wp_note_anchor?: NoteAnchorSnapshot[] };
}

/**
 * Re-attaches orphaned notes to their blocks from the snapshots taken when
 * they were added, see `_wp_note_anchor`.
 *
 * Runs once the notes have loaded. The restored anchors are in-memory edits
 * like the original ones: they persist with the next save and get no undo
 * level. Notes orphaned later in the session, eg. by deleting their block,
 * are left alone.
 *
 * @param notes       Note threads from `useNoteThreads`.
 * @param hasResolved Whether the notes have finished loading.
 */
export function useReattachOrphanedNotes(
	notes: NoteThread[],
	hasResolved: boolean
) {
	const registry = useRegistry();
	const hasRunRef = useRef( false );

	useEffect( () => {
		if ( hasRunRef.current || ! hasResolved ) {
			return;
		}
		hasRunRef.current = true;

		const orphans = notes
			.filter( ( note ) => note.parent === 0 && ! note.blockClientId )
			.map( ( note ) => ( {
				id: note.id,
				anchors: note.meta?._wp_note_anchor ?? [],
			} ) );
		const { getBlocks } = registry.select( blockEditorStore );
		const attributesByClientId = findNoteAnchors( orphans, getBlocks() );
		const clientIds = Object.keys( attributesByClientId );
		if ( ! clientIds.length ) {
			return;
		}

		const {
			__unstableMarkNextChangeAsNotPersistent,
			__unstableMarkLastChangeAsPersistent,
			updateBlockAttributes,
		} = registry.dispatch( blockEditorStore );
		__unstableMarkNextChangeAsNotPersistent( { history: 'ignore' } );
		updateBlockAttributes( clientIds, attributesByClientId, {
			uniqueByBlock: true,
		} );
		__unstableMarkLastChangeAsPersistent();
	}, [ registry, notes, hasResolved ] );
}
