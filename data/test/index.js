import { registerReducer } from '../';

describe( 'store', () => {
	it( 'Should append reducers to the state', () => {
		const reducer1 = () => 'chicken';
		const reducer2 = () => 'ribs';

		const store = registerReducer( 'red1', reducer1 );
		expect( store.getState() ).toEqual( 'chicken' );

		const store2 = registerReducer( 'red2', reducer2 );
		expect( store2.getState() ).toEqual( 'ribs' );
	} );
} );
