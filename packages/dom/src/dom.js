/**
 * External dependencies
 */
import { includes, noop } from 'lodash';

/**
 * Internal dependencies
 */
import { isPhrasingContent } from './phrasing-content';

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

/**
 * Returns true if the given selection object is in the forward direction, or
 * false otherwise.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
 *
 * @param {Selection} selection Selection object to check.
 *
 * @return {boolean} Whether the selection is forward.
 */
function isSelectionForward( selection ) {
	const { anchorNode, focusNode, anchorOffset, focusOffset } = selection;

	const position = anchorNode.compareDocumentPosition( focusNode );

	// Disable reason: `Node#compareDocumentPosition` returns a bitmask value,
	// so bitwise operators are intended.
	/* eslint-disable no-bitwise */
	// Compare whether anchor node precedes focus node. If focus node (where
	// end of selection occurs) is after the anchor node, it is forward.
	if ( position & anchorNode.DOCUMENT_POSITION_PRECEDING ) {
		return false;
	}

	if ( position & anchorNode.DOCUMENT_POSITION_FOLLOWING ) {
		return true;
	}
	/* eslint-enable no-bitwise */

	// `compareDocumentPosition` returns 0 when passed the same node, in which
	// case compare offsets.
	if ( position === 0 ) {
		return anchorOffset <= focusOffset;
	}

	// This should never be reached, but return true as default case.
	return true;
}

/**
 * Check whether the selection is at the edge of the container. Checks for
 * horizontal position by default. Set `onlyVertical` to true to check only
 * vertically.
 *
 * @param {Element} container    Focusable element.
 * @param {boolean} isReverse    Set to true to check left, false to check right.
 * @param {boolean} onlyVertical Set to true to check only vertical position.
 *
 * @return {boolean} True if at the edge, false if not.
 */
function isEdge( container, isReverse, onlyVertical ) {
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

	const { ownerDocument } = container;
	const { defaultView } = ownerDocument;

	const selection = defaultView.getSelection();

	if ( ! selection.rangeCount ) {
		return false;
	}

	const originalRange = selection.getRangeAt( 0 );
	const range = originalRange.cloneRange();
	const isForward = isSelectionForward( selection );
	const isCollapsed = selection.isCollapsed;

	// Collapse in direction of selection.
	if ( ! isCollapsed ) {
		range.collapse( ! isForward );
	}

	const rangeRect = getRectangleFromRange( range );

	if ( ! rangeRect ) {
		return false;
	}

	const computedStyle = getComputedStyle( container );
	const lineHeight = parseInt( computedStyle.lineHeight, 10 ) || 0;

	// Only consider the multiline selection at the edge if the direction is
	// towards the edge.
	if (
		! isCollapsed &&
		rangeRect.height > lineHeight &&
		isForward === isReverse
	) {
		return false;
	}

	const padding =
		parseInt(
			computedStyle[ `padding${ isReverse ? 'Top' : 'Bottom' }` ],
			10
		) || 0;

	// Calculate a buffer that is half the line height. In some browsers, the
	// selection rectangle may not fill the entire height of the line, so we add
	// 3/4 the line height to the selection rectangle to ensure that it is well
	// over its line boundary.
	const buffer = ( 3 * parseInt( lineHeight, 10 ) ) / 4;
	const containerRect = container.getBoundingClientRect();
	const originalRangeRect = getRectangleFromRange( originalRange );
	const verticalEdge = isReverse
		? containerRect.top + padding > originalRangeRect.top - buffer
		: containerRect.bottom - padding < originalRangeRect.bottom + buffer;

	if ( ! verticalEdge ) {
		return false;
	}

	if ( onlyVertical ) {
		return true;
	}

	// In the case of RTL scripts, the horizontal edge is at the opposite side.
	const { direction } = computedStyle;
	const isReverseDir = direction === 'rtl' ? ! isReverse : isReverse;

	// To calculate the horizontal position, we insert a test range and see if
	// this test range has the same horizontal position. This method proves to
	// be better than a DOM-based calculation, because it ignores empty text
	// nodes and a trailing line break element. In other words, we need to check
	// visual positioning, not DOM positioning.
	const x = isReverseDir ? containerRect.left + 1 : containerRect.right - 1;
	const y = isReverse
		? containerRect.top + buffer
		: containerRect.bottom - buffer;
	const testRange = hiddenCaretRangeFromPoint(
		ownerDocument,
		x,
		y,
		container
	);

	if ( ! testRange ) {
		return false;
	}

	const side = isReverseDir ? 'left' : 'right';
	const testRect = getRectangleFromRange( testRange );

	// Allow the position to be 1px off.
	return Math.abs( testRect[ side ] - rangeRect[ side ] ) <= 1;
}

