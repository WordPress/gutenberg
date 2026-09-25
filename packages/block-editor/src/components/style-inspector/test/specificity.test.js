import { describe, expect, it } from 'vitest';
import {
	compareSpecificity,
	getSelectorSpecificity,
	splitSelectorList,
} from '../specificity';

describe( 'getSelectorSpecificity', () => {
	it.each( [
		[ 'p', [ 0, 0, 1 ] ],
		[ '.has-text-color', [ 0, 1, 0 ] ],
		[ '#id .a > p::before', [ 1, 1, 2 ] ],
		[ ':root :where(.wp-block-paragraph)', [ 0, 1, 0 ] ],
		[ ':where(.a, #b) p', [ 0, 0, 1 ] ],
		[ ':is(.a, #b) p', [ 1, 0, 1 ] ],
		[ 'a:not(.x):hover', [ 0, 2, 1 ] ],
		[ '[data-type="core/paragraph"]', [ 0, 1, 0 ] ],
		[ 'li:nth-child(2 of .item)', [ 0, 2, 1 ] ],
		[ '.wp-block-button__link', [ 0, 1, 0 ] ],
	] )( '%s', ( selector, expected ) => {
		expect( getSelectorSpecificity( selector ) ).toEqual( expected );
	} );
} );

describe( 'splitSelectorList', () => {
	it( 'splits on top-level commas only', () => {
		expect( splitSelectorList( 'h1, :is(h2, h3), [title="a,b"]' ) ).toEqual(
			[ 'h1', ':is(h2, h3)', '[title="a,b"]' ]
		);
	} );
} );

describe( 'compareSpecificity', () => {
	it( 'compares ids before classes before types', () => {
		expect(
			compareSpecificity( [ 1, 0, 0 ], [ 0, 9, 9 ] )
		).toBeGreaterThan( 0 );
		expect( compareSpecificity( [ 0, 1, 0 ], [ 0, 1, 0 ] ) ).toBe( 0 );
	} );
} );
