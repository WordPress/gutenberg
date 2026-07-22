/**
 * Internal dependencies
 */
import {
	buildBlockHighlightCss,
	buildHighlightCss,
} from '../note-highlight-styles';
import { getAvatarBorderColor } from '../utils';

describe( 'buildHighlightCss', () => {
	it( 'always emits the mark reset so the browser default yellow does not bleed through', () => {
		expect( buildHighlightCss( [] ) ).toContain(
			'mark.wp-note{background-color:transparent;color:inherit;}'
		);
	} );

	it( 'tints each thread with its author color at the tint alpha (0x40)', () => {
		const css = buildHighlightCss( [
			{ id: 7, author: 1 },
			{ id: 12, author: 3 },
		] );
		expect( css ).toContain(
			`mark.wp-note[data-id="7"]{background-color:${ getAvatarBorderColor(
				1
			) }40;}`
		);
		expect( css ).toContain(
			`mark.wp-note[data-id="12"]{background-color:${ getAvatarBorderColor(
				3
			) }40;}`
		);
	} );

	it( 'emphasizes hover and focus-within with an author-tinted underline', () => {
		const css = buildHighlightCss( [ { id: 7, author: 1 } ] );
		const color = getAvatarBorderColor( 1 );
		expect( css ).toContain(
			`mark.wp-note[data-id="7"]:hover,mark.wp-note[data-id="7"]:focus-within{text-decoration-line:underline;text-decoration-color:color-mix(in srgb, ${ color } 30%, currentColor);`
		);
	} );

	/*
	 * The canvas can be light or dark and the author palette is fixed, so a
	 * pure-palette stroke would fall under the 3:1 non-text contrast minimum on
	 * one of them. Anchoring the mix to `currentColor` is what keeps it above
	 * that floor in both.
	 */
	it( 'anchors the underline color to currentColor rather than the raw palette', () => {
		const css = buildHighlightCss( [ { id: 7, author: 1 } ], '7' );
		const color = getAvatarBorderColor( 1 );
		expect( css ).not.toContain( `text-decoration-color:${ color };` );
		expect( css ).toContain( 'currentColor)' );
	} );

	it( 'emphasizes the selected thread by appending a second rule', () => {
		const css = buildHighlightCss(
			[ { id: 7, author: 1 } ],
			'7' // selected
		);
		const color = getAvatarBorderColor( 1 );
		// Rest rule still present.
		expect( css ).toContain(
			`mark.wp-note[data-id="7"]{background-color:${ color }40;}`
		);
		// Emphasis rule appended later, so the cascade picks it.
		const restIndex = css.indexOf(
			`mark.wp-note[data-id="7"]{background-color:${ color }40;}`
		);
		const activeIndex = css.lastIndexOf(
			`mark.wp-note[data-id="7"]{text-decoration-line:underline;`
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
			`mark.wp-note[data-id="a"]{background-color:${ color }40;}`
		);
		expect( css ).toContain(
			`mark.wp-note[data-id="b"]{background-color:${ color }40;}`
		);
	} );

	it( 'falls back to author 0 when the field is missing', () => {
		const css = buildHighlightCss( [ { id: 'x' } ] );
		const color = getAvatarBorderColor( 0 );
		expect( css ).toContain(
			`mark.wp-note[data-id="x"]{background-color:${ color }40;}`
		);
	} );

	it( 'returns just the reset when no threads are provided', () => {
		expect( buildHighlightCss() ).toBe(
			'mark.wp-note{background-color:transparent;color:inherit;}'
		);
		expect( buildHighlightCss( null ) ).toBe(
			'mark.wp-note{background-color:transparent;color:inherit;}'
		);
	} );
} );

describe( 'buildBlockHighlightCss', () => {
	// The selector only matches when the block's own wrapper element is itself
	// a rich-text editable, which is what scopes the treatment to text blocks.
	const selectorFor = ( clientId ) =>
		`[data-block="${ clientId }"].block-editor-rich-text__editable`;

	it( 'tints each block with its author color at the tint alpha (0x40)', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: 'abc-1', id: 7, author: 1 },
			{ clientId: 'abc-2', id: 12, author: 3 },
		] );
		expect( css ).toContain(
			`${ selectorFor(
				'abc-1'
			) }{background-color:${ getAvatarBorderColor( 1 ) }40;}`
		);
		expect( css ).toContain(
			`${ selectorFor(
				'abc-2'
			) }{background-color:${ getAvatarBorderColor( 3 ) }40;}`
		);
	} );

	/*
	 * The tint covers a whole paragraph, so neither emphasis treatment used for
	 * inline markers applies: a deeper wash would cost the theme's text contrast
	 * across the entire block, and an underline on every line reads as
	 * formatting. Hover and selection are carried by the block outline instead,
	 * so the CSS here has to stay a single flat rule per block.
	 */
	it( 'emits exactly one flat rule per block, with no state variants', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: 'abc-1', id: 7, author: 1 },
			{ clientId: 'abc-2', id: 12, author: 3 },
		] );
		expect( css.match( /\{/g ) ).toHaveLength( 2 );
		expect( css ).not.toContain( ':hover' );
		expect( css ).not.toContain( 'text-decoration' );
		const alphas = [
			...css.matchAll( /background-color:#[0-9a-f]{6}([0-9a-f]{2})?/gi ),
		]
			.map( ( [ , alpha ] ) => alpha )
			.filter( Boolean );
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
			`${ selectorFor(
				'abc-1'
			) }{background-color:${ getAvatarBorderColor( 0 ) }40;}`
		);
	} );

	it( 'returns an empty string when there are no block-level notes', () => {
		expect( buildBlockHighlightCss() ).toBe( '' );
		expect( buildBlockHighlightCss( null ) ).toBe( '' );
		expect( buildBlockHighlightCss( [] ) ).toBe( '' );
	} );
} );
