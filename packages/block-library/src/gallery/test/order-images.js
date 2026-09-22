import { describe, expect, it } from 'vitest';
import { getCurrentOrder, sortImageBlocks } from '../order-images';

function block( id, clientId = `block-${ id }` ) {
	return { clientId, attributes: { id } };
}

function record( id, title, date ) {
	return { id, title: { raw: title, rendered: title }, date };
}

const MEDIA = [
	record( 1, 'Beach', '2024-03-01T10:00:00' ),
	record( 2, 'apple', '2024-01-15T10:00:00' ),
	record( 3, 'IMG_10', '2024-02-01T10:00:00' ),
	record( 4, 'IMG_2', '2024-04-01T10:00:00' ),
];

const ids = ( blocks ) => blocks.map( ( { attributes } ) => attributes.id );

describe( 'sortImageBlocks', () => {
	it( 'sorts by date, newest first', () => {
		const blocks = [ block( 1 ), block( 2 ), block( 3 ), block( 4 ) ];
		expect(
			ids( sortImageBlocks( blocks, MEDIA, 'date', 'desc' ) )
		).toEqual( [ 4, 1, 3, 2 ] );
	} );

	it( 'sorts by date, oldest first', () => {
		const blocks = [ block( 1 ), block( 2 ), block( 3 ), block( 4 ) ];
		expect(
			ids( sortImageBlocks( blocks, MEDIA, 'date', 'asc' ) )
		).toEqual( [ 2, 3, 1, 4 ] );
	} );

	it( 'sorts by title ascending, ignoring case and comparing numbers naturally', () => {
		const blocks = [ block( 1 ), block( 2 ), block( 3 ), block( 4 ) ];
		expect(
			ids( sortImageBlocks( blocks, MEDIA, 'title', 'asc' ) )
		).toEqual( [ 2, 1, 4, 3 ] );
	} );

	it( 'sorts by title descending', () => {
		const blocks = [ block( 1 ), block( 2 ), block( 3 ), block( 4 ) ];
		expect(
			ids( sortImageBlocks( blocks, MEDIA, 'title', 'desc' ) )
		).toEqual( [ 3, 4, 1, 2 ] );
	} );

	it( 'returns a new array containing the same block objects', () => {
		const blocks = [ block( 1 ), block( 2 ) ];
		const sorted = sortImageBlocks( blocks, MEDIA, 'date', 'asc' );
		expect( sorted ).not.toBe( blocks );
		expect( sorted[ 0 ] ).toBe( blocks[ 1 ] );
		expect( sorted[ 1 ] ).toBe( blocks[ 0 ] );
	} );

	it( 'moves images without an id or attachment record to the end, in their existing order', () => {
		const blocks = [
			block( undefined, 'external-a' ),
			block( 1 ),
			block( 99 ),
			block( 2 ),
			block( undefined, 'external-b' ),
		];
		const sorted = sortImageBlocks( blocks, MEDIA, 'date', 'asc' );
		expect( sorted.map( ( { clientId } ) => clientId ) ).toEqual( [
			'block-2',
			'block-1',
			'external-a',
			'block-99',
			'external-b',
		] );
	} );

	it( 'keeps the existing order of images with equal keys', () => {
		const media = [
			record( 1, 'Same', '2024-01-01T00:00:00' ),
			record( 2, 'Same', '2024-01-01T00:00:00' ),
		];
		const blocks = [ block( 2 ), block( 1 ) ];
		expect(
			ids( sortImageBlocks( blocks, media, 'date', 'desc' ) )
		).toEqual( [ 2, 1 ] );
		expect(
			ids( sortImageBlocks( blocks, media, 'title', 'asc' ) )
		).toEqual( [ 2, 1 ] );
	} );

	it( 'falls back to the rendered title when there is no raw title', () => {
		const media = [
			{ id: 1, title: { rendered: 'b' }, date: '' },
			{ id: 2, title: { rendered: 'a' }, date: '' },
		];
		expect(
			ids(
				sortImageBlocks(
					[ block( 1 ), block( 2 ) ],
					media,
					'title',
					'asc'
				)
			)
		).toEqual( [ 2, 1 ] );
	} );
} );

describe( 'getCurrentOrder', () => {
	it( 'detects newest to oldest', () => {
		expect(
			getCurrentOrder(
				[ block( 4 ), block( 1 ), block( 3 ), block( 2 ) ],
				MEDIA
			)
		).toEqual( { orderby: 'date', order: 'desc' } );
	} );

	it( 'detects oldest to newest', () => {
		expect(
			getCurrentOrder(
				[ block( 2 ), block( 3 ), block( 1 ), block( 4 ) ],
				MEDIA
			)
		).toEqual( { orderby: 'date', order: 'asc' } );
	} );

	it( 'detects title A to Z', () => {
		expect(
			getCurrentOrder(
				[ block( 2 ), block( 1 ), block( 4 ), block( 3 ) ],
				MEDIA
			)
		).toEqual( { orderby: 'title', order: 'asc' } );
	} );

	it( 'detects title Z to A', () => {
		expect(
			getCurrentOrder(
				[ block( 3 ), block( 4 ), block( 1 ), block( 2 ) ],
				MEDIA
			)
		).toEqual( { orderby: 'title', order: 'desc' } );
	} );

	it( 'returns null for a custom order', () => {
		expect(
			getCurrentOrder(
				[ block( 1 ), block( 2 ), block( 3 ), block( 4 ) ],
				MEDIA
			)
		).toBeNull();
	} );

	it( 'returns null while the attachment records have not resolved', () => {
		expect( getCurrentOrder( [ block( 1 ), block( 2 ) ], [] ) ).toBeNull();
	} );

	it( 'returns null when fewer than two images have an attachment record', () => {
		expect(
			getCurrentOrder(
				[ block( 1 ), block( undefined ), block( 99 ) ],
				MEDIA
			)
		).toBeNull();
	} );

	it( 'ignores unplaceable images at the end when detecting the order', () => {
		expect(
			getCurrentOrder(
				[
					block( 4 ),
					block( 1 ),
					block( 3 ),
					block( 2 ),
					block( undefined ),
				],
				MEDIA
			)
		).toEqual( { orderby: 'date', order: 'desc' } );
	} );

	it( 'reports the first matching option when a sequence satisfies several', () => {
		const media = [
			record( 1, 'a', '2024-01-01T00:00:00' ),
			record( 2, 'b', '2024-01-02T00:00:00' ),
		];
		// Oldest to newest and A → Z both match; date options are listed first.
		expect( getCurrentOrder( [ block( 1 ), block( 2 ) ], media ) ).toEqual(
			{
				orderby: 'date',
				order: 'asc',
			}
		);
	} );
} );
