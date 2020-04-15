/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { preferences, entitiesSavedStates } from '../reducer';
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

	describe( 'entitiesSavedStates', () => {
		it( 'returns expected initialized state by default', () => {
			const state = entitiesSavedStates( undefined, {} );

			expect( state.isOpen ).toBe( false );
			expect( typeof state.onRequestClose ).toEqual( 'function' );
		} );

		it( 'returns expected updated state on OPEN action', () => {
			const onRequestClose = jest.fn();
			const state = entitiesSavedStates( undefined, {
				type: 'OPEN_ENTITIES_SAVED_STATES',
				onRequestClose,
			} );

			expect( state ).toEqual( {
				isOpen: true,
				onRequestClose,
			} );
		} );

		it( 'returns expected updated state on CLOSE action', () => {
			const onRequestClose = jest.fn();
			const startingState = { isOpen: true, onRequestClose };
			const action = {
				type: 'CLOSE_ENTITIES_SAVED_STATES',
			};
			const state = entitiesSavedStates( startingState, action );

			expect( state.isOpen ).toBe( false );
			expect( typeof state.onRequestClose ).toEqual( 'function' );
			expect( state.onRequestClose ).not.toEqual( onRequestClose );
		} );

		it( 'fires onRequestClose with callbackArg on CLOSE action', () => {
			const onRequestClose = jest.fn();
			const startingState = { isOpen: true, onRequestClose };
			const action = {
				type: 'CLOSE_ENTITIES_SAVED_STATES',
				callbackArg: 'testArg',
			};
			entitiesSavedStates( startingState, action );

			expect( onRequestClose ).toHaveBeenCalledTimes( 1 );
			expect( onRequestClose ).toHaveBeenCalledWith( 'testArg' );
		} );
	} );
} );
