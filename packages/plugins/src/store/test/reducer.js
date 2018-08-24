/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	preferences,
} from '../reducer';

describe( 'state', () => {
	describe( 'preferences()', () => {
		it( 'should apply all defaults', () => {
			const state = preferences( undefined, {} );

			expect( state ).toEqual( {
				pinnedPluginItems: {},
			} );
		} );

		describe( 'pinnedPluginItems', () => {
			const initialState = deepFreeze( {
				pinnedPluginItems: {
					'foo/enabled': true,
					'foo/disabled': false,
				},
			} );

			it( 'should disable a pinned plugin flag when the value does not exist', () => {
				const state = preferences( initialState, {
					type: 'TOGGLE_PINNED_PLUGIN_ITEM',
					itemName: 'foo/does-not-exist',
				} );

				expect( state.pinnedPluginItems[ 'foo/does-not-exist' ] ).toBe( false );
			} );

			it( 'should disable a pinned plugin flag when it is enabled', () => {
				const state = preferences( initialState, {
					type: 'TOGGLE_PINNED_PLUGIN_ITEM',
					itemName: 'foo/enabled',
				} );

				expect( state.pinnedPluginItems[ 'foo/enabled' ] ).toBe( false );
			} );

			it( 'should enable a pinned plugin flag when it is disabled', () => {
				const state = preferences( initialState, {
					type: 'TOGGLE_PINNED_PLUGIN_ITEM',
					itemName: 'foo/disabled',
				} );

				expect( state.pinnedPluginItems[ 'foo/disabled' ] ).toBe( true );
			} );
		} );
	} );
} );
