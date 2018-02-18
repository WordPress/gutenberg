/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Browser dependencies
 */
const { getComputedStyle } = window;
const { TEXT_NODE } = window.Node;

/**
 * Check whether the caret is horizontally at the edge of the container.
 *
 * @param {Element} container      Focusable element.
 * @param {boolean} isReverse      Set to true to check left, false for right.
 * @param {boolean} collapseRanges Whether or not to collapse the selection range before the check.
 *
 * @return {boolean} True if at the horizontal edge, false if not.
 */
export function isHorizontalEdge( container, isReverse, collapseRanges = false ) {
	if ( includes( [ 'INPUT', 'TEXTAREA' ], container.tagName ) ) {
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

	const selection = window.getSelection();
	let range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;
	if ( collapseRanges ) {
		range = range.cloneRange();
		range.collapse( isReverse );
	}

	if ( ! range || ! range.collapsed ) {
		return false;
	}

	const position = isReverse ? 'start' : 'end';
	const order = isReverse ? 'first' : 'last';
	const offset = range[ `${ position }Offset` ];

	let node = range.startContainer;

	if ( isReverse && offset !== 0 ) {
		return false;
	}

	const maxOffset = node.nodeType === TEXT_NODE ? node.nodeValue.length : node.childNodes.length;

	if ( ! isReverse && offset !== maxOffset ) {
		return false;
	}

	while ( node !== container ) {
		const parentNode = node.parentNode;

		if ( parentNode[ `${ order }Child` ] !== node ) {
			return false;
		}

		node = parentNode;
	}

	return true;
}

/**
 * Check whether the caret is vertically at the edge of the container.
 *
 * @param {Element} container      Focusable element.
 * @param {boolean} isReverse      Set to true to check top, false for bottom.
 * @param {boolean} collapseRanges Whether or not to collapse the selection range before the check.
 *
 * @return {boolean} True if at the edge, false if not.
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
 * @param {boolean} isReverse True for end, false for start.
 */
export function placeCaretAtHorizontalEdge( container, isReverse ) {
	if ( ! container ) {
		return;
	}

	if ( includes( [ 'INPUT', 'TEXTAREA' ], container.tagName ) ) {
		container.focus();
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
 * @param {Document} doc The document of the range.
 * @param {number}    x   Horizontal position within the current viewport.
 * @param {number}    y   Vertical position within the current viewport.
 *
 * @return {?Range} The best range for the given point.
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
 * @param {Document} doc       The document of the range.
 * @param {number}    x         Horizontal position within the current viewport.
 * @param {number}    y         Vertical position within the current viewport.
 * @param {Element}  container Container in which the range is expected to be found.
 *
 * @return {?Range} The best range for the given point.
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
 * @param {boolean} isReverse           True for bottom, false for top.
 * @param {DOMRect} [rect]              The rectangle to position the caret with.
 * @param {boolean} [mayUseScroll=true] True to allow scrolling, false to disallow.
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

/**
 * Check whether the given node in an input field.
 *
 * @param {HTMLElement} element The HTML element.
 *
 * @return {boolean} True if the element is an input field, false if not.
 */
export function isInputField( { nodeName, contentEditable } ) {
	return (
		nodeName === 'INPUT' ||
		nodeName === 'TEXTAREA' ||
		contentEditable === 'true'
	);
}

/**
 * Check wether the current document has a selection.
 * This checks both for focus in an input field and general text selection.
 *
 * @return {boolean} True if there is selection, false if not.
 */
export function documentHasSelection() {
	if ( isInputField( document.activeElement ) ) {
		return true;
	}

	const selection = window.getSelection();
	const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;

	return range && ! range.collapsed;
}

/**
 * Given a DOM node, finds the closest scrollable container node.
 *
 * @param {Element} node Node from which to start.
 *
 * @return {?Element} Scrollable container node, if found.
 */
export function getScrollContainer( node ) {
	if ( ! node ) {
		return;
	}

	// Scrollable if scrollable height exceeds displayed...
	if ( node.scrollHeight > node.clientHeight ) {
		// ...except when overflow is defined to be hidden or visible
		const { overflowY } = window.getComputedStyle( node );
		if ( /(auto|scroll)/.test( overflowY ) ) {
			return node;
		}
	}

	// Continue traversing
	return getScrollContainer( node.parentNode );
}
