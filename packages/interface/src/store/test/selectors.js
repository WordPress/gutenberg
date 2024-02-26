/**
 * Internal dependencies
 */
import { isModalActive } from '../selectors';

describe( 'selectors', () => {
	describe( 'isModalActive', () => {
		it( 'returns true if the provided name matches the value in the preferences activeModal property', () => {
			const state = {
				activeModal: 'test-modal',
			};

			expect( isModalActive( state, 'test-modal' ) ).toBe( true );
		} );

		it( 'returns false if the provided name does not match the preferences activeModal property', () => {
			const state = {
				activeModal: 'something-else',
			};

			expect( isModalActive( state, 'test-modal' ) ).toBe( false );
		} );

		it( 'returns false if the preferences activeModal property is null', () => {
			const state = {
				activeModal: null,
			};

			expect( isModalActive( state, 'test-modal' ) ).toBe( false );
		} );
	} );
} );
