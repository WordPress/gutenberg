/**
 * Internal dependencies
 */
import createReduxStore from '../store';

describe( 'store', () => {
	describe( 'createReduxStore()', () => {
		it( 'should return a redux store', () => {
			const store = createReduxStore();

			expect( typeof store.dispatch ).toBe( 'function' );
			expect( typeof store.getState ).toBe( 'function' );
		} );

		it( 'should have expected reducer keys', () => {
			const store = createReduxStore();
			const state = store.getState();

			expect( Object.keys( state ) ).toEqual( expect.arrayContaining( [
				'optimist',
				'editor',
				'currentPost',
				'isTyping',
				'blockSelection',
				'hoveredBlock',
				'preferences',
				'saving',
				'blockInsertionPoint',
				'notices',
			] ) );
		} );
	} );
} );
