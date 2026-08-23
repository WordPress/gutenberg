import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
// @ts-expect-error No exported types
import { store as interfaceStore } from '@wordpress/interface';
import { store as editorStore } from '../../store';
import { checkSupport } from '../post-type-support-check';
import { isSuggestionModeEnabled } from '../suggestion-mode/gate';
import { ALL_NOTES_SIDEBAR } from '../collab-sidebar/constants';

/**
 * Notice id. Stable so repeated creation replaces rather than stacks.
 */
const NOTICE_ID = 'editor/pending-suggestions';

/**
 * Marker class the `core/suggestion` format serializes to in post content.
 */
const INLINE_MARKER_CLASS = 'wp-suggestion';

/**
 * The `metadata.suggestion.type` values a structural suggestion serializes
 * into a block comment delimiter. Matched as raw JSON fragments so the probe
 * stays a substring test on the saved content instead of a block-tree walk.
 */
const STRUCTURAL_MARKER_VALUES = [
	'"pending-remove"',
	'"pending-insert"',
	'"pending-move"',
];

/**
 * Whether saved post content carries suggestion state of any kind.
 *
 * @param content Raw post content.
 * @return True when an inline marker or a structural marker is present.
 */
export function hasSuggestionMarkers( content: any ): boolean {
	if ( typeof content !== 'string' || ! content ) {
		return false;
	}
	return (
		content.includes( INLINE_MARKER_CLASS ) ||
		STRUCTURAL_MARKER_VALUES.some( ( value ) => content.includes( value ) )
	);
}

/**
 * Explains suggestion markers to a user who does not have Suggest mode.
 *
 * Suggestion state outlives the experiment flag by design: the
 * `core/suggestion` format is registered unconditionally so a `<mark
 * class="wp-suggestion">` survives a load-and-save byte for byte, which is
 * what keeps content safe when the experiment is toggled off on a site that
 * has been using it. The cost is comprehension. With the experiment off the
 * intent switcher, the marker tooltips and the per-author tinting are all
 * absent, so a proposed insertion reads as ordinary green underlined text
 * with nothing to say what it is or where to act on it.
 *
 * The controls are not actually missing — a suggestion is a note comment, the
 * notes sidebar ships in core, and its Accept/Reject buttons render whether or
 * not the experiment is on. What is missing is any sign that they exist. This
 * notice supplies it, and its action opens the sidebar.
 *
 * Stripping the markers instead would be the destructive answer: a pending
 * addition's text is not public content until it is accepted, so dropping the
 * wrapper on load and saving would silently promote every proposal and orphan
 * its note.
 */
export default function useSuggestionReviewNotice() {
	const { createInfoNotice } = useDispatch( noticesStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	const hasPendingSuggestions = useSelect( ( select ) => {
		/*
		 * With the experiment on, the intent switcher and the suggestion UI
		 * explain themselves; the notice would be noise.
		 */
		if ( isSuggestionModeEnabled() ) {
			return false;
		}
		const { getCurrentPostAttribute, getCurrentPostType } =
			select( editorStore );
		if ( ! hasSuggestionMarkers( getCurrentPostAttribute( 'content' ) ) ) {
			return false;
		}
		/*
		 * Suggestions persist as note comments, so the sidebar the notice
		 * points at only exists on a post type that supports notes.
		 */
		const postTypeSlug = getCurrentPostType();
		const postType = postTypeSlug
			? select( coreStore ).getPostType( postTypeSlug )
			: null;
		return !! postType && checkSupport( postType.supports, 'editor.notes' );
	}, [] );

	useEffect( () => {
		if ( ! hasPendingSuggestions ) {
			return;
		}
		createInfoNotice(
			__(
				'This post has suggested edits, shown as highlighted text in the content. Open the notes to accept or reject them.'
			),
			{
				id: NOTICE_ID,
				actions: [
					{
						label: __( 'Show notes' ),
						onClick: () =>
							enableComplementaryArea(
								'core',
								ALL_NOTES_SIDEBAR
							),
					},
				],
			}
		);
		/*
		 * Created once per editor mount. `hasPendingSuggestions` is derived
		 * from the saved post, so it flips false -> true at most once and a
		 * dismissed notice is not resurrected by the next save.
		 */
	}, [ hasPendingSuggestions, createInfoNotice, enableComplementaryArea ] );
}
