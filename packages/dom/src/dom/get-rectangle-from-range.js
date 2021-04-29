/**
 * Internal dependencies
 */
import { assertIsDefined } from '../utils/assert-is-defined';

/**
 * Get the rectangle of a given Range.
 *
 * @param {Range} range The range.
 *
 * @return {DOMRect} The rectangle.
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
			if ( top < furthestTop ) furthestTop = top;
			if ( bottom > furthestBottom ) furthestBottom = bottom;
			if ( left < furthestLeft ) furthestLeft = left;
			if ( right > furthestRight ) furthestRight = right;
		}

		return new window.DOMRect(
			furthestLeft,
			furthestTop,
			furthestRight - furthestLeft,
			furthestBottom - furthestTop
		);
	}

	const { startContainer } = range;
	const { ownerDocument } = startContainer;

	// Correct invalid "BR" ranges. The cannot contain any children.
	if ( startContainer.nodeName === 'BR' ) {
		const { parentNode } = startContainer;
		assertIsDefined( parentNode, 'parentNode' );
		const index = /** @type {Node[]} */ ( Array.from(
			parentNode.childNodes
		) ).indexOf( startContainer );

		assertIsDefined( ownerDocument, 'ownerDocument' );
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
		assertIsDefined( ownerDocument, 'ownerDocument' );
		const padNode = ownerDocument.createTextNode( '\u200b' );
		// Do not modify the live range.
		range = range.cloneRange();
		range.insertNode( padNode );
		rect = range.getClientRects()[ 0 ];
		assertIsDefined( padNode.parentNode, 'padNode.parentNode' );
		padNode.parentNode.removeChild( padNode );
	}

	return rect;
}
