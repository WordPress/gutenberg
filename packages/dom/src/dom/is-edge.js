/**
 * Internal dependencies
 */
import isRTL from './is-rtl';
import getRangeHeight from './get-range-height';
import getRectangleFromRange from './get-rectangle-from-range';
import isSelectionForward from './is-selection-forward';
import hiddenCaretRangeFromPoint from './hidden-caret-range-from-point';
import { assertIsDefined } from '../utils/assert-is-defined';
import isInputOrTextArea from './is-input-or-text-area';

/**
 * Check whether the selection is at the edge of the container. Checks for
 * horizontal position by default. Set `onlyVertical` to true to check only
 * vertically.
 *
 * @param {Element} container            Focusable element.
 * @param {boolean} isReverse            Set to true to check left, false to check right.
 * @param {boolean} [onlyVertical=false] Set to true to check only vertical position.
 *
 * @return {boolean} True if at the edge, false if not.
 */
export default function isEdge( container, isReverse, onlyVertical = false ) {
	if (
		isInputOrTextArea( container ) &&
		typeof container.selectionStart === 'number'
	) {
		if ( container.selectionStart !== container.selectionEnd ) {
			return false;
		}

		if ( isReverse ) {
			return container.selectionStart === 0;
		}

		return container.value.length === container.selectionStart;
	}

	if ( ! (/** @type {HTMLElement} */ ( container ).isContentEditable) ) {
		return true;
	}

	const { ownerDocument } = container;
	const { defaultView } = ownerDocument;

	assertIsDefined( defaultView, 'defaultView' );
	const selection = defaultView.getSelection();

	if ( ! selection || ! selection.rangeCount ) {
		return false;
	}

	const range = selection.getRangeAt( 0 );
	const collapsedRange = range.cloneRange();
	const isForward = isSelectionForward( selection );
	const isCollapsed = selection.isCollapsed;

	// Collapse in direction of selection.
	if ( ! isCollapsed ) {
		collapsedRange.collapse( ! isForward );
	}

	const collapsedRangeRect = getRectangleFromRange( collapsedRange );
	const rangeRect = getRectangleFromRange( range );

	if ( ! collapsedRangeRect || ! rangeRect ) {
		return false;
	}

	// Only consider the multiline selection at the edge if the direction is
	// towards the edge. The selection is multiline if it is taller than the
	// collapsed  selection.
	const rangeHeight = getRangeHeight( range );
	if (
		! isCollapsed &&
		rangeHeight &&
		rangeHeight > collapsedRangeRect.height &&
		isForward === isReverse
	) {
		return false;
	}

	// In the case of RTL scripts, the horizontal edge is at the opposite side.
	const isReverseDir = isRTL( container ) ? ! isReverse : isReverse;
	const containerRect = container.getBoundingClientRect();

	// To check if a selection is at the edge, we insert a test selection at the
	// edge of the container and check if the selections have the same vertical
	// or horizontal position. If they do, the selection is at the edge.
	// This method proves to be better than a DOM-based calculation for the
	// horizontal edge, since it ignores empty textnodes and a trailing line
	// break element. In other words, we need to check visual positioning, not
	// DOM positioning.
	// It also proves better than using the computed style for the vertical
	// edge, because we cannot know the padding and line height reliably in
	// pixels. `getComputedStyle` may return a value with different units.
	const x = isReverseDir ? containerRect.left + 1 : containerRect.right - 1;
	const y = isReverse ? containerRect.top + 1 : containerRect.bottom - 1;
	const testRange = hiddenCaretRangeFromPoint(
		ownerDocument,
		x,
		y,
		/** @type {HTMLElement} */ ( container )
	);

	if ( ! testRange ) {
		return false;
	}

	const testRect = getRectangleFromRange( testRange );

	if ( ! testRect ) {
		return false;
	}

	const verticalSide = isReverse ? 'top' : 'bottom';
	const horizontalSide = isReverseDir ? 'left' : 'right';
	const verticalDiff = testRect[ verticalSide ] - rangeRect[ verticalSide ];
	const horizontalDiff =
		testRect[ horizontalSide ] - collapsedRangeRect[ horizontalSide ];

	// Allow the position to be 1px off.
	const hasVerticalDiff = Math.abs( verticalDiff ) <= 1;
	const hasHorizontalDiff = Math.abs( horizontalDiff ) <= 1;

	return onlyVertical
		? hasVerticalDiff
		: hasVerticalDiff && hasHorizontalDiff;
}
