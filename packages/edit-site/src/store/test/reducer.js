/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	settings,
	homeTemplateId,
	editedPost,
	navigationPanel,
	blockInserterPanel,
	listViewPanel,
} from '../reducer';

import {
	setNavigationPanelActiveMenu,
	openNavigationPanelToMenu,
	setIsNavigationPanelOpened,
	setIsInserterOpened,
	setIsListViewOpened,
} from '../actions';

describe( 'state', () => {
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

	describe( 'editedPost()', () => {
		it( 'should apply default state', () => {
			expect( editedPost( undefined, {} ) ).toEqual( {} );
		} );

		it( 'should default to returning the same state', () => {
			const state = [];
			expect( editedPost( state, {} ) ).toBe( state );
		} );

		it( 'should update when a template is set', () => {
			expect(
				editedPost(
					{ id: 1, type: 'wp_template' },
					{
						type: 'SET_TEMPLATE',
						templateId: 2,
					}
				)
			).toEqual( { id: 2, type: 'wp_template' } );
		} );

		it( 'should update when a page is set', () => {
			expect(
				editedPost(
					{ id: 1, type: 'wp_template' },
					{
						type: 'SET_PAGE',
						templateId: 2,
						page: {},
					}
				)
			).toEqual( { id: 2, type: 'wp_template', page: {} } );
		} );

		it( 'should update when a template part is set', () => {
			expect(
				editedPost(
					{ id: 1, type: 'wp_template' },
					{
						type: 'SET_TEMPLATE_PART',
						templatePartId: 2,
					}
				)
			).toEqual( { id: 2, type: 'wp_template_part' } );
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

		it( 'should close the navigation panel when opening the list view and change the menu to root', () => {
			const state = navigationPanel(
				undefined,
				openNavigationPanelToMenu( 'test-menu' )
			);

			expect( state.menu ).toEqual( 'test-menu' );
			expect(
				navigationPanel( state, setIsListViewOpened( true ) )
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

		it( 'should not change the state when closing the list view', () => {
			const state = navigationPanel(
				undefined,
				openNavigationPanelToMenu( 'test-menu' )
			);

			expect( state.menu ).toEqual( 'test-menu' );
			expect(
				navigationPanel( state, setIsListViewOpened( false ) )
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

		it( 'should close the inserter when opening the list view panel', () => {
			expect(
				blockInserterPanel( true, setIsListViewOpened( true ) )
			).toBe( false );
		} );

		it( 'should not change the state when closing the nav panel', () => {
			expect(
				blockInserterPanel( true, setIsNavigationPanelOpened( false ) )
			).toBe( true );
		} );

		it( 'should not change the state when closing the list view panel', () => {
			expect(
				blockInserterPanel( true, setIsListViewOpened( false ) )
			).toBe( true );
		} );
	} );

	describe( 'listViewPanel()', () => {
		it( 'should apply default state', () => {
			expect( listViewPanel( undefined, {} ) ).toEqual( false );
		} );

		it( 'should default to returning the same state', () => {
			expect( listViewPanel( true, {} ) ).toBe( true );
		} );

		it( 'should set the open state of the list view panel', () => {
			expect( listViewPanel( false, setIsListViewOpened( true ) ) ).toBe(
				true
			);
			expect( listViewPanel( true, setIsListViewOpened( false ) ) ).toBe(
				false
			);
		} );

		it( 'should close the list view when opening the nav panel', () => {
			expect(
				listViewPanel( true, openNavigationPanelToMenu( 'noop' ) )
			).toBe( false );
			expect(
				listViewPanel( true, setIsNavigationPanelOpened( true ) )
			).toBe( false );
		} );

		it( 'should close the list view when opening the inserter panel', () => {
			expect( listViewPanel( true, setIsInserterOpened( true ) ) ).toBe(
				false
			);
		} );

		it( 'should not change the state when closing the nav panel', () => {
			expect(
				listViewPanel( true, setIsNavigationPanelOpened( false ) )
			).toBe( true );
		} );

		it( 'should not change the state when closing the inserter panel', () => {
			expect( listViewPanel( true, setIsInserterOpened( false ) ) ).toBe(
				true
			);
		} );
	} );
} );
