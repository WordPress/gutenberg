/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	useStyleOverride,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	findNoteInBlock,
	getAvatarBorderColor,
	getNoteMarkerSelector,
	pickPrimaryNote,
} from './utils';

/*
 * Hex alpha suffix for the tint painted behind the marker's text. One low value
 * for every state, on purpose: the tint sits behind the glyphs, so raising it
 * eats into whatever text/background contrast the theme already provides, and
 * the canvas background comes from `theme.json`, so the composited result
 * cannot be measured from CSS. (0x40 ≈ 25%.)
 */
const TINT_ALPHA = '40';

/*
 * Thickness of the rule drawn under a note, at rest and when emphasized. Fixed
 * pixels rather than an em value: it has to stay distinct from a hyperlink's
 * underline at body size without turning into a bar under a heading.
 */
const RULE_THICKNESS = '1.5px';
const RULE_THICKNESS_EMPHASIZED = '3px';

/**
 * The stroke color for a note's rule: the author's color with a share of
 * `currentColor` mixed in.
 *
 * Pure author color would be the clearest signal, but the canvas can be light
 * or dark and the palette is fixed, so some of the seven colors would land
 * under the 3:1 non-text contrast minimum on one of them. Mixing in 30% of the
 * text color is the least dilution that holds the floor on both: at 70% author
 * share every palette color clears 3:1 against a white and a near-black
 * canvas, with orange right at the line (3.0:1 on white).
 *
 * @param {string} color The author's `#RRGGBB` color.
 * @return {string} A CSS color value.
 */
function ruleColor( color ) {
	return `color-mix(in srgb, currentColor 30%, ${ color })`;
}

/**
 * The underline drawn beneath an inline marker's text.
 *
 * Present at rest, not only on hover or selection: a reader has to be able to
 * see which text carries a note without interacting with anything first, which
 * is the whole reason the marking exists. Emphasis is then a thicker version of
 * the same rule - a silhouette change rather than a stronger wash, so it costs
 * the theme's text contrast nothing.
 *
 * @param {string} color     The author's `#RRGGBB` color.
 * @param {string} thickness Rule thickness.
 * @return {string} Declarations for the underline.
 */
function underline( color, thickness ) {
	return (
		'text-decoration-line:underline;' +
		`text-decoration-color:${ ruleColor( color ) };` +
		`text-decoration-thickness:${ thickness };` +
		'text-underline-offset:0.15em;'
	);
}

// Reset the browser's default `<mark>` styling so the per-author rules below
// are what readers actually see (without it, `mark` ships with a bright yellow
// background in every browser). The `core/note` anchor marker serializes as a
// `<mark>` and would otherwise inherit the yellow default in the editor canvas.
const BASE_RESET = 'mark.wp-note{background-color:transparent;color:inherit;}';

/**
 * Derive the block-level highlights from the note threads: a thread marks its
 * whole block when no in-content `core/note` marker carries its id (an inline
 * note's marker is its anchor, so markerless means block-level). A block can
 * hold several; one color has to win, so the primary thread (the same one the
 * avatar indicator surfaces) decides.
 *
 * Pure helper: block attributes are read through the passed selector so it can
 * be unit-tested without a store.
 *
 * @param {Array}    threads            Unresolved note threads (each with `id`, `author` and `blockClientId`).
 * @param {Function} getBlockAttributes Block-editor selector.
 * @return {Array} Block-level notes (each with `clientId`, `id` and `author`).
 */
export function getBlockLevelHighlights( threads, getBlockAttributes ) {
	const threadsByBlock = new Map();
	for ( const thread of threads ?? [] ) {
		if ( ! thread?.id || ! thread?.blockClientId ) {
			continue;
		}
		const attributes = getBlockAttributes( thread.blockClientId );
		if ( findNoteInBlock( attributes, thread.id ) ) {
			continue;
		}
		const blockThreads = threadsByBlock.get( thread.blockClientId ) ?? [];
		blockThreads.push( thread );
		threadsByBlock.set( thread.blockClientId, blockThreads );
	}
	const highlights = [];
	for ( const [ clientId, blockThreads ] of threadsByBlock ) {
		const primary = pickPrimaryNote( blockThreads );
		if ( primary ) {
			highlights.push( {
				clientId,
				id: primary.id,
				author: primary.author,
			} );
		}
	}
	return highlights;
}

