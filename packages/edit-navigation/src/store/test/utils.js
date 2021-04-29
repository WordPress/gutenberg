/**
 * Internal dependencies
 */
import {
	buildNavigationPostId,
	menuItemsQuery,
	serializeProcessing,
	computeCustomizedAttribute,
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
				type: 'custom',
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
				type: 'custom',
				url: 'http://wp.com',
				xfn: [ '' ],
				target: '_blank',
			},
		} );
	} );
} );
