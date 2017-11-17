/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Browser dependencies
 */
const { getComputedStyle } = window;

const { ELEMENT_NODE, TEXT_NODE } = window.Node;

// Note: the filtered cursor positions don't consider more than one <br> yet.

// Returns an offset which ignores the last br if applicable
function getFilteredCursorEnd( node ) {
	const len = node.childNodes.length;
	if ( len > 0 ) {
		const last = node.childNodes[ len - 1 ];
		const hasBrLast = last.nodeType === ELEMENT_NODE && last.nodeName.toLowerCase() === 'br';
		return hasBrLast ? len - 1 : len;
	}

	return len;
}

// Returns an offset which ignores the first br if possible
function getFilteredCursorStart( node ) {
	const first = node.firstChild;
	if ( ! first ) {
		return 0;
	}
	const hasBrFirst = first.nodeType === ELEMENT_NODE && first.nodeName.toLowerCase() === 'br';
	return hasBrFirst ? 1 : 0;
}

/**
 * Check whether the offset is at the start of the node
 *
 * @param {Element} node    the DOM element
 * @param {Integer} offset  the offset
 * @return {Boolean}        whether or not the offset is at the first cursor position in node
 */
function isAtCursorStart( node, offset ) {
	// NOTE: In the future, we may want to skip some non-inhabitable positions in some nodes
	return offset === 0 || offset === getFilteredCursorStart( node );
}

/**
 * Check whether the offset is at the end of the node
 *
 * @param {Element} node    the DOM element
 * @param {Integer} offset  the offset
 * @return {Boolean}        whether or not the offset is at the last cursor position in node
 */
function isAtCursorEnd( node, offset ) {
	const nodeEnd = node.nodeType === TEXT_NODE ? node.nodeValue.length : node.childNodes.length;
	return offset === nodeEnd || offset === getFilteredCursorEnd( node );
}

function isEdgeChild( isReverse, parent, child ) {
	const candidate = isReverse ? parent.firstChild : parent.lastChild;
	return candidate === child;
}

/**
 * Check whether the caret is horizontally at the edge of the container.
 *
 * @param  {Element} container       Focusable element.
 * @param  {Boolean} isReverse       Set to true to check left, false for right.
 * @param  {Boolean} collapseRanges  Whether or not to collapse the selection range before the check
 * @return {Boolean}                 True if at the horizontal edge, false if not.
 */
export function isHorizontalEdge( container, isReverse, collapseRanges = false ) {
	if ( includes( [ 'INPUT', 'TEXTAREA' ], container.tagName ) ) {
		if ( container.selectionStart !== container.selectionEnd ) {
			return false;
		}

		const edge = isReverse ? 0 : container.value.length;
		return container.selectionStart === edge;
	}

	if ( ! container.isContentEditable ) {
		return true;
	}

	const selection = window.getSelection();
	let range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;
	if ( collapseRanges ) {
		range = range.cloneRange();
		range.collapse( isReverse );
	}

	if ( ! range || ! range.collapsed ) {
		return false;
	}

	let node = range.startContainer;
	const offset = range.startOffset;

	// If we are not at the start of our node (any node in container) then we are not at left edge.
	if ( isReverse && ! isAtCursorStart( node, offset ) ) {
		return false;
	}

	// If we are not at the end of of our node (any node in container) then we are not at right edge
	if ( ! isReverse && ! isAtCursorEnd( node, offset ) ) {
		return false;
	}

	// Traverse up the tree, exiting early if we are ever not at the edge child
	while ( node !== container ) {
		const parentNode = node.parentNode;

		if ( ! isEdgeChild( isReverse, parentNode, node ) ) {
			return false;
		}

		node = parentNode;
	}

	return true;
}

/**
 * Check whether the caret is vertically at the edge of the container.
 *
 * @param  {Element} container       Focusable element.
 * @param  {Boolean} isReverse       Set to true to check top, false for bottom.
 * @param  {Boolean} collapseRanges  Whether or not to collapse the selection range before the check
 * @return {Boolean}                 True if at the edge, false if not.
 */
export function isVerticalEdge( container, isReverse, collapseRanges = false ) {
	if ( includes( [ 'INPUT', 'TEXTAREA' ], container.tagName ) ) {
		return isHorizontalEdge( container, isReverse );
	}

	if ( ! container.isContentEditable ) {
		return true;
	}

	const selection = window.getSelection();
	let range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;
	if ( collapseRanges && range && ! range.collapsed ) {
		const newRange = document.createRange();
		// Get the end point of the selection (see focusNode vs. anchorNode)
		newRange.setStart( selection.focusNode, selection.focusOffset );
		newRange.collapse( true );
		range = newRange;
	}

	if ( ! range || ! range.collapsed ) {
		return false;
	}

	// Adjust for empty containers.
	const rangeRect =
		range.startContainer.nodeType === window.Node.ELEMENT_NODE ?
			range.startContainer.getBoundingClientRect() :
			range.getClientRects()[ 0 ];

	if ( ! rangeRect ) {
		return false;
	}

	const buffer = rangeRect.height / 2;
	const editableRect = container.getBoundingClientRect();

	// Too low.
	if ( isReverse && rangeRect.top - buffer > editableRect.top ) {
		return false;
	}

	// Too high.
	if ( ! isReverse && rangeRect.bottom + buffer < editableRect.bottom ) {
		return false;
	}

	return true;
}

