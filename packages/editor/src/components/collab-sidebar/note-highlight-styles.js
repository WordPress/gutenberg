/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useStyleOverride } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getAvatarBorderColor } from './utils';

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
 * underline in the author's color rather than a stronger tint, so the marker
 * reads more strongly without changing what sits behind the text.
 *
 * @param {string} color The author's `#RRGGBB` color.
 * @return {string} Declarations for the emphasized state.
 */
function emphasis( color ) {
	return (
		'text-decoration-line:underline;' +
		`text-decoration-color:${ color };` +
		'text-decoration-thickness:0.125em;' +
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
		// `thread.id` is a server comment ID (always a positive integer), but
		// escape `"`/`\` defensively since it composes a quoted attribute value
		// from stored data.
		const escapedId = String( thread.id ).replace( /["\\]/g, '\\$&' );
		const sel = `mark.wp-note[data-id="${ escapedId }"]`;
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
 * Injects per-note background rules into the editor canvas so inline-note
 * markers carry their author's avatar color. The `core/note` format serializes
 * each marker as `<mark class="wp-note" data-id="{noteId}">`, which we target
 * directly.
 *
 * Uses `useStyleOverride` so the styles reach the iframed canvas; a plain
 * `<style>` element rendered in the sidebar would only affect the parent doc.
 *
 * An author-colored underline is added on `:hover`, `:focus-within`, and when
 * the matching thread is the editor's selected note.
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
