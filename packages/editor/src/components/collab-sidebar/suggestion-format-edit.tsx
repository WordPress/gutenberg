import { useEffect, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as editorStore } from '../../store';
import { ALL_NOTES_SIDEBAR } from './constants';
import {
	SUGGESTION_ID_ATTRIBUTE,
	SUGGESTION_KIND_ORDER,
	suggestionKindOf,
} from '../inline-suggestions';
import { unlock } from '../../lock-unlock';

interface SuggestionFormatEditProps {
	isActive: boolean;
	activeAttributes?: Record< string, string >;
	value?: { activeFormats?: any[] };
}

/**
 * The note id of the innermost suggestion marker among the formats active at
 * the caret: a deletion over a formatting change over an addition, matching
 * the marker the caret visually sits in.
 *
 * @param activeFormats Formats active at the caret.
 * @return Note id, or undefined when no marker is active.
 */
function innermostSuggestionId(
	activeFormats: any[] | undefined
): string | undefined {
	let best: any;
	for ( const format of activeFormats ?? [] ) {
		const kind = suggestionKindOf( format );
		if (
			kind &&
			( ! best ||
				SUGGESTION_KIND_ORDER.indexOf( kind ) >
					SUGGESTION_KIND_ORDER.indexOf( suggestionKindOf( best )! ) )
		) {
			best = format;
		}
	}
	return best?.attributes?.[ SUGGESTION_ID_ATTRIBUTE ];
}

/**
 * `edit` for the suggestion marker formats: selects the note of the
 * suggestion marker under the caret, the way `NoteFormat` does for inline
 * notes. Block-level sync alone picks the block's primary note, so in a block
 * holding several suggestions it could never point at the one the caret is in.
 *
 * A replacement's `add` and `del` runs share one id, so either half resolves to
 * the same note.
 *
 * Every marker kind registers this edit, so where markers nest several
 * instances are active at once. Each one resolves the same note, the
 * innermost marker's, from the formats active at the caret, so they agree on
 * what to select whichever runs first.
 *
 * @param props                  Rich-text format edit props.
 * @param props.isActive         Whether a suggestion marker is at the caret.
 * @param props.activeAttributes The active marker's attributes.
 * @param props.value            Rich-text value, for the formats at the caret.
 * @return Renders nothing.
 */
export default function SuggestionFormatEdit( {
	isActive,
	activeAttributes,
	value,
}: SuggestionFormatEditProps ) {
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { getSelectedNote, isNoteFocused } = unlock(
		useSelect( editorStore )
	);
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const noteId = isActive
		? ( innermostSuggestionId( value?.activeFormats ) ??
			activeAttributes?.[ SUGGESTION_ID_ATTRIBUTE ] )
		: undefined;
	const previousNoteIdRef = useRef( noteId );

	useEffect( () => {
		const previousNoteId = previousNoteIdRef.current;
		previousNoteIdRef.current = noteId;

		// Sync an already-open sidebar to the marker under the caret. Read
		// imperatively so it triggers on caret movement, not sidebar state.
		if ( getActiveComplementaryArea( 'core' ) !== ALL_NOTES_SIDEBAR ) {
			return;
		}

		// A pending focus request is an explicit pick from the sidebar.
		if ( isNoteFocused() ) {
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
		// some other way stays selected. Leaving the block unmounts this
		// component instead, and the block-level sync owns that transition.
		if ( previousNoteId && selectedNote === String( previousNoteId ) ) {
			selectNote( undefined );
		}
	}, [
		noteId,
		getActiveComplementaryArea,
		getSelectedNote,
		isNoteFocused,
		selectNote,
	] );

	return null;
}
