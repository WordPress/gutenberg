/**
 * Internal dependencies
 */
import {
	buildNavigationPostId,
	menuItemsQuery,
	serializeProcessing,
	computeCustomizedAttribute,
	mapBlockAttributeToMenuItemField,
	mapMenuItemFieldToBlockAttribute,
} from '../utils';
import {
	isProcessingPost,
	getNavigationPostForMenu,
	getPendingActions,
} from '../controls';

describe( 'buildNavigationPostId', () => {
	it( 'build navigation post id', () => {
		expect( buildNavigationPostId( 123 ) ).toBe( 'navigation-post-123' );
	} );
} );

describe( 'menuItemsQuery', () => {
	it( 'build menu items query', () => {
		expect( menuItemsQuery( 123 ) ).toEqual( { menus: 123, per_page: -1 } );
	} );
} );

describe( 'serializeProcessing', () => {
	it( 'calls the callback', () => {
		const callback = jest.fn( function* () {} );

		const post = {
			id: 'navigation-post-123',
			meta: {
				menuId: 123,
			},
		};

		const generator = serializeProcessing( callback );

		const iterator = generator( post );

		expect( iterator.next().value ).toEqual( isProcessingPost( post.id ) );

		expect( iterator.next( false ).value ).toEqual( {
			type: 'POP_PENDING_ACTION',
			postId: post.id,
			action: callback,
		} );

		expect( iterator.next().value ).toEqual( {
			type: 'START_PROCESSING_POST',
			postId: post.id,
		} );

		expect( iterator.next().value ).toEqual(
			getNavigationPostForMenu( post.meta.menuId )
		);

		expect( iterator.next( post ).value ).toEqual( {
			type: 'FINISH_PROCESSING_POST',
			postId: post.id,
			action: callback,
		} );

		expect( callback ).toHaveBeenCalledWith( post );

		expect( iterator.next().value ).toEqual( getPendingActions( post.id ) );

		expect( iterator.next( [] ).done ).toBe( true );
	} );

	it( 'handles and pends the calls if there is pending call', () => {
		const callback = jest.fn( function* () {} );

		const post = {
			id: 'navigation-post-123',
			meta: {
				menuId: 123,
			},
		};

		const generator = serializeProcessing( callback );

		const iterator = generator( post );

		expect( iterator.next().value ).toEqual( isProcessingPost( post.id ) );

		expect( iterator.next( true ).value ).toEqual( {
			type: 'ENQUEUE_AFTER_PROCESSING',
			postId: post.id,
			action: callback,
		} );

		expect( iterator.next().value ).toEqual( { status: 'pending' } );

		expect( iterator.next().done ).toBe( true );
	} );

	it( 'handles pending actions', () => {
		const callback1 = jest.fn( function* () {} );
		const callback2 = jest.fn( function* () {} );
		const callback3 = jest.fn( function* () {} );

		const post = {
			id: 'navigation-post-123',
			meta: {
				menuId: 123,
			},
		};

		const generator = serializeProcessing( callback1 );

		const iterator = generator( post );

		function testIterator( pendingActions ) {
			const [ callback ] = pendingActions;

			expect( iterator.next( pendingActions ).value ).toEqual(
				isProcessingPost( post.id )
			);

			expect( iterator.next( false ).value ).toEqual( {
				type: 'POP_PENDING_ACTION',
				postId: post.id,
				action: callback,
			} );

			expect( iterator.next().value ).toEqual( {
				type: 'START_PROCESSING_POST',
				postId: post.id,
			} );

			expect( iterator.next().value ).toEqual(
				getNavigationPostForMenu( post.meta.menuId )
			);

			expect( iterator.next( post ).value ).toEqual( {
				type: 'FINISH_PROCESSING_POST',
				postId: post.id,
				action: callback,
			} );

			expect( callback ).toHaveBeenCalledWith( post );

			expect( iterator.next().value ).toEqual(
				getPendingActions( post.id )
			);
		}

		testIterator( [ callback1 ] );
		testIterator( [ callback2, callback3 ] );
		testIterator( [ callback3 ] );

		expect( iterator.next( [] ).done ).toBe( true );
	} );

	it( 'handles errors in the callback', () => {
		const callback = jest.fn( function* () {
			throw new Error( 'error' );
		} );

		const post = {
			id: 'navigation-post-123',
			meta: {
				menuId: 123,
			},
		};

		const generator = serializeProcessing( callback );

		expect( () => {
			const iterator = generator( post );

			expect( iterator.next().value ).toEqual(
				isProcessingPost( post.id )
			);

			expect( iterator.next( false ).value ).toEqual( {
				type: 'POP_PENDING_ACTION',
				postId: post.id,
				action: callback,
			} );

			expect( iterator.next().value ).toEqual( {
				type: 'START_PROCESSING_POST',
				postId: post.id,
			} );

			expect( iterator.next().value ).toEqual(
				getNavigationPostForMenu( post.meta.menuId )
			);

			expect( iterator.next( post ).value ).toEqual( {
				type: 'FINISH_PROCESSING_POST',
				postId: post.id,
				action: callback,
			} );

			expect( callback ).toHaveBeenCalledWith( post );

			expect( iterator.next().value ).toEqual(
				getPendingActions( post.id )
			);

			expect( iterator.next( [] ).done ).toBe( true );
		} ).toThrow( new Error( 'error' ) );
	} );
} );

