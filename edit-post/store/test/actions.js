/**
 * Internal dependencies
 */
import {
	toggleSidebar,
	setActivePanel,
	toggleSidebarPanel,
	toggleFeature,
} from '../actions';

describe( 'actions', () => {
	describe( 'toggleSidebar', () => {
		it( 'should return TOGGLE_SIDEBAR action', () => {
			expect( toggleSidebar( 'publish', true ) ).toEqual( {
				type: 'TOGGLE_SIDEBAR',
				sidebar: 'publish',
				forcedValue: true,
			} );
		} );
	} );

	describe( 'setActivePanel', () => {
		const panel = 'panelName';
		expect( setActivePanel( panel ) ).toEqual( {
			type: 'SET_ACTIVE_PANEL',
			panel,
		} );
	} );

	describe( 'toggleSidebarPanel', () => {
		it( 'should return TOGGLE_SIDEBAR_PANEL action', () => {
			const panel = 'panelName';
			expect( toggleSidebarPanel( panel ) ).toEqual( {
				type: 'TOGGLE_SIDEBAR_PANEL',
				panel,
			} );
		} );
	} );

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
