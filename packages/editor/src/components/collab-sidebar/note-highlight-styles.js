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

// Removes the browser's default yellow `<mark>` background from note markers.
const BASE_RESET = 'mark.wp-note{background-color:transparent;color:inherit;}';

/*
 * In forced colors mode, paints markers with the system highlight colors.
 * Restated because BASE_RESET's transparent background survives forcing.
 * Emitted last at the per-note rules' specificity so it overrides them.
 */
const FORCED_COLORS_RESET =
	'@media (forced-colors: active){mark.wp-note[data-id]{background-color:Mark;color:MarkText;text-decoration-color:MarkText;}}';

/**
 * Builds CSS that tints and underlines each inline note marker in its
 * author's color. The selected note gets a thicker underline.
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
		const thickness =
			selectedId && String( selectedId ) === String( thread.id )
				? RULE_THICKNESS_EMPHASIZED
				: RULE_THICKNESS;
		rules.push(
			`${ getNoteMarkerSelector( thread.id ) }{background-color:${ color }${ TINT_ALPHA };text-decoration-line:underline;text-decoration-color:${ ruleColor(
				color
			) };text-decoration-thickness:${ thickness };text-underline-offset:0.15em;}`
		);
	}
	rules.push( FORCED_COLORS_RESET );
	return rules.join( '' );
}

/**
 * Builds CSS that covers each block with a block-level note in a tinted,
 * bordered overlay in its author's color.
 *
 * A thread is block-level when none of its blocks contains a `core/note`
 * marker with its id. A split can leave a block with the note's id but none
 * of its text, which shouldn't turn an inline note into a block-level one.
 * When a block has several, the first one supplies the color.
 *
 * @param {Array}                         threads            Unresolved note threads (each with `id`, `author` and `blockClientIds`).
 * @param {(clientId: string) => ?Object} getBlockAttributes Block-editor selector.
 * @return {string} A serialized CSS string targeting the blocks' wrapper elements.
 */
export function buildBlockHighlightCss( threads, getBlockAttributes ) {
	const rules = [];
	const highlightedBlocks = new Set();
	const isBlockLevel = ( thread ) =>
		! thread.blockClientIds.some( ( clientId ) =>
			findNoteInBlock( getBlockAttributes( clientId ), thread.id )
		);
	const anchors = ( threads ?? [] ).flatMap( ( thread ) =>
		thread?.id && isBlockLevel( thread )
			? thread.blockClientIds.map( ( clientId ) => ( {
					thread,
					clientId,
				} ) )
			: []
	);
	for ( const { thread, clientId } of anchors ) {
		if ( highlightedBlocks.has( clientId ) ) {
			continue;
		}
		highlightedBlocks.add( clientId );
		const color = getAvatarBorderColor( thread.author ?? 0 );
		const blockSel = `[data-block="${ clientId }"]`;
		// Multi-selected blocks use `::after` for the selection overlay.
		const overlaySel = `${ blockSel }:not(.is-multi-selected)::after`;
		/*
		 * Uses `border`, not `outline`, because the editor's focus styles set
		 * `outline` and `box-shadow` on this same `::after`.
		 *
		 * Forced colors: a dashed outline replaces the tint, and the border is
		 * dropped so it is not mistaken for the selected-block outline.
		 */
		rules.push(
			`${ overlaySel }{content:"";position:absolute;inset:0;pointer-events:none;background-color:${ color }${ TINT_ALPHA };border:${ RULE_THICKNESS } solid ${ ruleColor(
				color
			) };}` +
				`@media (forced-colors: active){${ blockSel }{outline:${ RULE_THICKNESS } dashed;outline-offset:2px;}${ overlaySel }{border:none;}}`
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
	const blockCss = useSelect(
		( select ) =>
			isHidden
				? ''
				: buildBlockHighlightCss(
						threads,
						select( blockEditorStore ).getBlockAttributes
					),
		[ threads, isHidden ]
	);
	// Tints the unsent draft marker in the current user's color.
	const markerCss = buildHighlightCss(
		[ ...threads, { id: 'new', author: currentUserId } ],
		selectedId
	);
	useStyleOverride( {
		id: 'core-note-highlights',
		css: isHidden ? BASE_RESET : markerCss + blockCss,
	} );
	return null;
}
