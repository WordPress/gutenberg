import { describe, expect, it } from 'vitest';
import { getSuggestionsQuery } from '..';

const PER_PAGE = 20;

const LINK_TYPES = [
	[ 'page', 'post-type', { type: 'post', subtype: 'page' }, 'page' ],
	[ 'post', 'post-type', { type: 'post', subtype: 'post' }, 'post' ],
	[
		'category',
		'taxonomy',
		{ type: 'term', subtype: 'category' },
		'category',
	],
	[ 'tag', 'taxonomy', { type: 'term', subtype: 'post_tag' }, 'post_tag' ],
	[ 'post_format', 'taxonomy', { type: 'post-format' }, 'post-format' ],
	[ 'event', 'post-type', { type: 'post', subtype: 'event' }, 'event' ],
	[ 'genre', 'taxonomy', { type: 'term', subtype: 'genre' }, 'genre' ],
];

describe( 'getSuggestionsQuery', () => {
	it.each( LINK_TYPES )(
		'searches every entity type from a %s link',
		( type, kind ) => {
			const query = getSuggestionsQuery( type, kind );

			expect( query.type ).toBeUndefined();
			expect( query.subtype ).toBeUndefined();
			expect( query.perPage ).toBe( PER_PAGE );
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

	it.each( LINK_TYPES )(
		'ranks the %s link’s own type above the others',
		( type, kind, _initial, expectedPriority ) => {
			expect( getSuggestionsQuery( type, kind ).priorityTypes ).toEqual( [
				expectedPriority,
			] );
		}
	);

	it.each( LINK_TYPES )(
		'leaves attachments out of the %s link’s search',
		( type, kind ) => {
			expect( getSuggestionsQuery( type, kind ).exclude ).toContain(
				'attachment'
			);
		}
	);

	it.each( LINK_TYPES.filter( ( [ type ] ) => type !== 'post_format' ) )(
		'leaves post formats out of the %s link’s search',
		( type, kind ) => {
			expect( getSuggestionsQuery( type, kind ).exclude ).toContain(
				'post-format'
			);
		}
	);

	it( 'keeps post formats in a post format link’s search', () => {
		// Excluding them would leave the link with nothing of its own to find.
		expect(
			getSuggestionsQuery( 'post_format', 'taxonomy' ).exclude
		).toEqual( [ 'attachment' ] );
	} );

	it.each( [
		[ 'a custom link', 'custom', 'custom' ],
		[ 'a link with no type', undefined, undefined ],
	] )(
		'suggests pages before anything is typed for %s',
		( _label, type, kind ) => {
			const query = getSuggestionsQuery( type, kind );

			expect( query.initialSuggestionsSearchOptions ).toEqual( {
				type: 'post',
				subtype: 'page',
				perPage: PER_PAGE,
			} );
			expect( query.priorityTypes ).toEqual( [ 'page' ] );
		}
	);
} );
