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
} from '../note-highlight-styles';
import { getAvatarBorderColor } from '../utils';

const MARK_RESET = 'mark.wp-note{background-color:transparent;color:inherit;}';
const FORCED_COLORS_RESET =
	'@media (forced-colors: active){mark.wp-note[data-id]{background-color:Mark;color:MarkText;text-decoration-color:MarkText;}}';

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
		expect( css.endsWith( FORCED_COLORS_RESET ) ).toBe( true );
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

	it( 'thickens the underline of the selected thread only', () => {
		const css = buildHighlightCss(
			[
				{ id: 7, author: 1 },
				{ id: 12, author: 3 },
			],
			'7' // selected
		);
		expect( css ).toMatch(
			/mark\.wp-note\[data-id="7"\]\{[^}]*text-decoration-thickness:3px;/
		);
		expect( css ).toMatch(
			/mark\.wp-note\[data-id="12"\]\{[^}]*text-decoration-thickness:1\.5px;/
		);
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

describe( 'buildBlockHighlightCss', () => {
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
	};
	const getBlockAttributes = ( clientId ) =>
		attributesByClientId[ clientId ] ?? { content: 'no markers here' };

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
		const css = buildBlockHighlightCss(
			[
				{ id: 7, author: 1, blockClientIds: [ 'abc-1' ] },
				{ id: 12, author: 3, blockClientIds: [ 'abc-2' ] },
			],
			getBlockAttributes
		);
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

	it( 'skips threads whose marker exists in their block (inline notes)', () => {
		expect(
			buildBlockHighlightCss(
				[ { id: 7, author: 1, blockClientIds: [ 'block-inline' ] } ],
				getBlockAttributes
			)
		).toBe( '' );
	} );

	it( 'does not tint a block left without the marker of a shared inline note', () => {
		expect(
			buildBlockHighlightCss(
				[
					{
						id: 7,
						author: 1,
						blockClientIds: [ 'block-inline', 'abc-1' ],
					},
				],
				getBlockAttributes
			)
		).toBe( '' );
	} );

	it( 'tints every block of a shared note', () => {
		const css = buildBlockHighlightCss(
			[ { id: 7, author: 1, blockClientIds: [ 'abc-1', 'abc-2' ] } ],
			getBlockAttributes
		);
		expect( css ).toContain( overlaySelectorFor( 'abc-1' ) );
		expect( css ).toContain( overlaySelectorFor( 'abc-2' ) );
	} );

	it( 'colors a block with several block-level notes by the first one', () => {
		const css = buildBlockHighlightCss(
			[
				{ id: 9, author: 2, blockClientIds: [ 'abc-1' ] },
				{ id: 11, author: 4, blockClientIds: [ 'abc-1' ] },
			],
			getBlockAttributes
		);
		expect( css.match( /content:""/g ) ).toHaveLength( 1 );
		expect( css ).toContain(
			`background-color:${ getAvatarBorderColor( 2 ) }40;`
		);
	} );

	// The underline is the inline-note signal; a block-level note marks the
	// block, not its text.
	it( 'does not underline the text of an annotated block', () => {
		const css = buildBlockHighlightCss(
			[ { id: 7, author: 1, blockClientIds: [ 'abc-1' ] } ],
			getBlockAttributes
		);
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
		const css = buildBlockHighlightCss(
			[ { id: 7, author: 1, blockClientIds: [ 'abc-1' ] } ],
			getBlockAttributes
		);
		expect( css ).toContain(
			'@media (forced-colors: active){[data-block="abc-1"]{outline:1.5px dashed;outline-offset:2px;}' +
				`${ overlaySelectorFor( 'abc-1' ) }{border:none;}}`
		);
	} );

	/*
	 * The tint covers a whole block, so deepening it would cost the theme's
	 * text contrast across all of that. Hover and selection are carried by the
	 * block outline instead, so the CSS here stays flat: resting rules only,
	 * no state variants, and every tint at the one fixed alpha.
	 */
	it( 'emits only resting rules, with no state variants', () => {
		const css = buildBlockHighlightCss(
			[
				{ id: 7, author: 1, blockClientIds: [ 'abc-1' ] },
				{ id: 12, author: 3, blockClientIds: [ 'abc-2' ] },
			],
			getBlockAttributes
		);
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

	it( 'skips threads without an id or block', () => {
		expect(
			buildBlockHighlightCss(
				[
					{ author: 2, blockClientIds: [ 'abc-1' ] },
					{ id: 9, author: 2, blockClientIds: [] },
				],
				getBlockAttributes
			)
		).toBe( '' );
	} );

	it( 'falls back to author 0 when the field is missing', () => {
		const css = buildBlockHighlightCss(
			[ { id: 7, blockClientIds: [ 'abc-1' ] } ],
			getBlockAttributes
		);
		expect( css ).toContain(
			`background-color:${ getAvatarBorderColor( 0 ) }40;`
		);
	} );

	it( 'returns an empty string when there are no block-level notes', () => {
		expect( buildBlockHighlightCss( undefined, getBlockAttributes ) ).toBe(
			''
		);
		expect( buildBlockHighlightCss( null, getBlockAttributes ) ).toBe( '' );
		expect( buildBlockHighlightCss( [], getBlockAttributes ) ).toBe( '' );
	} );
} );
