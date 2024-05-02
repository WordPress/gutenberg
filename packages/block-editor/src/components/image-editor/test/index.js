/**
 * Internal dependencies
 */
import { ratioToNumber } from '../aspect-ratio-dropdown';

test( 'ratioToNumber', () => {
	expect( ratioToNumber( '1/1' ) ).toBe( 1 );
	expect( ratioToNumber( '1' ) ).toBe( 1 );
	expect( ratioToNumber( '11/11' ) ).toBe( 1 );
	expect( ratioToNumber( '16/9' ) ).toBe( 16 / 9 );
	expect( ratioToNumber( '4/3' ) ).toBe( 4 / 3 );
	expect( ratioToNumber( '3/2' ) ).toBe( 3 / 2 );
	expect( ratioToNumber( '2/1' ) ).toBe( 2 );
	expect( ratioToNumber( '1/2' ) ).toBe( 1 / 2 );
	expect( ratioToNumber( '2/3' ) ).toBe( 2 / 3 );
	expect( ratioToNumber( '3/4' ) ).toBe( 3 / 4 );
	expect( ratioToNumber( '9/16' ) ).toBe( 9 / 16 );
	expect( ratioToNumber( '1/16' ) ).toBe( 1 / 16 );
	expect( ratioToNumber( '16/1' ) ).toBe( 16 );
	expect( ratioToNumber( '1/9' ) ).toBe( 1 / 9 );
	expect( ratioToNumber( 'auto' ) ).toBe( NaN );
} );
