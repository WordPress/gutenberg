import { ORDER_OPTIONS } from './dynamic-source';

/**
 * Returns the value an image block is ordered by, or `undefined` when it has no
 * resolved attachment record to take it from.
 *
 * @param {Object} block   A `core/image` inner block.
 * @param {Array}  media   Attachment records for the gallery's images.
 * @param {string} orderby `date` or `title`.
 * @return {?string} The sort key.
 */
function getSortKey( block, media, orderby ) {
	const { id } = block.attributes;
	if ( id === undefined ) {
		return undefined;
	}
	const record = media.find( ( item ) => item.id === id );
	if ( ! record ) {
		return undefined;
	}
	if ( orderby === 'title' ) {
		return record.title?.raw ?? record.title?.rendered ?? '';
	}
	return record.date ?? '';
}

/**
 * Compares two sort keys for the given field. Titles use a natural,
 * case-insensitive comparison so `IMG_2` sorts before `IMG_10`; dates are ISO
 * 8601 strings, so a plain string comparison orders them chronologically.
 *
 * @param {string} a       First key.
 * @param {string} b       Second key.
 * @param {string} orderby `date` or `title`.
 * @return {number} Negative when `a` sorts first, positive when `b` does.
 */
function compareKeys( a, b, orderby ) {
	if ( orderby === 'title' ) {
		return a.localeCompare( b, undefined, {
			numeric: true,
			sensitivity: 'base',
		} );
	}
	if ( a === b ) {
		return 0;
	}
	return a < b ? -1 : 1;
}

/**
 * Sorts a static gallery's image blocks by an attachment field.
 *
 * Blocks without an `id`, or whose attachment record isn't in `media` (still
 * loading, or deleted from the library), can't be placed, so they keep their
 * relative order and move to the end. Blocks with equal keys likewise keep
 * their relative order (`Array.prototype.sort` is stable), so re-applying the
 * current order is a no-op.
 *
 * @param {Array}  blocks  The gallery's `core/image` inner blocks.
 * @param {Array}  media   Attachment records for the gallery's images.
 * @param {string} orderby `date` or `title`.
 * @param {string} order   `asc` or `desc`.
 * @return {Array} A new array holding the same block objects, sorted.
 */
export function sortImageBlocks( blocks, media, orderby, order ) {
	const direction = order === 'desc' ? -1 : 1;
	const keys = new Map(
		blocks.map( ( block ) => [
			block,
			getSortKey( block, media, orderby ),
		] )
	);

	return [ ...blocks ].sort( ( a, b ) => {
		const keyA = keys.get( a );
		const keyB = keys.get( b );
		if ( keyA === undefined || keyB === undefined ) {
			if ( keyA === keyB ) {
				return 0;
			}
			return keyA === undefined ? 1 : -1;
		}
		return compareKeys( keyA, keyB, orderby ) * direction;
	} );
}

/**
 * Detects which of the offered orders, if any, a static gallery's images are
 * currently in, so the "Order by" control can reflect it without storing an
 * attribute.
 *
 * Returns `null` ("custom order") when the sequence matches none of the
 * options, and also when there are fewer than two blocks with a resolved
 * attachment record, since every order trivially matches then. Options are
 * checked in `ORDER_OPTIONS` order, so a sequence that satisfies several (e.g.
 * images uploaded in title order) reports the first.
 *
 * @param {Array} blocks The gallery's `core/image` inner blocks.
 * @param {Array} media  Attachment records for the gallery's images.
 * @return {?{orderby: string, order: string}} The detected order, or `null`.
 */
export function getCurrentOrder( blocks, media ) {
	const resolvedCount = blocks.filter(
		( block ) =>
			block.attributes.id !== undefined &&
			media.some( ( item ) => item.id === block.attributes.id )
	).length;
	if ( resolvedCount < 2 ) {
		return null;
	}

	for ( const { value } of ORDER_OPTIONS ) {
		const [ orderby, order ] = value.split( '/' );
		const sorted = sortImageBlocks( blocks, media, orderby, order );
		if ( sorted.every( ( block, index ) => block === blocks[ index ] ) ) {
			return { orderby, order };
		}
	}

	return null;
}
