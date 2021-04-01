/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Internal dependencies
 */
import hiddenCaretRangeFromPoint from './hidden-caret-range-from-point';

/**
 * Places the caret at start or end of a given element.
 *
 * @param {Element} container Focusable element.
 * @param {boolean} isReverse True for end, false for start.
 */
export default function placeCaretAtHorizontalEdge( container, isReverse ) {
	if ( ! container ) {
		return;
	}

	container.focus();

	if ( includes( [ 'INPUT', 'TEXTAREA' ], container.tagName ) ) {
		// The element may not support selection setting.
		if ( typeof container.selectionStart !== 'number' ) {
			return;
		}

		if ( isReverse ) {
			container.selectionStart = container.value.length;
			container.selectionEnd = container.value.length;
		} else {
			container.selectionStart = 0;
			container.selectionEnd = 0;
		}

		return;
	}

	if ( ! container.isContentEditable ) {
		return;
	}

	const { ownerDocument } = container;
	const { defaultView } = ownerDocument;
	const selection = defaultView.getSelection();
	const containerRect = container.getBoundingClientRect();
	// When placing at the end (isReverse), find the closest range to the bottom
	// right corner. When placing at the start, to the top left corner.
	const x = isReverse ? containerRect.right - 1 : containerRect.left + 1;
	const y = isReverse ? containerRect.bottom - 1 : containerRect.top + 1;
	const range = hiddenCaretRangeFromPoint( ownerDocument, x, y, container );

	selection.removeAllRanges();
	selection.addRange( range );
}