/**
 * Check whether the selection is horizontally at the edge of the container.
 *
 * @param {Element} container Focusable element.
 * @param {boolean} isReverse Set to true to check left, false for right.
 *
 * @return {boolean} True if at the horizontal edge, false if not.
 */
export function isHorizontalEdge( container, isReverse ) {
	return isEdge( container, isReverse );
}

/**
 * Check whether the selection is vertically at the edge of the container.
 *
 * @param {Element} container Focusable element.
 * @param {boolean} isReverse Set to true to check top, false for bottom.
 *
 * @return {boolean} True if at the vertical edge, false if not.
 */
export function isVerticalEdge( container, isReverse ) {
	return isEdge( container, isReverse, true );
}

/**
 * Get the rectangle of a given Range.
 *
 * @param {Range} range The range.
 *
 * @return {DOMRect} The rectangle.
 */
export function getRectangleFromRange( range ) {
	// For uncollapsed ranges, get the rectangle that bounds the contents of the
	// range; this a rectangle enclosing the union of the bounding rectangles
	// for all the elements in the range.
	if ( ! range.collapsed ) {
		return range.getBoundingClientRect();
	}

	const { startContainer } = range;
	const { ownerDocument } = startContainer;

	// Correct invalid "BR" ranges. The cannot contain any children.
	if ( startContainer.nodeName === 'BR' ) {
		const { parentNode } = startContainer;
		const index = Array.from( parentNode.childNodes ).indexOf(
			startContainer
		);

		range = ownerDocument.createRange();
		range.setStart( parentNode, index );
		range.setEnd( parentNode, index );
	}

	let rect = range.getClientRects()[ 0 ];

	// If the collapsed range starts (and therefore ends) at an element node,
	// `getClientRects` can be empty in some browsers. This can be resolved
	// by adding a temporary text node with zero-width space to the range.
	//
	// See: https://stackoverflow.com/a/6847328/995445
	if ( ! rect ) {
		const padNode = ownerDocument.createTextNode( '\u200b' );
		// Do not modify the live range.
		range = range.cloneRange();
		range.insertNode( padNode );
		rect = range.getClientRects()[ 0 ];
		padNode.parentNode.removeChild( padNode );
	}

	return rect;
}

/**
 * Get the rectangle for the selection in a container.
 *
 * @param {Window} win The window of the selection.
 *
 * @return {?DOMRect} The rectangle.
 */
export function computeCaretRect( win ) {
	const selection = win.getSelection();
	const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;

	if ( ! range ) {
		return;
	}

	return getRectangleFromRange( range );
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

	container.focus();

	if ( ! container.isContentEditable ) {
		return;
	}

	// Select on extent child of the container, not the container itself. This
	// avoids the selection always being `endOffset` of 1 when placed at end,
	// where `startContainer`, `endContainer` would always be container itself.
	const rangeTarget = container[ isReverse ? 'lastChild' : 'firstChild' ];

	// If no range target, it implies that the container is empty. Focusing is
	// sufficient for caret to be placed correctly.
	if ( ! rangeTarget ) {
		return;
	}

	const { ownerDocument } = container;
	const { defaultView } = ownerDocument;
	const selection = defaultView.getSelection();
	const range = ownerDocument.createRange();

	range.selectNodeContents( rangeTarget );
	range.collapse( ! isReverse );

	selection.removeAllRanges();
	selection.addRange( range );
}

/**
 * Polyfill.
 * Get a collapsed range for a given point.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/caretRangeFromPoint
 *
 * @param {Document} doc  The document of the range.
 * @param {number}   x    Horizontal position within the current viewport.
 * @param {number}   y    Vertical position within the current viewport.
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

	// If x or y are negative, outside viewport, or there is no text entry node.
	// https://developer.mozilla.org/en-US/docs/Web/API/Document/caretRangeFromPoint
	if ( ! point ) {
		return null;
	}

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
	const originalZIndex = container.style.zIndex;
	const originalPosition = container.style.position;

	// A z-index only works if the element position is not static.
	container.style.zIndex = '10000';
	container.style.position = 'relative';

	const range = caretRangeFromPoint( doc, x, y );

	container.style.zIndex = originalZIndex;
	container.style.position = originalPosition;

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
export function placeCaretAtVerticalEdge(
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

	const selection = defaultView.getSelection();
	selection.removeAllRanges();
	selection.addRange( range );
	container.focus();
	// Editable was already focussed, it goes back to old range...
	// This fixes it.
	selection.removeAllRanges();
	selection.addRange( range );
}

/**
 * Check whether the given element is a text field, where text field is defined
 * by the ability to select within the input, or that it is contenteditable.
 *
 * See: https://html.spec.whatwg.org/#textFieldSelection
 *
 * @param {HTMLElement} element The HTML element.
 *
 * @return {boolean} True if the element is an text field, false if not.
 */
