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
 * Build the CSS rule set that tints each inline-note marker with its author's
 * avatar color. Pure helper extracted so it can be unit-tested without React.
 *
 * @param {Array}       threads    Unresolved note threads (each with `id` and `author`).
 * @param {string|null} selectedId ID of the currently selected note, if any.
 * @return {string} A serialized CSS string targeting the in-content note markers.
 */
export function buildHighlightCss( threads, selectedId = null ) {
	const rules = [ BASE_RESET ];
	for ( const thread of threads ?? [] ) {
		if ( ! thread?.id ) {
			continue;
		}
		const color = getAvatarBorderColor( thread.author ?? 0 );
		// The `core/note` format serializes the id into `data-id`, so the marker
		// can be targeted directly without a separate annotation layer.
		// `thread.id` is a server comment ID (always a positive integer), but
		// escape `"`/`\` defensively since it composes a quoted attribute value
		// from stored data.
		const escapedId = String( thread.id ).replace( /["\\]/g, '\\$&' );
		const sel = `mark.wp-note[data-id="${ escapedId }"]`;
		rules.push( `${ sel }{background-color:${ color }${ REST_ALPHA };}` );
		rules.push(
			`${ sel }:hover,${ sel }:focus-within{background-color:${ color }${ ACTIVE_ALPHA };}`
		);
		if ( selectedId && String( selectedId ) === String( thread.id ) ) {
			rules.push(
				`${ sel }{background-color:${ color }${ ACTIVE_ALPHA };}`
			);
		}
	}
	return rules.join( '' );
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
 * the editor's selected note.
 *
 * @param {Object}      props
 * @param {Array}       props.threads      Unresolved note threads.
 * @param {string|null} [props.selectedId] ID of the currently selected note.
 * @return {null} Renders nothing; styles are applied via `useStyleOverride`.
 */
export function NoteHighlightStyles( { threads, selectedId } ) {
	const css = useMemo(
		() => buildHighlightCss( threads, selectedId ),
		[ threads, selectedId ]
	);
	useStyleOverride( { id: 'core-note-highlights', css } );
	return null;
}
