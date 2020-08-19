/**
 * Internal dependencies
 */
import { createMissingMenuItems } from '../actions';
import {
	getNavigationPostForMenu,
	isProcessingPost,
	resolveMenuItems,
	getMenuItemToClientIdMapping,
	getPendingActions,
	dispatch,
	apiFetch,
} from '../controls';
import { menuItemsQuery } from '../utils';

describe( 'createMissingMenuItems', () => {
	it( 'create missing menu for navigation block', () => {
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

		// Entering `serializeProcessing`
		expect( action.next().value ).toEqual( isProcessingPost( post.id ) );
		expect( action.next( false ).value ).toEqual(
			expect.objectContaining( {
				type: 'POP_PENDING_ACTION',
				postId: post.id,
			} )
		);
		expect( action.next().value ).toEqual( {
			type: 'START_PROCESSING_POST',
			postId: post.id,
		} );
		expect( action.next().value ).toEqual(
			getNavigationPostForMenu( post.meta.menuId )
		);

		// Entering `createMissingMenuItems`
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

		// Exiting `serializeProcessing`
		expect( action.next().value ).toEqual(
			expect.objectContaining( {
				type: 'FINISH_PROCESSING_POST',
				postId: post.id,
			} )
		);
		expect( action.next().value ).toEqual( getPendingActions( post.id ) );
		expect( action.next( [] ).done ).toBe( true );
	} );

	it( 'create missing menu for navigation link block', () => {
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

		// Entering `serializeProcessing`
		expect( action.next().value ).toEqual( isProcessingPost( post.id ) );
		expect( action.next( false ).value ).toEqual(
			expect.objectContaining( {
				type: 'POP_PENDING_ACTION',
				postId: post.id,
			} )
		);
		expect( action.next().value ).toEqual( {
			type: 'START_PROCESSING_POST',
			postId: post.id,
		} );
		expect( action.next().value ).toEqual(
			getNavigationPostForMenu( post.meta.menuId )
		);

		// Entering `createMissingMenuItems`
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

		// Exiting `serializeProcessing`
		expect( action.next().value ).toEqual(
			expect.objectContaining( {
				type: 'FINISH_PROCESSING_POST',
				postId: post.id,
			} )
		);
		expect( action.next().value ).toEqual( getPendingActions( post.id ) );
		expect( action.next( [] ).done ).toBe( true );
	} );
} );
