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

	it( 'tints each thread with its author color at the rest alpha (0x40)', () => {
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

	it( 'emits a higher-alpha (0x80) rule on hover and focus-within for each thread', () => {
		const css = buildHighlightCss( [ { id: 7, author: 1 } ] );
		const color = getAvatarBorderColor( 1 );
		expect( css ).toContain(
			`mark.wp-note[data-id="7"]:hover,mark.wp-note[data-id="7"]:focus-within{background-color:${ color }80;}`
		);
	} );

	it( 'boosts opacity for the selected thread by appending a second rule', () => {
		const css = buildHighlightCss(
			[ { id: 7, author: 1 } ],
			'7' // selected
		);
		const color = getAvatarBorderColor( 1 );
		// Rest rule still present.
		expect( css ).toContain(
			`mark.wp-note[data-id="7"]{background-color:${ color }40;}`
		);
		// Active rule appended later, so the cascade picks it.
		const restIndex = css.indexOf(
			`mark.wp-note[data-id="7"]{background-color:${ color }40;}`
		);
		const activeIndex = css.lastIndexOf(
			`mark.wp-note[data-id="7"]{background-color:${ color }80;}`
		);
		expect( activeIndex ).toBeGreaterThan( restIndex );
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

	it( 'tints each block with its author color at the rest alpha (0x40)', () => {
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

	it( 'emits a higher-alpha (0x80) rule on hover for each block', () => {
		const css = buildBlockHighlightCss( [
			{ clientId: 'abc-1', id: 7, author: 1 },
		] );
		expect( css ).toContain(
			`${ selectorFor(
				'abc-1'
			) }:hover{background-color:${ getAvatarBorderColor( 1 ) }80;}`
		);
	} );

	it( 'boosts opacity for the selected note by appending a second rule', () => {
		const color = getAvatarBorderColor( 1 );
		const css = buildBlockHighlightCss(
			[ { clientId: 'abc-1', id: 7, author: 1 } ],
			'7' // selected
		);
		const restIndex = css.indexOf(
			`${ selectorFor( 'abc-1' ) }{background-color:${ color }40;}`
		);
		const activeIndex = css.lastIndexOf(
			`${ selectorFor( 'abc-1' ) }{background-color:${ color }80;}`
		);
		// Rest rule still present, active rule appended later so it wins.
		expect( restIndex ).toBeGreaterThanOrEqual( 0 );
		expect( activeIndex ).toBeGreaterThan( restIndex );
	} );

	it( 'leaves other blocks at the rest alpha when one note is selected', () => {
		const css = buildBlockHighlightCss(
			[
				{ clientId: 'abc-1', id: 7, author: 1 },
				{ clientId: 'abc-2', id: 12, author: 1 },
			],
			7
		);
		const color = getAvatarBorderColor( 1 );
		expect( css ).not.toContain(
			`${ selectorFor( 'abc-2' ) }{background-color:${ color }80;}`
		);
	} );

	it( 'matches numeric and string selectedId variants', () => {
		const entry = [ { clientId: 'abc-1', id: 7, author: 1 } ];
		expect( buildBlockHighlightCss( entry, 7 ) ).toEqual(
			buildBlockHighlightCss( entry, '7' )
		);
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
