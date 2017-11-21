import { attachCallbacks } from '../promise';

describe( 'attachCallbacks', () => {
	it( 'calls itemCompletedCallback for each item', done => {
		const values = [];

		attachCallbacks( [ Promise.resolve( 1 ), Promise.reject( 2 ), Promise.resolve( 3 ) ],
			( error, result ) => {
				if ( error ) {
					values[ error.index ] = error.error;
				} else {
					values[ result.index ] = result.value;
				}
			},
			() => {
				expect( values ).toEqual( [ 1, 2, 3 ] );
				done();
			} );
	} );
} );
