/**
 * Maps a rich text character offset within an element to a DOM node and offset.
 * Text nodes count their length; void nodes such as line breaks or inline
 * objects count as a single character, the same way rich text counts them.
 *
 * @param {Element} element The rich text element.
 * @param {number}  offset  The character offset.
 *
 * @return {{node: Node, offset: number}} The DOM node and offset.
 */
function getPoint( element, offset ) {
	let remaining = offset;

	function walk( node ) {
		for ( const child of node.childNodes ) {
			if ( child.nodeType === child.TEXT_NODE ) {
				if ( remaining <= child.length ) {
					return { node: child, offset: remaining };
				}
				remaining -= child.length;
			} else if (
				child.nodeName === 'BR' ||
				child.getAttribute?.( 'contenteditable' ) === 'false'
			) {
				if ( remaining === 0 ) {
					const index = Array.prototype.indexOf.call(
						node.childNodes,
						child
					);
					return { node, offset: index };
				}
				remaining -= 1;
			} else {
				const found = walk( child );
				if ( found ) {
					return found;
				}
			}
		}
		return null;
	}

	return (
		walk( element ) ?? {
			node: element,
			offset: element.childNodes.length,
		}
	);
}

function getRichTextElement( ownerDocument, point ) {
	return ownerDocument.querySelector(
		`[data-block="${ point.clientId }"] [data-wp-block-attribute-key="${ point.attributeKey }"]`
	);
}

/**
 * Restores a selection on the DOM from the store. When blocks move, React
 * remounts them and the native selection that spanned the old nodes collapses.
 * The store keeps the selection, so the native range is rebuilt on the new
 * nodes once they are in place.
 *
 * @param {Document} ownerDocument The document the blocks live in.
 * @param {Object}   start         The selection start from the store.
 * @param {Object}   end           The selection end from the store.
 */
export function restoreSelection( ownerDocument, start, end ) {
	if (
		! ownerDocument ||
		! start?.clientId ||
		! end?.clientId ||
		start.offset === undefined ||
		end.offset === undefined
	) {
		return;
	}

	const { defaultView } = ownerDocument;
	// The blocks are about to move, which remounts them. Remember the current
	// nodes so the selection is only rebuilt once they have been replaced.
	const previousStart = getRichTextElement( ownerDocument, start );
	const previousEnd = getRichTextElement( ownerDocument, end );
	let attempts = 10;

	function apply() {
		const startElement = getRichTextElement( ownerDocument, start );
		const endElement = getRichTextElement( ownerDocument, end );

		// Wait until the blocks have re-rendered into fresh nodes; applying to
		// the old nodes would be undone when they are replaced.
		if (
			! startElement ||
			! endElement ||
			startElement === previousStart ||
			endElement === previousEnd
		) {
			if ( attempts-- > 0 ) {
				defaultView.requestAnimationFrame( apply );
			}
			return;
		}

		const startPoint = getPoint( startElement, start.offset );
		const endPoint = getPoint( endElement, end.offset );
		// `setBaseAndExtent` keeps the selection direction and orders the
		// boundaries itself, so a backward selection is not collapsed.
		defaultView
			.getSelection()
			.setBaseAndExtent(
				startPoint.node,
				startPoint.offset,
				endPoint.node,
				endPoint.offset
			);
	}

	apply();
}
