/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import {
	getCanUserCreateMedia,
	getSettings,
	getHomeTemplateId,
	getEditedPostType,
	getEditedPostId,
	getPage,
	getNavigationPanelActiveMenu,
	getReusableBlocks,
	isNavigationOpened,
	isInserterOpened,
	isListViewOpened,
	__unstableGetPreference,
} from '../selectors';

describe( 'selectors', () => {
	const canUser = jest.fn( () => true );
	const getEntityRecords = jest.fn( () => [] );
	const get = jest.fn();
	getCanUserCreateMedia.registry = {
		select: jest.fn( () => ( { canUser } ) ),
	};
	getReusableBlocks.registry = {
		select: jest.fn( () => ( { getEntityRecords } ) ),
	};
	__unstableGetPreference.registry = {
		select: jest.fn( () => ( { get } ) ),
	};

	describe( 'getCanUserCreateMedia', () => {
		it( "selects `canUser( 'create', 'media' )` from the core store", () => {
			expect( getCanUserCreateMedia() ).toBe( true );
			expect(
				getCanUserCreateMedia.registry.select
			).toHaveBeenCalledWith( coreDataStore );
			expect( canUser ).toHaveBeenCalledWith( 'create', 'media' );
		} );
	} );

	describe( 'getReusableBlocks', () => {
		it( "selects `getEntityRecords( 'postType', 'wp_block' )` from the core store", () => {
			expect( getReusableBlocks() ).toEqual( [] );
			expect( getReusableBlocks.registry.select ).toHaveBeenCalledWith(
				coreDataStore
			);
			expect( getEntityRecords ).toHaveBeenCalledWith(
				'postType',
				'wp_block',
				{
					per_page: -1,
				}
			);
		} );
	} );

	describe( 'getSettings', () => {
		it( "returns the settings when the user can't create media", () => {
			canUser.mockReturnValueOnce( false );
			canUser.mockReturnValueOnce( false );
			get.mockImplementation( ( scope, name ) => {
				if ( name === 'focusMode' ) return false;
				if ( name === 'fixedToolbar' ) return false;
			} );
			const state = {
				settings: {},
				preferences: {},
				editedPost: { type: 'wp_template' },
			};
			const setInserterOpened = () => {};
			expect( getSettings( state, setInserterOpened ) ).toEqual( {
				outlineMode: true,
				focusMode: false,
				hasFixedToolbar: false,
				keepCaretInsideBlock: false,
				__experimentalSetIsInserterOpened: setInserterOpened,
				__experimentalReusableBlocks: [],
				__experimentalPreferPatternsOnRoot: true,
			} );
		} );

		it( 'returns the extended settings when the user can create media', () => {
			get.mockImplementation( ( scope, name ) => {
				if ( name === 'focusMode' ) return true;
				if ( name === 'fixedToolbar' ) return true;
			} );

			const state = {
				settings: { key: 'value' },
				editedPost: { type: 'wp_template_part' },
			};
			const setInserterOpened = () => {};

			expect( getSettings( state, setInserterOpened ) ).toEqual( {
				outlineMode: true,
				key: 'value',
				focusMode: true,
				hasFixedToolbar: true,
				keepCaretInsideBlock: false,
				__experimentalSetIsInserterOpened: setInserterOpened,
				__experimentalReusableBlocks: [],
				mediaUpload: expect.any( Function ),
				__experimentalPreferPatternsOnRoot: false,
			} );
		} );
	} );

	describe( 'getHomeTemplateId', () => {
		it( 'returns the home template ID', () => {
			const state = { homeTemplateId: {} };
			expect( getHomeTemplateId( state ) ).toBe( state.homeTemplateId );
		} );
	} );

	describe( 'getEditedPostId', () => {
		it( 'returns the template ID', () => {
			const state = { editedPost: { id: 10 } };
			expect( getEditedPostId( state ) ).toBe( 10 );
		} );
	} );

	describe( 'getEditedPostType', () => {
		it( 'returns the template type', () => {
			const state = { editedPost: { type: 'wp_template' } };
			expect( getEditedPostType( state ) ).toBe( 'wp_template' );
		} );
	} );

	describe( 'getPage', () => {
		it( 'returns the page object', () => {
			const page = {};
			const state = { editedPost: { page } };
			expect( getPage( state ) ).toBe( page );
		} );
	} );

	describe( 'getNavigationPanelActiveMenu', () => {
		it( 'returns the current navigation menu', () => {
			const state = {
				navigationPanel: { menu: 'test-menu', isOpen: false },
			};
			expect( getNavigationPanelActiveMenu( state ) ).toBe( 'test-menu' );
		} );
	} );

	describe( 'isNavigationOpened', () => {
		it( 'returns the navigation panel isOpened state', () => {
			const state = {
				navigationPanel: { menu: 'test-menu', isOpen: false },
			};
			expect( isNavigationOpened( state ) ).toBe( false );
			state.navigationPanel.isOpen = true;
			expect( isNavigationOpened( state ) ).toBe( true );
		} );
	} );

	describe( 'isInserterOpened', () => {
		it( 'returns the block inserter panel isOpened state', () => {
			const state = {
				blockInserterPanel: true,
			};
			expect( isInserterOpened( state ) ).toBe( true );
			state.blockInserterPanel = false;
			expect( isInserterOpened( state ) ).toBe( false );
		} );
	} );

	describe( 'isListViewOpened', () => {
		it( 'returns the list view panel isOpened state', () => {
			const state = {
				listViewPanel: true,
			};
			expect( isListViewOpened( state ) ).toBe( true );
			state.listViewPanel = false;
			expect( isListViewOpened( state ) ).toBe( false );
		} );
	} );
} );
