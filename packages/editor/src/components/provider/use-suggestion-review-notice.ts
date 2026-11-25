import { useEffect, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
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
 * The `<mark>` element an inline suggestion marker of any kind serializes to
 * in post content. Matched as an element so prose or a code sample that
 * mentions a class name does not count: in content the same markup is escaped
 * (`&lt;mark class="wp-suggestion-add"`) and has no `<mark` to match.
 */
const INLINE_MARKER_PROBE =
	/<mark\b[^>]*\bclass="(?:[^"]*\s)?wp-suggestion-(?:add|del|format)(?:[\s"])/;

/**
 * The `metadata.suggestion` object a structural suggestion serializes into a
 * block comment delimiter, matched as the raw JSON fragment inside the
 * delimiter so the probe stays a substring test on the saved content instead
 * of a block-tree walk. The delimiter JSON sits on the delimiter's own line
 * and carries no whitespace; the same text in a code block sits in the block's
 * HTML, not in a delimiter.
 */
const STRUCTURAL_MARKER_PROBE =
	/<!-- wp:[a-z0-9/_-]+ \{[^\n]*"suggestion":\{[^{}\n]*"type":"pending-(?:remove|insert|move)"/;

/**
 * The void block the save pass leaves where a suggested block goes. Without
 * the experiment the editor loads it as stored.
 */
const PLACEHOLDER_PROBE = '<!-- wp:suggestion-placeholder ';

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
		INLINE_MARKER_PROBE.test( content ) ||
		STRUCTURAL_MARKER_PROBE.test( content ) ||
		content.includes( PLACEHOLDER_PROBE )
	);
}

/**
 * Explains suggestion markers to a user who does not have Suggestion mode.
 *
 * A post that carries suggestions keeps them when the experiment is turned
 * off: the save pass has left an anchor where each one goes, and the marker
 * formats stay registered so an anchor survives a load and a save. Nothing
 * else of the feature runs, though. The proposed text is not loaded, and the
 * notes sidebar lists the suggestions without Accept or Reject, so this
 * notice says what they are and what brings the controls back.
 *
 * Stripping the anchors instead would be the destructive answer: their notes
 * would have nothing left to apply once the experiment is back on.
 */
export default function useSuggestionReviewNotice() {
	const { createInfoNotice } = useDispatch( noticesStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	// The regex probes run in a memo on the saved content, which changes on
	// load and save only, rather than in `mapSelect` on every store update.
	const { savedContent, supportsNotes } = useSelect( ( select ) => {
		/*
		 * With the experiment on, the intent switcher and the suggestion UI
		 * explain themselves; the notice would be noise.
		 */
		if ( isSuggestionModeEnabled() ) {
			return { savedContent: null, supportsNotes: false };
		}
		const { getCurrentPostAttribute, getCurrentPostType } =
			select( editorStore );
		/*
		 * Suggestions persist as note comments, so the sidebar the notice
		 * points at only exists on a post type that supports notes.
		 */
		const postTypeSlug = getCurrentPostType();
		const postType = postTypeSlug
			? select( coreStore ).getPostType( postTypeSlug )
			: null;
		return {
			savedContent: getCurrentPostAttribute( 'content' ),
			supportsNotes:
				!! postType &&
				checkSupport( postType.supports, 'editor.notes' ),
		};
	}, [] );
	const hasPendingSuggestions = useMemo(
		() => supportsNotes && hasSuggestionMarkers( savedContent ),
		[ supportsNotes, savedContent ]
	);

	useEffect( () => {
		if ( ! hasPendingSuggestions ) {
			return;
		}
		createInfoNotice(
			__(
				'This post has suggested edits. Turn on the Suggestion Mode experiment to review them.'
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
