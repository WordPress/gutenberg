import reducer from '../reducer';

describe( 'reducer', () => {
	it( 'defaults to disabled empty state', () => {
		expect( reducer( undefined, {} ) ).toEqual( {
			guides: [],
			preferences: {
				areTipsEnabled: false,
				dismissedTips: {},
			},
		} );
	} );

	it( 'ignores legacy actions', () => {
		const state = reducer( undefined, {} );

		expect(
			reducer( state, {
				type: 'ENABLE_TIPS',
			} )
		).toBe( state );
		expect(
			reducer( state, {
				type: 'TRIGGER_GUIDE',
				tipIds: [ 'test/tip' ],
			} )
		).toBe( state );
	} );
} );