/**
 * Build the CSS rule set that tints each inline-note marker with its author's
 * avatar color. Pure helper extracted so it can be unit-tested without React.
 *
 * Each marker gets a tint and an underline at rest, so which text carries a
 * note is legible without hovering or selecting anything. The tint stays at a
 * single low alpha in every state; hover, focus and selection only thicken the
 * underline, so marking a note can cost the theme's text contrast the one fixed
 * amount and never more.
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
		rules.push(
			`${ sel }{background-color:${ color }${ TINT_ALPHA };${ underline(
				color,
				RULE_THICKNESS
			) }}`
		);
		rules.push(
			`${ sel }:hover,${ sel }:focus-within{text-decoration-thickness:${ RULE_THICKNESS_EMPHASIZED };}`
		);
		if ( selectedId && String( selectedId ) === String( thread.id ) ) {
			rules.push(
				`${ sel }{text-decoration-thickness:${ RULE_THICKNESS_EMPHASIZED };}`
			);
		}
	}
	return rules.join( '' );
}

/**
 * Build the CSS rule set that marks a whole block whose note is attached at
 * the block level. Block-level notes carry no in-content `<mark>` to target, so
 * the block is matched by its client id instead.
 *
 * Text blocks - those whose own wrapper element *is* a rich-text editable
 * (paragraph, heading, list item) - get a tint behind the text and a rule along
 * their bottom edge. The rule is an inset shadow rather than a border so adding
 * it cannot reflow the canvas, and it sits under the block rather than under
 * each line: a wrapped paragraph striped on every line would read as
 * formatting, where a single edge reads as a boundary.
 *
 * Every other block (media, containers) paints the same treatment onto an
 * `::after` overlay instead - a tinted veil with the rule drawn all the way
 * around - because a background behind e.g. an image is hidden by the image
 * itself. The overlay ignores pointer events, so the block stays editable
 * through it.
 *
 * Both are present at rest, with no hover or selected variant, so an annotated
 * block is legible as one without clicking anything. The tint covers a whole
 * block rather than a few words, so deepening it on a state would cost the
 * theme's text contrast across all of that. Hovering or selecting the note
 * draws the block's own outline instead, which is what already signals "this
 * block" everywhere else in the editor.
 *
 * @param {Array} blockHighlights Block-level notes (each with `clientId`, `id` and `author`).
 * @return {string} A serialized CSS string targeting the blocks' wrapper elements.
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
		const blockSel = `[data-block="${ escapedClientId }"]`;
		rules.push(
			`${ blockSel }.block-editor-rich-text__editable{background-color:${ color }${ TINT_ALPHA };box-shadow:inset 0 -${ RULE_THICKNESS } 0 0 ${ ruleColor(
				color
			) };}`
		);
		// Block wrappers are position:relative and the overlay sits above the
		// content, so `inset:0` hugs the block exactly with no reflow.
		rules.push(
			`${ blockSel }:not(.block-editor-rich-text__editable)::after{content:"";position:absolute;inset:0;pointer-events:none;background-color:${ color }${ TINT_ALPHA };box-shadow:inset 0 0 0 ${ RULE_THICKNESS } ${ ruleColor(
				color
			) };}`
		);
	}
	return rules.join( '' );
}

/**
 * Injects per-note background rules into the editor canvas so inline-note
 * markers carry their author's avatar color. The `core/note` format serializes
 * each marker as `<mark class="wp-note" data-id="{noteId}">`, which we target
 * directly. Notes attached at the block level have no marker, so the whole
 * block is marked instead - text blocks by tinting the text, any other block
 * by a tinted overlay.
 *
 * Uses `useStyleOverride` so the styles reach the iframed canvas; a plain
 * `<style>` element rendered in the sidebar would only affect the parent doc.
 *
 * Inline markers are underlined and block-level notes ruled at rest, so
 * annotated content is legible without interaction. Markers thicken their
 * underline on `:hover`, `:focus-within` and when the matching thread is
 * selected; block-level tints stay flat and let the block's own outline carry
 * those states.
 *
 * @param {Object}      props
 * @param {Array}       props.threads      Unresolved note threads.
 * @param {string|null} [props.selectedId] ID of the currently selected note.
 * @return {null} Renders nothing; styles are applied via `useStyleOverride`.
 */
export function NoteHighlightStyles( { threads, selectedId } ) {
	// Which threads are block-level depends on block attributes (a thread is
	// inline iff its marker exists in the block), so the CSS is derived in
	// `useSelect` to track attribute edits. It returns the finished string:
	// strict-equality on a primitive keeps re-renders to actual changes.
	const css = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			return (
				buildHighlightCss( threads, selectedId ) +
				buildBlockHighlightCss(
					getBlockLevelHighlights( threads, getBlockAttributes )
				)
			);
		},
		[ threads, selectedId ]
	);
	useStyleOverride( { id: 'core-note-highlights', css } );
	return null;
}
