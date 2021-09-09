/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );

/**
 * Internal dependencies
 */
import {
	createMissingMenuItems,
	createPlaceholderMenuItem,
	setSelectedMenuId,
} from '../actions';
import { menuItemsQuery } from '../utils';

jest.mock( '../utils', () => {
	const utils = jest.requireActual( '../utils' );
	// Mock serializeProcessing to always return the callback for easier testing and less boilerplate.
	utils.serializeProcessing = ( callback ) => callback;
	return utils;
} );

describe( 'createMissingMenuItems', () => {
	it( 'creates a missing menu for navigation block', async () => {
		const post = {
			id: 'navigation-post-1',
			slug: 'navigation-post-1',
			type: 'page',
			meta: {
				menuId: 1,
			},
			blocks: [
				{
					attributes: { showSubmenuIcon: true },
					clientId: 'navigation-block-client-id',
					innerBlocks: [
						{
							attributes: {},
							clientId: 'navigation-block-client-id',
							innerBlocks: [],
							isValid: true,
							name: 'core/navigation-link',
						},
						{
							attributes: {},
							clientId: 'navigation-block-client-id2',
							innerBlocks: [],
							isValid: true,
							name: 'core/navigation-link',
						},
					],
					isValid: true,
					name: 'core/navigation',
				},
			],
		};

		const menuItemPlaceholder = {
			id: 87,
			title: {
				raw: 'Placeholder',
				rendered: 'Placeholder',
			},
		};

		const dispatch = jest
			.fn()
			.mockReturnValueOnce( {} )
			.mockReturnValueOnce( menuItemPlaceholder )
			.mockReturnValueOnce( { ...menuItemPlaceholder, id: 88 } );
		const registryDispatch = {
			__unstableAcquireStoreLock: jest.fn(),
			__unstableReleaseStoreLock: jest.fn(),
		};
		const registry = {
			dispatch: jest.fn( () => registryDispatch ),
		};

		await createMissingMenuItems( post )( { registry, dispatch } );

		expect( dispatch ).toHaveBeenCalledWith( {
			type: 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
			postId: post.id,
			mapping: {
				87: 'navigation-block-client-id',
				88: 'navigation-block-client-id2',
			},
		} );
	} );
} );

describe( 'createPlaceholderMenuItem', () => {
	beforeEach( async () => {
		apiFetch.mockReset();
	} );

	it( 'creates a missing menu for navigation link block', async () => {
		const menuItemPlaceholder = {
			id: 102,
			title: {
				raw: 'Placeholder',
				rendered: 'Placeholder',
			},
		};
		const menuItems = [
			{
				id: 100,
				title: {
					raw: 'wp.com',
					rendered: 'wp.com',
				},
				url: 'http://wp.com',
				menu_order: 1,
				menus: [ 1 ],
			},
			{
				id: 101,
				title: {
					raw: 'wp.org',
					rendered: 'wp.org',
				},
				url: 'http://wp.org',
				menu_order: 2,
				menus: [ 1 ],
			},
		];

		// Provide response
		apiFetch.mockImplementation( () => menuItemPlaceholder );

		const registryDispatch = {
			receiveEntityRecords: jest.fn(),
		};
		const registry = { dispatch: jest.fn( () => registryDispatch ) };
		const dispatch = jest.fn( () => menuItems );

		await createPlaceholderMenuItem(
			{
				id: 101,
				title: {
					raw: 'wp.org',
					rendered: 'wp.org',
				},
				url: 'http://wp.org',
				menu_order: 2,
				menus: [ 1 ],
			},
			199
		)( { registry, dispatch } );

		expect( registryDispatch.receiveEntityRecords ).toHaveBeenCalledWith(
			'root',
			'menuItem',
			[ ...menuItems, menuItemPlaceholder ],
			menuItemsQuery( 199 ),
			false
		);
	} );
} );

describe( 'setSelectedMenuId', () => {
	it( 'should return the SET_SELECTED_MENU_ID action', () => {
		const menuId = 1;
		expect( setSelectedMenuId( menuId ) ).toEqual( {
			type: 'SET_SELECTED_MENU_ID',
			menuId,
		} );
	} );
} );
