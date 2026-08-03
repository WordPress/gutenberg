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

	// An element explicitly marked editable by inheritance
	// (contenteditable="inherit") is editable through an editing host
	// ancestor (e.g. an editable canvas wrapper) and cannot hold focus
	// itself. Place the range within it first, below, and then focus the
	// editing host, which adopts the selection placed within it. The order
	// matters: focusing an editing host without a selection makes Safari
	// asynchronously reveal a caret, scrolling the viewport.
	const isInheritedEditable =
		container.nodeType === container.ELEMENT_NODE &&
		!! container.isContentEditable &&
		container.contentEditable !== 'true';

	if ( ! isInheritedEditable ) {
		container.focus();
	}

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

	// Only place a caret if the container is an editable element: an editing
	// host, or explicitly marked editable by inheritance. A merely focusable
	// element (e.g. a block wrapper) is not a caret target.
	if ( container.contentEditable !== 'true' && ! isInheritedEditable ) {
		return;
	}

	let range;

	if ( isInheritedEditable && x === undefined ) {
		// Point-based caret lookup is unreliable for an element that is not
		// an editing host of its own: an empty paragraph under the editing
		// host hit-tests to a neighbour, and scrollIfNoRange scrolls the
		// viewport as a result. The horizontal edge needs no point; build
		// the range directly.
		range = container.ownerDocument.createRange();
		range.selectNodeContents( container );
		range.collapse( ! isReverse );
	} else {
		range = scrollIfNoRange( container, isReverse, () =>
			getRange( container, isReverse, x )
		);
	}

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

	if ( isInheritedEditable ) {
		const host = /** @type {HTMLElement|null} */ (
			container.closest( '[contenteditable="true"]' )
		);
		// Without preventScroll, focusing the editing host (e.g. the canvas
		// body) nudges the scroll position; the placed caret, not the host,
		// determines what should be revealed.
		host?.focus( { preventScroll: true } );

		// Gecko moves the selection when an editing host takes focus instead
		// of adopting the existing one: re-place the range if it no longer
		// matches.
		const liveRange =
			selection.rangeCount > 0 ? selection.getRangeAt( 0 ) : null;
		if (
			! liveRange ||
			liveRange.startContainer !== range.startContainer ||
			liveRange.startOffset !== range.startOffset ||
			liveRange.endContainer !== range.endContainer ||
			liveRange.endOffset !== range.endOffset
		) {
			selection.removeAllRanges();
			selection.addRange( range );
		}
	}
}
