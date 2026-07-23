/**
 * WordPress dependencies
 */
import {
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	buildBlockHighlightCss,
	buildHighlightCss,
	getBlockLevelHighlights,
} from '../note-highlight-styles';
import { getAvatarBorderColor } from '../utils';

const MARK_RESET = 'mark.wp-note{background-color:transparent;color:inherit;}';
const FORCED_COLORS_RESET =
	'@media (forced-colors: active){mark.wp-note{background-color:Mark;color:MarkText;}}';

describe( 'buildHighlightCss', () => {
	it( 'always emits the mark reset so the browser default yellow does not bleed through', () => {
		expect( buildHighlightCss( [] ) ).toContain( MARK_RESET );
	} );

	/*
	 * Forced colors (e.g. Windows High Contrast) forces a `mark` background
	 * while an author-specified `color:inherit` keeps the canvas text color,
	 * which can compose an unreadable pairing. Opting into the system
	 * `Mark`/`MarkText` pair keeps the two halves consistent.
	 */
	it( 'pairs Mark with MarkText under forced colors', () => {
		expect( buildHighlightCss( [] ) ).toContain( FORCED_COLORS_RESET );
	} );

	it( 'tints each thread with its author color at the tint alpha (0x40)', () => {
		const css = buildHighlightCss( [
			{ id: 7, author: 1 },
			{ id: 12, author: 3 },
		] );
		expect( css ).toContain(
			`mark.wp-note[data-id="7"]{background-color:${ getAvatarBorderColor(
				1
			) }40;`
		);
		expect( css ).toContain(
			`mark.wp-note[data-id="12"]{background-color:${ getAvatarBorderColor(
				3
			) }40;`
		);
	} );

	/*
	 * A reader has to be able to see which text carries a note without hovering
	 * or selecting anything first, which is the whole point of the marking, so
	 * the underline belongs on the resting rule and not only on a state variant.
	 */
	it( 'underlines each marker at rest, not only when emphasized', () => {
		const css = buildHighlightCss( [ { id: 7, author: 1 } ] );
		const color = getAvatarBorderColor( 1 );
		expect( css ).toContain(
			`mark.wp-note[data-id="7"]{background-color:${ color }40;text-decoration-line:underline;text-decoration-color:color-mix(in srgb, currentColor 30%, ${ color });text-decoration-thickness:1.5px;`
		);
	} );

	it( 'emphasizes hover and focus-within by thickening that same underline', () => {
		const css = buildHighlightCss( [ { id: 7, author: 1 } ] );
		expect( css ).toContain(
			'mark.wp-note[data-id="7"]:hover,mark.wp-note[data-id="7"]:focus-within{text-decoration-thickness:3px;}'
		);
	} );

	/*
	 * The canvas can be light or dark and the author palette is fixed, so a
	 * pure-palette stroke would fall under the 3:1 non-text contrast minimum on
	 * one of them. Mixing 30% of `currentColor` into the author color is the
	 * least dilution that holds the floor on both canvases.
	 */
	it( 'mixes currentColor into the underline rather than using the raw palette', () => {
		const css = buildHighlightCss( [ { id: 7, author: 1 } ], '7' );
		const color = getAvatarBorderColor( 1 );
		expect( css ).not.toContain( `text-decoration-color:${ color };` );
		expect( css ).toContain(
			`color-mix(in srgb, currentColor 30%, ${ color })`
		);
	} );

	it( 'emphasizes the selected thread by appending a second rule', () => {
		const css = buildHighlightCss(
			[ { id: 7, author: 1 } ],
			'7' // selected
		);
		const color = getAvatarBorderColor( 1 );
		// Rest rule still present.
		expect( css ).toContain(
			`mark.wp-note[data-id="7"]{background-color:${ color }40;`
		);
		// Emphasis rule appended later, so the cascade picks it.
		const restIndex = css.indexOf(
			`mark.wp-note[data-id="7"]{background-color:${ color }40;`
		);
		const activeIndex = css.lastIndexOf(
			'mark.wp-note[data-id="7"]{text-decoration-thickness:3px;}'
		);
		expect( activeIndex ).toBeGreaterThan( restIndex );
	} );

	/*
	 * The tint sits behind the glyphs, so every increment of it is subtracted
	 * from whatever text/background contrast the theme provides, and CSS cannot
	 * measure the composited result because the canvas background comes from
	 * `theme.json`. Emphasis therefore has to come from somewhere other than a
	 * stronger wash. Guards against reintroducing a per-state alpha.
	 */
	it( 'never paints a stronger tint behind the text than the single tint alpha', () => {
		const css = buildHighlightCss(
			[
				{ id: 7, author: 1 },
				{ id: 12, author: 3 },
			],
			'7'
		);
		const alphas = [
			...css.matchAll( /background-color:#[0-9a-f]{6}([0-9a-f]{2})?/gi ),
		]
			.map( ( [ , alpha ] ) => alpha )
			.filter( Boolean );
		expect( alphas.length ).toBeGreaterThan( 0 );
		expect( alphas.every( ( alpha ) => alpha === '40' ) ).toBe( true );
	} );

	it( 'matches numeric and string selectedId variants', () => {
		const cssNum = buildHighlightCss( [ { id: 7, author: 1 } ], 7 );
		const cssStr = buildHighlightCss( [ { id: 7, author: 1 } ], '7' );
		expect( cssNum ).toEqual( cssStr );
	} );

	it( 'skips threads without an id', () => {
		const css = buildHighlightCss( [
			{ id: null, author: 1 },
			{ author: 1 },
		] );
		expect( css ).not.toMatch( /data-id="(null|undefined)"/ );
	} );

	it( 'cycles through AVATAR_BORDER_COLORS by author id modulo length', () => {
		// Authors 1 and 8 collide (1 % 7 === 8 % 7), so both threads should
		// share the same color — guards the modulo behavior in
		// getAvatarBorderColor.
		const css = buildHighlightCss( [
			{ id: 'a', author: 1 },
			{ id: 'b', author: 8 },
		] );
		const color = getAvatarBorderColor( 1 );
		expect( css ).toContain(
			`mark.wp-note[data-id="a"]{background-color:${ color }40;`
		);
		expect( css ).toContain(
			`mark.wp-note[data-id="b"]{background-color:${ color }40;`
		);
	} );

	it( 'falls back to author 0 when the field is missing', () => {
		const css = buildHighlightCss( [ { id: 'x' } ] );
		const color = getAvatarBorderColor( 0 );
		expect( css ).toContain(
			`mark.wp-note[data-id="x"]{background-color:${ color }40;`
		);
	} );

	it( 'returns just the resets when no threads are provided', () => {
		expect( buildHighlightCss() ).toBe( MARK_RESET + FORCED_COLORS_RESET );
		expect( buildHighlightCss( null ) ).toBe(
			MARK_RESET + FORCED_COLORS_RESET
		);
	} );
} );

describe( 'getBlockLevelHighlights', () => {
	const FORMAT_NAME = 'core/note';
	const isRegistered = () =>
		!! select( richTextStore ).getFormatType( FORMAT_NAME );

	// Marker detection parses the block's rich-text HTML, which needs the
	// `core/note` format registered — same setup as the `findNoteRange` tests.
	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( FORMAT_NAME, {
				title: 'Note',
				tagName: 'span',
				className: 'wp-note',
				attributes: { 'data-id': 'data-id' },
				edit: () => null,
			} );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( FORMAT_NAME );
		}
	} );

	// A thread is inline iff a `core/note` marker with its id exists in the
	// block; these attributes hold a marker for note 7 only.
	const attributesByClientId = {
		'block-inline': {
			content: 'a <span class="wp-note" data-id="7">b</span> c',
		},
		'block-plain': { content: 'no markers here' },
	};
	const getBlockAttributes = ( clientId ) =>
		attributesByClientId[ clientId ] ?? {};

	it( 'returns markerless threads as block-level highlights', () => {
		const highlights = getBlockLevelHighlights(
			[ { id: 9, author: 2, blockClientId: 'block-plain' } ],
			getBlockAttributes
		);
		expect( highlights ).toEqual( [
			{ clientId: 'block-plain', id: 9, author: 2 },
		] );
	} );

	it( 'skips threads whose marker exists in their block (inline notes)', () => {
		const highlights = getBlockLevelHighlights(
			[ { id: 7, author: 1, blockClientId: 'block-inline' } ],
			getBlockAttributes
		);
		expect( highlights ).toEqual( [] );
	} );

	it( 'collapses several block-level threads on one block to the primary', () => {
		// `pickPrimaryNote` prefers the first unresolved thread, so the first
		// listed thread wins and only one highlight is emitted for the block.
		const highlights = getBlockLevelHighlights(
			[
				{
					id: 9,
					author: 2,
					status: 'hold',
					blockClientId: 'block-plain',
				},
				{
					id: 11,
					author: 4,
					status: 'hold',
					blockClientId: 'block-plain',
				},
			],
			getBlockAttributes
		);
		expect( highlights ).toEqual( [
			{ clientId: 'block-plain', id: 9, author: 2 },
		] );
	} );

	it( 'skips threads without an id or block', () => {
		const highlights = getBlockLevelHighlights(
			[
				{ author: 2, blockClientId: 'block-plain' },
				{ id: 9, author: 2, blockClientId: null },
			],
			getBlockAttributes
		);
		expect( highlights ).toEqual( [] );
	} );

	it( 'returns an empty list for empty input', () => {
		expect( getBlockLevelHighlights( [], getBlockAttributes ) ).toEqual(
			[]
		);
		expect( getBlockLevelHighlights( null, getBlockAttributes ) ).toEqual(
			[]
		);
	} );
} );

