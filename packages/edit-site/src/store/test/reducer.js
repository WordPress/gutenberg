/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	settings,
	editedPost,
	blockInserterPanel,
	listViewPanel,
	hasPageContentFocus,
} from '../reducer';

import { setIsInserterOpened } from '../actions';

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
						type: 'SET_EDITED_POST',
						postType: 'wp_template',
						id: 2,
						context: { templateSlug: 'slug' },
					}
				)
			).toEqual( {
				postType: 'wp_template',
				id: 2,
				context: { templateSlug: 'slug' },
			} );
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

		it( 'should close the inserter when opening the list view panel', () => {
			expect(
				blockInserterPanel( true, {
					type: 'SET_IS_LIST_VIEW_OPENED',
					isOpen: true,
				} )
			).toBe( false );
		} );

		it( 'should not change the state when closing the list view panel', () => {
			expect(
				blockInserterPanel( true, {
					type: 'SET_IS_LIST_VIEW_OPENED',
					isOpen: false,
				} )
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
			expect(
				listViewPanel( false, {
					type: 'SET_IS_LIST_VIEW_OPENED',
					isOpen: true,
				} )
			).toBe( true );
			expect(
				listViewPanel( true, {
					type: 'SET_IS_LIST_VIEW_OPENED',
					isOpen: false,
				} )
			).toBe( false );
		} );

		it( 'should close the list view when opening the inserter panel', () => {
			expect( listViewPanel( true, setIsInserterOpened( true ) ) ).toBe(
				false
			);
		} );

		it( 'should not change the state when closing the inserter panel', () => {
			expect( listViewPanel( true, setIsInserterOpened( false ) ) ).toBe(
				true
			);
		} );
	} );

	describe( 'hasPageContentFocus()', () => {
		it( 'defaults to false', () => {
			expect( hasPageContentFocus( undefined, {} ) ).toBe( false );
		} );

		it( 'becomes false when editing a template', () => {
			expect(
				hasPageContentFocus( true, {
					type: 'SET_EDITED_POST',
					postType: 'wp_template',
				} )
			).toBe( false );
		} );

		it( 'becomes true when editing a page', () => {
			expect(
				hasPageContentFocus( false, {
					type: 'SET_EDITED_POST',
					postType: 'wp_template',
					context: {
						postType: 'page',
						postId: 123,
					},
				} )
			).toBe( true );
		} );

		it( 'can be set', () => {
			expect(
				hasPageContentFocus( false, {
					type: 'SET_HAS_PAGE_CONTENT_FOCUS',
					hasPageContentFocus: true,
				} )
			).toBe( true );
			expect(
				hasPageContentFocus( true, {
					type: 'SET_HAS_PAGE_CONTENT_FOCUS',
					hasPageContentFocus: false,
				} )
			).toBe( false );
		} );
	} );
} );
