/**
 * Internal dependencies
 */
import { get } from '../selectors';

describe( 'selectors', () => {
	describe( 'get', () => {
		it( 'returns `undefined` if the there is no state for the preference', () => {
			const emptyState = {
				defaults: {},
				preferences: {},
			};

			expect(
				get( emptyState, 'test-scope', 'testPreferenceName' )
			).toBe( undefined );
		} );

		it( 'returns the default for a preference if the default is set and the preference has no value', () => {
			const emptyState = {
				defaults: {
					'test-scope': {
						testPreferenceName: 'test default',
					},
				},
				preferences: {},
			};

			expect(
				get( emptyState, 'test-scope', 'testPreferenceName' )
			).toBe( 'test default' );
		} );

		it( 'returns the value for a preference if the preference is set and the default is not set', () => {
			const emptyState = {
				defaults: {},
				preferences: {
					'test-scope': {
						testPreferenceName: 'test value',
					},
				},
			};

			expect(
				get( emptyState, 'test-scope', 'testPreferenceName' )
			).toBe( 'test value' );
		} );

		it( 'returns the value for a preference if the preference and the default are set', () => {
			const emptyState = {
				defaults: {
					'test-scope': {
						testPreferenceName: 'test default',
					},
				},
				preferences: {
					'test-scope': {
						testPreferenceName: 'test value',
					},
				},
			};

			expect(
				get( emptyState, 'test-scope', 'testPreferenceName' )
			).toBe( 'test value' );
		} );
	} );
} );
