/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { preferences } from '../reducer';
import { PREFERENCES_DEFAULTS } from '../defaults';

describe( 'state', () => {
	describe( 'preferences()', () => {
		it( 'should apply all defaults', () => {
			const state = preferences( undefined, {} );

			expect( state ).toEqual( PREFERENCES_DEFAULTS );
		} );

		it( 'should toggle a feature flag', () => {
			const state = preferences(
				deepFreeze( { features: { chicken: true } } ),
				{
					type: 'TOGGLE_FEATURE',
					feature: 'chicken',
				}
			);

			expect( state.features ).toEqual( { chicken: false } );
		} );
	} );
} );