describe( 'computeCustomizedAttribute', () => {
	it( 'computes customized attributes', () => {
		const blocks = [
			{
				attributes: {
					label: 'wp.org',
					opensInNewTab: false,
					url: 'http://wp.org',
					className: 'block classnames',
					rel: 'external',
				},
				clientId: 'navigation-link-block-client-id-1',
				innerBlocks: [],
				isValid: true,
				name: 'core/navigation-link',
			},
			{
				attributes: {
					label: 'wp.com',
					opensInNewTab: true,
					url: 'http://wp.com',
					className: '',
					rel: '',
				},
				clientId: 'navigation-link-block-client-id-2',
				innerBlocks: [],
				isValid: true,
				name: 'core/navigation-link',
			},
			{
				attributes: {
					id: 678,
					label: 'Page Example',
					opensInNewTab: false,
					url: 'https://localhost:8889/page-example/',
					className: '',
					rel: '',
					type: 'page',
					kind: 'post-type',
				},
				clientId: 'navigation-link-block-client-id-3',
				innerBlocks: [],
				isValid: true,
				name: 'core/navigation-link',
			},
		];

		const menuId = 123;

		const menuItemsByClientId = {
			'navigation-link-block-client-id-1': {
				id: 100,
				title: {
					raw: 'wp.com',
					rendered: 'wp.com',
				},
				url: 'http://wp.com',
				menu_order: 1,
				menus: [ 1 ],
				object: 'custom',
			},
			'navigation-link-block-client-id-2': {
				id: 101,
				title: {
					raw: 'wp.org',
					rendered: 'wp.org',
				},
				url: 'http://wp.org',
				menu_order: 2,
				menus: [ 1 ],
				object: 'custom',
			},
			'navigation-link-block-client-id-3': {
				id: 102,
				title: {
					raw: 'Page Example',
					rendered: 'Page Example',
				},
				url: 'https://wordpress.org',
				menu_order: 3,
				menus: [ 1 ],
				object: 'page',
				object_id: 678,
				type: 'post_type',
			},
		};

		expect(
			JSON.parse(
				computeCustomizedAttribute(
					blocks,
					menuId,
					menuItemsByClientId
				)
			)
		).toEqual( {
			'nav_menu_item[100]': {
				_invalid: false,
				classes: [ 'block', 'classnames' ],
				id: 100,
				menu_item_parent: 0,
				menu_order: 1,
				nav_menu_term_id: 123,
				original_title: '',
				position: 1,
				status: 'publish',
				title: 'wp.org',
				object: 'custom',
				url: 'http://wp.org',
				xfn: [ 'external' ],
				target: '',
			},
			'nav_menu_item[101]': {
				_invalid: false,
				classes: [ '' ],
				id: 101,
				menu_item_parent: 0,
				menu_order: 2,
				nav_menu_term_id: 123,
				original_title: '',
				position: 2,
				status: 'publish',
				title: 'wp.com',
				object: 'custom',
				url: 'http://wp.com',
				xfn: [ '' ],
				target: '_blank',
			},
			'nav_menu_item[102]': {
				_invalid: false,
				classes: [ '' ],
				id: 102,
				menu_item_parent: 0,
				menu_order: 3,
				nav_menu_term_id: 123,
				original_title: '',
				position: 3,
				status: 'publish',
				title: 'Page Example',
				object: 'page', // equivalent: block.attributes.type
				object_id: 678, // equivalent: block.attributes.id
				type: 'post_type', // // equivalent: block.attributes.kind
				url: 'https://localhost:8889/page-example/',
				xfn: [ '' ],
				target: '',
			},
		} );
	} );
} );

