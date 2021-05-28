/**
 * WordPress dependencies
 */
import triggerApiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import controls, {
	apiFetch,
	getPendingActions,
	isProcessingPost,
	getMenuItemToClientIdMapping,
	getNavigationPostForMenu,
	resolveMenuItems,
	select,
	dispatch,
} from '../controls';
import { menuItemsQuery } from '../utils';
import { STORE_NAME } from '../constants';

// Mock it to prevent calling window.fetch in test environment
jest.mock( '@wordpress/api-fetch', () => jest.fn( ( request ) => request ) );

describe( 'apiFetch', () => {
	it( 'has the correct type and payload', () => {
		expect( apiFetch( { foo: 'bar' } ) ).toEqual( {
			type: 'API_FETCH',
			request: {
				foo: 'bar',
			},
		} );
	} );
} );

describe( 'getPendingActions', () => {
	it( 'has the correct type and payload', () => {
		expect( getPendingActions( 123 ) ).toEqual( {
			type: 'GET_PENDING_ACTIONS',
			postId: 123,
		} );
	} );
} );

describe( 'isProcessingPost', () => {
	it( 'has the correct type and payload', () => {
		expect( isProcessingPost( 123 ) ).toEqual( {
			type: 'IS_PROCESSING_POST',
			postId: 123,
		} );
	} );
} );

describe( 'getMenuItemToClientIdMapping', () => {
	it( 'has the correct type and payload', () => {
		expect( getMenuItemToClientIdMapping( 123 ) ).toEqual( {
			type: 'GET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
			postId: 123,
		} );
	} );
} );

describe( 'getNavigationPostForMenu', () => {
	it( 'has the correct type and payload', () => {
		expect( getNavigationPostForMenu( 123 ) ).toEqual( {
			type: 'SELECT',
			registryName: STORE_NAME,
			selectorName: 'getNavigationPostForMenu',
			args: [ 123 ],
		} );
	} );
} );

describe( 'resolveMenuItems', () => {
	it( 'has the correct type and payload', () => {
		expect( resolveMenuItems( 123 ) ).toEqual( {
			type: 'RESOLVE_MENU_ITEMS',
			query: menuItemsQuery( 123 ),
		} );
	} );
} );

describe( 'select', () => {
	it( 'has the correct type and payload', () => {
		expect(
			select( 'registryName', 'selectorName', 'arg1', 'arg2' )
		).toEqual( {
			type: 'SELECT',
			registryName: 'registryName',
			selectorName: 'selectorName',
			args: [ 'arg1', 'arg2' ],
		} );
	} );
} );

describe( 'dispatch', () => {
	it( 'has the correct type and payload', () => {
		expect(
			dispatch( 'registryName', 'actionName', 'arg1', 'arg2' )
		).toEqual( {
			type: 'DISPATCH',
			registryName: 'registryName',
			actionName: 'actionName',
			args: [ 'arg1', 'arg2' ],
		} );
	} );
} );

