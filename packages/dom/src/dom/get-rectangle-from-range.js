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

	const { startContainer, startOffset } = range;
	const { ownerDocument } = startContainer;
	assertIsDefined( ownerDocument, 'ownerDocument' );

	// A range inside an element with no children, like a line break or the
	// placeholder, is the same spot as the position before that element.
	if (
		startContainer.nodeType !== startContainer.TEXT_NODE &&
		! startContainer.childNodes.length &&
		startContainer.parentNode
	) {
		range = ownerDocument.createRange();
		range.setStartBefore( startContainer );
		range.collapse( true );
		return getRectangleFromRange( range );
	}

	// A collapsed range at an element offset has no rectangle. Translate it
	// to the text offset next to it: the end of the text before or the start
	// of the text after. When those sit on different lines the caret could
	// be on either, so return null.
	if ( startContainer.nodeType !== startContainer.TEXT_NODE ) {
		let before = startContainer.childNodes[ startOffset - 1 ];
		while ( before?.lastChild ) {
			before = before.lastChild;
		}
		let after = startContainer.childNodes[ startOffset ];
		while ( after?.firstChild ) {
			after = after.firstChild;
		}

		let beforeRange;
		if ( before && before.nodeType === before.TEXT_NODE ) {
			beforeRange = ownerDocument.createRange();
			beforeRange.setStart(
				before,
				/** @type {Text} */ ( before ).length
			);
			beforeRange.collapse( true );
		}
		let afterRange;
		if ( after && after.nodeType === after.TEXT_NODE ) {
			afterRange = ownerDocument.createRange();
			afterRange.setStart( after, 0 );
			afterRange.collapse( true );
		}

		if ( beforeRange && afterRange ) {
			const beforeRect = beforeRange.getClientRects()[ 0 ];
			const afterRect = afterRange.getClientRects()[ 0 ];
			if (
				beforeRect &&
				afterRect &&
				beforeRect.bottom <= afterRect.top
			) {
				return null;
			}
		}

		if ( afterRange ) {
			range = afterRange;
		} else if ( beforeRange ) {
			range = beforeRange;
		} else {
			return null;
		}
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
