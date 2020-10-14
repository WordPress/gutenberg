/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	preferences,
	settings,
	homeTemplateId,
	templateId,
	templatePartId,
	templateType,
	page,
	navigationPanel,
	blockInserterPanel,
} from '../reducer';
import { PREFERENCES_DEFAULTS } from '../defaults';

import {
	setNavigationPanelActiveMenu,
	openNavigationPanelToMenu,
	setIsNavigationPanelOpened,
	setIsInserterOpened,
} from '../actions';

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

	describe( 'settings()', () => {
		it( 'should apply default state', () => {
			expect( settings( undefined, {} ) ).toEqual( {} );
		} );

		it( 'should default to returning the same state', () => {
			const state = {};
			expect( settings( state, {} ) ).toBe( state );
		} );

		it( 'should update settings with a shallow merge', () => {
			expect(
				settings(
					deepFreeze( {
						setting: { key: 'value' },
						otherSetting: 'value',
					} ),
					{
						type: 'UPDATE_SETTINGS',
						settings: { setting: { newKey: 'newValue' } },
					}
				)
			).toEqual( {
				setting: { newKey: 'newValue' },
				otherSetting: 'value',
			} );
		} );
	} );

	describe( 'homeTemplateId()', () => {
		it( 'should apply default state', () => {
			expect( homeTemplateId( undefined, {} ) ).toEqual( undefined );
		} );

		it( 'should default to returning the same state', () => {
			const state = {};
			expect( homeTemplateId( state, {} ) ).toBe( state );
		} );
	} );

	describe( 'templateId()', () => {
		it( 'should apply default state', () => {
			expect( templateId( undefined, {} ) ).toEqual( undefined );
		} );

		it( 'should default to returning the same state', () => {
			const state = {};
			expect( templateId( state, {} ) ).toBe( state );
		} );

		it( 'should update when a template is set', () => {
			expect(
				templateId( 1, {
					type: 'SET_TEMPLATE',
					templateId: 2,
				} )
			).toEqual( 2 );
		} );

		it( 'should update when a page is set', () => {
			expect(
				templateId( 1, {
					type: 'SET_PAGE',
					templateId: 2,
				} )
			).toEqual( 2 );
		} );
	} );

	describe( 'templatePartId()', () => {
		it( 'should apply default state', () => {
			expect( templatePartId( undefined, {} ) ).toEqual( undefined );
		} );

		it( 'should default to returning the same state', () => {
			const state = {};
			expect( templatePartId( state, {} ) ).toBe( state );
		} );

		it( 'should update when a template part is set', () => {
			expect(
				templatePartId( 1, {
					type: 'SET_TEMPLATE_PART',
					templatePartId: 2,
				} )
			).toEqual( 2 );
		} );
	} );

	describe( 'templateType()', () => {
		it( 'should apply default state', () => {
			expect( templateType( undefined, {} ) ).toEqual( 'wp_template' );
		} );

		it( 'should default to returning the same state', () => {
			const state = {};
			expect( templateType( state, {} ) ).toBe( state );
		} );

		it( 'should update when a template is set', () => {
			expect(
				templateType( undefined, {
					type: 'SET_TEMPLATE',
				} )
			).toEqual( 'wp_template' );
		} );

		it( 'should update when a page is set', () => {
			expect(
				templateType( undefined, {
					type: 'SET_PAGE',
				} )
			).toEqual( 'wp_template' );
		} );

		it( 'should update when a template part is set', () => {
			expect(
				templateType( undefined, {
					type: 'SET_TEMPLATE_PART',
				} )
			).toEqual( 'wp_template_part' );
		} );
	} );

	describe( 'page()', () => {
		it( 'should apply default state', () => {
			expect( page( undefined, {} ) ).toEqual( undefined );
		} );

		it( 'should default to returning the same state', () => {
			const state = {};
			expect( page( state, {} ) ).toBe( state );
		} );

		it( 'should set the page', () => {
			const newPage = {};
			expect(
				page( undefined, {
					type: 'SET_PAGE',
					page: newPage,
				} )
			).toBe( newPage );
		} );
	} );

	describe( 'navigationPanel()', () => {
		it( 'should apply default state', () => {
			expect( navigationPanel( undefined, {} ) ).toEqual( {
				menu: 'root',
				isOpen: false,
			} );
		} );

		it( 'should default to returning the same state', () => {
			const state = { test: 1 };
			expect( navigationPanel( state, {} ) ).toBe( state );
		} );

		it( 'should set the active navigation panel', () => {
			expect(
				navigationPanel(
					undefined,
					setNavigationPanelActiveMenu( 'test-menu' )
				)
			).toEqual( {
				isOpen: false,
				menu: 'test-menu',
			} );
		} );

		it( 'should be able to open the navigation panel to a menu', () => {
			expect(
				navigationPanel(
					undefined,
					openNavigationPanelToMenu( 'test-menu' )
				)
			).toEqual( {
				isOpen: true,
				menu: 'test-menu',
			} );
		} );

		it( 'should be able to open the navigation panel', () => {
			expect(
				navigationPanel( undefined, setIsNavigationPanelOpened( true ) )
			).toEqual( {
				isOpen: true,
				menu: 'root',
			} );
		} );

		it( 'should change the menu to root when closing the panel', () => {
			const state = navigationPanel(
				undefined,
				openNavigationPanelToMenu( 'test-menu' )
			);

			expect( state.menu ).toEqual( 'test-menu' );
			expect(
				navigationPanel( state, setIsNavigationPanelOpened( false ) )
			).toEqual( {
				isOpen: false,
				menu: 'root',
			} );
		} );

		it( 'should close the navigation panel when opening the inserter and change the menu to root', () => {
			const state = navigationPanel(
				undefined,
				openNavigationPanelToMenu( 'test-menu' )
			);

			expect( state.menu ).toEqual( 'test-menu' );
			expect(
				navigationPanel( state, setIsInserterOpened( true ) )
			).toEqual( {
				isOpen: false,
				menu: 'root',
			} );
		} );

		it( 'should not change the state when closing the inserter', () => {
			const state = navigationPanel(
				undefined,
				openNavigationPanelToMenu( 'test-menu' )
			);

			expect( state.menu ).toEqual( 'test-menu' );
			expect(
				navigationPanel( state, setIsInserterOpened( false ) )
			).toEqual( state );
		} );
	} );

	describe( 'blockInserterPanel()', () => {
		it( 'should apply default state', () => {
			expect( blockInserterPanel( undefined, {} ) ).toEqual( false );
		} );

		it( 'should default to returning the same state', () => {
			expect( blockInserterPanel( true, {} ) ).toBe( true );
		} );

		it( 'should set the open state of the inserter panel', () => {
			expect(
				blockInserterPanel( false, setIsInserterOpened( true ) )
			).toBe( true );
			expect(
				blockInserterPanel( true, setIsInserterOpened( false ) )
			).toBe( false );
		} );

		it( 'should close the inserter when opening the nav panel', () => {
			expect(
				blockInserterPanel( true, openNavigationPanelToMenu( 'noop' ) )
			).toBe( false );
			expect(
				blockInserterPanel( true, setIsNavigationPanelOpened( true ) )
			).toBe( false );
		} );

		it( 'should not change the state when closing the nav panel', () => {
			expect(
				blockInserterPanel( true, setIsNavigationPanelOpened( false ) )
			).toBe( true );
		} );
	} );
} );