describe( 'controls', () => {
	it( 'triggers API_FETCH', () => {
		expect( controls.API_FETCH( { request: { foo: 'bar' } } ) ).toEqual( {
			foo: 'bar',
		} );

		expect( triggerApiFetch ).toHaveBeenCalledWith( { foo: 'bar' } );
	} );

	it( 'triggers SELECT', () => {
		const selector = jest.fn( () => 'value' );
		const registry = {
			select: jest.fn( () => ( {
				selectorName: selector,
			} ) ),
		};

		expect(
			controls.SELECT( registry )( {
				registryName: 'registryName',
				selectorName: 'selectorName',
				args: [ 'arg1', 'arg2' ],
			} )
		).toBe( 'value' );

		expect( registry.select ).toHaveBeenCalledWith( 'registryName' );
		expect( selector ).toHaveBeenCalledWith( 'arg1', 'arg2' );
	} );

	it( 'triggers GET_PENDING_ACTIONS', () => {
		const state = {
			processingQueue: {
				postId: {
					pendingActions: [ 'action1', 'action2' ],
				},
			},
		};
		const registry = {
			stores: {
				[ STORE_NAME ]: {
					store: {
						getState: jest.fn( () => state ),
					},
				},
			},
		};

		expect(
			controls.GET_PENDING_ACTIONS( registry )( { postId: 'postId' } )
		).toEqual( [ 'action1', 'action2' ] );

		expect(
			registry.stores[ STORE_NAME ].store.getState
		).toHaveBeenCalledTimes( 1 );

		expect(
			controls.GET_PENDING_ACTIONS( registry )( {
				postId: 'non-exist-post-id',
			} )
		).toEqual( [] );

		expect(
			registry.stores[ STORE_NAME ].store.getState
		).toHaveBeenCalledTimes( 2 );
	} );

	it( 'triggers IS_PROCESSING_POST', () => {
		const state = {
			processingQueue: {
				postId: {
					inProgress: true,
				},
			},
		};
		const registry = {
			stores: {
				[ STORE_NAME ]: {
					store: {
						getState: jest.fn( () => state ),
					},
				},
			},
		};

		expect(
			controls.IS_PROCESSING_POST( registry )( { postId: 'postId' } )
		).toBe( true );

		expect(
			registry.stores[ STORE_NAME ].store.getState
		).toHaveBeenCalledTimes( 1 );

		expect(
			controls.IS_PROCESSING_POST( registry )( {
				postId: 'non-exist-post-id',
			} )
		).toBe( false );

		expect(
			registry.stores[ STORE_NAME ].store.getState
		).toHaveBeenCalledTimes( 2 );
	} );

	it( 'triggers GET_MENU_ITEM_TO_CLIENT_ID_MAPPING', () => {
		const state = {
			mapping: {
				postId: {
					123: 'client-id',
				},
			},
		};
		const registry = {
			stores: {
				[ STORE_NAME ]: {
					store: {
						getState: jest.fn( () => state ),
					},
				},
			},
		};

		expect(
			controls.GET_MENU_ITEM_TO_CLIENT_ID_MAPPING( registry )( {
				postId: 'postId',
			} )
		).toEqual( {
			123: 'client-id',
		} );

		expect(
			registry.stores[ STORE_NAME ].store.getState
		).toHaveBeenCalledTimes( 1 );

		expect(
			controls.GET_MENU_ITEM_TO_CLIENT_ID_MAPPING( registry )( {
				postId: 'non-exist-post-id',
			} )
		).toEqual( {} );

		expect(
			registry.stores[ STORE_NAME ].store.getState
		).toHaveBeenCalledTimes( 2 );
	} );

	it( 'triggers DISPATCH', () => {
		const dispatcher = jest.fn();
		const registry = {
			dispatch: jest.fn( () => ( {
				actionName: dispatcher,
			} ) ),
		};

		controls.DISPATCH( registry )( {
			registryName: 'registryName',
			actionName: 'actionName',
			args: [ 'arg1', 'arg2' ],
		} );

		expect( registry.dispatch ).toHaveBeenCalledWith( 'registryName' );
		expect( dispatcher ).toHaveBeenCalledWith( 'arg1', 'arg2' );
	} );

	it( 'triggers RESOLVE_MENU_ITEMS', () => {
		const getMenuItems = jest.fn( () => [ 'menu-1', 'menu-2' ] );
		const registry = {
			resolveSelect: jest.fn( () => ( {
				getMenuItems,
			} ) ),
		};

		expect(
			controls.RESOLVE_MENU_ITEMS( registry )( {
				query: 'query',
			} )
		).toEqual( [ 'menu-1', 'menu-2' ] );

		expect( registry.resolveSelect ).toHaveBeenCalledWith( 'core' );
		expect( getMenuItems ).toHaveBeenCalledTimes( 1 );
	} );
} );
