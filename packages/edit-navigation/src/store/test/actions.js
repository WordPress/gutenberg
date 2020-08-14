/**
 * Internal dependencies
 */
import { createMissingMenuItems } from '../actions';
import {
	getNavigationPostForMenu,
	isProcessingPost,
	resolveMenuItems,
	dispatch,
	apiFetch,
} from '../controls';
import { menuItemsQuery } from '../utils';

describe( 'createMissingMenuItems', () => {
	it( 'createMissingMenuItems', () => {
		const post = {
			id: 1,
			meta: {
				menuId: 100,
			},
			blocks: [
				{
					clientId: '123',
					innerBlock: { a: 'b' },
				},
			],
		};

		const menuItemToClientIdMapping = {};

		const action = createMissingMenuItems( post );

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

		expect( action.next( post ).value ).toEqual( {
			type: 'GET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
			postId: post.id,
		} );

		expect( action.next( menuItemToClientIdMapping ).value ).toEqual(
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

		expect(
			action.next( {
				id: post.meta.menuId,
			} ).value
		).toEqual( resolveMenuItems( post.meta.menuId ) );

		expect(
			action.next( [
				{
					id: 101,
				},
			] ).value
		).toEqual(
			dispatch(
				'core',
				'receiveEntityRecords',
				'root',
				'menuItem',
				[ { id: 101 }, { id: post.meta.menuId } ],
				menuItemsQuery( post.meta.menuId ),
				false
			)
		);
	} );
} );
