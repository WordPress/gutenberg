/**
 * Internal dependencies
 */
import {
	toggleFeature,
	openEntitiesSavedStates,
	closeEntitiesSavedStates,
} from '../actions';

describe( 'actions', () => {
	describe( 'toggleFeature', () => {
		it( 'should return TOGGLE_FEATURE action', () => {
			const feature = 'name';
			expect( toggleFeature( feature ) ).toEqual( {
				type: 'TOGGLE_FEATURE',
				feature,
			} );
		} );
	} );
} );

describe( 'openEntitiesSavedStates', () => {
	it( 'should return OPEN_ENTITIES_SAVED_STATES action', () => {
		const result = openEntitiesSavedStates( 'test' );
		expect( result ).toEqual( {
			type: 'OPEN_ENTITIES_SAVED_STATES',
			onRequestClose: 'test',
		} );
	} );
} );

describe( 'closeEntitiesSavedStates', () => {
	it( 'should return CLOSE_ENTITIES_SAVED_STATES action', () => {
		const result = closeEntitiesSavedStates( 'test' );
		expect( result ).toEqual( {
			type: 'CLOSE_ENTITIES_SAVED_STATES',
			callbackArg: 'test',
		} );
	} );
} );
