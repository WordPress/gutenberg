import { describe, expect, it, vi } from 'vitest';
import { convertToNavigationLinks } from '../use-convert-to-navigation-links';

// Expected entity binding structure for navigation links
const EXPECTED_ENTITY_BINDING = {
	url: {
		source: 'core/post-data',
		args: {
			field: 'link',
		},
	},
};

// Mock createBlock to avoid creating the blocks in test environment
// as convertToNavigationLinks calls this method internally.
vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => {
	const blocks = await importOriginal();

	return {
		...blocks,
		createBlock( name, attributes, innerBlocks ) {
			return {
				name,
				attributes,
				innerBlocks,
			};
		},
	};
} );

describe( 'page list convert to links', () => {
	describe( 'convertToNavigationLinks', () => {
		it( 'Can create submenus', () => {
			const pages = [
				{
					title: {
						raw: 'Sample Page',
						rendered: 'Sample Page',
					},
					id: 2,
					parent: 0,
					link: 'http://wordpress.local/sample-page/',
					type: 'page',
				},
				{
					title: {
						raw: 'About',
						rendered: 'About',
					},
					id: 34,
					parent: 0,
					link: 'http://wordpress.local/about/',
					type: 'page',
				},
				{
					title: {
						raw: 'Contact Page',
						rendered: 'Contact Page',
					},
					id: 37,
					parent: 0,
					link: 'http://wordpress.local/contact-page/',
					type: 'page',
				},
				{
					title: {
						raw: 'Test',
						rendered: 'Test',
					},
					id: 229,
					parent: 0,
					link: 'http://wordpress.local/test/',
					type: 'page',
				},
				{
					title: {
						raw: 'About Sub 1',
						rendered: 'About Sub 1',
					},
					id: 738,
					parent: 34,
					link: 'http://wordpress.local/about/about-sub-1/',
					type: 'page',
				},
				{
					title: {
						raw: 'About Sub 2',
						rendered: 'About Sub 2',
					},
					id: 740,
					parent: 34,
					link: 'http://wordpress.local/about/about-sub-2/',
					type: 'page',
				},
				{
					title: {
						raw: 'Test Sub',
						rendered: 'Test Sub',
					},
					id: 742,
					parent: 229,
					link: 'http://wordpress.local/test/test-sub/',
					type: 'page',
				},
				{
					title: {
						raw: 'Test Sub Sub',
						rendered: 'Test Sub Sub',
					},
					id: 744,
					parent: 742,
					link: 'http://wordpress.local/test/test-sub/test-sub-sub/',
					type: 'page',
				},
			];

			const convertLinks = convertToNavigationLinks( pages );

			expect( convertLinks ).toEqual( [
				{
					attributes: {
						id: 2,
						kind: 'post-type',
						label: 'Sample Page',
						type: 'page',
						url: 'http://wordpress.local/sample-page/',
						metadata: {
							bindings: EXPECTED_ENTITY_BINDING,
						},
					},
					innerBlocks: [],
					name: 'core/navigation-link',
				},
				{
					attributes: {
						id: 34,
						kind: 'post-type',
						label: 'About',
						type: 'page',
						url: 'http://wordpress.local/about/',
						metadata: {
							bindings: EXPECTED_ENTITY_BINDING,
						},
					},
					innerBlocks: [
						{
							attributes: {
								id: 738,
								kind: 'post-type',
								label: 'About Sub 1',
								type: 'page',
								url: 'http://wordpress.local/about/about-sub-1/',
								metadata: {
									bindings: EXPECTED_ENTITY_BINDING,
								},
							},
							innerBlocks: [],
							name: 'core/navigation-link',
						},
						{
							attributes: {
								id: 740,
								kind: 'post-type',
								label: 'About Sub 2',
								type: 'page',
								url: 'http://wordpress.local/about/about-sub-2/',
								metadata: {
									bindings: EXPECTED_ENTITY_BINDING,
								},
							},
							innerBlocks: [],
							name: 'core/navigation-link',
						},
					],
					name: 'core/navigation-submenu',
				},
				{
					attributes: {
						id: 37,
						kind: 'post-type',
						label: 'Contact Page',
						type: 'page',
						url: 'http://wordpress.local/contact-page/',
						metadata: {
							bindings: EXPECTED_ENTITY_BINDING,
						},
					},
					innerBlocks: [],
					name: 'core/navigation-link',
				},
				{
					attributes: {
						id: 229,
						kind: 'post-type',
						label: 'Test',
						type: 'page',
						url: 'http://wordpress.local/test/',
						metadata: {
							bindings: EXPECTED_ENTITY_BINDING,
						},
					},
					innerBlocks: [
						{
							attributes: {
								id: 742,
								kind: 'post-type',
								label: 'Test Sub',
								type: 'page',
								url: 'http://wordpress.local/test/test-sub/',
								metadata: {
									bindings: EXPECTED_ENTITY_BINDING,
								},
							},
							innerBlocks: [
								{
									attributes: {
										id: 744,
										kind: 'post-type',
										label: 'Test Sub Sub',
										type: 'page',
										url: 'http://wordpress.local/test/test-sub/test-sub-sub/',
										metadata: {
											bindings: EXPECTED_ENTITY_BINDING,
										},
									},
									innerBlocks: [],
									name: 'core/navigation-link',
								},
							],
							name: 'core/navigation-submenu',
						},
					],
					name: 'core/navigation-submenu',
				},
			] );
		} );
		it( 'Can create submenus, when children appear before parents', () => {
			const pages = [
				{
					title: {
						raw: 'About Sub 1',
						rendered: 'About Sub 1',
					},
					id: 738,
					parent: 34,
					link: 'http://wordpress.local/about/about-sub-1/',
					type: 'page',
				},
				{
					title: {
						raw: 'About Sub 2',
						rendered: 'About Sub 2',
					},
					id: 740,
					parent: 34,
					link: 'http://wordpress.local/about/about-sub-2/',
					type: 'page',
				},
				{
					title: {
						raw: 'Test Sub Sub',
						rendered: 'Test Sub Sub',
					},
					id: 744,
					parent: 742,
					link: 'http://wordpress.local/test/test-sub/test-sub-sub/',
					type: 'page',
				},
				{
					title: {
						raw: 'Test Sub',
						rendered: 'Test Sub',
					},
					id: 742,
					parent: 229,
					link: 'http://wordpress.local/test/test-sub/',
					type: 'page',
				},
				{
					title: {
						raw: 'Sample Page',
						rendered: 'Sample Page',
					},
					id: 2,
					parent: 0,
					link: 'http://wordpress.local/sample-page/',
					type: 'page',
				},
				{
					title: {
						raw: 'About',
						rendered: 'About',
					},
					id: 34,
					parent: 0,
					link: 'http://wordpress.local/about/',
					type: 'page',
				},
				{
					title: {
						raw: 'Contact Page',
						rendered: 'Contact Page',
					},
					id: 37,
					parent: 0,
					link: 'http://wordpress.local/contact-page/',
					type: 'page',
				},
				{
					title: {
						raw: 'Test',
						rendered: 'Test',
					},
					id: 229,
					parent: 0,
					link: 'http://wordpress.local/test/',
					type: 'page',
				},
			];

			const convertLinks = convertToNavigationLinks( pages );

			expect( convertLinks ).toEqual( [
				{
					attributes: {
						id: 2,
						kind: 'post-type',
						label: 'Sample Page',
						type: 'page',
						url: 'http://wordpress.local/sample-page/',
						metadata: {
							bindings: EXPECTED_ENTITY_BINDING,
						},
					},
					innerBlocks: [],
					name: 'core/navigation-link',
				},
				{
					attributes: {
						id: 34,
						kind: 'post-type',
						label: 'About',
						type: 'page',
						url: 'http://wordpress.local/about/',
						metadata: {
							bindings: EXPECTED_ENTITY_BINDING,
						},
					},
					innerBlocks: [
						{
							attributes: {
								id: 738,
								kind: 'post-type',
								label: 'About Sub 1',
								type: 'page',
								url: 'http://wordpress.local/about/about-sub-1/',
								metadata: {
									bindings: EXPECTED_ENTITY_BINDING,
								},
							},
							innerBlocks: [],
							name: 'core/navigation-link',
						},
						{
							attributes: {
								id: 740,
								kind: 'post-type',
								label: 'About Sub 2',
								type: 'page',
								url: 'http://wordpress.local/about/about-sub-2/',
								metadata: {
									bindings: EXPECTED_ENTITY_BINDING,
								},
							},
							innerBlocks: [],
							name: 'core/navigation-link',
						},
					],
					name: 'core/navigation-submenu',
				},
				{
					attributes: {
						id: 37,
						kind: 'post-type',
						label: 'Contact Page',
						type: 'page',
						url: 'http://wordpress.local/contact-page/',
						metadata: {
							bindings: EXPECTED_ENTITY_BINDING,
						},
					},
					innerBlocks: [],
					name: 'core/navigation-link',
				},
				{
					attributes: {
						id: 229,
						kind: 'post-type',
						label: 'Test',
						type: 'page',
						url: 'http://wordpress.local/test/',
						metadata: {
							bindings: EXPECTED_ENTITY_BINDING,
						},
					},
					innerBlocks: [
						{
							attributes: {
								id: 742,
								kind: 'post-type',
								label: 'Test Sub',
								type: 'page',
								url: 'http://wordpress.local/test/test-sub/',
								metadata: {
									bindings: EXPECTED_ENTITY_BINDING,
								},
							},
							innerBlocks: [
								{
									attributes: {
										id: 744,
										kind: 'post-type',
										label: 'Test Sub Sub',
										type: 'page',
										url: 'http://wordpress.local/test/test-sub/test-sub-sub/',
										metadata: {
											bindings: EXPECTED_ENTITY_BINDING,
										},
									},
									innerBlocks: [],
									name: 'core/navigation-link',
								},
							],
							name: 'core/navigation-submenu',
						},
					],
					name: 'core/navigation-submenu',
				},
			] );
		} );

		it( 'Finds a parent page whose own parent is not published', () => {
			// Page 1, the parent of page 2, isn't among the pages.
			const page = ( id, parent, title ) => ( {
				id,
				parent,
				title: { raw: title, rendered: title },
				link: `http://example.com/${ id }`,
				type: 'page',
			} );
			const pages = [
				page( 5, 0, 'Top' ),
				page( 2, 1, 'Parent' ),
				page( 3, 2, 'Child one' ),
				page( 4, 2, 'Child two' ),
			];

			const links = convertToNavigationLinks( pages, 2 );

			expect( links.map( ( link ) => link.attributes.label ) ).toEqual( [
				'Child one',
				'Child two',
			] );
		} );

		it( 'Finds the children of a parent page that is not published', () => {
			const page = ( id, parent, title ) => ( {
				id,
				parent,
				title: { raw: title, rendered: title },
				link: `http://example.com/${ id }`,
				type: 'page',
			} );
			// Page 1 isn't among the pages.
			const pages = [ page( 5, 0, 'Top' ), page( 2, 1, 'Child' ) ];

			const links = convertToNavigationLinks( pages, 1 );

			expect( links.map( ( link ) => link.attributes.label ) ).toEqual( [
				'Child',
			] );
		} );

		it( 'Labels a page with an empty title as it shows in the list', () => {
			const page = ( id, parent, title ) => ( {
				id,
				parent,
				title: { raw: title, rendered: title },
				link: `http://example.com/${ id }`,
				type: 'page',
			} );
			const pages = [ page( 1, 0, '' ), page( 2, 1, ' ' ) ];

			const [ submenu ] = convertToNavigationLinks( pages );

			expect( submenu.attributes.label ).toBe( '(no title)' );
			expect( submenu.innerBlocks[ 0 ].attributes.label ).toBe(
				'(no title)'
			);
		} );

		it( 'Returns no links when the parent page is missing', () => {
			const pages = [
				{
					id: 5,
					parent: 0,
					title: { raw: 'Top', rendered: 'Top' },
					link: 'http://example.com/5',
					type: 'page',
				},
			];

			expect( convertToNavigationLinks( pages, 99 ) ).toEqual( [] );
		} );

		it( 'Can use a different parent page', () => {
			const pages = [
				{
					title: {
						raw: 'Sample Page',
						rendered: 'Sample Page',
					},
					id: 2,
					parent: 0,
					link: 'http://wordpress.local/sample-page/',
					type: 'page',
				},
				{
					title: {
						raw: 'About',
						rendered: 'About',
					},
					id: 34,
					parent: 0,
					link: 'http://wordpress.local/about/',
					type: 'page',
				},
				{
					title: {
						raw: 'Contact Page',
						rendered: 'Contact Page',
					},
					id: 37,
					parent: 0,
					link: 'http://wordpress.local/contact-page/',
					type: 'page',
				},
				{
					title: {
						raw: 'Test',
						rendered: 'Test',
					},
					id: 229,
					parent: 0,
					link: 'http://wordpress.local/test/',
					type: 'page',
				},
				{
					title: {
						raw: 'About Sub 1',
						rendered: 'About Sub 1',
					},
					id: 738,
					parent: 34,
					link: 'http://wordpress.local/about/about-sub-1/',
					type: 'page',
				},
				{
					title: {
						raw: 'About Sub 2',
						rendered: 'About Sub 2',
					},
					id: 740,
					parent: 34,
					link: 'http://wordpress.local/about/about-sub-2/',
					type: 'page',
				},
				{
					title: {
						raw: 'Test Sub',
						rendered: 'Test Sub',
					},
					id: 742,
					parent: 229,
					link: 'http://wordpress.local/test/test-sub/',
					type: 'page',
				},
				{
					title: {
						raw: 'Test Sub Sub',
						rendered: 'Test Sub Sub',
					},
					id: 744,
					parent: 742,
					link: 'http://wordpress.local/test/test-sub/test-sub-sub/',
					type: 'page',
				},
			];

			const convertLinksWithParentOneLevel = convertToNavigationLinks(
				pages,
				34
			);

			expect( convertLinksWithParentOneLevel ).toEqual( [
				{
					attributes: {
						id: 738,
						kind: 'post-type',
						label: 'About Sub 1',
						type: 'page',
						url: 'http://wordpress.local/about/about-sub-1/',
						metadata: {
							bindings: EXPECTED_ENTITY_BINDING,
						},
					},
					innerBlocks: [],
					name: 'core/navigation-link',
				},
				{
					attributes: {
						id: 740,
						kind: 'post-type',
						label: 'About Sub 2',
						type: 'page',
						url: 'http://wordpress.local/about/about-sub-2/',
						metadata: {
							bindings: EXPECTED_ENTITY_BINDING,
						},
					},
					innerBlocks: [],
					name: 'core/navigation-link',
				},
			] );

			const convertLinksWithParentTwoLevels = convertToNavigationLinks(
				pages,
				742
			);

			expect( convertLinksWithParentTwoLevels ).toEqual( [
				{
					attributes: {
						id: 744,
						kind: 'post-type',
						label: 'Test Sub Sub',
						type: 'page',
						url: 'http://wordpress.local/test/test-sub/test-sub-sub/',
						metadata: {
							bindings: EXPECTED_ENTITY_BINDING,
						},
					},
					innerBlocks: [],
					name: 'core/navigation-link',
				},
			] );
		} );
	} );
} );
