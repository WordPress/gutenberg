/**
 * WordPress dependencies
 */
import { _n, sprintf, __ } from '@wordpress/i18n';

/**
 * Get the footer message for the DataViews footer.
 *
 * @param selectionCount  - The number of items in the selection array (selected items in normal mode, deselected items in select all mode).
 * @param itemsCount      - The number of items in the current page.
 * @param totalItems      - The total number of items.
 * @param onlyTotalCount  - Whether to only show the total count (used with infinite scroll).
 * @param isSelectAllMode - Whether select all mode is active (selection array is a deselection list). Only true when onlyTotalCount is true.
 * @return                - The footer message.
 */
export default function getFooterMessage(
	selectionCount: number,
	itemsCount: number,
	totalItems: number,
	onlyTotalCount = false,
	isSelectAllMode = false
): string {
	// Handle selection messages
	if ( isSelectAllMode ) {
		// In select-all mode, selection array is a deselection list
		const actualSelectedCount = totalItems - selectionCount;
		if ( actualSelectedCount === totalItems ) {
			return sprintf(
				/* translators: %d: total number of items. */
				__( 'All %d Items selected' ),
				totalItems
			);
		}
		return sprintf(
			/* translators: %d: number of items. */
			_n( '%d Item selected', '%d Items selected', actualSelectedCount ),
			actualSelectedCount
		);
	}

	if ( selectionCount > 0 ) {
		return sprintf(
			/* translators: %d: number of items. */
			_n( '%d Item selected', '%d Items selected', selectionCount ),
			selectionCount
		);
	}

	// No selection - show item count
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
