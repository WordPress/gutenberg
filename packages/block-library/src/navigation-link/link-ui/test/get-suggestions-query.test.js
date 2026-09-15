import { describe, expect, it } from 'vitest';
import { getSuggestionsQuery } from '../get-suggestions-query';

describe( 'getSuggestionsQuery', () => {
	it.each( [
		[ 'an unlinked item', undefined, undefined ],
		[ 'a page link', 'page', 'post-type' ],
		[ 'a post link', 'post', 'post-type' ],
		[ 'a category link', 'category', 'taxonomy' ],
		[ 'a tag link', 'tag', 'taxonomy' ],
		[ 'a post format link', 'post_format', 'taxonomy' ],
		[ 'a custom post type link', 'event', 'post-type' ],
		[ 'a custom taxonomy link', 'genre', 'taxonomy' ],
		[ 'a custom link', 'custom', 'custom' ],
	] )( 'never scopes the search by type for %s', ( _label, type, kind ) => {
		const query = getSuggestionsQuery( type, kind );

		expect( query.type ).toBeUndefined();
		expect( query.subtype ).toBeUndefined();
	} );

	it( 'shows pages as initial suggestions for an unlinked item', () => {
		expect(
			getSuggestionsQuery( undefined, undefined )
				.initialSuggestionsSearchOptions
		).toMatchObject( { type: 'post', subtype: 'page' } );
	} );

	it( 'shows pages as initial suggestions for a custom link', () => {
		expect(
			getSuggestionsQuery( 'custom', 'custom' )
				.initialSuggestionsSearchOptions
		).toMatchObject( { type: 'post', subtype: 'page' } );
	} );

	it.each( [
		[
			'a page link',
			'page',
			'post-type',
			{ type: 'post', subtype: 'page' },
		],
		[
			'a post link',
			'post',
			'post-type',
			{ type: 'post', subtype: 'post' },
		],
		[
			'a category link',
			'category',
			'taxonomy',
			{ type: 'term', subtype: 'category' },
		],
		[
			'a tag link',
			'tag',
			'taxonomy',
			{ type: 'term', subtype: 'post_tag' },
		],
		[
			'a post format link',
			'post_format',
			'taxonomy',
			{ type: 'post-format' },
		],
		[
			'a custom post type link',
			'event',
			'post-type',
			{ type: 'post', subtype: 'event' },
		],
		[
			'a custom taxonomy link',
			'genre',
			'taxonomy',
			{ type: 'term', subtype: 'genre' },
		],
	] )(
		'shows the block’s own entity type as initial suggestions for %s',
		( _label, type, kind, expected ) => {
			expect(
				getSuggestionsQuery( type, kind )
					.initialSuggestionsSearchOptions
			).toMatchObject( expected );
		}
	);
} );
