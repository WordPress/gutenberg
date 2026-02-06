/**
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Get the footer message for the DataViews footer.
 *
 * @param selectionCount - The number of items selected.
 * @param itemsCount     - The number of items in the current page.
 * @param totalItems     - The total number of items.
 * @param onlyTotalCount - Whether to only show the total count.
 * @return               - The footer message.
 */
export default function getFooterMessage(
	selectionCount: number,
	itemsCount: number,
	totalItems: number,
	onlyTotalCount = false
): string {
	if ( selectionCount > 0 ) {
		return sprintf(
			/* translators: %d: number of items. */
			_n( '%d Item selected', '%d Items selected', selectionCount ),
			selectionCount
		);
	}

	if ( onlyTotalCount || totalItems <= itemsCount ) {
		return sprintf(
			/* translators: %d: number of items. */
			_n( '%d Item', '%d Items', totalItems ),
			totalItems
		);
	}

	return sprintf(
		/* translators: %1$d: number of items. %2$d: total number of items. */
		_n( '%1$d of %2$d Item', '%1$d of %2$d Items', totalItems ),
		itemsCount,
		totalItems
	);
}