export function computeCaretRect( container ) {
	if (
		includes( [ 'INPUT', 'TEXTAREA' ], container.tagName ) ||
		! container.isContentEditable
	) {
		return;
	}

	const selection = window.getSelection();
	const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;

	if ( ! range || ! range.collapsed ) {
		return;
	}

	// Adjust for empty containers.
	return range.startContainer.nodeType === window.Node.ELEMENT_NODE ?
		range.startContainer.getBoundingClientRect() :
		range.getClientRects()[ 0 ];
}

/**
 * Places the caret at start or end of a given element.
 *
 * @param {Element} container Focusable element.
 * @param {Boolean} isReverse True for end, false for start.
 */
export function placeCaretAtHorizontalEdge( container, isReverse ) {
	if ( ! container ) {
		return;
	}

	if ( includes( [ 'INPUT', 'TEXTAREA' ], container.tagName ) ) {
		container.focus();
		const offset = isReverse ? 0 : container.value.length;
		container.selectionStart = offset;
		container.selectionEnd = offset;
		return;
	}

	if ( ! container.isContentEditable ) {
		container.focus();
		return;
	}

	const selection = window.getSelection();
	const range = document.createRange();

	range.selectNodeContents( container );
	range.collapse( ! isReverse );

	selection.removeAllRanges();
	selection.addRange( range );

	container.focus();
}

/**
 * Polyfill.
 * Get a collapsed range for a given point.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/caretRangeFromPoint
 *
 * @param  {Document} doc The document of the range.
 * @param  {Float}    x   Horizontal position within the current viewport.
 * @param  {Float}    y   Vertical position within the current viewport.
 * @return {?Range}       The best range for the given point.
 */
function caretRangeFromPoint( doc, x, y ) {
	if ( doc.caretRangeFromPoint ) {
		return doc.caretRangeFromPoint( x, y );
	}

	if ( ! doc.caretPositionFromPoint ) {
		return null;
	}

	const point = doc.caretPositionFromPoint( x, y );
	const range = doc.createRange();

	range.setStart( point.offsetNode, point.offset );
	range.collapse( true );

	return range;
}

/**
 * Get a collapsed range for a given point.
 * Gives the container a temporary high z-index (above any UI).
 * This is preferred over getting the UI nodes and set styles there.
 *
 * @param  {Document} doc       The document of the range.
 * @param  {Float}    x         Horizontal position within the current viewport.
 * @param  {Float}    y         Vertical position within the current viewport.
 * @param  {Element}  container Container in which the range is expected to be found.
 * @return {?Range}             The best range for the given point.
 */
function hiddenCaretRangeFromPoint( doc, x, y, container ) {
	container.style.zIndex = '10000';

	const range = caretRangeFromPoint( doc, x, y );

	container.style.zIndex = null;

	return range;
}

/**
 * Places the caret at the top or bottom of a given element.
 *
 * @param {Element} container           Focusable element.
 * @param {Boolean} isReverse           True for bottom, false for top.
 * @param {DOMRect} [rect]              The rectangle to position the caret with.
 * @param {Boolean} [mayUseScroll=true] True to allow scrolling, false to disallow.
 */
export function placeCaretAtVerticalEdge( container, isReverse, rect, mayUseScroll = true ) {
	if ( ! container ) {
		return;
	}

	if ( ! rect || ! container.isContentEditable ) {
		placeCaretAtHorizontalEdge( container, isReverse );
		return;
	}

	const buffer = rect.height / 2;
	const editableRect = container.getBoundingClientRect();
	const x = rect.left + ( rect.width / 2 );
	const y = isReverse ? ( editableRect.bottom - buffer ) : ( editableRect.top + buffer );
	const selection = window.getSelection();

	let range = hiddenCaretRangeFromPoint( document, x, y, container );

	if ( ! range || ! container.contains( range.startContainer ) ) {
		if ( mayUseScroll && (
			( ! range || ! range.startContainer ) ||
				! range.startContainer.contains( container ) ) ) {
			// Might be out of view.
			// Easier than attempting to calculate manually.
			container.scrollIntoView( isReverse );
			placeCaretAtVerticalEdge( container, isReverse, rect, false );
			return;
		}

		placeCaretAtHorizontalEdge( container, isReverse );
		return;
	}

	// Check if the closest text node is actually further away.
	// If so, attempt to get the range again with the y position adjusted to get the right offset.
	if ( range.startContainer.nodeType === TEXT_NODE ) {
		const parentNode = range.startContainer.parentNode;
		const parentRect = parentNode.getBoundingClientRect();
		const side = isReverse ? 'bottom' : 'top';
		const padding = parseInt( getComputedStyle( parentNode ).getPropertyValue( `padding-${ side }` ), 10 ) || 0;
		const actualY = isReverse ? ( parentRect.bottom - padding - buffer ) : ( parentRect.top + padding + buffer );

		if ( y !== actualY ) {
			range = hiddenCaretRangeFromPoint( document, x, actualY, container );
		}
	}

	selection.removeAllRanges();
	selection.addRange( range );
	container.focus();
	// Editable was already focussed, it goes back to old range...
	// This fixes it.
	selection.removeAllRanges();
	selection.addRange( range );
}
