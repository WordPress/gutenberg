import { assertIsDefined } from '../utils/assert-is-defined';
import getComputedStyle from './get-computed-style';

/**
 * Get the rectangle of a given Range. Returns `null` if no suitable rectangle
 * can be found. Use instead of `Range.getBoundingClientRect()`, which is often
 * broken, especially for collapsed ranges.
 *
 * @param {Range} range The range.
 *
 * @return {DOMRect?} The rectangle.
 */
export default function getRectangleFromRange( range ) {
	// For uncollapsed ranges, get the rectangle that bounds the contents of the
	// range; this a rectangle enclosing the union of the bounding rectangles
	// for all the elements in the range.
	if ( ! range.collapsed ) {
		const rects = Array.from( range.getClientRects() );

		// If there's just a single rect, return it.
		if ( rects.length === 1 ) {
			return rects[ 0 ];
		}

		// Ignore tiny selection at the edge of a range.
		const filteredRects = rects.filter( ( { width } ) => width > 1 );

		// If it's full of tiny selections, return browser default.
		if ( filteredRects.length === 0 ) {
			return range.getBoundingClientRect();
		}

		if ( filteredRects.length === 1 ) {
			return filteredRects[ 0 ];
		}

		let {
			top: furthestTop,
			bottom: furthestBottom,
			left: furthestLeft,
			right: furthestRight,
		} = filteredRects[ 0 ];

		for ( const { top, bottom, left, right } of filteredRects ) {
			if ( top < furthestTop ) {
				furthestTop = top;
			}
			if ( bottom > furthestBottom ) {
				furthestBottom = bottom;
			}
			if ( left < furthestLeft ) {
				furthestLeft = left;
			}
			if ( right > furthestRight ) {
				furthestRight = right;
			}
		}

		return new window.DOMRect(
			furthestLeft,
			furthestTop,
			furthestRight - furthestLeft,
			furthestBottom - furthestTop
		);
	}

	let { startContainer, startOffset } = range;
	const { ownerDocument } = startContainer;
	assertIsDefined( ownerDocument, 'ownerDocument' );

	// Correct invalid "BR" ranges. The cannot contain any children.
	if ( startContainer.nodeName === 'BR' ) {
		const { parentNode } = startContainer;
		assertIsDefined( parentNode, 'parentNode' );
		startOffset = /** @type {Node[]} */ (
			Array.from( parentNode.childNodes )
		).indexOf( startContainer );
		startContainer = parentNode;
	}

	// An empty text node renders nothing: a position in it is the same spot
	// as its index in its parent.
	if (
		startContainer.nodeType === startContainer.TEXT_NODE &&
		/** @type {Text} */ ( startContainer ).length === 0
	) {
		const { parentNode } = startContainer;
		assertIsDefined( parentNode, 'parentNode' );
		startOffset = /** @type {Node[]} */ (
			Array.from( parentNode.childNodes )
		).indexOf( startContainer );
		startContainer = parentNode;
	}

	// A position on an element, between two of its children, is the same
	// spot as the start or the end of the text next to it, but only a
	// position inside a text node with content has a caret rectangle.
	// Translate it.
	if ( startContainer.nodeType !== startContainer.TEXT_NODE ) {
		const position = getTextPosition( startContainer, startOffset );
		if ( position ) {
			[ startContainer, startOffset ] = position;
		}
	}

	if ( startContainer !== range.startContainer ) {
		range = ownerDocument.createRange();
		range.setStart( startContainer, startOffset );
		range.setEnd( startContainer, startOffset );
	}

	const rects = range.getClientRects();

	// If we have multiple rectangles for a collapsed range, there's no way to
	// know which it is, so don't return anything.
	if ( rects.length > 1 ) {
		return null;
	}

	// A collapsed range at a soft line wrap is equally ambiguous: the same
	// position ends one line and starts the next. Some browsers (Gecko)
	// return a single rectangle for it, on the upper line, regardless of
	// where the caret is. Detect the boundary by measuring the characters
	// around the position: when they sit on different lines, there is no
	// way to know which line the caret is on, so don't return anything.
	if (
		rects.length === 1 &&
		startContainer.nodeType === startContainer.TEXT_NODE &&
		startOffset > 0 &&
		startOffset < /** @type {Text} */ ( startContainer ).length
	) {
		const measure = (
			/** @type {number} */ start,
			/** @type {number} */ end
		) => {
			const charRange = ownerDocument.createRange();
			charRange.setStart( startContainer, start );
			charRange.setEnd( startContainer, end );
			return charRange.getBoundingClientRect();
		};
		const before = measure( startOffset - 1, startOffset );
		const after = measure( startOffset, startOffset + 1 );

		if ( before.bottom <= after.top ) {
			return null;
		}
	}

	return rects[ 0 ] ?? null;
}

/**
 * The first or last non-empty text node inside a node, in document order.
 *
 * @param {Node}    node The node.
 * @param {boolean} last Whether to find the last one rather than the first.
 *
 * @return {Text?} The text node.
 */
function findText( node, last ) {
	if ( node.nodeType === node.TEXT_NODE ) {
		return /** @type {Text} */ ( node ).length
			? /** @type {Text} */ ( node )
			: null;
	}
	const children = Array.from( node.childNodes );
	if ( last ) {
		children.reverse();
	}
	for ( const child of children ) {
		const text = findText( child, last );
		if ( text ) {
			return text;
		}
	}
	return null;
}

/**
 * Translates a position on an element to the same spot inside the text next
 * to it: the start of the text that follows, else the end of the text that
 * precedes. A position after a line break belongs to the next line, which
 * is why the following text comes first. An inline element with no text
 * inside it, like the placeholder, takes up no caret position of its own,
 * so a position in it is the same spot as its own position in its parent.
 *
 * @param {Node}   node   The element.
 * @param {number} offset The offset between its children.
 *
 * @return {[Text, number]?} The text node and offset, or null when there is
 *                           no text on either side.
 */
function getTextPosition( node, offset ) {
	const children = Array.from( node.childNodes );
	for ( const child of children.slice( offset ) ) {
		const text = findText( child, false );
		if ( text ) {
			return [ text, 0 ];
		}
	}
	for ( const child of children.slice( 0, offset ).reverse() ) {
		const text = findText( child, true );
		if ( text ) {
			return [ text, text.length ];
		}
	}
	const { parentNode } = node;
	if (
		parentNode &&
		node.nodeType === node.ELEMENT_NODE &&
		getComputedStyle( /** @type {Element} */ ( node ) ).display.startsWith(
			'inline'
		)
	) {
		return getTextPosition(
			parentNode,
			/** @type {Node[]} */ (
				Array.from( parentNode.childNodes )
			).indexOf( node )
		);
	}
	return null;
}
