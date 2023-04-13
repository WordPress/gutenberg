/**
 * Internal dependencies
 */
import moveThirdPartyFeaturePreferences from '../move-third-party-feature-preferences';

describe( 'moveThirdPartyFeaturePreferences', () => {
	it( 'migrates multiple scopes from the interface package to the preferences package', () => {
		const state = {
			'core/interface': {
				otherData: {
					test: 1,
				},
				preferences: {
					features: {
						'plugin-a': {
							featureA: true,
							featureB: false,
							featureC: true,
						},
						'plugin-b': {
							featureD: true,
							featureE: false,
							featureF: true,
						},
					},
				},
			},
		};

		const convertedState = moveThirdPartyFeaturePreferences( state );

		expect( convertedState ).toEqual( {
			'core/preferences': {
				preferences: {
					'plugin-a': {
						featureA: true,
						featureB: false,
						featureC: true,
					},
					'plugin-b': {
						featureD: true,
						featureE: false,
						featureF: true,
					},
				},
			},
			'core/interface': {
				otherData: {
					test: 1,
				},
				preferences: {
					features: {
						'plugin-a': undefined,
						'plugin-b': undefined,
					},
				},
			},
		} );
	} );

	it( 'ignores any core scopes', () => {
		const state = {
			'core/interface': {
				preferences: {
					features: {
						'plugin-a': {
							featureA: true,
							featureB: false,
							featureC: true,
						},
						'core/edit-post': {
							featureD: true,
							featureE: false,
							featureF: true,
						},
					},
				},
			},
		};

		const convertedState = moveThirdPartyFeaturePreferences( state );

		expect( convertedState ).toEqual( {
			'core/preferences': {
				preferences: {
					'plugin-a': {
						featureA: true,
						featureB: false,
						featureC: true,
					},
				},
			},
			'core/interface': {
				preferences: {
					features: {
						'plugin-a': undefined,
						'core/edit-post': {
							featureD: true,
							featureE: false,
							featureF: true,
						},
					},
				},
			},
		} );
	} );
} );
