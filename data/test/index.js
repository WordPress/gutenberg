import { registerReducer, getState } from '../';

describe( 'store', () => {
	it( 'Should append reducers to the state', () => {
		const reducer1 = () => 'chicken';
		const reducer2 = () => 'ribs';

		registerReducer( 'red1', reducer1 );
		expect( getState() ).toEqual( { red1: 'chicken' } );

		registerReducer( 'red2', reducer2 );
		expect( getState() ).toEqual( {
			red1: 'chicken',
			red2: 'ribs',
		} );
	} );
} );
