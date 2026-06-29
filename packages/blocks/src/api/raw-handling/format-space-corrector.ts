/**
 * WordPress dependencies
 */
import { isPhrasingContent } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { getSibling } from './utils';

function isFormattingSpace( character: string ): boolean {
	return (
		character === ' ' ||
		character === '\r' ||
		character === '\n' ||
		character === '\t'
	);
}

/**
 * Moves a space from one edge of an element out to the surrounding text.
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
	const edgeChar = isLeading
		? text.data[ 0 ]
		: text.data[ text.data.length - 1 ];

	if ( ! isFormattingSpace( edgeChar ) ) {
		return;
	}

	// Strip the edge whitespace from inside the element.
	text.data = isLeading
		? text.data.replace( /^[ \r\n\t]+/, '' )
		: text.data.replace( /[ \r\n\t]+$/, '' );

	if ( ! text.data ) {
		node.removeChild( text );
	}

	// Re-insert a single space outside the element, unless a block edge, a line
	// break, or an adjacent space already separates the content.
	const sibling = getSibling( node, isLeading ? 'previous' : 'next' );

	if ( ! sibling || sibling.nodeName === 'BR' ) {
		return;
	}

	const siblingText = sibling.textContent!;
	const adjacentChar = isLeading ? siblingText.slice( -1 ) : siblingText[ 0 ];

	if ( isFormattingSpace( adjacentChar ) ) {
		return;
	}

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
 * surrounding text instead (`before <a>text</a>after`). Whitespace that would
 * land at the start or end of a block, or that is already provided by an
 * adjacent node, is dropped to avoid doubling up.
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
