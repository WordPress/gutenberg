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

		describe( 'with excluded pages', () => {
			const makePage = ( id, parent ) => ( {
				title: { raw: `Page ${ id }`, rendered: `Page ${ id }` },
				id,
				parent,
				link: `http://wordpress.local/?page_id=${ id }`,
				type: 'page',
			} );
			// 1 > 2 > 3, and 4 at the top level.
			const pages = [
				makePage( 1, 0 ),
				makePage( 2, 1 ),
				makePage( 3, 2 ),
				makePage( 4, 0 ),
			];
			const getIds = ( links ) =>
				links.map( ( { attributes, innerBlocks } ) => [
					attributes.id,
					getIds( innerBlocks ),
				] );

			it( 'removes an excluded page along with its subpages', () => {
				expect(
					getIds( convertToNavigationLinks( pages, null, [ 2 ] ) )
				).toEqual( [
					[ 1, [] ],
					[ 4, [] ],
				] );
			} );

			it( 'turns a parent with only excluded subpages into a link', () => {
				const links = convertToNavigationLinks( pages, null, [ 2 ] );

				expect( links[ 0 ].name ).toBe( 'core/navigation-link' );
			} );

			it( 'keeps the subpages of an excluded parent page', () => {
				expect(
					getIds( convertToNavigationLinks( pages, 2, [ 2 ] ) )
				).toEqual( [ [ 3, [] ] ] );
				expect(
					getIds( convertToNavigationLinks( pages, 2, [ 1 ] ) )
				).toEqual( [ [ 3, [] ] ] );
			} );
		} );
	} );
} );
