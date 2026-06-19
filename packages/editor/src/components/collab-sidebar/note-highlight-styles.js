/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useStyleOverride } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getAvatarBorderColor } from './utils';

// Hex alpha suffixes for the rest / active states. Kept low so the marker
// reads as a soft tint at rest and gets noticeably stronger when focused or
// hovered. (0x40 ≈ 25%, 0x80 ≈ 50%.)
const REST_ALPHA = '40';
const ACTIVE_ALPHA = '80';

// Reset the browser's default `<mark>` styling so the per-author rules below
// are what readers actually see (without it, `mark` ships with a bright yellow
// background in every browser). The `core/note` anchor marker serializes as a
// `<mark>` and would otherwise inherit the yellow default in the editor canvas.
const BASE_RESET = 'mark.wp-note{background-color:transparent;color:inherit;}';

/**
 * Build the selector that targets a single note's in-content marker. The
 * `core/note` format serializes the id into `data-id`, so the marker can be
 * targeted directly without a separate annotation layer.
 *
 * @param {number|string} id Note id.
 * @return {string} A CSS selector for the note's `mark.wp-note` element.
 */
function noteMarkerSelector( id ) {
	// `id` is a server comment ID (always a positive integer), but escape
	// `"`/`\` defensively since it composes a quoted attribute value from
	// stored data.
	const escapedId = String( id ).replace( /["\\]/g, '\\$&' );
	return `mark.wp-note[data-id="${ escapedId }"]`;
}

/**
 * Build the selection-independent tint rules: each note's rest color plus its
 * hover/focus emphasis. Pure helper extracted so it can be unit-tested without
 * React, and so it only re-runs when the thread set changes - not on every
 * selection change.
 *
 * @param {Array} threads Unresolved note threads (each with `id` and `author`).
 * @return {string} A serialized CSS string targeting the in-content note markers.
 */
export function buildBaseHighlightCss( threads ) {
	const rules = [ BASE_RESET ];
	for ( const thread of threads ?? [] ) {
		if ( ! thread?.id ) {
			continue;
		}
		const color = getAvatarBorderColor( thread.author ?? 0 );
		const sel = noteMarkerSelector( thread.id );
		rules.push( `${ sel }{background-color:${ color }${ REST_ALPHA };}` );
		rules.push(
			`${ sel }:hover,${ sel }:focus-within{background-color:${ color }${ ACTIVE_ALPHA };}`
		);
	}
	return rules.join( '' );
}

/**
 * Build the emphasis rule for the currently selected note - a single rule
 * promoting it to the stronger (active) alpha. Split from the base rules so
 * changing the selection only rebuilds this one rule rather than every note's
 * rules. The caller concatenates it *after* the base CSS so it wins the cascade
 * (it shares the rest rule's specificity).
 *
 * @param {Array}              threads    Unresolved note threads.
 * @param {number|string|null} selectedId ID of the currently selected note, if any.
 * @return {string} A serialized CSS string, or an empty string when nothing is selected.
 */
export function buildSelectedHighlightCss( threads, selectedId = null ) {
	if ( ! selectedId ) {
		return '';
	}
	const thread = ( threads ?? [] ).find(
		( candidate ) =>
			candidate?.id && String( candidate.id ) === String( selectedId )
	);
	if ( ! thread ) {
		return '';
	}
	const color = getAvatarBorderColor( thread.author ?? 0 );
	return `${ noteMarkerSelector(
		thread.id
	) }{background-color:${ color }${ ACTIVE_ALPHA };}`;
}

/**
 * Injects per-note background rules into the editor canvas so inline-note
 * markers carry their author's avatar color. The `core/note` format serializes
 * each marker as `<mark class="wp-note" data-id="{noteId}">`, which we target
 * directly.
 *
 * Uses `useStyleOverride` so the styles reach the iframed canvas; a plain
 * `<style>` element rendered in the sidebar would only affect the parent doc.
 *
 * Opacity boosts on `:hover`, `:focus-within`, and when the matching thread is
 * the editor's selected note. The base tint rules are memoized on the thread
 * set, so clicking between notes only rebuilds the single selected-note rule.
 *
 * @param {Object}             props
 * @param {Array}              props.threads      Unresolved note threads.
 * @param {number|string|null} [props.selectedId] ID of the currently selected note.
 * @return {null} Renders nothing; styles are applied via `useStyleOverride`.
 */
export function NoteHighlightStyles( { threads, selectedId } ) {
	const baseCss = useMemo(
		() => buildBaseHighlightCss( threads ),
		[ threads ]
	);
	const selectedCss = useMemo(
		() => buildSelectedHighlightCss( threads, selectedId ),
		[ threads, selectedId ]
	);
	// Concatenated into one override so the selected rule always follows the
	// base rules in source order and wins the cascade. The base string is reused
	// from its memo while only the selection changes, so this stays cheap.
	useStyleOverride( {
		id: 'core-note-highlights',
		css: baseCss + selectedCss,
	} );
	return null;
}
