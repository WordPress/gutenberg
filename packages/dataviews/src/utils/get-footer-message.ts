import { _n, sprintf } from '@wordpress/i18n';

/**
 * Get the footer message for the DataViews footer.
 *
 * @param selectionCount - The number of selected items.
 * @param itemsCount     - The number of items in the current page.
 * @param totalItems     - The total number of items.
 * @param onlyTotalCount - Whether to only show the total count (used with infinite scroll).
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
			/* translators: %s: formatted number of items. */
			_n( '%s Item selected', '%s Items selected', selectionCount ),
			selectionCount.toLocaleString()
		);
	}

	// No selection - show item count
	if ( onlyTotalCount || totalItems <= itemsCount ) {
		return sprintf(
			/* translators: %s: formatted number of items. */
			_n( '%s Item', '%s Items', totalItems ),
			totalItems.toLocaleString()
		);
	}

	return sprintf(
		/* translators: %1$s: formatted number of items. %2$s: formatted total number of items. */
		_n( '%1$s of %2$s Item', '%1$s of %2$s Items', totalItems ),
		itemsCount.toLocaleString(),
		totalItems.toLocaleString()
	);
}
