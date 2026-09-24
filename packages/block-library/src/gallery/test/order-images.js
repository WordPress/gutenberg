import { describe, expect, it } from 'vitest';
import {
	getCurrentOrder,
	hasSortableImages,
	sortImageBlocks,
} from '../order-images';

const NEWEST_FIRST = { orderby: 'date', order: 'desc' };
const OLDEST_FIRST = { orderby: 'date', order: 'asc' };
const TITLE_A_TO_Z = { orderby: 'title', order: 'asc' };
const TITLE_Z_TO_A = { orderby: 'title', order: 'desc' };

/**
 * Creates the minimal `core/image` block the helpers read: an attachment id
 * and a client ID, which defaults from the id.
 *
 * @param {number|undefined} id       Attachment id, or `undefined` for an external image.
 * @param {string}           clientId Block client ID.
 */
function createImageBlock( id, clientId = `block-${ id }` ) {
	return { clientId, attributes: { id } };
}

/**
 * Creates image blocks for the given attachment ids, in that order.
 *
 * @param {...number} ids Attachment ids.
 */
function createImageBlocks( ...ids ) {
	return ids.map( ( id ) => createImageBlock( id ) );
}

/**
 * Creates the minimal attachment record the helpers read.
 *
 * @param {number} id    Attachment id.
 * @param {string} title Attachment title.
 * @param {string} date  Upload date, ISO 8601.
 */
function createAttachment( id, title, date ) {
	return { id, title: { raw: title, rendered: title }, date };
}

// Listed oldest to newest, so the date order reads top to bottom: 2, 3, 1, 4.
// The ids deliberately don't follow the dates, so a sort keyed on the id (or
// on the position in this list) can't pass the date tests by accident. The
// title order is different again: apple, Beach, IMG_2, IMG_10 (2, 1, 4, 3),
// which requires the compare to ignore case and treat numbers naturally.
const ATTACHMENTS = [
	createAttachment( 2, 'apple', '2024-01-15T10:00:00' ),
	createAttachment( 3, 'IMG_10', '2024-02-01T10:00:00' ),
	createAttachment( 1, 'Beach', '2024-03-01T10:00:00' ),
	createAttachment( 4, 'IMG_2', '2024-04-01T10:00:00' ),
];

const getImageIds = ( blocks ) =>
	blocks.map( ( { attributes } ) => attributes.id );

describe( 'sortImageBlocks', () => {
	it( 'sorts by date, newest first', () => {
		const blocks = createImageBlocks( 1, 2, 3, 4 );
		expect(
			getImageIds( sortImageBlocks( blocks, ATTACHMENTS, NEWEST_FIRST ) )
		).toEqual( [ 4, 1, 3, 2 ] );
	} );

	it( 'sorts by date, oldest first', () => {
		const blocks = createImageBlocks( 1, 2, 3, 4 );
		expect(
			getImageIds( sortImageBlocks( blocks, ATTACHMENTS, OLDEST_FIRST ) )
		).toEqual( [ 2, 3, 1, 4 ] );
	} );

	it( 'sorts by title ascending, ignoring case and comparing numbers naturally', () => {
		const blocks = createImageBlocks( 1, 2, 3, 4 );
		expect(
			getImageIds( sortImageBlocks( blocks, ATTACHMENTS, TITLE_A_TO_Z ) )
		).toEqual( [ 2, 1, 4, 3 ] );
	} );

	it( 'sorts by title descending', () => {
		const blocks = createImageBlocks( 1, 2, 3, 4 );
		expect(
			getImageIds( sortImageBlocks( blocks, ATTACHMENTS, TITLE_Z_TO_A ) )
		).toEqual( [ 3, 4, 1, 2 ] );
	} );

	it( 'returns a new array containing the same block objects', () => {
		const blocks = createImageBlocks( 1, 2 );
		const sorted = sortImageBlocks( blocks, ATTACHMENTS, OLDEST_FIRST );
		expect( sorted ).not.toBe( blocks );
		expect( sorted[ 0 ] ).toBe( blocks[ 1 ] );
		expect( sorted[ 1 ] ).toBe( blocks[ 0 ] );
	} );

	it( 'moves images without an id or attachment record to the end, in their existing order', () => {
		const blocks = [
			createImageBlock( undefined, 'external-a' ),
			createImageBlock( 1 ),
			createImageBlock( 99 ),
			createImageBlock( 2 ),
			createImageBlock( undefined, 'external-b' ),
		];
		const sorted = sortImageBlocks( blocks, ATTACHMENTS, OLDEST_FIRST );
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
			createAttachment( 1, 'Same', '2024-01-01T00:00:00' ),
			createAttachment( 2, 'Same', '2024-01-01T00:00:00' ),
		];
		const blocks = createImageBlocks( 2, 1 );
		expect(
			getImageIds( sortImageBlocks( blocks, media, NEWEST_FIRST ) )
		).toEqual( [ 2, 1 ] );
		expect(
			getImageIds( sortImageBlocks( blocks, media, TITLE_A_TO_Z ) )
		).toEqual( [ 2, 1 ] );
	} );

	it( 'falls back to the rendered title when there is no raw title', () => {
		const media = [
			{ id: 1, title: { rendered: 'b' }, date: '' },
			{ id: 2, title: { rendered: 'a' }, date: '' },
		];
		expect(
			getImageIds(
				sortImageBlocks(
					createImageBlocks( 1, 2 ),
					media,
					TITLE_A_TO_Z
				)
			)
		).toEqual( [ 2, 1 ] );
	} );
} );

