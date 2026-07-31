/**
 * WordPress dependencies
 */
import { sprintf } from '@wordpress/i18n';
import i18n from '@wordpress/dataviews-i18n';

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
		return sprintf( i18n.ITEMS_SELECTED( selectionCount ), selectionCount );
	}

	// No selection - show item count
	if ( onlyTotalCount || totalItems <= itemsCount ) {
		return sprintf( i18n.ITEM_COUNT( totalItems ), totalItems );
	}

	return sprintf( i18n.ITEMS_OF_TOTAL( totalItems ), itemsCount, totalItems );
}
