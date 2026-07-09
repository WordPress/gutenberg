/**
 * WordPress dependencies
 */
import { isPhrasingContent } from '@wordpress/dom';

/**
 * Moves a space from one edge of an element out to the surrounding text.
 *
 * This runs alongside `htmlFormattingRemover`, which already strips an edge
 * space whenever the outside is separated (a block edge, a line break, or a
 * neighbour that ends/starts with a space). So an edge space only survives to
 * here when it abuts real content with no separator, in which case it always
 * needs hoisting out — no further checks required.
 *
 * `htmlFormattingRemover` also runs first, collapsing every run of `[ \r\n\t]`
 * to a single regular space, so the edge can only be a lone `' '` by now. A
 * non-breaking space (`&nbsp;`) is intentionally left untouched by both filters,
 * hence the strict `=== ' '` check rather than a general whitespace test.
 *
 * @param node      The element to be processed.
 * @param doc       The document of the node.
 * @param isLeading Whether to process the leading (`true`) or trailing edge.
 */
function moveEdgeSpace( node: Node, doc: Document, isLeading: boolean ): void {
	const child = isLeading ? node.firstChild : node.lastChild;

	if ( ! child || child.nodeType !== node.TEXT_NODE ) {
		return;
	}

	const text = child as Text;
	const edgeIndex = isLeading ? 0 : text.data.length - 1;

	if ( text.data[ edgeIndex ] !== ' ' ) {
		return;
	}

	// Strip the edge space from inside the element…
	text.data = isLeading ? text.data.slice( 1 ) : text.data.slice( 0, -1 );

	if ( ! text.data ) {
		node.removeChild( text );
	}

	// …and re-insert a single space just outside it.
	node.parentNode!.insertBefore(
		doc.createTextNode( ' ' ),
		isLeading ? node : node.nextSibling
	);
}

/**
 * Moves leading and trailing spaces out of inline formatting elements, so that
 * the formatting (a link, bold, italic…) wraps only its meaningful content.
 *
 * Some editors, notably Google Docs, place the space that separates a word from
 * an adjacent link *inside* the formatting element (e.g.
 * `before<a> text</a>after`). That leading/trailing space is purely
 * presentational and ends up underlined/linked, so it is hoisted to the
 * surrounding text instead (`before <a>text</a>after`).
 *
 * @param node The node to be processed.
 * @param doc  The document of the node.
 */
export default function formatSpaceCorrector(
	node: Node,
	doc: Document
): void {
	if ( node.nodeType !== node.ELEMENT_NODE || ! isPhrasingContent( node ) ) {
		return;
	}

	moveEdgeSpace( node, doc, true );
	moveEdgeSpace( node, doc, false );
}
