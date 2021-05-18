/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import {
	createMissingMenuItems,
	saveNavigationPost,
	setSelectedMenuId,
} from '../actions';
import {
	resolveMenuItems,
	getMenuItemToClientIdMapping,
	dispatch,
	select,
	apiFetch,
} from '../controls';
import { menuItemsQuery, computeCustomizedAttribute } from '../utils';
import {
	NAVIGATION_POST_KIND,
	NAVIGATION_POST_POST_TYPE,
} from '../../constants';

jest.mock( '../utils', () => {
	const utils = jest.requireActual( '../utils' );
	// Mock serializeProcessing to always return the callback for easier testing and less boilerplate.
	utils.serializeProcessing = ( callback ) => callback;
	return utils;
} );

describe( 'createMissingMenuItems', () => {
	it( 'creates a missing menu for navigation block', () => {
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
					innerBlocks: [],
					isValid: true,
					name: 'core/navigation',
				},
			],
		};

		const mapping = {};

		const menuItemPlaceholder = {
			id: 87,
			title: {
				raw: 'Placeholder',
				rendered: 'Placeholder',
			},
		};

		const menuItems = [];

		const action = createMissingMenuItems( post );

		expect( action.next( post ).value ).toEqual(
			getMenuItemToClientIdMapping( post.id )
		);

		expect( action.next( mapping ).value ).toEqual(
			apiFetch( {
				path: `/__experimental/menu-items`,
				method: 'POST',
				data: {
					title: 'Placeholder',
					url: 'Placeholder',
					menu_order: 0,
				},
			} )
		);

		expect( action.next( menuItemPlaceholder ).value ).toEqual(
			resolveMenuItems( post.meta.menuId )
		);

		expect( action.next( menuItems ).value ).toEqual(
			dispatch(
				'core',
				'receiveEntityRecords',
				'root',
				'menuItem',
				[ ...menuItems, menuItemPlaceholder ],
				menuItemsQuery( post.meta.menuId ),
				false
			)
		);

		expect( action.next().value ).toEqual( {
			type: 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
			postId: post.id,
			mapping: {
				87: 'navigation-block-client-id',
			},
		} );

		expect( action.next( [] ).done ).toBe( true );
	} );

	it( 'creates a missing menu for navigation link block', () => {
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
							attributes: {
								label: 'wp.org',
								opensInNewTab: false,
								url: 'http://wp.org',
							},
							clientId: 'navigation-link-block-client-id-1',
							innerBlocks: [],
							isValid: true,
							name: 'core/navigation-link',
						},
						{
							attributes: {
								label: 'wp.com',
								opensInNewTab: false,
								url: 'http://wp.com',
							},
							clientId: 'navigation-link-block-client-id-2',
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

		const mapping = {
			87: 'navigation-block-client-id',
			100: 'navigation-link-block-client-id-1',
		};

		const menuItemPlaceholder = {
			id: 101,
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

		const action = createMissingMenuItems( post );

		expect( action.next( post ).value ).toEqual(
			getMenuItemToClientIdMapping( post.id )
		);

		expect( action.next( mapping ).value ).toEqual(
			apiFetch( {
				path: `/__experimental/menu-items`,
				method: 'POST',
				data: {
					title: 'Placeholder',
					url: 'Placeholder',
					menu_order: 0,
				},
			} )
		);

		expect( action.next( menuItemPlaceholder ).value ).toEqual(
			resolveMenuItems( post.meta.menuId )
		);

		expect( action.next( menuItems ).value ).toEqual(
			dispatch(
				'core',
				'receiveEntityRecords',
				'root',
				'menuItem',
				[ ...menuItems, menuItemPlaceholder ],
				menuItemsQuery( post.meta.menuId ),
				false
			)
		);

		expect( action.next().value ).toEqual( {
			type: 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
			postId: post.id,
			mapping: {
				87: 'navigation-block-client-id',
				100: 'navigation-link-block-client-id-1',
				101: 'navigation-link-block-client-id-2',
			},
		} );

		expect( action.next( [] ).done ).toBe( true );
	} );
} );

