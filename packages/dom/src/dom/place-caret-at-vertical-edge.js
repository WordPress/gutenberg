/**
 * Internal dependencies
 */
import placeCaretAtHorizontalEdge from './place-caret-at-horizontal-edge';
import hiddenCaretRangeFromPoint from './hidden-caret-range-from-point';
import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * Places the caret at the top or bottom of a given element.
 *
 * @param {HTMLElement} container           Focusable element.
 * @param {boolean} isReverse           True for bottom, false for top.
 * @param {DOMRect} [rect]              The rectangle to position the caret with.
 * @param {boolean} [mayUseScroll=true] True to allow scrolling, false to disallow.
 */
export default function placeCaretAtVerticalEdge(
	container,
	isReverse,
	rect,
	mayUseScroll = true
) {
	if ( ! container ) {
		return;
	}

	if ( ! rect || ! container.isContentEditable ) {
		placeCaretAtHorizontalEdge( container, isReverse );
		return;
	}

	container.focus();

	// Offset by a buffer half the height of the caret rect. This is needed
	// because caretRangeFromPoint may default to the end of the selection if
	// offset is too close to the edge. It's unclear how to precisely calculate
	// this threshold; it may be the padded area of some combination of line
	// height, caret height, and font size. The buffer offset is effectively
	// equivalent to a point at half the height of a line of text.
	const buffer = rect.height / 2;
	const editableRect = container.getBoundingClientRect();
	const x = rect.left;
	const y = isReverse
		? editableRect.bottom - buffer
		: editableRect.top + buffer;

	const { ownerDocument } = container;
	const { defaultView } = ownerDocument;
	const range = hiddenCaretRangeFromPoint( ownerDocument, x, y, container );

	if ( ! range || ! container.contains( range.startContainer ) ) {
		if (
			mayUseScroll &&
			( ! range ||
				! range.startContainer ||
				! range.startContainer.contains( container ) )
		) {
			// Might be out of view.
			// Easier than attempting to calculate manually.
			container.scrollIntoView( isReverse );
			placeCaretAtVerticalEdge( container, isReverse, rect, false );
			return;
		}

		placeCaretAtHorizontalEdge( container, isReverse );
		return;
	}

	assertIsDefined( defaultView, 'defaultView' );
	const selection = defaultView.getSelection();
	assertIsDefined( selection, 'selection' );
	selection.removeAllRanges();
	selection.addRange( range );
}
