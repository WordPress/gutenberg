/**
 * Internal dependencies
 */
import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * Internal dependencies
 */
import hiddenCaretRangeFromPoint from './hidden-caret-range-from-point';
import isInputOrTextArea from './is-input-or-text-area';
import isRTL from './is-rtl';

/**
 * Places the caret at start or end of a given element.
 *
 * @param {HTMLElement} container    Focusable element.
 * @param {boolean} isReverse    True for end, false for start.
 * @param {boolean} [mayUseScroll=false] Whether to allow scrolling.
 */
export default function placeCaretAtHorizontalEdge(
	container,
	isReverse,
	mayUseScroll = false
) {
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

	const { ownerDocument } = container;
	// In the case of RTL scripts, the horizontal edge is at the opposite side.
	const isReverseDir = isRTL( container ) ? ! isReverse : isReverse;
	const containerRect = container.getBoundingClientRect();
	// When placing at the end (isReverse), find the closest range to the bottom
	// right corner. When placing at the start, to the top left corner.
	const x = isReverse ? containerRect.right - 1 : containerRect.left + 1;
	const y = isReverseDir ? containerRect.bottom - 1 : containerRect.top + 1;
	const range = hiddenCaretRangeFromPoint( ownerDocument, x, y, container );

	// If no range range can be created or it is outside the container, the
	// element may be out of view.
	if (
		! range ||
		! range.startContainer ||
		! container.contains( range.startContainer )
	) {
		if ( ! mayUseScroll ) {
			return;
		}

		// Only try to scroll into view once to avoid an infinite loop.
		mayUseScroll = false;
		container.scrollIntoView( isReverse );
		placeCaretAtHorizontalEdge( container, isReverse, mayUseScroll );
		return;
	}

	const { defaultView } = ownerDocument;
	assertIsDefined( defaultView, 'defaultView' );
	const selection = defaultView.getSelection();
	assertIsDefined( selection, 'selection' );
	selection.removeAllRanges();
	selection.addRange( range );
}
