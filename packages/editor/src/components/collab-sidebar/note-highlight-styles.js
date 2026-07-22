/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useStyleOverride } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getAvatarBorderColor, getNoteMarkerSelector } from './utils';

/*
 * Hex alpha suffix for the tint painted behind the marker's text. One low value
 * for every state, on purpose: the tint sits behind the glyphs, so raising it
 * eats into whatever text/background contrast the theme already provides, and
 * the canvas background comes from `theme.json`, so the composited result
 * cannot be measured from CSS. (0x40 ≈ 25%.)
 */
const TINT_ALPHA = '40';

/**
 * Emphasis for hover / focus / the selected note. Carried by an opaque
 * underline rather than a stronger tint, so the marker reads more strongly
 * without changing what sits behind the text.
 *
 * The stroke is mostly `currentColor` with the author's color mixed in. Pure
 * author color would be the clearest signal, but the canvas can be light or
 * dark and the palette is fixed, so some of the seven colors would land under
 * the 3:1 non-text contrast minimum on one of them. Anchoring to the text color
 * keeps the underline above that floor in both, and 30% is about as much hue as
 * fits underneath it.
 *
 * Thickness is a fixed `1.5px` rather than an em value: it has to stay distinct
 * from a hyperlink's underline at body size without turning into a bar under a
 * heading.
 *
 * @param {string} color The author's `#RRGGBB` color.
 * @return {string} Declarations for the emphasized state.
 */
function emphasis( color ) {
	return (
		'text-decoration-line:underline;' +
		`text-decoration-color:color-mix(in srgb, ${ color } 30%, currentColor);` +
		'text-decoration-thickness:1.5px;' +
		'text-underline-offset:0.15em;'
	);
}

// Reset the browser's default `<mark>` styling so the per-author rules below
// are what readers actually see (without it, `mark` ships with a bright yellow
// background in every browser). The `core/note` anchor marker serializes as a
// `<mark>` and would otherwise inherit the yellow default in the editor canvas.
const BASE_RESET = 'mark.wp-note{background-color:transparent;color:inherit;}';

/**
 * Build the CSS rule set that tints each inline-note marker with its author's
 * avatar color. Pure helper extracted so it can be unit-tested without React.
 *
 * The tint stays at a single low alpha in every state and emphasis is expressed
 * as an underline, so marking a note can only cost the theme's text contrast
 * the one fixed amount, never more when the note is hovered or selected.
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
		rules.push( `${ sel }{background-color:${ color }${ TINT_ALPHA };}` );
		rules.push(
			`${ sel }:hover,${ sel }:focus-within{${ emphasis( color ) }}`
		);
		if ( selectedId && String( selectedId ) === String( thread.id ) ) {
			rules.push( `${ sel }{${ emphasis( color ) }}` );
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
 * The tint is flat: one alpha, no hover or selected variant. It covers a whole
 * paragraph rather than a few words, so both of the emphasis treatments the
 * inline markers use would be wrong here - a deeper wash costs the theme's text
 * contrast across the entire block, and an underline spanning every line reads
 * as formatting. Hovering or selecting the note draws the block's own outline
 * instead, which is what already signals "this block" everywhere else.
 *
 * @param {Array} blockHighlights Block-level notes (each with `clientId`, `id` and `author`).
 * @return {string} A serialized CSS string targeting the blocks' editable elements.
 */
export function buildBlockHighlightCss( blockHighlights ) {
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
		rules.push( `${ sel }{background-color:${ color }${ TINT_ALPHA };}` );
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
 * An author-colored underline is added to inline markers on `:hover`,
 * `:focus-within`, and when the matching thread is the editor's selected note.
 * Block-level tints stay flat; the block outline carries that state for them.
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
			buildBlockHighlightCss( blockHighlights ),
		[ threads, blockHighlights, selectedId ]
	);
	useStyleOverride( { id: 'core-note-highlights', css } );
	return null;
}
