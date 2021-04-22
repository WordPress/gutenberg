/**
 * Internal dependencies
 */
import { getNavigationPostForMenu } from '../resolvers';
import { resolveMenuItems, dispatch } from '../controls';
import {
	NAVIGATION_POST_KIND,
	NAVIGATION_POST_POST_TYPE,
} from '../../constants';

import { buildNavigationPostId } from '../utils';

// Mock createBlock to avoid creating block in test environment
jest.mock( '@wordpress/blocks', () => {
	const blocks = jest.requireActual( '@wordpress/blocks' );
	let id = 0;

	return {
		...blocks,
		createBlock( name, attributes, innerBlocks ) {
			return {
				clientId: `client-id-${ id++ }`,
				name,
				attributes,
				innerBlocks,
			};
		},
	};
} );

describe( 'getNavigationPostForMenu', () => {
	it( 'returns early when a menuId is not provided', () => {
		const generator = getNavigationPostForMenu( null );
		expect( generator.next().value ).toBeUndefined();
		expect( generator.next().done ).toBe( true );
	} );

	it( 'gets navigation post for menu id', () => {
		const menuId = 123;

		const generator = getNavigationPostForMenu( menuId );

		const id = buildNavigationPostId( menuId );
		const stubPost = {
			id,
			slug: id,
			status: 'draft',
			type: 'page',
			blocks: [],
			meta: {
				menuId,
			},
		};

		// Create stub post.
		expect( generator.next().value ).toEqual(
			dispatch(
				'core',
				'receiveEntityRecords',
				NAVIGATION_POST_KIND,
				NAVIGATION_POST_POST_TYPE,
				stubPost,
				{ id: stubPost.id },
				false
			)
		);

		// Dispatch startResolution.
		expect( generator.next().value ).toEqual(
			dispatch( 'core', 'startResolution', 'getEntityRecord', [
				NAVIGATION_POST_KIND,
				NAVIGATION_POST_POST_TYPE,
				stubPost.id,
			] )
		);

		expect( generator.next().value ).toEqual( resolveMenuItems( menuId ) );

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
				parent: 0,
				classes: [ 'menu', 'classes' ],
				xfn: [ 'nofollow' ],
				description: 'description',
				attr_title: 'link title',
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
				parent: 0,
				classes: [],
				xfn: [],
				description: '',
				attr_title: '',
				target: '_blank',
			},
		];

		expect( generator.next( menuItems ).value ).toEqual( {
			type: 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
			postId: stubPost.id,
			mapping: {
				100: expect.stringMatching( /client-id-\d+/ ),
				101: expect.stringMatching( /client-id-\d+/ ),
			},
		} );

		const navigationBlockStubPost = {
			id,
			slug: id,
			status: 'draft',
			type: 'page',
			blocks: [
				{
					attributes: {
						orientation: 'vertical',
					},
					clientId: expect.stringMatching( /client-id-\d+/ ),
					innerBlocks: [
						{
							attributes: {
								label: 'wp.com',
								url: 'http://wp.com',
								className: 'menu classes',
								rel: 'nofollow',
								description: 'description',
								title: 'link title',
							},
							clientId: 'client-id-0',
							innerBlocks: [],
							name: 'core/navigation-link',
						},
						{
							attributes: {
								label: 'wp.org',
								url: 'http://wp.org',
								className: '',
								rel: '',
								description: '',
								title: '',
								opensInNewTab: true,
							},
							clientId: 'client-id-1',
							innerBlocks: [],
							name: 'core/navigation-link',
						},
					],
					name: 'core/navigation',
				},
			],
			meta: {
				menuId,
			},
		};

		expect( generator.next().value ).toEqual(
			dispatch(
				'core',
				'receiveEntityRecords',
				NAVIGATION_POST_KIND,
				NAVIGATION_POST_POST_TYPE,
				navigationBlockStubPost,
				{ id: navigationBlockStubPost.id },
				false
			)
		);

		expect( generator.next().value ).toEqual(
			dispatch( 'core', 'finishResolution', 'getEntityRecord', [
				NAVIGATION_POST_KIND,
				NAVIGATION_POST_POST_TYPE,
				stubPost.id,
			] )
		);

		expect( generator.next().done ).toBe( true );
	} );
} );