describe( 'hasSortableImages', () => {
	it( 'is true with two or more images that have an attachment record', () => {
		expect(
			hasSortableImages( createImageBlocks( 1, 2 ), ATTACHMENTS )
		).toBe( true );
	} );

	it( 'is false while the attachment records have not resolved', () => {
		expect( hasSortableImages( createImageBlocks( 1, 2 ), [] ) ).toBe(
			false
		);
	} );

	it( 'does not count images without an id or attachment record', () => {
		expect(
			hasSortableImages(
				createImageBlocks( 1, undefined, 99 ),
				ATTACHMENTS
			)
		).toBe( false );
	} );
} );

describe( 'getCurrentOrder', () => {
	it( 'detects newest to oldest', () => {
		expect(
			getCurrentOrder( createImageBlocks( 4, 1, 3, 2 ), ATTACHMENTS )
		).toEqual( NEWEST_FIRST );
	} );

	it( 'detects oldest to newest', () => {
		expect(
			getCurrentOrder( createImageBlocks( 2, 3, 1, 4 ), ATTACHMENTS )
		).toEqual( OLDEST_FIRST );
	} );

	it( 'detects title A to Z', () => {
		expect(
			getCurrentOrder( createImageBlocks( 2, 1, 4, 3 ), ATTACHMENTS )
		).toEqual( TITLE_A_TO_Z );
	} );

	it( 'detects title Z to A', () => {
		expect(
			getCurrentOrder( createImageBlocks( 3, 4, 1, 2 ), ATTACHMENTS )
		).toEqual( TITLE_Z_TO_A );
	} );

	it( 'returns null for a custom order', () => {
		expect(
			getCurrentOrder( createImageBlocks( 1, 2, 3, 4 ), ATTACHMENTS )
		).toBeNull();
	} );

	it( 'returns null while the attachment records have not resolved', () => {
		expect( getCurrentOrder( createImageBlocks( 1, 2 ), [] ) ).toBeNull();
	} );

	it( 'returns null when fewer than two images have an attachment record', () => {
		expect(
			getCurrentOrder(
				createImageBlocks( 1, undefined, 99 ),
				ATTACHMENTS
			)
		).toBeNull();
	} );

	it( 'ignores unplaceable images at the end when detecting the order', () => {
		expect(
			getCurrentOrder(
				createImageBlocks( 4, 1, 3, 2, undefined ),
				ATTACHMENTS
			)
		).toEqual( NEWEST_FIRST );
	} );

	describe( 'when a sequence satisfies several orders', () => {
		// Oldest to newest and A → Z both match.
		const media = [
			createAttachment( 1, 'a', '2024-01-01T00:00:00' ),
			createAttachment( 2, 'b', '2024-01-02T00:00:00' ),
		];
		const blocks = createImageBlocks( 1, 2 );

		it( 'reports the first matching option by default', () => {
			expect( getCurrentOrder( blocks, media ) ).toEqual( OLDEST_FIRST );
		} );

		it( 'reports the preferred order when it holds', () => {
			expect( getCurrentOrder( blocks, media, TITLE_A_TO_Z ) ).toEqual(
				TITLE_A_TO_Z
			);
		} );

		it( 'ignores the preferred order when it no longer holds', () => {
			expect( getCurrentOrder( blocks, media, TITLE_Z_TO_A ) ).toEqual(
				OLDEST_FIRST
			);
		} );
	} );
} );
