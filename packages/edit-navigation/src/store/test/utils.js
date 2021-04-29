/**
 * Internal dependencies
 */
import {
	buildNavigationPostId,
	menuItemsQuery,
	serializeProcessing,
	computeCustomizedAttribute,
	blockAttributesToMenuItem,
	menuItemToBlockAttributes,
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
					type: 'custom',
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
					type: 'custom',
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
				original_title: '',
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
				original_title: '',
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
				original_title: '',
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
				object: 'custom',
				position: 1,
				status: 'publish',
				title: {
					raw: 'wp.org',
					rendered: 'wp.org',
				},
				url: 'http://wp.org',
				xfn: [ 'external' ],
				target: '',
				type: 'custom',
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
				title: {
					raw: 'wp.com',
					rendered: 'wp.com',
				},
				object: 'custom',
				url: 'http://wp.com',
				xfn: [ '' ],
				target: '_blank',
				type: 'custom',
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
				title: {
					raw: 'Page Example',
					rendered: 'Page Example',
				},
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
				label: 'Example Page',
				url: '/example-page/',
				description: 'Lorem ipsum dolor sit amet.',
				rel: 'friend met',
				className: 'my-custom-class-one my-custom-class-two',
				title: 'Example page link title attribute',
				id: 100,
				type: 'page',
				kind: 'post-type',
				opensInNewTab: true,
			},
			clientId: 'navigation-link-block-client-id-1',
			innerBlocks: [],
			isValid: true,
			name: 'core/navigation-link',
		},
		{
			attributes: {
				label: 'Example Post',
				url: '/example-post/',
				description: 'Consectetur adipiscing elit.',
				rel: 'friend',
				className: 'my-custom-class-one',
				title: 'Example post link title attribute',
				id: 101,
				type: 'post',
				kind: 'post-type',
				opensInNewTab: false,
			},
			clientId: 'navigation-link-block-client-id-2',
			innerBlocks: [],
			isValid: true,
			name: 'core/navigation-link',
		},
		{
			attributes: {
				label: 'Example Category',
				url: '/example-category/',
				description:
					'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				rel: '',
				className: '',
				title: '',
				id: 102,
				type: 'category',
				kind: 'taxonomy',
				opensInNewTab: true,
			},
			clientId: 'navigation-link-block-client-id-3',
			innerBlocks: [],
			isValid: true,
			name: 'core/navigation-link',
		},
		{
			attributes: {
				label: 'Example Tag',
				url: '/example-tag/',
				description: '',
				rel: '',
				className: '',
				title: '',
				id: 103,
				type: 'tag',
				kind: 'taxonomy',
				opensInNewTab: false,
			},
			clientId: 'navigation-link-block-client-id-4',
			innerBlocks: [],
			isValid: true,
			name: 'core/navigation-link',
		},
		{
			attributes: {
				label: 'Example Custom Link',
				url: 'https://wordpress.org',
				description: '',
				rel: '',
				className: '',
				title: '',
				type: 'custom',
				kind: 'custom',
				opensInNewTab: true,
			},
			clientId: 'navigation-link-block-client-id-5',
			innerBlocks: [],
			isValid: true,
			name: 'core/navigation-link',
		},
	];

	const menuItems = [
		{
			title: {
				raw: 'Example Page',
				rendered: 'Example Page',
			},
			url: '/example-page/',
			description: 'Lorem ipsum dolor sit amet.',
			xfn: [ 'friend', 'met' ],
			classes: [ 'my-custom-class-one', 'my-custom-class-two' ],
			attr_title: 'Example page link title attribute',
			object_id: 100,
			object: 'page',
			type: 'post_type',
			target: '_blank',
		},
		{
			title: {
				raw: 'Example Post',
				rendered: 'Example Post',
			},
			url: '/example-post/',
			description: 'Consectetur adipiscing elit.',
			xfn: [ 'friend' ],
			classes: [ 'my-custom-class-one' ],
			attr_title: 'Example post link title attribute',
			object_id: 101,
			object: 'post',
			type: 'post_type',
			target: '',
		},
		{
			title: {
				raw: 'Example Category',
				rendered: 'Example Category',
			},
			url: '/example-category/',
			description:
				'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
			xfn: [ '' ],
			classes: [ '' ],
			attr_title: '',
			object_id: 102,
			object: 'category',
			type: 'taxonomy',
			target: '_blank',
		},
		{
			title: {
				raw: 'Example Tag',
				rendered: 'Example Tag',
			},
			url: '/example-tag/',
			description: '',
			xfn: [ '' ],
			classes: [ '' ],
			attr_title: '',
			object_id: 103,
			object: 'tag',
			type: 'taxonomy',
			target: '',
		},
		{
			title: {
				raw: 'Example Custom Link',
				rendered: 'Example Custom Link',
			},
			url: 'https://wordpress.org',
			description: '',
			xfn: [ '' ],
			classes: [ '' ],
			attr_title: '',
			object: 'custom',
			type: 'custom',
			target: '_blank',
		},
	];

	const blockAttrs = blocks.map( ( block ) => block.attributes );

	describe( 'mapping block attributes to menu item fields', () => {
		it( 'maps block attributes to equivalent menu item fields', () => {
			const actual = blockAttrs.map( ( attrs ) =>
				blockAttributesToMenuItem( attrs )
			);

			expect( actual ).toEqual( menuItems );
		} );

		it( 'does not map block attribute "id" to menu item "object_id" field for custom (non-entity) links', () => {
			const customLinkBlockAttributes = {
				id: 123456, // added for test purposes only - should not occur.
				title: 'Example Custom Link',
				url: 'https://wordpress.org',
				description: '',
				xfn: [ '' ],
				classes: [ '' ],
				attr_title: '',
				object: 'custom',
				type: 'custom',
			};
			const actual = blockAttributesToMenuItem(
				customLinkBlockAttributes
			);

			expect( actual.object_id ).toBeUndefined();
		} );
	} );

	describe( 'mapping menu item fields to block attributes', () => {
		it( 'maps menu item fields to equivalent block attributes', () => {
			const actual = menuItems.map( ( fields ) =>
				menuItemToBlockAttributes( fields )
			);

			expect( actual ).toEqual( blockAttrs );
		} );

		it( 'does not map menu item "object_id" field to block attribute "id" for custom (non-entity) links', () => {
			const customLinkMenuItem = {
				title: 'Example Custom Link',
				url: 'https://wordpress.org',
				description: '',
				xfn: [ '' ],
				classes: [ '' ],
				attr_title: '',
				object_id: 123456, // added for test purposes.
				object: 'custom',
				type: 'custom',
				target: '_blank',
			};
			const actual = menuItemToBlockAttributes( customLinkMenuItem );

			expect( actual.id ).toBeUndefined();
		} );
	} );
} );
