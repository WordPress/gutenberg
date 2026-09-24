import { ORDER_OPTIONS, parseOrderValue } from './order-options';

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
		// The media is fetched in the default (view) context, so `rendered`
		// is the usual source; `raw` is only present with the edit context.
		return record.title?.raw ?? record.title?.rendered ?? '';
	}
	return record.date ?? '';
}

/**
 * Whether there's anything to sort: at least two image blocks with a resolved
 * attachment record. With fewer, every order trivially holds and sorting is a
 * no-op, so the control is disabled and reports a custom order.
 *
 * @param {Array} blocks The gallery's `core/image` inner blocks.
 * @param {Array} media  Attachment records for the gallery's images.
 * @return {boolean} Whether the images can be sorted.
 */
export function hasSortableImages( blocks, media ) {
	return (
		blocks.filter(
			( block ) =>
				block.attributes.id !== undefined &&
				media.some( ( item ) => item.id === block.attributes.id )
		).length > 1
	);
}

/**
 * Whether sorting `blocks` by the given order would leave them as they are.
 *
 * @param {Array}  blocks The gallery's `core/image` inner blocks.
 * @param {Array}  media  Attachment records for the gallery's images.
 * @param {Object} order  The `{ orderby, order }` to check.
 * @return {boolean} Whether the blocks are already in that order.
 */
function isInOrder( blocks, media, order ) {
	return sortImageBlocks( blocks, media, order ).every(
		( block, index ) => block === blocks[ index ]
	);
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
 * @param {Array}  blocks        The gallery's `core/image` inner blocks.
 * @param {Array}  media         Attachment records for the gallery's images.
 * @param {Object} order         The order to apply.
 * @param {string} order.orderby `date` or `title`.
 * @param {string} order.order   `asc` or `desc`.
 * @return {Array} A new array holding the same block objects, sorted.
 */
export function sortImageBlocks( blocks, media, { orderby, order } ) {
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
 * options, or when there's nothing sortable (see `hasSortableImages`).
 *
 * A sequence can satisfy several orders at once — files named in sequence and
 * uploaded in one go are in both title and date order — so the order the user
 * last applied, if given, is checked first and wins while it still holds. That
 * way the control keeps showing what was chosen rather than the first option
 * that happens to fit. Otherwise options are checked in `ORDER_OPTIONS` order.
 *
 * @param {Array}   blocks         The gallery's `core/image` inner blocks.
 * @param {Array}   media          Attachment records for the gallery's images.
 * @param {?Object} preferredOrder The `{ orderby, order }` to check first, if any.
 * @return {?{orderby: string, order: string}} The detected order, or `null`.
 */
export function getCurrentOrder( blocks, media, preferredOrder = null ) {
	if ( ! hasSortableImages( blocks, media ) ) {
		return null;
	}

	if ( preferredOrder && isInOrder( blocks, media, preferredOrder ) ) {
		return preferredOrder;
	}

	for ( const { value } of ORDER_OPTIONS ) {
		const order = parseOrderValue( value );
		if ( isInOrder( blocks, media, order ) ) {
			return order;
		}
	}

	return null;
}
