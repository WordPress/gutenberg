/**
 * Internal dependencies
 */
import {
	buildNavigationPostId,
	menuItemsQuery,
	blockAttributesToMenuItem,
	menuItemToBlockAttributes,
} from '../utils';

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

describe( 'Mapping block attributes and menu item fields', () => {
	const blocksToMenuItems = [
		{
			block: {
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
			menuItem: {
				title: 'Example Page',
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
		},
		{
			block: {
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
			menuItem: {
				title: 'Example Post',
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
		},
		{
			block: {
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
			menuItem: {
				title: 'Example Category',
				url: '/example-category/',
				description:
					'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				object_id: 102,
				object: 'category',
				type: 'taxonomy',
				target: '_blank',
			},
		},
		{
			block: {
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
			menuItem: {
				title: 'Example Tag',
				url: '/example-tag/',
				object_id: 103,
				object: 'post_tag',
				type: 'taxonomy',
				target: '',
			},
		},
		{
			block: {
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
			menuItem: {
				title: 'Example Custom Link',
				url: 'https://wordpress.org',
				object: 'custom',
				type: 'custom',
				target: '_blank',
			},
		},
	];

	const menuItemsToBlockAttrs = [
		{
			menuItem: {
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
			blockAttrs: {
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
		},
		{
			menuItem: {
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
			blockAttrs: {
				label: 'Example Post',
				url: '/example-post/',
				description: 'Consectetur adipiscing elit.',
				rel: 'friend',
				className: 'my-custom-class-one',
				title: 'Example post link title attribute',
				id: 101,
				type: 'post',
				kind: 'post-type',
			},
		},
		{
			menuItem: {
				title: {
					raw: 'Example Category',
					rendered: 'Example Category',
				},
				url: '/example-category/',
				description:
					'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				xfn: [ '   ', '   ' ],
				classes: [ '   ', ' ' ],
				attr_title: '',
				object_id: 102,
				object: 'category',
				type: 'taxonomy',
				target: '_blank',
			},
			blockAttrs: {
				label: 'Example Category',
				url: '/example-category/',
				description:
					'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				id: 102,
				type: 'category',
				kind: 'taxonomy',
				opensInNewTab: true,
			},
		},
		{
			menuItem: {
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
			blockAttrs: {
				label: 'Example Tag',
				url: '/example-tag/',
				id: 103,
				type: 'tag',
				kind: 'taxonomy',
			},
		},
		{
			menuItem: {
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
			blockAttrs: {
				label: 'Example Custom Link',
				url: 'https://wordpress.org',
				type: 'custom',
				kind: 'custom',
				opensInNewTab: true,
			},
		},
	];

	describe( 'mapping block attributes to menu item fields', () => {
		it( 'maps block attributes to equivalent menu item fields', () => {
			const [ actual, expected ] = blocksToMenuItems.reduce(
				( acc, item ) => {
					acc[ 0 ].push(
						blockAttributesToMenuItem( item.block.attributes )
					);
					acc[ 1 ].push( item.menuItem );
					return acc;
				},
				[ [], [] ]
			);

			expect( actual ).toEqual( expected );
		} );

		it( 'does not map block attribute "id" to menu item "object_id" field for custom (non-entity) links', () => {
			const customLinkBlockAttributes = {
				id: 12345, // added for test purposes only - should't exist.
				type: 'custom', // custom type indicates we shouldn't need an `id` field.
				kind: 'custom', // custom type indicates we shouldn't need an `id` field.
				label: 'Example Custom Link',
				url: 'https://wordpress.org',
				description: '',
				rel: '',
				className: '',
				title: '',
				opensInNewTab: true,
			};

			const actual = blockAttributesToMenuItem(
				customLinkBlockAttributes
			);

			// Check the basic conversion to menuItem happened successfully.
			expect( actual ).toEqual( {
				title: 'Example Custom Link',
				url: 'https://wordpress.org',
				object: 'custom',
				type: 'custom',
				target: '_blank',
			} );

			// Assert `id` attr has NOT been converted to a `object_id` field for a "custom" type even if present.
			expect( actual.object_id ).toBeUndefined();
		} );

		it( 'correctly maps "tag" block type variation to "post_tag" value as expected in "object" type field', () => {
			const tagLinkBlockVariation = {
				id: 12345, // added for test purposes only - should't exist.
				type: 'tag', // custom type indicates we shouldn't need an `id` field.
				kind: 'taxonomy', // custom type indicates we shouldn't need an `id` field.
				label: 'Example Tag',
				url: '/example-tag/',
			};

			const actual = blockAttributesToMenuItem( tagLinkBlockVariation );

			expect( actual.object ).toBe( 'post_tag' );
		} );

		it( 'gracefully handles undefined values by falling back to menu item defaults', () => {
			const blockAttrsWithUndefinedValues = {
				id: undefined,
				type: undefined,
				kind: undefined,
				label: undefined,
				url: undefined,
				description: undefined,
				rel: undefined,
				className: undefined,
				title: undefined,
				opensInNewTab: undefined,
			};

			const actual = blockAttributesToMenuItem(
				blockAttrsWithUndefinedValues
			);

			// Defaults are taken from https://core.trac.wordpress.org/browser/tags/5.7.1/src/wp-includes/nav-menu.php#L438.
			expect( actual ).toEqual(
				expect.objectContaining( {
					title: '',
					url: '',
				} )
			);

			// Remaining values should not be present.
			expect( Object.keys( actual ) ).not.toEqual(
				expect.arrayContaining( [
					'description',
					'xfn',
					'classes',
					'attr_title',
					'object',
					'type',
					'object_id',
					'target',
				] )
			);

			expect( Object.values( actual ) ).not.toContain( undefined );
		} );

		it( 'allows for setting and unsetting of target property based on opensInNewTab arttribute boolean', () => {
			const shared = {
				id: 12345, // added for test purposes only - should't exist.
				type: 'custom', // custom type indicates we shouldn't need an `id` field.
				kind: 'custom', // custom type indicates we shouldn't need an `id` field.
				label: 'Example',
				url: '/example/',
			};

			const openInNewTabBlock = {
				...shared,
				opensInNewTab: true,
			};

			const doNotOpenInNewTabBlock = {
				...shared,
				opensInNewTab: false,
			};

			const shouldOpenInNewTab = blockAttributesToMenuItem(
				openInNewTabBlock
			);

			const shouldNotOpenInNewTab = blockAttributesToMenuItem(
				doNotOpenInNewTabBlock
			);

			expect( shouldOpenInNewTab.target ).toBe( '_blank' );

			// Should also allow unsetting of an existing value.
			expect( shouldNotOpenInNewTab.target ).toBe( '' );
		} );
	} );

	describe( 'mapping menu item fields to block attributes', () => {
		it( 'maps menu item fields to equivalent block attributes', () => {
			const [ actual, expected ] = menuItemsToBlockAttrs.reduce(
				( acc, item ) => {
					acc[ 0 ].push( menuItemToBlockAttributes( item.menuItem ) );
					acc[ 1 ].push( item.blockAttrs );
					return acc;
				},
				[ [], [] ]
			);

			expect( actual ).toEqual( expected );
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

		it( 'correctly maps "post_tag" menu item object type to "tag" block type variation', () => {
			const tagMenuItem = {
				title: 'Example Tag',
				url: '/example-tag/',
				object_id: 123456,
				object: 'post_tag',
				type: 'taxonomy',
			};

			const actual = menuItemToBlockAttributes( tagMenuItem );

			expect( actual.type ).toBe( 'tag' );
		} );

		it( 'gracefully handles undefined values by falling back to block attribute defaults', () => {
			// Note that whilst Core provides default values for nav_menu_item's it is possible that these
			// values could be manipulated via Plugins. As such we must account for unexpected values.
			const menuItemsWithUndefinedValues = {
				title: undefined,
				url: undefined,
				description: undefined,
				xfn: undefined,
				classes: undefined,
				attr_title: undefined,
				object_id: undefined,
				object: undefined,
				type: undefined,
				target: undefined,
			};

			const actual = menuItemToBlockAttributes(
				menuItemsWithUndefinedValues
			);

			expect( actual ).toEqual(
				expect.objectContaining( {
					label: '',
					url: '',
					kind: 'custom',
				} )
			);

			expect( Object.keys( actual ) ).not.toEqual(
				expect.arrayContaining( [
					'rel',
					'className',
					'title',
					'id',
					'description',
					'opensInNewTab',
				] )
			);

			expect( Object.values( actual ) ).not.toContain( undefined );
		} );
	} );
} );
