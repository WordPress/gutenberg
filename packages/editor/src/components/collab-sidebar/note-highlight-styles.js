import { useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	useStyleOverride,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import {
	findNoteInBlock,
	getAvatarBorderColor,
	getNoteMarkerSelector,
	pickPrimaryNote,
} from './utils';

// Hex alpha (~25%) for the note tint, kept low to preserve text contrast.
const TINT_ALPHA = '40';

// Fixed pixels so the rule stays distinct from link underlines at any size.
const RULE_THICKNESS = '1.5px';
const RULE_THICKNESS_EMPHASIZED = '3px';

/**
 * Returns the author's color mixed with 30% `currentColor`, which keeps every
 * palette color above 3:1 contrast on light and dark canvases.
 *
 * @param {string} color The author's `#RRGGBB` color.
 * @return {string} A CSS color value.
 */
function ruleColor( color ) {
	return `color-mix(in srgb, currentColor 30%, ${ color })`;
}

/**
 * Returns the underline declarations for an inline note marker.
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

// Removes the browser's default yellow `<mark>` background from note markers.
const BASE_RESET = 'mark.wp-note{background-color:transparent;color:inherit;}';

/*
 * In forced colors mode, paints markers with the system highlight colors.
 * Restated because BASE_RESET's transparent background survives forcing.
 */
const FORCED_COLORS_HIGHLIGHT =
	'background-color:Mark;color:MarkText;text-decoration-color:MarkText;';

const FORCED_COLORS_RESET = `@media (forced-colors: active){mark.wp-note{${ FORCED_COLORS_HIGHLIGHT }}}`;

/**
 * Returns one highlight per block that has block-level notes.
 *
 * A thread is block-level when its block contains no `core/note` marker with
 * its id. When a block has several, the primary thread supplies the color.
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
 * Builds CSS that tints and underlines each inline note marker in its
 * author's color. The selected note gets a thicker underline.
 *
 * @param {Array}       threads    Unresolved note threads (each with `id` and `author`).
 * @param {string|null} selectedId ID of the currently selected note, if any.
 * @return {string} A serialized CSS string targeting the in-content note markers.
 */
export function buildHighlightCss( threads, selectedId = null ) {
	const rules = [ BASE_RESET, FORCED_COLORS_RESET ];
	const markerSelectors = [];
	for ( const thread of threads ?? [] ) {
		if ( ! thread?.id ) {
			continue;
		}
		const color = getAvatarBorderColor( thread.author ?? 0 );
		const sel = getNoteMarkerSelector( thread.id );
		markerSelectors.push( sel );
		rules.push(
			`${ sel }{background-color:${ color }${ TINT_ALPHA };${ underline(
				color,
				RULE_THICKNESS
			) }}`
		);
		if ( selectedId && String( selectedId ) === String( thread.id ) ) {
			rules.push(
				`${ sel }{text-decoration-thickness:${ RULE_THICKNESS_EMPHASIZED };}`
			);
		}
	}
	// Emitted last so it overrides the per-note rules without `!important`.
	if ( markerSelectors.length > 0 ) {
		rules.push(
			`@media (forced-colors: active){${ markerSelectors.join(
				','
			) }{${ FORCED_COLORS_HIGHLIGHT }}}`
		);
	}
	return rules.join( '' );
}

/**
 * Builds CSS that covers each block with a block-level note in a tinted,
 * bordered overlay in its author's color.
 *
 * @param {Array} blockHighlights Block-level notes (each with `clientId`, `id` and `author`).
 * @return {string} A serialized CSS string targeting the blocks' wrapper elements.
 */
export function buildBlockHighlightCss( blockHighlights ) {
	const rules = [];
	const blockSelectors = [];
	const overlaySelectors = [];
	for ( const highlight of blockHighlights ?? [] ) {
		if ( ! highlight?.clientId ) {
			continue;
		}
		const color = getAvatarBorderColor( highlight.author ?? 0 );
		// Escape defensively, since the id goes into a quoted attribute selector.
		const escapedClientId = String( highlight.clientId ).replace(
			/["\\]/g,
			'\\$&'
		);
		const blockSel = `[data-block="${ escapedClientId }"]`;
		blockSelectors.push( blockSel );
		// Multi-selected blocks use `::after` for the selection overlay.
		const overlaySel = `${ blockSel }:not(.is-multi-selected)::after`;
		overlaySelectors.push( overlaySel );
		/*
		 * Uses `border`, not `outline`, because the editor's focus styles set
		 * `outline` and `box-shadow` on this same `::after`.
		 */
		rules.push(
			`${ overlaySel }{content:"";position:absolute;inset:0;pointer-events:none;background-color:${ color }${ TINT_ALPHA };border:${ RULE_THICKNESS } solid ${ ruleColor(
				color
			) };}`
		);
	}
	if ( blockSelectors.length > 0 ) {
		/*
		 * Forced colors: a dashed outline replaces the tint, and the border is
		 * dropped so it is not mistaken for the selected-block outline.
		 */
		rules.push(
			`@media (forced-colors: active){${ blockSelectors.join(
				','
			) }{outline:${ RULE_THICKNESS } dashed;outline-offset:2px;}${ overlaySelectors.join(
				','
			) }{border:none;}}`
		);
	}
	return rules.join( '' );
}

/**
 * Highlights noted content in the editor canvas with each author's color.
 *
 * Styles are injected with `useStyleOverride` so they reach the iframed canvas.
 *
 * @param {Object}      props
 * @param {Array}       props.threads      Unresolved note threads.
 * @param {string|null} [props.selectedId] ID of the currently selected note.
 * @param {boolean}     [props.isHidden]   Whether the notes are hidden.
 * @return {null} Renders nothing; styles are applied via `useStyleOverride`.
 */
export function NoteHighlightStyles( { threads, selectedId, isHidden } ) {
	const currentUserId = useSelect(
		( select ) => select( coreStore ).getCurrentUser()?.id,
		[]
	);
	/*
	 * Derived in `useSelect` so attribute edits update which notes are
	 * block-level. Returning a string avoids re-renders when nothing changed.
	 */
	const css = useSelect(
		( select ) => {
			if ( isHidden ) {
				return BASE_RESET;
			}
			const { getBlockAttributes } = select( blockEditorStore );
			return (
				// Tints the unsent draft marker in the current user's color.
				buildHighlightCss(
					[ ...threads, { id: 'new', author: currentUserId } ],
					selectedId
				) +
				buildBlockHighlightCss(
					getBlockLevelHighlights( threads, getBlockAttributes )
				)
			);
		},
		[ threads, selectedId, isHidden, currentUserId ]
	);
	useStyleOverride( { id: 'core-note-highlights', css } );
	return null;
}
