/**
 * Internal dependencies
 */
import {
	flattenRecordsWithDepth,
	recordToNavigationLinkAttributes,
	taxonomySlugToNavType,
	selectionKey,
} from '../add-menu-items';

describe( 'LinkUIAddMenuItems helpers', () => {
	test( 'taxonomySlugToNavType maps post_tag to tag', () => {
		expect( taxonomySlugToNavType( 'post_tag' ) ).toBe( 'tag' );
	} );

	test( 'taxonomySlugToNavType replaces hyphens in slug', () => {
		expect( taxonomySlugToNavType( 'custom-tax' ) ).toBe( 'custom_tax' );
	} );

	test( 'recordToNavigationLinkAttributes maps a post', () => {
		expect(
			recordToNavigationLinkAttributes(
				{
					id: 5,
					link: 'https://example.com/hello/',
					title: { rendered: 'Hello' },
				},
				'postType',
				'page'
			)
		).toEqual( {
			kind: 'post-type',
			type: 'page',
			id: 5,
			url: 'https://example.com/hello/',
			label: 'Hello',
		} );
	} );

	test( 'recordToNavigationLinkAttributes maps a term', () => {
		expect(
			recordToNavigationLinkAttributes(
				{
					id: 2,
					link: 'https://example.com/category/news/',
					name: 'News',
				},
				'taxonomy',
				'category'
			)
		).toEqual( {
			kind: 'taxonomy',
			type: 'category',
			id: 2,
			url: 'https://example.com/category/news/',
			label: 'News',
		} );
	} );

	test( 'selectionKey is stable', () => {
		expect( selectionKey( 'postType', 'page', 3 ) ).toBe(
			'postType:page:3'
		);
	} );

	test( 'flattenRecordsWithDepth nests pages by parent', () => {
		const pages = [
			{
				id: 1,
				parent: 0,
				menu_order: 0,
				title: { rendered: 'Home' },
			},
			{
				id: 2,
				parent: 1,
				menu_order: 0,
				title: { rendered: 'Child' },
			},
			{
				id: 3,
				parent: 0,
				menu_order: 1,
				title: { rendered: 'About' },
			},
		];
		const rows = flattenRecordsWithDepth( pages, 'postType' );
		expect( rows.map( ( r ) => [ r.record.id, r.depth ] ) ).toEqual( [
			[ 1, 0 ],
			[ 2, 1 ],
			[ 3, 0 ],
		] );
	} );

	test( 'flattenRecordsWithDepth orders categories by name among siblings', () => {
		const terms = [
			{ id: 10, parent: 0, name: 'Zebra' },
			{ id: 11, parent: 0, name: 'Alpha' },
			{ id: 12, parent: 11, name: 'Child' },
		];
		const rows = flattenRecordsWithDepth( terms, 'taxonomy' );
		expect( rows.map( ( r ) => r.record.id ) ).toEqual( [ 11, 12, 10 ] );
	} );
} );
