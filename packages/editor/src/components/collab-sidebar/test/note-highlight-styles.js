/**
 * Internal dependencies
 */
import {
	buildBaseHighlightCss,
	buildSelectedHighlightCss,
} from '../note-highlight-styles';
import { getAvatarBorderColor } from '../utils';

describe( 'buildBaseHighlightCss', () => {
	it( 'always emits the mark reset so the browser default yellow does not bleed through', () => {
		expect( buildBaseHighlightCss( [] ) ).toContain(
			'mark.wp-note{background-color:transparent;color:inherit;}'
		);
	} );

	it( 'tints each thread with its author color at the rest alpha (0x40)', () => {
		const css = buildBaseHighlightCss( [
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
		const css = buildBaseHighlightCss( [ { id: 7, author: 1 } ] );
		const color = getAvatarBorderColor( 1 );
		expect( css ).toContain(
			`mark.wp-note[data-id="7"]:hover,mark.wp-note[data-id="7"]:focus-within{background-color:${ color }80;}`
		);
	} );

	it( 'does not emit a selected rule (selection is handled separately)', () => {
		const css = buildBaseHighlightCss( [ { id: 7, author: 1 } ] );
		const color = getAvatarBorderColor( 1 );
		// Only the rest rule and the hover/focus rule, never a bare 0x80 rule.
		expect( css ).not.toContain(
			`mark.wp-note[data-id="7"]{background-color:${ color }80;}`
		);
	} );

	it( 'skips threads without an id', () => {
		const css = buildBaseHighlightCss( [
			{ id: null, author: 1 },
			{ author: 1 },
		] );
		expect( css ).not.toMatch( /data-id="(null|undefined)"/ );
	} );

	it( 'cycles through AVATAR_BORDER_COLORS by author id modulo length', () => {
		// Authors 1 and 8 collide (1 % 7 === 8 % 7), so both threads should
		// share the same color — guards the modulo behavior in
		// getAvatarBorderColor.
		const css = buildBaseHighlightCss( [
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
		const css = buildBaseHighlightCss( [ { id: 'x' } ] );
		const color = getAvatarBorderColor( 0 );
		expect( css ).toContain(
			`mark.wp-note[data-id="x"]{background-color:${ color }40;}`
		);
	} );

	it( 'returns just the reset when no threads are provided', () => {
		expect( buildBaseHighlightCss() ).toBe(
			'mark.wp-note{background-color:transparent;color:inherit;}'
		);
		expect( buildBaseHighlightCss( null ) ).toBe(
			'mark.wp-note{background-color:transparent;color:inherit;}'
		);
	} );
} );

describe( 'buildSelectedHighlightCss', () => {
	const threads = [
		{ id: 7, author: 1 },
		{ id: 12, author: 3 },
	];

	it( 'returns an empty string when nothing is selected', () => {
		expect( buildSelectedHighlightCss( threads ) ).toBe( '' );
		expect( buildSelectedHighlightCss( threads, null ) ).toBe( '' );
	} );

	it( 'returns an empty string when the selected id is not among the threads', () => {
		expect( buildSelectedHighlightCss( threads, 999 ) ).toBe( '' );
	} );

	it( 'emits a single active-alpha (0x80) rule for the selected thread', () => {
		const color = getAvatarBorderColor( 1 );
		expect( buildSelectedHighlightCss( threads, 7 ) ).toBe(
			`mark.wp-note[data-id="7"]{background-color:${ color }80;}`
		);
	} );

	it( 'matches numeric and string selectedId variants', () => {
		expect( buildSelectedHighlightCss( threads, 7 ) ).toEqual(
			buildSelectedHighlightCss( threads, '7' )
		);
	} );

	it( 'appends after the base rule so the cascade promotes the selected note', () => {
		// The component concatenates base + selected; the selected rule shares
		// the rest rule's specificity, so being last is what makes it win.
		const color = getAvatarBorderColor( 1 );
		const css =
			buildBaseHighlightCss( threads ) +
			buildSelectedHighlightCss( threads, 7 );
		const restIndex = css.indexOf(
			`mark.wp-note[data-id="7"]{background-color:${ color }40;}`
		);
		const activeIndex = css.lastIndexOf(
			`mark.wp-note[data-id="7"]{background-color:${ color }80;}`
		);
		expect( restIndex ).toBeGreaterThanOrEqual( 0 );
		expect( activeIndex ).toBeGreaterThan( restIndex );
	} );
} );
