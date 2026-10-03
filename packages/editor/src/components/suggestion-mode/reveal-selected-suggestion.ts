import { useEffect, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	useStyleOverride,
	privateApis as blockEditorPrivateApis,
	// @ts-expect-error No exported types
} from '@wordpress/block-editor';
import { getSuggestionMarkerSelector } from '../inline-suggestions';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import { useNoteThreads } from '../collab-sidebar/hooks';
import { parseSuggestionPayload } from './provider';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { useBlockElement } = unlock( blockEditorPrivateApis );

// Hex alpha suffix for the active marker's tint. Deliberately lighter than the
// `NoteHighlightStyles` active state (0x80): a suggestion marker already
// carries a strikethrough or underline in the author's color, so a heavy wash
// behind it competes with the decoration instead of pointing at it.
// (0x33 = 20%.)
const ACTIVE_ALPHA = '33';

/**
 * Build the CSS that gives the selected suggestion's in-content marker an
 * active treatment: a tint and a ring in the suggester's color, so a reviewer
 * can tell at a glance *which* run a note is about. Block selection alone is
 * the wrong granularity, because one block can hold several markers.
 *
 * Pure so it can be unit-tested without React.
 *
 * @param selectedId Suggestion (note) id to reveal, if any.
 * @param author     Author id the marker's color derives from.
 * @return Serialized CSS, or '' when nothing is selected.
 */
export function buildSelectedSuggestionCss(
	selectedId?: number | string | null,
	author?: number | null
): string {
	if ( ! selectedId ) {
		return '';
	}
	const color = getAvatarBorderColor( author ?? 0 );
	const selector = getSuggestionMarkerSelector( selectedId );
	return (
		`${ selector }{background-color:${ color }${ ACTIVE_ALPHA };` +
		`border-radius:2px;outline:2px solid ${ color };outline-offset:1px;}`
	);
}

/**
 * Reveal the in-content marker belonging to the selected note.
 *
 * Selecting a note in the sidebar selects its block, which is as far as the
 * link went: the marker itself kept its resting treatment and the canvas never
 * moved, so on a long post the reviewer had to hunt for the run the note was
 * about — and on a block holding several markers, block selection could not
 * point at one of them at all.
 *
 * Both halves are keyed off the note the editor considers selected, rather
 * than off a click handler, so every route into a selection behaves the same:
 * clicking a card, arrowing through the sidebar, or the List View's
 * "focus note" path.
 *
 * @return {null} Renders nothing; styles are applied via `useStyleOverride`.
 */
export default function RevealSelectedSuggestion() {
	const { postId, selectedNoteId } = useSelect( ( select ) => {
		const { getCurrentPostId, getSelectedNote } = unlock(
			select( editorStore )
		);
		return {
			postId: getCurrentPostId(),
			selectedNoteId: getSelectedNote(),
		};
	}, [] );
	const { unresolvedNotes } = useNoteThreads( postId );

	// Only threads that actually carry an inline marker can be revealed;
	// structural and whole-attribute suggestions have nothing in content to
	// point at, and plain notes are handled by `NoteHighlightStyles`.
	const thread = useMemo( () => {
		if ( ! selectedNoteId ) {
			return undefined;
		}
		const match = unresolvedNotes?.find(
			( candidate ) => String( candidate.id ) === String( selectedNoteId )
		);
		const payload = parseSuggestionPayload( match?.meta?._wp_suggestion );
		const hasInline = payload?.operations?.some(
			( op ) => op.type === 'inline-suggestion'
		);
		return hasInline ? match : undefined;
	}, [ unresolvedNotes, selectedNoteId ] );

	const css = useMemo(
		() => buildSelectedSuggestionCss( thread?.id, thread?.author ),
		[ thread?.id, thread?.author ]
	);
	useStyleOverride( { id: 'core-suggestion-selected', css } );

	const blockElement = useBlockElement( thread?.blockClientId );
	const markerId = thread?.id;

	useEffect( () => {
		if ( ! blockElement || ! markerId ) {
			return;
		}
		/*
		 * A marker split across several runs (crossing overlaps) resolves to
		 * its first run, which is where the note's text begins — the same
		 * choice the floating board makes when anchoring a card.
		 *
		 * `block: 'nearest'` leaves an already-visible marker alone instead of
		 * yanking the canvas to center it, so selecting notes one after
		 * another does not make the page jump.
		 */
		blockElement
			.querySelector( getSuggestionMarkerSelector( markerId ) )
			?.scrollIntoView( { block: 'nearest' } );
	}, [ blockElement, markerId ] );

	return null;
}
