/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useStyleOverride } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getAvatarBorderColor, getNoteMarkerSelector } from './utils';

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
		const sel = getNoteMarkerSelector( thread.id );
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
 * Build the CSS rule set that tints a whole text block whose note is attached at
 * the block level. Block-level notes carry no in-content `<mark>` to target, so
 * the block is matched by its client id instead.
 *
 * The selector only matches when the block's own wrapper element *is* a
 * rich-text editable, which is true for text-leaf blocks (paragraph, heading,
 * list item) and false for containers and media. That keeps the treatment
 * scoped to text without any block-type checks: non-text blocks get an overlay
 * of their own in a separate iteration.
 *
 * @param {Array}       blockHighlights Block-level notes (each with `clientId`, `id` and `author`).
 * @param {string|null} selectedId      ID of the currently selected note, if any.
 * @return {string} A serialized CSS string targeting the blocks' editable elements.
 */
export function buildBlockHighlightCss( blockHighlights, selectedId = null ) {
	const rules = [];
	for ( const highlight of blockHighlights ?? [] ) {
		if ( ! highlight?.clientId ) {
			continue;
		}
		const color = getAvatarBorderColor( highlight.author ?? 0 );
		// Client ids are generated UUIDs, but escape `"`/`\` defensively since
		// this composes a quoted attribute value.
		const escapedClientId = String( highlight.clientId ).replace(
			/["\\]/g,
			'\\$&'
		);
		const sel = `[data-block="${ escapedClientId }"].block-editor-rich-text__editable`;
		rules.push( `${ sel }{background-color:${ color }${ REST_ALPHA };}` );
		rules.push(
			`${ sel }:hover{background-color:${ color }${ ACTIVE_ALPHA };}`
		);
		if ( selectedId && String( selectedId ) === String( highlight.id ) ) {
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
 * directly. Notes attached at the block level have no marker, so the whole text
 * block is tinted instead.
 *
 * Uses `useStyleOverride` so the styles reach the iframed canvas; a plain
 * `<style>` element rendered in the sidebar would only affect the parent doc.
 *
 * Opacity boosts on `:hover`, `:focus-within`, and when the matching thread is
 * the editor's selected note.
 *
 * @param {Object}      props
 * @param {Array}       props.threads           Unresolved note threads.
 * @param {Array}       [props.blockHighlights] Unresolved block-level notes to tint whole.
 * @param {string|null} [props.selectedId]      ID of the currently selected note.
 * @return {null} Renders nothing; styles are applied via `useStyleOverride`.
 */
export function NoteHighlightStyles( {
	threads,
	blockHighlights,
	selectedId,
} ) {
	const css = useMemo(
		() =>
			buildHighlightCss( threads, selectedId ) +
			buildBlockHighlightCss( blockHighlights, selectedId ),
		[ threads, blockHighlights, selectedId ]
	);
	useStyleOverride( { id: 'core-note-highlights', css } );
	return null;
}