describe( 'Mapping block attributes and menu item fields', () => {
	const blocks = [
		{
			attributes: {
				id: 100,
				type: 'page',
				kind: 'post-type',
			},
			clientId: 'navigation-link-block-client-id-1',
			innerBlocks: [],
			isValid: true,
			name: 'core/navigation-link',
		},
		{
			attributes: {
				id: 101,
				type: 'post',
				kind: 'post-type',
			},
			clientId: 'navigation-link-block-client-id-2',
			innerBlocks: [],
			isValid: true,
			name: 'core/navigation-link',
		},
		{
			attributes: {
				id: 102,
				type: 'category',
				kind: 'taxonomy',
			},
			clientId: 'navigation-link-block-client-id-3',
			innerBlocks: [],
			isValid: true,
			name: 'core/navigation-link',
		},
		{
			attributes: {
				id: 103,
				type: 'tag',
				kind: 'taxonomy',
			},
			clientId: 'navigation-link-block-client-id-4',
			innerBlocks: [],
			isValid: true,
			name: 'core/navigation-link',
		},
		{
			attributes: {
				type: 'custom',
			},
			clientId: 'navigation-link-block-client-id-5',
			innerBlocks: [],
			isValid: true,
			name: 'core/navigation-link',
		},
	];

	const menuItems = [
		{
			object_id: 100,
			object: 'page',
			type: 'post_type',
		},
		{
			object_id: 101,
			object: 'post',
			type: 'post_type',
		},
		{
			object_id: 102,
			object: 'category',
			type: 'taxonomy',
		},
		{
			object_id: 103,
			object: 'tag',
			type: 'taxonomy',
		},
		{
			object: 'custom',
			type: 'custom',
		},
	];

	const blockAttrs = blocks.map( ( block ) => block.attributes );

	describe( 'mapBlockAttributeToMenuItemField', () => {
		it( 'maps block attributes to equivalent menu item fields', () => {
			const expected = blockAttrs.map( ( attrs ) => {
				return Object.entries( attrs ).reduce(
					( acc, [ key, value ] ) => {
						acc = {
							...acc,
							...mapBlockAttributeToMenuItemField( key, value ),
						};
						return acc;
					},
					{}
				);
			} );
			expect( expected ).toEqual( menuItems );
		} );
	} );

	describe( 'mapMenuItemFieldToBlockAttribute', () => {
		it( 'maps menu item fields equivalent block attributes', () => {
			const expected = menuItems.map( ( attrs ) => {
				return Object.entries( attrs ).reduce(
					( acc, [ key, value ] ) => {
						acc = {
							...acc,
							...mapMenuItemFieldToBlockAttribute( key, value ),
						};
						return acc;
					},
					{}
				);
			} );
			expect( expected ).toEqual( blockAttrs );
		} );

		it( 'does not map id to object_id for "custom" block variation', () => {
			const customBlockVariationAttrs = {
				type: 'custom',
				id: 123456,
			};

			const actual = Object.entries( customBlockVariationAttrs ).reduce(
				( acc, [ key, value ] ) => {
					acc = {
						...acc,
						...mapMenuItemFieldToBlockAttribute( key, value ),
					};
					return acc;
				},
				{}
			);

			expect( actual ).toEqual( {
				object: 'custom',
				type: 'custom',
			} );

			expect( actual.id ).toBeUndefined();
		} );
	} );
} );
