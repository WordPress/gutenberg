/**
 * Internal dependencies
 */
import moveFeaturePreferences from '../move-feature-preferences';

describe( 'moveFeaturePreferences', () => {
	it( 'migrates multiple preferences from persisted source stores to preferences without overwriting data', () => {
		const state = {
			'core/test-a': {
				preferences: {
					features: {
						featureA: true,
						featureB: false,
						featureC: true,
					},
				},
			},
			'core/test-b': {
				preferences: {
					features: {
						featureD: true,
						featureE: false,
						featureF: true,
					},
				},
			},
		};

		let convertedState = moveFeaturePreferences( state, 'core/test-a' );

		convertedState = moveFeaturePreferences(
			convertedState,
			'core/test-b'
		);

		expect( convertedState ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/test-a': {
						featureA: true,
						featureB: false,
						featureC: true,
					},
					'core/test-b': {
						featureD: true,
						featureE: false,
						featureF: true,
					},
				},
			},
			'core/test-a': {
				preferences: {
					features: undefined,
				},
			},
			'core/test-b': {
				preferences: {
					features: undefined,
				},
			},
		} );
	} );

	it( 'migrates multiple preferences from the persisted interface store to preferences, with interface state taking precedence over source stores', () => {
		const state = {
			'core/test-a': {
				preferences: {
					features: {
						featureA: true,
						featureB: false,
						featureC: true,
					},
				},
			},
			'core/test-b': {
				preferences: {
					features: {
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
						'core/test-a': {
							featureG: true,
							featureH: false,
							featureI: true,
						},
						'core/test-b': {
							featureJ: true,
							featureK: false,
							featureL: true,
						},
					},
				},
			},
		};

		let convertedState = moveFeaturePreferences( state, 'core/test-a' );

		convertedState = moveFeaturePreferences(
			convertedState,
			'core/test-b'
		);

		expect( convertedState ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/test-a': {
						featureG: true,
						featureH: false,
						featureI: true,
					},
					'core/test-b': {
						featureJ: true,
						featureK: false,
						featureL: true,
					},
				},
			},
			'core/interface': {
				otherData: {
					test: 1,
				},
				preferences: {
					features: {
						'core/test-a': undefined,
						'core/test-b': undefined,
					},
				},
			},
			'core/test-a': {
				preferences: {
					features: undefined,
				},
			},
			'core/test-b': {
				preferences: {
					features: undefined,
				},
			},
		} );
	} );

	it( 'only migrates persisted preference data for the source name from source stores', () => {
		const state = {
			'core/test-a': {
				otherData: {
					test: 1,
				},
				preferences: {
					features: {
						featureA: true,
						featureB: false,
						featureC: true,
					},
				},
			},
			'core/test-b': {
				otherData: {
					test: 2,
				},
				preferences: {
					features: {
						featureD: true,
						featureE: false,
						featureF: true,
					},
				},
			},
		};

		const convertedState = moveFeaturePreferences( state, 'core/test-a' );

		expect( convertedState ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/test-a': {
						featureA: true,
						featureB: false,
						featureC: true,
					},
				},
			},
			'core/test-a': {
				otherData: {
					test: 1,
				},
				preferences: {
					features: undefined,
				},
			},
			'core/test-b': {
				otherData: {
					test: 2,
				},
				preferences: {
					features: {
						featureD: true,
						featureE: false,
						featureF: true,
					},
				},
			},
		} );
	} );

	it( 'only migrates persisted data for the source name from interface', () => {
		const state = {
			'core/interface': {
				preferences: {
					features: {
						'core/test-a': {
							featureG: true,
							featureH: false,
							featureI: true,
						},
						'core/test-b': {
							featureJ: true,
							featureK: false,
							featureL: true,
						},
					},
				},
			},
		};

		const convertedState = moveFeaturePreferences( state, 'core/test-a' );

		expect( convertedState ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/test-a': {
						featureG: true,
						featureH: false,
						featureI: true,
					},
				},
			},
			'core/interface': {
				preferences: {
					features: {
						'core/test-a': undefined,
						'core/test-b': {
							featureJ: true,
							featureK: false,
							featureL: true,
						},
					},
				},
			},
		} );
	} );
} );
