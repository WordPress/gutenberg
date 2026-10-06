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
	// A typed search is unscoped: naming no type leaves every endpoint to
	// answer it, which is what lets a category be found from a page link.
	it.each( LINK_TYPES )(
		'searches every entity type from a %s link',
		( type, kind ) => {
			const query = getSuggestionsQuery( type, kind );

			expect( query.type ).toBeUndefined();
			expect( query.subtype ).toBeUndefined();
		}
	);

	// Searching everything only helps if the link's own kind leads, so the
	// block names it rather than narrowing to it.
	it.each( LINK_TYPES )(
		'ranks the %s link’s own type above the usual order',
		( type, kind, expected ) => {
			expect( getSuggestionsQuery( type, kind ).preferTypes ).toEqual( [
				expected.subtype ? expected : expected.type,
			] );
		}
	);

	// Before anything is typed there is nothing to rank, so the preview is
	// narrowed to the link's own type instead.
	it.each( LINK_TYPES )(
		'suggests the %s link’s own type before anything is typed',
		( type, kind, expected ) => {
			expect(
				getSuggestionsQuery( type, kind )
					.initialSuggestionsSearchOptions
			).toEqual( { ...expected, perPage: PER_PAGE } );
		}
	);

	// A custom link points at a URL, and a link just inserted has no type at
	// all, so neither has a kind of its own to preview. Pages are the most
	// likely thing to link to.
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
