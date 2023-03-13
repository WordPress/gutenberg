/**
 * Internal dependencies
 */
import { setPersistenceLayer } from '../actions';

describe( 'setPersistenceLayer', () => {
	it( 'returns an action that contains the persistence layer and the result of calling `persistenceLayer.get`', async () => {
		const result = {
			testA: 1,
			testB: 2,
		};
		const testPersistenceLayer = {
			async get() {
				return result;
			},
			set() {},
		};

		const action = await setPersistenceLayer( testPersistenceLayer );

		expect( action ).toEqual( {
			type: 'SET_PERSISTENCE_LAYER',
			persistenceLayer: testPersistenceLayer,
			persistedData: result,
		} );
	} );
} );
