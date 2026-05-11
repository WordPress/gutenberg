/**
 * Internal dependencies
 */
import { orderBy } from '../sorting';

describe( 'orderBy', () => {
	it( 'should not mutate original input', () => {
		const input = [];
		expect( orderBy( input, 'x' ) ).not.toBe( input );
	} );

	it( 'should sort items by a field when it is specified as a string', () => {
		const input = [ { x: 2 }, { x: 1 }, { x: 3 } ];
		const expected = [ { x: 1 }, { x: 2 }, { x: 3 } ];
		expect( orderBy( input, 'x' ) ).toEqual( expected );
	} );

	it( 'should support functions for picking the field', () => {
		const input = [ { x: 2 }, { x: 1 }, { x: 3 } ];
		const expected = [ { x: 1 }, { x: 2 }, { x: 3 } ];
		expect( orderBy( input, ( item ) => item.x ) ).toEqual( expected );
	} );

	it( 'should support sorting in a descending order', () => {
		const input = [ { x: 2 }, { x: 1 }, { x: 3 } ];
		const expected = [ { x: 3 }, { x: 2 }, { x: 1 } ];
		expect( orderBy( input, 'x', 'desc' ) ).toEqual( expected );
	} );

	it( 'should maintain original order of equal items', () => {
		const a = { x: 1, a: 1 };
		const b = { x: 1, b: 2 };
		const c = { x: 0 };
		const d = { x: 1, b: 4 };
		const input = [ a, b, c, d ];
		const expected = [ c, a, b, d ];
		expect( orderBy( input, 'x' ) ).toEqual( expected );
	} );

	it( 'should maintain original order of equal items in descending order', () => {
		const a = { x: 1, a: 1 };
		const b = { x: 1, b: 2 };
		const c = { x: 0 };
		const d = { x: 1, b: 4 };
		const input = [ a, b, c, d ];
		const expected = [ a, b, d, c ];
		expect( orderBy( input, 'x', 'desc' ) ).toEqual( expected );
	} );
} );
