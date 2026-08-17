import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import { store as interfaceStore } from '@wordpress/interface';
import { store as editorStore } from '../../store';
import { ALL_NOTES_SIDEBAR } from './constants';
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
	const isLargeViewport = useViewportMatch( 'medium' );
	const noteId = activeAttributes?.[ 'data-id' ];

	useEffect( () => {
		if ( ! isActive || ! noteId ) {
			return;
		}

		// Sync an already-visible notes surface to the marker under the
		// caret. Read imperatively so it triggers on caret movement, not
		// sidebar state. The floating panel is not a complementary area: on
		// large viewports it is the surface, and a marker under the caret
		// means its note is unresolved, so the panel is already showing.
		if (
			! isLargeViewport &&
			getActiveComplementaryArea( 'core' ) !== ALL_NOTES_SIDEBAR
		) {
			return;
		}

		if ( String( getSelectedNote() ) === String( noteId ) ) {
			return;
		}

		// Select-only; no cleanup on leave. The block-level sync owns
		// clearing/reverting, and deselecting here would drop the block's
		// note while the caret is still inside the block.
		selectNote( Number( noteId ) );
	}, [
		isActive,
		noteId,
		isLargeViewport,
		getActiveComplementaryArea,
		getSelectedNote,
		selectNote,
	] );

	return null;
}