export function isTextField( element ) {
	const { nodeName, contentEditable } = element;
	const nonTextInputs = [
		'button',
		'checkbox',
		'hidden',
		'file',
		'radio',
		'image',
		'range',
		'reset',
		'submit',
		'number',
	];
	return (
		( nodeName === 'INPUT' && ! nonTextInputs.includes( element.type ) ) ||
		nodeName === 'TEXTAREA' ||
		contentEditable === 'true'
	);
}

/**
 * Check whether the given element is an input field of type number
 * and has a valueAsNumber
 *
 * @param {HTMLElement} element The HTML element.
 *
 * @return {boolean} True if the element is input and holds a number.
 */
export function isNumberInput( element ) {
	const { nodeName, type, valueAsNumber } = element;

	return nodeName === 'INPUT' && type === 'number' && !! valueAsNumber;
}

/**
 * Check whether the current document has selected text. This applies to ranges
 * of text in the document, and not selection inside <input> and <textarea>
 * elements.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection#Related_objects.
 *
 * @param {Document} doc The document to check.
 *
 * @return {boolean} True if there is selection, false if not.
 */
export function documentHasTextSelection( doc ) {
	const selection = doc.defaultView.getSelection();
	const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;
	return range && ! range.collapsed;
}

/**
 * Check whether the given element, assumed an input field or textarea,
 * contains a (uncollapsed) selection of text.
 *
 * Note: this is perhaps an abuse of the term "selection", since these elements
 * manage selection differently and aren't covered by Selection#collapsed.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection#Related_objects.
 *
 * @param {HTMLElement} element The HTML element.
 *
 * @return {boolean} Whether the input/textareaa element has some "selection".
 */
function inputFieldHasUncollapsedSelection( element ) {
	if ( ! isTextField( element ) && ! isNumberInput( element ) ) {
		return false;
	}
	try {
		const { selectionStart, selectionEnd } = element;

		return selectionStart !== null && selectionStart !== selectionEnd;
	} catch ( error ) {
		// Safari throws an exception when trying to get `selectionStart`
		// on non-text <input> elements (which, understandably, don't
		// have the text selection API). We catch this via a try/catch
		// block, as opposed to a more explicit check of the element's
		// input types, because of Safari's non-standard behavior. This
		// also means we don't have to worry about the list of input
		// types that support `selectionStart` changing as the HTML spec
		// evolves over time.
		return false;
	}
}

/**
 * Check whether the current document has any sort of selection. This includes
 * ranges of text across elements and any selection inside <input> and
 * <textarea> elements.
 *
 * @param {Document} doc The document to check.
 *
 * @return {boolean} Whether there is any sort of "selection" in the document.
 */
export function documentHasUncollapsedSelection( doc ) {
	return (
		documentHasTextSelection( doc ) ||
		inputFieldHasUncollapsedSelection( doc.activeElement )
	);
}

/**
 * Check whether the current document has a selection. This checks for both
 * focus in an input field and general text selection.
 *
 * @param {Document} doc The document to check.
 *
 * @return {boolean} True if there is selection, false if not.
 */
export function documentHasSelection( doc ) {
	return (
		isTextField( doc.activeElement ) ||
		isNumberInput( doc.activeElement ) ||
		documentHasTextSelection( doc )
	);
}

/**
 * Check whether the contents of the element have been entirely selected.
 * Returns true if there is no possibility of selection.
 *
 * @param {Element} element The element to check.
 *
 * @return {boolean} True if entirely selected, false if not.
 */
export function isEntirelySelected( element ) {
	if ( includes( [ 'INPUT', 'TEXTAREA' ], element.nodeName ) ) {
		return (
			element.selectionStart === 0 &&
			element.value.length === element.selectionEnd
		);
	}

	if ( ! element.isContentEditable ) {
		return true;
	}

	const { ownerDocument } = element;
	const { defaultView } = ownerDocument;
	const selection = defaultView.getSelection();
	const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;

	if ( ! range ) {
		return true;
	}

	const { startContainer, endContainer, startOffset, endOffset } = range;

	if (
		startContainer === element &&
		endContainer === element &&
		startOffset === 0 &&
		endOffset === element.childNodes.length
	) {
		return true;
	}

	const lastChild = element.lastChild;
	const lastChildContentLength =
		lastChild.nodeType === lastChild.TEXT_NODE
			? lastChild.data.length
			: lastChild.childNodes.length;

	return (
		startContainer === element.firstChild &&
		endContainer === element.lastChild &&
		startOffset === 0 &&
		endOffset === lastChildContentLength
	);
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
		const { overflowY } = getComputedStyle( node );
		if ( /(auto|scroll)/.test( overflowY ) ) {
			return node;
		}
	}

	// Continue traversing
	return getScrollContainer( node.parentNode );
}

