/**
 * Internal dependencies
 */
import { getNotices } from '../selectors';
import { DEFAULT_CONTEXT } from '../constants';

describe( 'selectors', () => {
	describe( 'getNotices', () => {
		it( 'should return a consistent empty array for empty state', () => {
			const state = {};

			expect( getNotices( state ) ).toEqual( [] );
			expect( getNotices( state ) ).toBe( getNotices( state ) );
		} );

		it( 'should return the notices array for the default context', () => {
			const state = {
				[ DEFAULT_CONTEXT ]: [
					{ id: 'b', content: 'message 1' },
					{ id: 'a', content: 'message 2' },
				],
			};

			expect( getNotices( state ) ).toEqual( [
				{ id: 'b', content: 'message 1' },
				{ id: 'a', content: 'message 2' },
			] );
		} );

		it( 'should return the notices array for a given context', () => {
			const state = {
				foo: [ { id: 'c', content: 'message 3' } ],
			};

			expect( getNotices( state, 'foo' ) ).toEqual( [
				{ id: 'c', content: 'message 3' },
			] );
		} );
	} );
} );
