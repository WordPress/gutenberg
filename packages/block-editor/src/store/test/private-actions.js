/**
 * Internal dependencies
 */
import {
	hideBlockInterface,
	showBlockInterface,
	setBlockEditingMode,
	unsetBlockEditingMode,
	__experimentalUpdateSettings,
} from '../private-actions';

describe( 'private actions', () => {
	describe( 'hideBlockInterface', () => {
		it( 'should return the HIDE_BLOCK_INTERFACE action', () => {
			expect( hideBlockInterface() ).toEqual( {
				type: 'HIDE_BLOCK_INTERFACE',
			} );
		} );
	} );

	describe( 'showBlockInterface', () => {
		it( 'should return the SHOW_BLOCK_INTERFACE action', () => {
			expect( showBlockInterface() ).toEqual( {
				type: 'SHOW_BLOCK_INTERFACE',
			} );
		} );
	} );

	describe( 'setBlockEditingMode', () => {
		it( 'should return the SET_BLOCK_EDITING_MODE action', () => {
			expect(
				setBlockEditingMode(
					'14501cc2-90a6-4f52-aa36-ab6e896135d1',
					'default'
				)
			).toEqual( {
				type: 'SET_BLOCK_EDITING_MODE',
				clientId: '14501cc2-90a6-4f52-aa36-ab6e896135d1',
				mode: 'default',
			} );
		} );
	} );

	describe( 'unsetBlockEditingMode', () => {
		it( 'should return the UNSET_BLOCK_EDITING_MODE action', () => {
			expect(
				unsetBlockEditingMode( '14501cc2-90a6-4f52-aa36-ab6e896135d1' )
			).toEqual( {
				type: 'UNSET_BLOCK_EDITING_MODE',
				clientId: '14501cc2-90a6-4f52-aa36-ab6e896135d1',
			} );
		} );
	} );

	describe( '__experimentalUpdateSettings', () => {
		const experimentalSettings = {
			inserterMediaCategories: 'foo',
			blockInspectorAnimation: 'bar',
		};

		const stableSettings = {
			foo: 'foo',
			bar: 'bar',
			baz: 'baz',
		};

		const settings = {
			...experimentalSettings,
			...stableSettings,
		};

		it( 'should dispatch provided settings by default', () => {
			expect( __experimentalUpdateSettings( settings ) ).toEqual( {
				type: 'UPDATE_SETTINGS',
				settings,
				reset: false,
			} );
		} );

		it( 'should dispatch provided settings with reset flag when `reset` argument is truthy', () => {
			expect(
				__experimentalUpdateSettings( settings, {
					stripExperimentalSettings: false,
					reset: true,
				} )
			).toEqual( {
				type: 'UPDATE_SETTINGS',
				settings,
				reset: true,
			} );
		} );

		it( 'should strip experimental settings from a given settings object when `stripExperimentalSettings` argument is truthy', () => {
			expect(
				__experimentalUpdateSettings( settings, {
					stripExperimentalSettings: true,
				} )
			).toEqual( {
				type: 'UPDATE_SETTINGS',
				settings: {
					foo: 'foo',
					bar: 'bar',
					baz: 'baz',
				},
				reset: false,
			} );
		} );
	} );
} );
