/**
 * Internal dependencies
 */
import { isFeatureActive, isEntitiesSavedStatesOpen } from '../selectors';

describe( 'selectors', () => {
	describe( 'isFeatureActive', () => {
		it( 'is tolerant to an undefined features preference', () => {
			// See: https://github.com/WordPress/gutenberg/issues/14580
			const state = {
				preferences: {},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( false );
		} );

		it( 'should return true if feature is active', () => {
			const state = {
				preferences: {
					features: {
						chicken: true,
					},
				},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( true );
		} );

		it( 'should return false if feature is not active', () => {
			const state = {
				preferences: {
					features: {
						chicken: false,
					},
				},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( false );
		} );

		it( 'should return false if feature is not referred', () => {
			const state = {
				preferences: {
					features: {},
				},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( false );
		} );
	} );

	describe( 'isEntitiesSavedStatesOpen', () => {
		it( 'should return isOpen property of entitiesSavedStates state', () => {
			const state = {
				entitiesSavedStates: {
					isOpen: 'some-thing',
				},
			};

			expect( isEntitiesSavedStatesOpen( state ) ).toBe( 'some-thing' );
		} );
	} );
} );
