import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useEvent, useViewportMatch } from '@wordpress/compose';
import {
	store as blockEditorStore,
	useBlockEditContext,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editorStore } from '../../store';
import { ALL_NOTES_SIDEBAR } from './constants';
import { getNoteIdsFromMetadata, pickBlockLevelNote } from './utils';
import { unlock } from '../../lock-unlock';

/*
 * Anchoring-only format: it serializes an inline note's in-content marker as
 * `<mark class="wp-note" data-id="N">`. Notes are added from the block options
 * menu instead, since an `edit` with UI would fill `RichText.ToolbarControls`,
 * which the format toolbar renders inside the "More" (inline styles) dropdown -
 * the wrong home for an action that is neither an inline style nor exclusive to
 * text selections.
 */
export const noteFormat = {
	title: __( 'Note' ),
	tagName: 'mark',
	className: 'wp-note',
	attributes: {
		'data-id': 'data-id',
	},
	edit: NoteFormat,
};

function NoteFormat( { isActive, activeAttributes } ) {
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { get: getPreference } = useSelect( preferencesStore );
	const isLargeViewport = useViewportMatch( 'medium' );
	const { getSelectedNote } = unlock( useSelect( editorStore ) );
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const noteId = isActive ? activeAttributes?.[ 'data-id' ] : undefined;
	const previousNoteIdRef = useRef( noteId );
	const { clientId } = useBlockEditContext();
	const registry = useRegistry();

	// Mirror the block-level sync's pick. The notes query already resolved
	// each record, so reading them here doesn't fetch.
	const getBlockLevelNoteId = useEvent( () => {
		const attributes = registry
			.select( blockEditorStore )
			.getBlockAttributes( clientId );
		const { getEntityRecord } = registry.select( coreStore );
		const threads = getNoteIdsFromMetadata( attributes?.metadata )
			.map( ( id ) => getEntityRecord( 'root', 'comment', id ) )
			.filter(
				( thread ) =>
					thread?.status === 'hold' || thread?.status === 'approved'
			)
			.sort( ( a, b ) => a.id - b.id );
		return pickBlockLevelNote( threads, attributes )?.id;
	} );

	useEffect( () => {
		const previousNoteId = previousNoteIdRef.current;
		previousNoteIdRef.current = noteId;

		// Sync visible notes to the marker under the caret. Read imperatively
		// so it triggers on caret movement, not sidebar state.
		const canShowFloatingNotes =
			isLargeViewport &&
			getPreference( 'core', 'notesDisplayMode' ) !== 'hidden';
		if (
			! canShowFloatingNotes &&
			getActiveComplementaryArea( 'core' ) !== ALL_NOTES_SIDEBAR
		) {
			return;
		}

		const selectedNote = String( getSelectedNote() );

		if ( noteId ) {
			if ( selectedNote !== String( noteId ) ) {
				selectNote( Number( noteId ) );
			}
			return;
		}

		// The caret left a marker for plain text in the same block. If its
		// note is still selected, fall back to what the block selects on its
		// own, so the result depends only on where the caret is. Leaving the
		// block unmounts this component instead, and the block-level sync
		// owns that transition.
		if ( previousNoteId && selectedNote === String( previousNoteId ) ) {
			selectNote( getBlockLevelNoteId() );
		}
	}, [
		noteId,
		isLargeViewport,
		getActiveComplementaryArea,
		getPreference,
		getSelectedNote,
		getBlockLevelNoteId,
		selectNote,
	] );

	return null;
}
