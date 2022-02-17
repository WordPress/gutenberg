/**
 * Internal dependencies
 */
import { isFeatureActive } from '../selectors';

describe( 'selectors', () => {
	describe( 'isFeatureActive', () => {
		it( 'returns false if the there is no state for the feature', () => {
			const emptyState = {
				featureDefaults: {},
				features: {},
			};

			expect(
				isFeatureActive( emptyState, 'test-scope', 'testFeatureName' )
			).toBe( false );
		} );

		it( 'returns false if the the default for a feature is false and there is no preference state', () => {
			const emptyState = {
				featureDefaults: {
					'test-scope': {
						testFeatureName: false,
					},
				},
				features: {},
			};

			expect(
				isFeatureActive( emptyState, 'test-scope', 'testFeatureName' )
			).toBe( false );
		} );

		it( 'returns true if the the default for a feature is true and there is no preference state', () => {
			const emptyState = {
				featureDefaults: {
					'test-scope': {
						testFeatureName: true,
					},
				},
				features: {},
			};

			expect(
				isFeatureActive( emptyState, 'test-scope', 'testFeatureName' )
			).toBe( true );
		} );

		it( 'returns true if the the default for a feature is false but the preference is true', () => {
			const emptyState = {
				featureDefaults: {
					'test-scope': {
						testFeatureName: false,
					},
				},
				features: {
					'test-scope': {
						testFeatureName: true,
					},
				},
			};

			expect(
				isFeatureActive( emptyState, 'test-scope', 'testFeatureName' )
			).toBe( true );
		} );

		it( 'returns false if the the default for a feature is true but the preference is false', () => {
			const emptyState = {
				featureDefaults: {
					'test-scope': {
						testFeatureName: true,
					},
				},
				features: {
					'test-scope': {
						testFeatureName: false,
					},
				},
			};

			expect(
				isFeatureActive( emptyState, 'test-scope', 'testFeatureName' )
			).toBe( false );
		} );
	} );
} );