/**
 * Returns the closest positioned element, or null under any of the conditions
 * of the offsetParent specification. Unlike offsetParent, this function is not
 * limited to HTMLElement and accepts any Node (e.g. Node.TEXT_NODE).
 *
 * @see https://drafts.csswg.org/cssom-view/#dom-htmlelement-offsetparent
 *
 * @param {Node} node Node from which to find offset parent.
 *
 * @return {?Node} Offset parent.
 */
export function getOffsetParent( node ) {
	// Cannot retrieve computed style or offset parent only anything other than
	// an element node, so find the closest element node.
	let closestElement;
	while ( ( closestElement = node.parentNode ) ) {
		if ( closestElement.nodeType === closestElement.ELEMENT_NODE ) {
			break;
		}
	}

	if ( ! closestElement ) {
		return null;
	}

	// If the closest element is already positioned, return it, as offsetParent
	// does not otherwise consider the node itself.
	if ( getComputedStyle( closestElement ).position !== 'static' ) {
		return closestElement;
	}

	return closestElement.offsetParent;
}

/**
 * Given two DOM nodes, replaces the former with the latter in the DOM.
 *
 * @param {Element} processedNode Node to be removed.
 * @param {Element} newNode       Node to be inserted in its place.
 * @return {void}
 */
export function replace( processedNode, newNode ) {
	insertAfter( newNode, processedNode.parentNode );
	remove( processedNode );
}

/**
 * Given a DOM node, removes it from the DOM.
 *
 * @param {Element} node Node to be removed.
 * @return {void}
 */
export function remove( node ) {
	node.parentNode.removeChild( node );
}

/**
 * Given two DOM nodes, inserts the former in the DOM as the next sibling of
 * the latter.
 *
 * @param {Element} newNode       Node to be inserted.
 * @param {Element} referenceNode Node after which to perform the insertion.
 * @return {void}
 */
export function insertAfter( newNode, referenceNode ) {
	referenceNode.parentNode.insertBefore( newNode, referenceNode.nextSibling );
}

/**
 * Unwrap the given node. This means any child nodes are moved to the parent.
 *
 * @param {Node} node The node to unwrap.
 *
 * @return {void}
 */
export function unwrap( node ) {
	const parent = node.parentNode;

	while ( node.firstChild ) {
		parent.insertBefore( node.firstChild, node );
	}

	parent.removeChild( node );
}

/**
 * Replaces the given node with a new node with the given tag name.
 *
 * @param {Element}  node    The node to replace
 * @param {string}   tagName The new tag name.
 *
 * @return {Element} The new node.
 */
export function replaceTag( node, tagName ) {
	const newNode = node.ownerDocument.createElement( tagName );

	while ( node.firstChild ) {
		newNode.appendChild( node.firstChild );
	}

	node.parentNode.replaceChild( newNode, node );

	return newNode;
}

/**
 * Wraps the given node with a new node with the given tag name.
 *
 * @param {Element} newNode       The node to insert.
 * @param {Element} referenceNode The node to wrap.
 */
export function wrap( newNode, referenceNode ) {
	referenceNode.parentNode.insertBefore( newNode, referenceNode );
	newNode.appendChild( referenceNode );
}

/**
 * Removes any HTML tags from the provided string.
 *
 * @param {string} html The string containing html.
 *
 * @return {string} The text content with any html removed.
 */
export function __unstableStripHTML( html ) {
	const document = new window.DOMParser().parseFromString(
		html,
		'text/html'
	);
	return document.body.textContent || '';
}

/**
 * Given a schema, unwraps or removes nodes, attributes and classes on a node
 * list.
 *
 * @param {NodeList} nodeList The nodeList to filter.
 * @param {Document} doc      The document of the nodeList.
 * @param {Object}   schema   An array of functions that can mutate with the provided node.
 * @param {Object}   inline   Whether to clean for inline mode.
 */