describe( 'saveNavigationPost', () => {
	it( 'converts all the blocks into menu items and batch save them at once', () => {
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
							attributes: {
								label: 'wp.org',
								opensInNewTab: false,
								url: 'http://wp.org',
								className: '',
								rel: '',
								description: '',
								title: '',
							},
							clientId: 'navigation-link-block-client-id-1',
							innerBlocks: [],
							isValid: true,
							name: 'core/navigation-link',
						},
						{
							attributes: {
								label: 'wp.com',
								opensInNewTab: false,
								url: 'http://wp.com',
								className: '',
								rel: '',
								description: '',
								title: '',
							},
							clientId: 'navigation-link-block-client-id-2',
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
				classes: [],
				xfn: [],
				description: '',
				attr_title: '',
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
				classes: [],
				xfn: [],
				description: '',
				attr_title: '',
			},
		];

		const mapping = {
			100: 'navigation-link-block-client-id-1',
			101: 'navigation-link-block-client-id-2',
		};

		const action = saveNavigationPost( post );

		expect( action.next().value ).toEqual(
			resolveMenuItems( post.meta.menuId )
		);

		expect( action.next( menuItems ).value ).toEqual(
			getMenuItemToClientIdMapping( post.id )
		);

		expect( action.next( mapping ).value ).toEqual(
			dispatch( 'core', 'saveEditedEntityRecord', 'root', 'menu', 1 )
		);
		expect( action.next( { id: 1 } ).value ).toEqual(
			select( 'core', 'getLastEntitySaveError', 'root', 'menu', 1 )
		);

		expect( action.next().value ).toEqual(
			apiFetch( {
				path: '/__experimental/customizer-nonces/get-save-nonce',
			} )
		);

		const batchSaveApiFetch = action.next( {
			nonce: 'nonce',
			stylesheet: 'stylesheet',
		} ).value;

		expect( batchSaveApiFetch.request.body.get( 'customized' ) ).toEqual(
			computeCustomizedAttribute(
				post.blocks[ 0 ].innerBlocks,
				post.meta.menuId,
				{
					'navigation-link-block-client-id-1': menuItems[ 0 ],
					'navigation-link-block-client-id-2': menuItems[ 1 ],
				}
			)
		);

		expect( action.next( { success: true } ).value ).toEqual(
			dispatch(
				'core',
				'receiveEntityRecords',
				NAVIGATION_POST_KIND,
				NAVIGATION_POST_POST_TYPE,
				[ post ],
				undefined
			)
		);

		expect( action.next().value ).toEqual(
			dispatch(
				noticesStore,
				'createSuccessNotice',
				__( 'Navigation saved.' ),
				{
					type: 'snackbar',
				}
			)
		);
	} );

	it( 'handles an error from the batch API and show error notifications', () => {
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
							attributes: {
								label: 'wp.org',
								opensInNewTab: false,
								url: 'http://wp.org',
								className: '',
								rel: '',
								description: '',
								title: '',
							},
							clientId: 'navigation-link-block-client-id-1',
							innerBlocks: [],
							isValid: true,
							name: 'core/navigation-link',
						},
						{
							attributes: {
								label: 'wp.com',
								opensInNewTab: false,
								url: 'http://wp.com',
								className: '',
								rel: '',
								description: '',
								title: '',
							},
							clientId: 'navigation-link-block-client-id-2',
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
				classes: [],
				xfn: [],
				description: '',
				attr_title: '',
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
				classes: [],
				xfn: [],
				description: '',
				attr_title: '',
			},
		];

		const mapping = {
			100: 'navigation-link-block-client-id-1',
			101: 'navigation-link-block-client-id-2',
		};

		const action = saveNavigationPost( post );

		expect( action.next().value ).toEqual(
			resolveMenuItems( post.meta.menuId )
		);

		expect( action.next( menuItems ).value ).toEqual(
			getMenuItemToClientIdMapping( post.id )
		);

		expect( action.next( mapping ).value ).toEqual(
			dispatch( 'core', 'saveEditedEntityRecord', 'root', 'menu', 1 )
		);

		expect( action.next( { id: 1 } ).value ).toEqual(
			select( 'core', 'getLastEntitySaveError', 'root', 'menu', 1 )
		);

		expect( action.next().value ).toEqual(
			apiFetch( {
				path: '/__experimental/customizer-nonces/get-save-nonce',
			} )
		);

		const batchSaveApiFetch = action.next( {
			nonce: 'nonce',
			stylesheet: 'stylesheet',
		} ).value;

		expect( batchSaveApiFetch.request.body.get( 'customized' ) ).toEqual(
			computeCustomizedAttribute(
				post.blocks[ 0 ].innerBlocks,
				post.meta.menuId,
				{
					'navigation-link-block-client-id-1': menuItems[ 0 ],
					'navigation-link-block-client-id-2': menuItems[ 1 ],
				}
			)
		);

		expect(
			action.next( { success: false, data: { message: 'Test Message' } } )
				.value
		).toEqual(
			dispatch(
				noticesStore,
				'createErrorNotice',
				__( "Unable to save: 'Test Message'" ),
				{
					type: 'snackbar',
				}
			)
		);
	} );

	it( 'handles an error from the entity and show error notifications', () => {
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
							attributes: {
								label: 'wp.org',
								opensInNewTab: false,
								url: 'http://wp.org',
								className: '',
								rel: '',
								description: '',
								title: '',
							},
							clientId: 'navigation-link-block-client-id-1',
							innerBlocks: [],
							isValid: true,
							name: 'core/navigation-link',
						},
						{
							attributes: {
								label: 'wp.com',
								opensInNewTab: false,
								url: 'http://wp.com',
								className: '',
								rel: '',
								description: '',
								title: '',
							},
							clientId: 'navigation-link-block-client-id-2',
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
				classes: [],
				xfn: [],
				description: '',
				attr_title: '',
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
				classes: [],
				xfn: [],
				description: '',
				attr_title: '',
			},
		];

		const mapping = {
			100: 'navigation-link-block-client-id-1',
			101: 'navigation-link-block-client-id-2',
		};

		const action = saveNavigationPost( post );

		expect( action.next().value ).toEqual(
			resolveMenuItems( post.meta.menuId )
		);

		expect( action.next( menuItems ).value ).toEqual(
			getMenuItemToClientIdMapping( post.id )
		);

		expect( action.next( mapping ).value ).toEqual(
			dispatch( 'core', 'saveEditedEntityRecord', 'root', 'menu', 1 )
		);

		expect( action.next().value ).toEqual(
			select( 'core', 'getLastEntitySaveError', 'root', 'menu', 1 )
		);

		expect( action.next( { message: 'Test Message 2' } ).value ).toEqual(
			dispatch(
				noticesStore,
				'createErrorNotice',
				__( "Unable to save: 'Test Message 2'" ),
				{
					type: 'snackbar',
				}
			)
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
