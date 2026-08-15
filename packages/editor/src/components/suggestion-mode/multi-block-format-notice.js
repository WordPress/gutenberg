import { useCallback, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { isKeyboardEvent } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import { unlock } from '../../lock-unlock';
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';
import { getCandidateDocuments } from './keyboard-target';

/*
 * The inline-format shortcuts `@wordpress/format-library` registers through
 * `RichTextShortcut`. Those registrations live inside a rich text's own format
 * edits, which only render while a single block is selected — so with a
 * multi-block selection there is nothing listening for any of them.
 */
const FORMAT_SHORTCUTS = [
	[ 'primary', 'b' ],
	[ 'primary', 'i' ],
	[ 'primary', 'u' ],
	[ 'primary', 'k' ],
	[ 'primaryShift', 'k' ],
	[ 'access', 'd' ],
	[ 'access', 'x' ],
];

/*
 * A stable id so holding a shortcut down replaces the snackbar instead of
 * stacking a queue of identical ones.
 */
const NOTICE_ID = 'editor/suggestion-mode/multi-block-format';

/*
 * `useWritingFlow` stamps this on the wrapper it makes the editing host for a
 * multi-block selection, so it identifies the one element whose keystrokes are
 * the cross-block formatting attempt. Block selection survives focus moving to
 * the notes sidebar, so `hasMultiSelection` alone would also fire this notice
 * for a Cmd+B pressed inside a note reply.
 */
const MULTI_SELECTION_HOST_SELECTOR = '[data-has-multi-selection="true"]';

/**
 * Explains why an inline-formatting shortcut does nothing across a multi-block
 * selection in Suggest mode.
 *
 * The refusal itself is correct and belongs to the block editor, not to this
 * layer: with a multi-block selection the writing-flow wrapper is the editing
 * host, and `useInput` cancels its `beforeinput`, so a browser-native bold
 * never reaches the blocks. Nothing commits directly, which is what the flow
 * asks for. What is missing is any sign that a decision was taken — no note,
 * no marker, no snackbar, and no disabled control to point at, because the
 * format toolbar does not render for a multi-block selection at all. Pressing
 * bold and getting silence reads as a broken editor.
 *
 * So this listens for the inline-format shortcuts on the multi-selection
 * editing host and answers with a snackbar naming the constraint. It is
 * feedback only: the keystroke is left alone rather than cancelled, so nothing
 * about the (already correct) refusal changes.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionMultiBlockFormatNotice() {
	const isSuggestMode = useSelect(
		( select ) =>
			// `getEditorIntent` is private while Suggest mode is experimental.
			unlock( select( EDITOR_STORE_NAME ) ).getEditorIntent() ===
			SUGGEST_INTENT,
		[]
	);
	const hasMultiSelection = useSelect(
		( select ) => select( blockEditorStore ).hasMultiSelection(),
		[]
	);
	const { createNotice } = useDispatch( noticesStore );

	const onKeyDown = useCallback(
		( event ) => {
			if (
				! FORMAT_SHORTCUTS.some( ( [ type, character ] ) =>
					isKeyboardEvent[ type ]( event, character )
				)
			) {
				return;
			}
			if ( ! event.target?.closest?.( MULTI_SELECTION_HOST_SELECTOR ) ) {
				return;
			}
			createNotice(
				'info',
				__(
					'Formatting suggestions apply to a selection within a single block.'
				),
				{
					id: NOTICE_ID,
					type: 'snackbar',
					isDismissible: true,
				}
			);
		},
		[ createNotice ]
	);

	useEffect( () => {
		// Only listen while there is a cross-block selection to explain. The
		// canvas iframe has long since mounted by then, so the documents are
		// resolved at that point rather than on every selection change.
		if ( ! isSuggestMode || ! hasMultiSelection ) {
			return undefined;
		}
		const docs = getCandidateDocuments();
		const listener = ( event ) => onKeyDown( event );
		for ( const doc of docs ) {
			doc.addEventListener( 'keydown', listener, true );
		}
		return () => {
			for ( const doc of docs ) {
				doc.removeEventListener( 'keydown', listener, true );
			}
		};
	}, [ isSuggestMode, hasMultiSelection, onKeyDown ] );

	return null;
}
