import isRTL from './is-rtl';
import getRangeHeight from './get-range-height';
import getRectangleFromRange from './get-rectangle-from-range';
import isSelectionForward from './is-selection-forward';
import hiddenCaretRangeFromPoint from './hidden-caret-range-from-point';
import { assertIsDefined } from '../utils/assert-is-defined';
import isInputOrTextArea from './is-input-or-text-area';
import { scrollIfNoRange } from './scroll-if-no-range';

/**
 * Check whether the selection is at the edge of the container. Checks for
 * horizontal position by default. Set `onlyVertical` to true to check only
 * vertically.
 *
 * @param container    Focusable element.
 * @param isReverse    Set to true to check left, false to check right.
 * @param onlyVertical Set to true to check only vertical position.
 *
 * @return True if at the edge, false if not.
 */
export default function isEdge(
	container: HTMLElement,
	isReverse: boolean,
	onlyVertical: boolean = false
): boolean {
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

	if ( ! container.isContentEditable ) {
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

	// The test point can only be hit-tested when it is within the viewport
	// (`caretRangeFromPoint` returns nothing for a point outside it, upon
	// which `scrollIfNoRange` scrolls the container's edge into view to
	// measure, e.g. on every arrow press within a container taller than the
	// viewport). When a container is taller than the viewport and the edge
	// is outside while the selection is within it, they are far apart along
	// that axis, so the selection cannot be at the edge. Check each axis
	// separately: the vertical check must not be short-circuited by a
	// horizontally overflowing container, and vice versa.
	// For containers that fit within the viewport (or when the selection is
	// near the edge), the edge must be measured directly (scrolling slightly
	// into view if needed) so arrow navigation can traverse blocks.
	const isFarFromVerticalEdge =
		containerRect.height > defaultView.innerHeight &&
		rangeRect.top >= 0 &&
		rangeRect.bottom <= defaultView.innerHeight &&
		( isReverse
			? y < 0 &&
				rangeRect.top - containerRect.top > defaultView.innerHeight / 2
			: y > defaultView.innerHeight &&
				containerRect.bottom - rangeRect.bottom >
					defaultView.innerHeight / 2 );
	const isFarFromHorizontalEdge =
		containerRect.width > defaultView.innerWidth &&
		rangeRect.left >= 0 &&
		rangeRect.right <= defaultView.innerWidth &&
		( isReverseDir
			? x < 0 &&
				rangeRect.left - containerRect.left > defaultView.innerWidth / 2
			: x > defaultView.innerWidth &&
				containerRect.right - rangeRect.right >
					defaultView.innerWidth / 2 );

	if (
		isFarFromVerticalEdge ||
		( ! onlyVertical && isFarFromHorizontalEdge )
	) {
		return false;
	}

	const getTestRange = () => {
		const rect = container.getBoundingClientRect();
		const testX = isReverseDir ? rect.left + 1 : rect.right - 1;
		const testY = isReverse ? rect.top + 1 : rect.bottom - 1;
		return hiddenCaretRangeFromPoint(
			ownerDocument,
			testX,
			testY,
			container
		);
	};

	const testRange = scrollIfNoRange( container, isReverse, getTestRange );

	if ( ! testRange ) {
		return false;
	}

	const testRect = getRectangleFromRange( testRange );

	if ( ! testRect ) {
		return false;
	}

	const updatedRangeRect = getRectangleFromRange( range ) || rangeRect;
	const updatedCollapsedRangeRect =
		getRectangleFromRange( collapsedRange ) || collapsedRangeRect;

	const verticalSide = isReverse ? 'top' : 'bottom';
	const horizontalSide = isReverseDir ? 'left' : 'right';
	const verticalDiff =
		testRect[ verticalSide ] - updatedRangeRect[ verticalSide ];
	const horizontalDiff =
		testRect[ horizontalSide ] -
		updatedCollapsedRangeRect[ horizontalSide ];

	// Allow the position to be 1px off.
	const hasVerticalDiff = Math.abs( verticalDiff ) <= 1;
	const hasHorizontalDiff = Math.abs( horizontalDiff ) <= 1;

	return onlyVertical
		? hasVerticalDiff
		: hasVerticalDiff && hasHorizontalDiff;
}
