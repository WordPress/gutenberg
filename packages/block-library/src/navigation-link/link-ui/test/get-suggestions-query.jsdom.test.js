import { describe, expect, it } from 'vitest';
import { getSuggestionsQuery } from '..';

const PER_PAGE = 20;

const LINK_TYPES = [
	[ 'page', 'post-type', { type: 'post', subtype: 'page' } ],
	[ 'post', 'post-type', { type: 'post', subtype: 'post' } ],
	[ 'category', 'taxonomy', { type: 'term', subtype: 'category' } ],
	[ 'tag', 'taxonomy', { type: 'term', subtype: 'post_tag' } ],
	[ 'post_format', 'taxonomy', { type: 'post-format' } ],
	[ 'event', 'post-type', { type: 'post', subtype: 'event' } ],
	[ 'genre', 'taxonomy', { type: 'term', subtype: 'genre' } ],
];

describe( 'getSuggestionsQuery', () => {
	it.each( LINK_TYPES )(
		'searches every entity type from a %s link',
		( type, kind ) => {
			const query = getSuggestionsQuery( type, kind );

			expect( query.type ).toBeUndefined();
			expect( query.subtype ).toBeUndefined();
			// Naming a number would cut results from a search that cannot be
			// paged through.
			expect( query.perPage ).toBeUndefined();
		}
	);

	it.each( LINK_TYPES )(
		'ranks the %s link’s own type above the usual order',
		( type, kind, expected ) => {
			expect( getSuggestionsQuery( type, kind ).preferTypes ).toEqual( [
				expected.subtype ? expected : expected.type,
			] );
		}
	);

	it.each( LINK_TYPES )(
		'suggests the %s link’s own type before anything is typed',
		( type, kind, expected ) => {
			expect(
				getSuggestionsQuery( type, kind )
					.initialSuggestionsSearchOptions
			).toEqual( { ...expected, perPage: PER_PAGE } );
		}
	);

	it.each( [
		[ 'a custom link', 'custom', 'custom' ],
		[ 'a link with no type', undefined, undefined ],
	] )(
		'suggests pages before anything is typed for %s',
		( _label, type, kind ) => {
			expect(
				getSuggestionsQuery( type, kind )
					.initialSuggestionsSearchOptions
			).toEqual( { type: 'post', subtype: 'page', perPage: PER_PAGE } );
		}
	);
} );
