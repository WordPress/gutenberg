/**
 * Decorate pending inline suggestions on the canvas.
 *
 * Phase 2 of the inline-suggestions work renders a suggested inline change as a
 * `core/suggestion` marker that lives in block content (Option B). This module
 * is the suggestion-mode counterpart to Notes' `useAnnotateBlocks`: it takes the
 * post's unresolved suggestion threads, re-derives each marker's live range from
 * the linked block's current content (`findSuggestionRange` — offsets are never
 * stored, so a marker survives unrelated edits elsewhere in the block), and
 * decorates the ranges through the annotations API. Decoration is runtime-only;
 * nothing is written back to block content.
 *
 * The bespoke overlay-diff layer still renders the older before/after
 * suggestions in parallel; the two coexist until that layer is retired.
 */

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	findSuggestionRange,
	useAnnotateSuggestions,
} from '../inline-suggestions';
import { parseSuggestionPayload } from './provider';
import { useNoteThreads } from '../collab-sidebar/hooks';
import { store as editorStore } from '../../store';

/**
 * Build the annotation ranges for a set of suggestion threads. Pure so it can
 * be unit-tested without React or the data stores.
 *
 * For each unresolved (`status: 'hold'`) thread whose payload carries an
 * `inline-suggestion` op, the marker's live range is re-derived from the linked
 * block's content by id. Threads with no inline-suggestion op (plain notes,
 * structural or whole-attribute suggestions) and markers that can no longer be
 * found in content are skipped.
 *
 * @param {Array}    threads            Note threads (suggestion comments).
 * @param {Function} getBlockAttributes Selector returning a block's attributes.
 * @return {Array} Ranges `{ id, clientId, attributeKey, start, end }`.
 */
export function suggestionAnnotations( threads, getBlockAttributes ) {
	if ( ! threads?.length ) {
		return [];
	}
	const out = [];
	for ( const thread of threads ) {
		if ( thread.status !== 'hold' || ! thread.blockClientId ) {
			continue;
		}
		const payload = parseSuggestionPayload( thread.meta?._wp_suggestion );
		const op = payload?.operations?.find(
			( candidate ) =>
				candidate.type === 'inline-suggestion' && candidate.attribute
		);
		if ( ! op ) {
			continue;
		}
		const attributes = getBlockAttributes( thread.blockClientId );
		if ( ! attributes ) {
			continue;
		}
		const range = findSuggestionRange(
			attributes[ op.attribute ],
			thread.id
		);
		if ( ! range ) {
			continue;
		}
		out.push( {
			id: String( thread.id ),
			clientId: thread.blockClientId,
			attributeKey: op.attribute,
			start: range.start,
			end: range.end,
		} );
	}
	return out;
}

/**
 * Resolve and decorate inline-suggestion ranges for the given threads.
 *
 * @param {Array} threads Note threads (suggestion comments).
 */
export function useAnnotateSuggestionThreads( threads ) {
	const { getBlockAttributes } = useSelect( blockEditorStore );
	const annotations = useMemo(
		() => suggestionAnnotations( threads, getBlockAttributes ),
		[ threads, getBlockAttributes ]
	);
	useAnnotateSuggestions( annotations );
}

/**
 * Invisible component that decorates the post's pending inline suggestions.
 * Mounted once inside the suggestion overlay provider so suggestion markers are
 * visible to everyone viewing the post (author, reviewers, the suggester after
 * a reload), in any editor intent — not just while editing in Suggest mode.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionAnnotations() {
	const postId = useSelect(
		( select ) => select( editorStore ).getCurrentPostId(),
		[]
	);
	const { unresolvedNotes } = useNoteThreads( postId );
	useAnnotateSuggestionThreads( unresolvedNotes );
	return null;
}