describe( 'buildBlockHighlightCss', () => {
	// The tint-behind-the-text rule matches when the block's own wrapper
	// element is itself a rich-text editable (paragraph, heading), or, for
	// containers whose direct children are block wrappers (list, quote,
	// group), each rich-text leaf inside; every other block gets the overlay.
	const textSelectorFor = ( clientId ) =>
		`[data-block="${ clientId }"].block-editor-rich-text__editable`;
	const leafSelectorFor = ( clientId ) =>
		`[data-block="${ clientId }"]:not(.block-editor-rich-text__editable):has(> [data-block]) .block-editor-rich-text__editable`;
	const overlaySelectorFor = ( clientId ) =>
		`[data-block="${ clientId }"]:not(.block-editor-rich-text__editable):not(:has(> [data-block]))::after`;

	it( 'tints each text block with its author color at the tint alpha (0x40)', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: 'abc-1', id: 7, author: 1 },
			{ clientId: 'abc-2', id: 12, author: 3 },
		] );
		expect( css ).toContain(
			`${ textSelectorFor(
				'abc-1'
			) }{background-color:${ getAvatarBorderColor( 1 ) }40;`
		);
		expect( css ).toContain(
			`${ textSelectorFor(
				'abc-2'
			) }{background-color:${ getAvatarBorderColor( 3 ) }40;`
		);
	} );

	/*
	 * An annotated block has to be legible as one without clicking it, so the
	 * underline belongs on the resting declaration - and it is a text
	 * underline, not a bottom-edge rule, so every line of a wrapped paragraph
	 * carries it, matching the inline-marker treatment.
	 */
	it( 'underlines every line of each text block at rest', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: 'abc-1', id: 7, author: 1 },
		] );
		const color = getAvatarBorderColor( 1 );
		expect( css ).toContain(
			`${ textSelectorFor( 'abc-1' ) }{background-color:${ color }40;` +
				'text-decoration-line:underline;' +
				`text-decoration-color:color-mix(in srgb, currentColor 30%, ${ color });` +
				'text-decoration-thickness:1.5px;'
		);
		expect( css ).not.toContain( 'border' );
	} );

	/*
	 * A container whose direct children are block wrappers (list, quote,
	 * group) has no text of its own to tint, so the same treatment lands on
	 * each rich-text leaf inside it - every list item tinted and underlined
	 * individually.
	 */
	it( 'tints and underlines each rich-text leaf of a block container', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: 'abc-1', id: 7, author: 1 },
		] );
		const color = getAvatarBorderColor( 1 );
		expect( css ).toContain(
			`${ leafSelectorFor( 'abc-1' ) }{background-color:${ color }40;` +
				'text-decoration-line:underline;'
		);
	} );

	/*
	 * A background behind a non-text block (an image, a container) is hidden by
	 * the block's own content, so the same tint and rule are painted onto an
	 * overlay above it instead - all the way around, since a non-text block has
	 * no text baseline for a bottom edge to relate to. The overlay must ignore
	 * pointer events or it would swallow every click on the block.
	 */
	it( 'overlays non-text blocks with the tint and an all-around rule at rest', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: 'abc-1', id: 7, author: 1 },
		] );
		const color = getAvatarBorderColor( 1 );
		expect( css ).toContain(
			`${ overlaySelectorFor(
				'abc-1'
			) }{content:"";position:absolute;inset:0;pointer-events:none;background-color:${ color }40;box-shadow:inset 0 0 0 1.5px color-mix(in srgb, currentColor 30%, ${ color });}`
		);
	} );

	/*
	 * Forced colors strips background tints and box-shadows, which would leave
	 * an annotated block with no marking at all. The dashed outline fallback
	 * survives (its color is forced to the system text color), and dashed keeps
	 * it distinct from the solid outline the editor draws on selection.
	 */
	it( 'falls back to a dashed outline under forced colors', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: 'abc-1', id: 7, author: 1 },
			{ clientId: 'abc-2', id: 12, author: 3 },
		] );
		expect( css ).toContain(
			'@media (forced-colors: active){[data-block="abc-1"],[data-block="abc-2"]{outline:1.5px dashed;outline-offset:2px;}}'
		);
	} );

	/*
	 * The tint covers a whole block, so deepening it would cost the theme's
	 * text contrast across all of that. Hover and selection are carried by the
	 * block outline instead, so the CSS here stays flat: resting rules only,
	 * no state variants, and every tint at the one fixed alpha.
	 */
	it( 'emits only resting rules, with no state variants', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: 'abc-1', id: 7, author: 1 },
			{ clientId: 'abc-2', id: 12, author: 3 },
		] );
		expect( css ).not.toContain( ':hover' );
		expect( css ).not.toContain( ':focus' );
		const alphas = [
			...css.matchAll( /background-color:#[0-9a-f]{6}([0-9a-f]{2})?/gi ),
		]
			.map( ( [ , alpha ] ) => alpha )
			.filter( Boolean );
		// One tint per treatment (text root + container leaves + overlay) per
		// block, all at 0x40.
		expect( alphas ).toEqual( [ '40', '40', '40', '40', '40', '40' ] );
	} );

	it( 'escapes quotes and backslashes in the client id', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: 'a"b\\c', id: 7, author: 1 },
		] );
		expect( css ).toContain( '[data-block="a\\"b\\\\c"]' );
	} );

	it( 'skips entries without a client id', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: null, id: 7, author: 1 },
			{ id: 8, author: 1 },
		] );
		expect( css ).not.toMatch( /data-block="(null|undefined)"/ );
	} );

	it( 'falls back to author 0 when the field is missing', () => {
		const css = buildBlockHighlightCss( [ { clientId: 'abc-1', id: 7 } ] );
		expect( css ).toContain(
			`${ textSelectorFor(
				'abc-1'
			) }{background-color:${ getAvatarBorderColor( 0 ) }40;`
		);
	} );

	it( 'returns an empty string when there are no block-level notes', () => {
		expect( buildBlockHighlightCss() ).toBe( '' );
		expect( buildBlockHighlightCss( null ) ).toBe( '' );
		expect( buildBlockHighlightCss( [] ) ).toBe( '' );
	} );
} );
