/**
 * Internal dependencies
 */
import type { WPBlockSelection, WPSelection } from '../types';

/**
 * Compare two selection objects by their attributes.
 *
 * @param {WPSelection | undefined} selectionA - First selection object
 * @param {WPSelection | undefined} selectionB - Second selection object
 * @return {boolean} True if selections are equal, false otherwise
 */
export function areSelectionsEqual(
	selectionA: WPSelection | undefined,
	selectionB: WPSelection | undefined
): boolean {
	if ( selectionA === selectionB ) {
		return true;
	}

	if ( ! selectionA || ! selectionB ) {
		return false;
	}

	return (
		areBlockSelectionsEqual(
			selectionA.selectionStart,
			selectionB.selectionStart
		) &&
		areBlockSelectionsEqual(
			selectionA.selectionEnd,
			selectionB.selectionEnd
		)
	);
}

/**
 * Compare two WPBlockSelection objects by their attributes.
 *
 * @param {WPBlockSelection | undefined} selectionA - First block selection
 * @param {WPBlockSelection | undefined} selectionB - Second block selection
 * @return {boolean} True if block selections are equal, false otherwise
 */
function areBlockSelectionsEqual(
	selectionA: WPBlockSelection | undefined,
	selectionB: WPBlockSelection | undefined
): boolean {
	if ( selectionA === selectionB ) {
		return true;
	}

	if ( ! selectionA || ! selectionB ) {
		return false;
	}

	return (
		selectionA.clientId === selectionB.clientId &&
		selectionA.attributeKey === selectionB.attributeKey &&
		selectionA.offset === selectionB.offset
	);
}
