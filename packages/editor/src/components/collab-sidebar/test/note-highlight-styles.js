/**
 * Internal dependencies
 */
import { buildHighlightCss } from '../note-highlight-styles';
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
