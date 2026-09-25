import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as editorStore } from '../../store';
import { SIDEBARS } from './constants';
import { unlock } from '../../lock-unlock';

export const NOTE_FORMAT_NAME = 'core/note';

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
	const { getSelectedNote } = unlock( useSelect( editorStore ) );
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const noteId = isActive ? activeAttributes?.[ 'data-id' ] : undefined;
	const previousNoteIdRef = useRef( noteId );

	useEffect( () => {
		const previousNoteId = previousNoteIdRef.current;
		previousNoteIdRef.current = noteId;

		// Sync an already-open sidebar to the marker under the caret. Read
		// imperatively so it triggers on caret movement, not sidebar state.
		if ( ! SIDEBARS.includes( getActiveComplementaryArea( 'core' ) ) ) {
			return;
		}

		const selectedNote = String( getSelectedNote() );

		if ( noteId ) {
			if ( selectedNote !== String( noteId ) ) {
				selectNote( Number( noteId ) );
			}
			return;
		}

		// The caret left a marker for plain text in the same block: deselect
		// its note, but only if it is still the selected one, so a note picked
		// some other way (sidebar, block-level sync) stays selected. Leaving
		// the block unmounts this component instead, and the block-level sync
		// owns that transition.
		if ( previousNoteId && selectedNote === String( previousNoteId ) ) {
			selectNote( undefined );
		}
	}, [ noteId, getActiveComplementaryArea, getSelectedNote, selectNote ] );

	return null;
}
