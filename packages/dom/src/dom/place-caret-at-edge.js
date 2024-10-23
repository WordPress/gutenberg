/**
 * Internal dependencies
 */
import hiddenCaretRangeFromPoint from './hidden-caret-range-from-point';
import { assertIsDefined } from '../utils/assert-is-defined';
import isInputOrTextArea from './is-input-or-text-area';
import isRTL from './is-rtl';
import { scrollIfNoRange } from './scroll-if-no-range';

/**
 * Gets the range to place.
 *
 * @param {HTMLElement}      container Focusable element.
 * @param {boolean}          isReverse True for end, false for start.
 * @param {number|undefined} x         X coordinate to vertically position.
 *
 * @return {Range|null} The range to place.
 */
function getRange( container, isReverse, x ) {
	const { ownerDocument } = container;
	// In the case of RTL scripts, the horizontal edge is at the opposite side.
	const isReverseDir = isRTL( container ) ? ! isReverse : isReverse;
	const containerRect = container.getBoundingClientRect();
	// When placing at the end (isReverse), find the closest range to the bottom
	// right corner. When placing at the start, to the top left corner.
	// Ensure x is defined and within the container's boundaries. When it's
	// exactly at the boundary, it's not considered within the boundaries.
	if ( x === undefined ) {
		x = isReverse ? containerRect.right - 1 : containerRect.left + 1;
	} else if ( x <= containerRect.left ) {
		x = containerRect.left + 1;
	} else if ( x >= containerRect.right ) {
		x = containerRect.right - 1;
	}
	const y = isReverseDir ? containerRect.bottom - 1 : containerRect.top + 1;
	return hiddenCaretRangeFromPoint( ownerDocument, x, y, container );
}

/**
 * Places the caret at start or end of a given element.
 *
 * @param {HTMLElement}      container Focusable element.
 * @param {boolean}          isReverse True for end, false for start.
 * @param {number|undefined} x         X coordinate to vertically position.
 */
export default function placeCaretAtEdge( container, isReverse, x ) {
	if ( ! container ) {
		return;
	}

	container.focus();

	if ( isInputOrTextArea( container ) ) {
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

	const range = scrollIfNoRange( container, isReverse, () =>
		getRange( container, isReverse, x )
	);

	if ( ! range ) {
		return;
	}

	const { ownerDocument } = container;
	const { defaultView } = ownerDocument;
	assertIsDefined( defaultView, 'defaultView' );
	const selection = defaultView.getSelection();
	assertIsDefined( selection, 'selection' );
	selection.removeAllRanges();
	selection.addRange( range );
}
