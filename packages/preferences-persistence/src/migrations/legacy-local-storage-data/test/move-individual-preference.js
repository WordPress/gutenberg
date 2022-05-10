/**
 * Internal dependencies
 */
import moveIndividualPreference from '../move-individual-preference';

describe( 'moveIndividualPreference', () => {
	it( 'migrates an individual preference from the source to the preferences store', () => {
		const initialState = {
			'core/test': {
				preferences: {
					myPreference: '123',
				},
			},
		};

		const convertedData = moveIndividualPreference(
			initialState,
			{ from: 'core/test', to: 'core/test' },
			'myPreference'
		);

		expect( convertedData ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/test': {
						myPreference: '123',
					},
				},
			},
			'core/test': {
				preferences: {
					myPreference: undefined,
				},
			},
		} );
	} );

	it( 'does not overwrite other preferences in the preferences store', () => {
		const initialState = {
			'core/test': {
				otherData: {
					test: 1,
				},
				preferences: {
					myPreference: '123',
				},
			},
			'core/preferences': {
				preferences: {
					'core/other-store': {
						preferenceA: 1,
						preferenceB: 2,
					},
					'core/test': {
						unrelatedPreference: 'unrelated-value',
					},
				},
			},
		};

		const convertedData = moveIndividualPreference(
			initialState,
			{ from: 'core/test', to: 'core/test' },
			'myPreference'
		);

		expect( convertedData ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/other-store': {
						preferenceA: 1,
						preferenceB: 2,
					},
					'core/test': {
						unrelatedPreference: 'unrelated-value',
						myPreference: '123',
					},
				},
			},
			'core/test': {
				otherData: {
					test: 1,
				},
				preferences: {
					myPreference: undefined,
				},
			},
		} );
	} );

	it( 'supports moving data to a scope that is differently named to the source store', () => {
		const initialState = {
			'core/source': {
				preferences: {
					myPreference: '123',
				},
			},
		};

		const convertedData = moveIndividualPreference(
			initialState,
			{ from: 'core/source', to: 'core/destination' },
			'myPreference'
		);

		expect( convertedData ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/destination': {
						myPreference: '123',
					},
				},
			},
			'core/source': {
				preferences: {
					myPreference: undefined,
				},
			},
		} );
	} );

	it( 'does not migrate data if there is already a matching preference key at the target', () => {
		const initialState = {
			'core/test': {
				preferences: {
					myPreference: '123',
				},
			},
			'core/preferences': {
				preferences: {
					'core/test': {
						myPreference: 'already-set',
					},
				},
			},
		};

		const convertedData = moveIndividualPreference(
			initialState,
			{ from: 'core/test', to: 'core/test' },
			'myPreference'
		);

		expect( convertedData ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/test': {
						myPreference: 'already-set',
					},
				},
			},
			'core/test': {
				preferences: {
					myPreference: '123',
				},
			},
		} );
	} );

	it( 'migrates preferences that have a `false` value', () => {
		const initialState = {
			'core/test': {
				preferences: {
					myFalsePreference: false,
				},
			},
		};

		const convertedData = moveIndividualPreference(
			initialState,
			{ from: 'core/test', to: 'core/test' },
			'myFalsePreference'
		);

		expect( convertedData ).toEqual( {
			'core/preferences': {
				preferences: {
					'core/test': {
						myFalsePreference: false,
					},
				},
			},
			'core/test': {
				preferences: {},
			},
		} );
	} );
} );
