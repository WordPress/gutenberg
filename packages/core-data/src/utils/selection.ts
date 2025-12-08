/**
 * Internal dependencies
 */
import type { WPBlockSelection, WPSelection } from '../types';

// Set the current selection. This is used by the
// sync manager to restore selection position when
// triggering an undo.
// Support block-level selection with just a clientId,
// and offset-based selection with additional parameters.
export function restoreSelection(
	selectionStart: WPBlockSelection,
	selectionEnd: WPBlockSelection
): void {
	console.log( 'In resetSelection with position:', selectionStart );
	// if (
	// 	areBlockSelectionsEqual( selectionStart, selectionEnd ) &&
	// 	! selectionStart.attributeKey
	// ) {
	// 	// Because selection doesn't have an attributeKey, it's a whole-block selection.
	// 	dispatch( blockEditorStore ).selectBlock( selectionStart.clientId );
	// } else {
	// 	// This selection has an attributeKey, so it's an offset-based selection.
	// 	dispatch( blockEditorStore ).resetSelection(
	// 		selectionStart,
	// 		selectionEnd,
	// 		null /* initialPosition */
	// 	);
	// }
}

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
