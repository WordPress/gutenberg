import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import {
	buildBlockHighlightCss,
	buildHighlightCss,
	getBlockLevelHighlights,
} from '../note-highlight-styles';
import { getAvatarBorderColor } from '../utils';

const MARK_RESET = 'mark.wp-note{background-color:transparent;color:inherit;}';
const FORCED_COLORS_HIGHLIGHT =
	'background-color:Mark;color:MarkText;text-decoration-color:MarkText;';
const FORCED_COLORS_RESET = `@media (forced-colors: active){mark.wp-note{${ FORCED_COLORS_HIGHLIGHT }}}`;

describe( 'buildHighlightCss', () => {
	it( 'always emits the mark reset so the browser default yellow does not bleed through', () => {
		expect( buildHighlightCss( [] ) ).toContain( MARK_RESET );
	} );

	/*
	 * Forced colors (e.g. Windows High Contrast) drop the author tints, so a
	 * marker falls back to the system `Mark`/`MarkText` pair. The base reset's
	 * `transparent` survives the forcing, so the pair has to be restated.
	 */
	it( 'paints markers with the system highlight pair under forced colors', () => {
		expect( buildHighlightCss( [] ) ).toContain( FORCED_COLORS_RESET );
	} );

	/*
	 * The per-note rules outrank the reset, so only a rule at their
	 * specificity, emitted after them, swaps the tint for the system pair.
	 */
	it( 'swaps each marker tint for the system highlight pair under forced colors', () => {
		const css = buildHighlightCss( [
			{ id: 7, author: 1 },
			{ id: 12, author: 3 },
		] );
		const forcedRule = `@media (forced-colors: active){mark.wp-note[data-id="7"],mark.wp-note[data-id="12"]{${ FORCED_COLORS_HIGHLIGHT }}}`;
		expect( css ).toContain( forcedRule );
		// After the resting tint rules, which carry the same specificity.
		expect( css.indexOf( forcedRule ) ).toBeGreaterThan(
			css.indexOf(
				`mark.wp-note[data-id="12"]{background-color:${ getAvatarBorderColor(
					3
				) }40;`
			)
		);
	} );

	it( 'emits no per-marker forced-colors rule when there are no threads', () => {
		expect( buildHighlightCss( [] ) ).not.toContain( 'data-id' );
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

	/*
	 * Hover is decorative, and a marker thickening under the pointer is a
	 * silhouette change that reads as noise. Emphasis is reserved for selecting
	 * the note. Guards against reintroducing a hover variant.
	 */
	it( 'never varies a marker on hover', () => {
		const css = buildHighlightCss( [ { id: 7, author: 1 } ], '7' );
		expect( css ).not.toContain( ':hover' );
		expect( css ).not.toContain( ':focus-within' );
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
	const overlaySelectorFor = ( clientId ) =>
		`[data-block="${ clientId }"]:not(.is-multi-selected)::after`;

	/*
	 * Every block-level note marks its block the same way, whatever the block
	 * holds: a tinted overlay with a rule all the way around. A background on
	 * the block itself would be hidden behind an image and would replace the
	 * block's own background, so the tint goes on an overlay. The overlay must
	 * ignore pointer events or it would swallow every click on the block.
	 *
	 * The rule is a border, not a box-shadow: the editor's selection outline
	 * sets `box-shadow` on the same `::after`, and the two must not compete.
	 */
	it( 'overlays each block with its author tint and an all-around rule at rest', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: 'abc-1', id: 7, author: 1 },
			{ clientId: 'abc-2', id: 12, author: 3 },
		] );
		for ( const [ clientId, author ] of [
			[ 'abc-1', 1 ],
			[ 'abc-2', 3 ],
		] ) {
			const color = getAvatarBorderColor( author );
			expect( css ).toContain(
				`${ overlaySelectorFor(
					clientId
				) }{content:"";position:absolute;inset:0;pointer-events:none;background-color:${ color }40;border:1.5px solid color-mix(in srgb, currentColor 30%, ${ color });}`
			);
		}
		expect( css ).not.toContain( 'box-shadow' );
	} );

	// The underline is the inline-note signal; a block-level note marks the
	// block, not its text.
	it( 'does not underline the text of an annotated block', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: 'abc-1', id: 7, author: 1 },
		] );
		expect( css ).not.toContain( 'text-decoration' );
		expect( css ).not.toContain( 'block-editor-rich-text__editable' );
	} );

	/*
	 * Forced colors strips the tint, so every annotated block gets a dashed
	 * outline, dashed so it stays distinct from the solid outline the editor
	 * draws on selection. The overlay's border is dropped so it does not
	 * become a second, solid ring beside the dashed outline.
	 */
	it( 'falls back to a dashed outline under forced colors', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: 'abc-1', id: 7, author: 1 },
			{ clientId: 'abc-2', id: 12, author: 3 },
		] );
		expect( css ).toContain(
			'@media (forced-colors: active){[data-block="abc-1"],[data-block="abc-2"]{outline:1.5px dashed;outline-offset:2px;}' +
				`${ overlaySelectorFor( 'abc-1' ) },${ overlaySelectorFor(
					'abc-2'
				) }{border:none;}}`
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
		// One overlay tint per block, at 0x40.
		expect( alphas ).toEqual( [ '40', '40' ] );
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
			`background-color:${ getAvatarBorderColor( 0 ) }40;`
		);
	} );

	it( 'returns an empty string when there are no block-level notes', () => {
		expect( buildBlockHighlightCss() ).toBe( '' );
		expect( buildBlockHighlightCss( null ) ).toBe( '' );
		expect( buildBlockHighlightCss( [] ) ).toBe( '' );
	} );
} );