function cleanNodeList( nodeList, doc, schema, inline ) {
	Array.from( nodeList ).forEach( ( node ) => {
		const tag = node.nodeName.toLowerCase();

		// It's a valid child, if the tag exists in the schema without an isMatch
		// function, or with an isMatch function that matches the node.
		if (
			schema.hasOwnProperty( tag ) &&
			( ! schema[ tag ].isMatch || schema[ tag ].isMatch( node ) )
		) {
			if ( node.nodeType === node.ELEMENT_NODE ) {
				const {
					attributes = [],
					classes = [],
					children,
					require = [],
					allowEmpty,
				} = schema[ tag ];

				// If the node is empty and it's supposed to have children,
				// remove the node.
				if ( children && ! allowEmpty && isEmpty( node ) ) {
					remove( node );
					return;
				}

				if ( node.hasAttributes() ) {
					// Strip invalid attributes.
					Array.from( node.attributes ).forEach( ( { name } ) => {
						if (
							name !== 'class' &&
							! includes( attributes, name )
						) {
							node.removeAttribute( name );
						}
					} );

					// Strip invalid classes.
					// In jsdom-jscore, 'node.classList' can be undefined.
					// TODO: Explore patching this in jsdom-jscore.
					if ( node.classList && node.classList.length ) {
						const mattchers = classes.map( ( item ) => {
							if ( typeof item === 'string' ) {
								return ( className ) => className === item;
							} else if ( item instanceof RegExp ) {
								return ( className ) => item.test( className );
							}

							return noop;
						} );

						Array.from( node.classList ).forEach( ( name ) => {
							if (
								! mattchers.some( ( isMatch ) =>
									isMatch( name )
								)
							) {
								node.classList.remove( name );
							}
						} );

						if ( ! node.classList.length ) {
							node.removeAttribute( 'class' );
						}
					}
				}

				if ( node.hasChildNodes() ) {
					// Do not filter any content.
					if ( children === '*' ) {
						return;
					}

					// Continue if the node is supposed to have children.
					if ( children ) {
						// If a parent requires certain children, but it does
						// not have them, drop the parent and continue.
						if (
							require.length &&
							! node.querySelector( require.join( ',' ) )
						) {
							cleanNodeList(
								node.childNodes,
								doc,
								schema,
								inline
							);
							unwrap( node );
							// If the node is at the top, phrasing content, and
							// contains children that are block content, unwrap
							// the node because it is invalid.
						} else if (
							node.parentNode.nodeName === 'BODY' &&
							isPhrasingContent( node )
						) {
							cleanNodeList(
								node.childNodes,
								doc,
								schema,
								inline
							);

							if (
								Array.from( node.childNodes ).some(
									( child ) => ! isPhrasingContent( child )
								)
							) {
								unwrap( node );
							}
						} else {
							cleanNodeList(
								node.childNodes,
								doc,
								children,
								inline
							);
						}
						// Remove children if the node is not supposed to have any.
					} else {
						while ( node.firstChild ) {
							remove( node.firstChild );
						}
					}
				}
			}
			// Invalid child. Continue with schema at the same place and unwrap.
		} else {
			cleanNodeList( node.childNodes, doc, schema, inline );

			// For inline mode, insert a line break when unwrapping nodes that
			// are not phrasing content.
			if (
				inline &&
				! isPhrasingContent( node ) &&
				node.nextElementSibling
			) {
				insertAfter( doc.createElement( 'br' ), node );
			}

			unwrap( node );
		}
	} );
}

/**
 * Recursively checks if an element is empty. An element is not empty if it
 * contains text or contains elements with attributes such as images.
 *
 * @param {Element} element The element to check.
 *
 * @return {boolean} Wether or not the element is empty.
 */
export function isEmpty( element ) {
	if ( ! element.hasChildNodes() ) {
		return true;
	}

	return Array.from( element.childNodes ).every( ( node ) => {
		if ( node.nodeType === node.TEXT_NODE ) {
			return ! node.nodeValue.trim();
		}

		if ( node.nodeType === node.ELEMENT_NODE ) {
			if ( node.nodeName === 'BR' ) {
				return true;
			} else if ( node.hasAttributes() ) {
				return false;
			}

			return isEmpty( node );
		}

		return true;
	} );
}

/**
 * Given a schema, unwraps or removes nodes, attributes and classes on HTML.
 *
 * @param {string} HTML   The HTML to clean up.
 * @param {Object} schema Schema for the HTML.
 * @param {Object} inline Whether to clean for inline mode.
 *
 * @return {string} The cleaned up HTML.
 */
export function removeInvalidHTML( HTML, schema, inline ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	cleanNodeList( doc.body.childNodes, doc, schema, inline );

	return doc.body.innerHTML;
}
