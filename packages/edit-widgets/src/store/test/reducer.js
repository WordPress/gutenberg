/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { widgetSavingLock } from '../reducer';

describe( 'state', () => {
	describe( 'widgetSavingLock', () => {
		it( 'returns empty object by default', () => {
			const state = widgetSavingLock( undefined, {} );

			expect( state ).toEqual( {} );
		} );

		it( 'returns correct widget saving locks when locks added and removed', () => {
			let state = widgetSavingLock( undefined, {
				type: 'LOCK_WIDGET_SAVING',
				lockName: 'test-lock',
			} );

			expect( state ).toEqual( {
				'test-lock': true,
			} );

			state = widgetSavingLock( deepFreeze( state ), {
				type: 'LOCK_WIDGET_SAVING',
				lockName: 'test-lock-2',
			} );

			expect( state ).toEqual( {
				'test-lock': true,
				'test-lock-2': true,
			} );

			state = widgetSavingLock( deepFreeze( state ), {
				type: 'UNLOCK_WIDGET_SAVING',
				lockName: 'test-lock',
			} );

			expect( state ).toEqual( {
				'test-lock-2': true,
			} );

			state = widgetSavingLock( deepFreeze( state ), {
				type: 'UNLOCK_WIDGET_SAVING',
				lockName: 'test-lock-2',
			} );

			expect( state ).toEqual( {} );
		} );
	} );
} );
