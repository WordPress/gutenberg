/**
 * Internal dependencies
 */
import { isFeatureActive } from '../selectors';

describe( 'selectors', () => {
	describe( 'isFeatureActive', () => {
		it( 'returns false if the there is no state for the feature', () => {
			const emptyState = {
				preferenceDefaults: {
					features: {},
				},
				preferences: {
					features: {},
				},
			};

			expect(
				isFeatureActive( emptyState, 'test-scope', 'testFeatureName' )
			).toBe( false );
		} );

		it( 'returns false if the the default for a feature is false and there is no preference state', () => {
			const emptyState = {
				preferenceDefaults: {
					features: {
						'test-scope': {
							testFeatureName: false,
						},
					},
				},
				preferences: {
					features: {},
				},
			};

			expect(
				isFeatureActive( emptyState, 'test-scope', 'testFeatureName' )
			).toBe( false );
		} );

		it( 'returns true if the the default for a feature is true and there is no preference state', () => {
			const emptyState = {
				preferenceDefaults: {
					features: {
						'test-scope': {
							testFeatureName: true,
						},
					},
				},
				preferences: {
					features: {},
				},
			};

			expect(
				isFeatureActive( emptyState, 'test-scope', 'testFeatureName' )
			).toBe( true );
		} );

		it( 'returns true if the the default for a feature is false but the preference is true', () => {
			const emptyState = {
				preferenceDefaults: {
					features: {
						'test-scope': {
							testFeatureName: false,
						},
					},
				},
				preferences: {
					features: {
						'test-scope': {
							testFeatureName: true,
						},
					},
				},
			};

			expect(
				isFeatureActive( emptyState, 'test-scope', 'testFeatureName' )
			).toBe( true );
		} );

		it( 'returns false if the the default for a feature is true but the preference is false', () => {
			const emptyState = {
				preferenceDefaults: {
					features: {
						'test-scope': {
							testFeatureName: true,
						},
					},
				},
				preferences: {
					features: {
						'test-scope': {
							testFeatureName: false,
						},
					},
				},
			};

			expect(
				isFeatureActive( emptyState, 'test-scope', 'testFeatureName' )
			).toBe( false );
		} );
	} );
} );
