/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import type { WPBlockSelection, WPSelection } from '../types';

// Set the current selection. This is used by the sync manager in async contexts
// to restore selection position when triggering an undo.
export function restoreSelection(
	selectionStart: WPBlockSelection,
	selectionEnd: WPBlockSelection
): void {
	const { resetSelection } = dispatch( blockEditorStore );
	if ( selectionStart.clientId === selectionEnd.clientId ) {
		// Selection within the same block works as expected.
		resetSelection(
			selectionStart,
			selectionEnd,
			null // initialPosition
		);
	} else {
		// resetSelection() does not work if the selection is across multiple blocks.
		// In this case, just put the caret at the start of the selection.
		resetSelection(
			selectionStart,
			selectionStart,
			null // initialPosition
		);
	}
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
