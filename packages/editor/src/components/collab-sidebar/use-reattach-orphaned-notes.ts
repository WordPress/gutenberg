import { useEffect, useRef, useState } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { findNoteAnchors, type NoteAnchorSnapshot } from './find-note-anchors';
import { getNoteIdsFromMetadata } from './utils/metadata';

interface Note {
	id: number;
	parent: number;
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
 * @param notes       Note records.
 * @param hasResolved Whether the notes have finished loading.
 * @return A counter that changes once anchors were restored.
 */
export function useReattachOrphanedNotes(
	notes: Note[] | null | undefined,
	hasResolved: boolean
) {
	const registry = useRegistry();
	const [ version, setVersion ] = useState( 0 );
	const hasRunRef = useRef( false );

	useEffect( () => {
		if ( hasRunRef.current || ! hasResolved ) {
			return;
		}
		hasRunRef.current = true;

		const { getBlocks, getBlockAttributes, getClientIdsWithDescendants } =
			registry.select( blockEditorStore );
		const anchored = new Set(
			getClientIdsWithDescendants().flatMap( ( clientId ) =>
				getNoteIdsFromMetadata(
					getBlockAttributes( clientId )?.metadata
				)
			)
		);
		const orphans = ( notes ?? [] )
			.filter(
				( note ) => note.parent === 0 && ! anchored.has( note.id )
			)
			.map( ( note ) => ( {
				id: note.id,
				anchors: note.meta?._wp_note_anchor ?? [],
			} ) );
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
		setVersion( ( current ) => current + 1 );
	}, [ registry, notes, hasResolved ] );

	return version;
}
