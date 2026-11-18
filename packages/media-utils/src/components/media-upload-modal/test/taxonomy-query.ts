import { describe, expect, it } from 'vitest';
import { getTaxonomyQueryArgs } from '../taxonomy-query';

const TAXONOMIES = [
	{ slug: 'category', rest_base: 'categories' },
	{ slug: 'post_tag', rest_base: 'tags' },
	{ slug: 'genre' },
	{ slug: 'place', rest_base: 'places', hierarchical: true },
];

describe( 'getTaxonomyQueryArgs', () => {
	it( 'queries items with any of the terms', () => {
		expect(
			getTaxonomyQueryArgs(
				[ { field: 'categories', operator: 'isAny', value: [ 3, 4 ] } ],
				TAXONOMIES
			)
		).toEqual( { categories: [ 3, 4 ] } );
	} );

	it( 'queries items with every one of the terms', () => {
		expect(
			getTaxonomyQueryArgs(
				[ { field: 'tags', operator: 'isAll', value: [ 5, 6 ] } ],
				TAXONOMIES
			)
		).toEqual( { tags: { terms: [ 5, 6 ], operator: 'AND' } } );
	} );

	it( 'queries items with none of the terms', () => {
		expect(
			getTaxonomyQueryArgs(
				[ { field: 'tags', operator: 'isNone', value: [ 7 ] } ],
				TAXONOMIES
			)
		).toEqual( { tags_exclude: [ 7 ] } );
	} );

	it( 'leaves `include_children` at the REST default of false', () => {
		expect(
			getTaxonomyQueryArgs(
				[
					{ field: 'places', operator: 'isAny', value: [ 9 ] },
					{ field: 'places', operator: 'isNone', value: [ 10 ] },
				],
				TAXONOMIES
			)
		).toEqual( { places: [ 9 ], places_exclude: [ 10 ] } );
	} );

	it( 'takes a single term for `is` and `isNot`', () => {
		expect(
			getTaxonomyQueryArgs(
				[
					{ field: 'categories', operator: 'is', value: 3 },
					{ field: 'tags', operator: 'isNot', value: 7 },
				],
				TAXONOMIES
			)
		).toEqual( { categories: [ 3 ], tags_exclude: [ 7 ] } );
	} );

	it( 'combines filters on several taxonomies', () => {
		expect(
			getTaxonomyQueryArgs(
				[
					{ field: 'categories', operator: 'isAny', value: [ 3 ] },
					{ field: 'tags', operator: 'isNone', value: [ 7 ] },
				],
				TAXONOMIES
			)
		).toEqual( { categories: [ 3 ], tags_exclude: [ 7 ] } );
	} );

	it( 'uses the slug of a taxonomy with no REST base', () => {
		expect(
			getTaxonomyQueryArgs(
				[ { field: 'genre', operator: 'isAny', value: [ 8 ] } ],
				TAXONOMIES
			)
		).toEqual( { genre: [ 8 ] } );
	} );

	it( 'leaves the query alone for a filter with no terms', () => {
		expect(
			getTaxonomyQueryArgs(
				[
					{ field: 'categories', operator: 'isAny', value: [] },
					{ field: 'tags', operator: 'isAny', value: undefined },
				],
				TAXONOMIES
			)
		).toEqual( {} );
	} );

	it( 'ignores filters on fields that are not taxonomies', () => {
		expect(
			getTaxonomyQueryArgs(
				[
					{ field: 'author', operator: 'isAny', value: [ 1 ] },
					{ field: 'post_tag', operator: 'isAny', value: [ 5 ] },
				],
				TAXONOMIES
			)
		).toEqual( {} );
	} );
} );
