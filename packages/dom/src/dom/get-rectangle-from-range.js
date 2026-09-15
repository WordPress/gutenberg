import { assertIsDefined } from '../utils/assert-is-defined';

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

	// Only a position inside a text node has a caret rectangle. A position
	// on an element, between two of its children, is the same spot as the
	// start of the child after it or the end of the child before it, and a
	// position inside an element with no children, like a line break or the
	// placeholder, is the same spot as the position before that element in
	// its parent. Measure a range at that text position instead.
	if ( range.startContainer.nodeType !== range.startContainer.TEXT_NODE ) {
		range = range.cloneRange();
		if (
			! range.startContainer.childNodes.length &&
			range.startContainer.parentNode
		) {
			range.setStartBefore( range.startContainer );
		}
		const { startContainer, startOffset } = range;
		// The start of the child at the offset, descended to its innermost
		// first node, else the end of the child before it, descended to its
		// innermost last node.
		let node = startContainer.childNodes[ startOffset ];
		let offset = 0;
		while ( node?.firstChild ) {
			node = node.firstChild;
		}
		if ( ! node || node.nodeType !== node.TEXT_NODE ) {
			node = startContainer.childNodes[ startOffset - 1 ];
			while ( node?.lastChild ) {
				node = node.lastChild;
			}
			offset = /** @type {Text} */ ( node )?.length;
		}
		if ( node && node.nodeType === node.TEXT_NODE ) {
			range.setStart( node, offset );
		}
		range.collapse( true );
	}

	const { startContainer } = range;
	const { ownerDocument } = startContainer;

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
		range.startOffset > 0 &&
		range.startOffset < /** @type {Text} */ ( startContainer ).length
	) {
		assertIsDefined( ownerDocument, 'ownerDocument' );
		const measure = (
			/** @type {number} */ start,
			/** @type {number} */ end
		) => {
			const charRange = ownerDocument.createRange();
			charRange.setStart( startContainer, start );
			charRange.setEnd( startContainer, end );
			return charRange.getBoundingClientRect();
		};
		const before = measure( range.startOffset - 1, range.startOffset );
		const after = measure( range.startOffset, range.startOffset + 1 );

		if ( before.bottom <= after.top ) {
			return null;
		}
	}

	return rects[ 0 ] ?? null;
}
