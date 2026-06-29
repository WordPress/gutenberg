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

	// Move a leading space out before the element.
	const firstChild = node.firstChild;
	if (
		firstChild &&
		firstChild.nodeType === node.TEXT_NODE &&
		isFormattingSpace( ( firstChild as Text ).data[ 0 ] )
	) {
		const text = firstChild as Text;
		text.data = text.data.replace( /^[ \r\n\t]+/, '' );

		if ( ! text.data ) {
			node.removeChild( text );
		}

		// Only re-insert a space if there's preceding content that doesn't
		// already end with one (and isn't a line break).
		const previousSibling = getSibling( node, 'previous' );
		if (
			previousSibling &&
			previousSibling.nodeName !== 'BR' &&
			previousSibling.textContent!.slice( -1 ) !== ' '
		) {
			node.parentNode!.insertBefore( doc.createTextNode( ' ' ), node );
		}
	}

	// Move a trailing space out after the element.
	const lastChild = node.lastChild;
	if (
		lastChild &&
		lastChild.nodeType === node.TEXT_NODE &&
		isFormattingSpace(
			( lastChild as Text ).data[ ( lastChild as Text ).data.length - 1 ]
		)
	) {
		const text = lastChild as Text;
		text.data = text.data.replace( /[ \r\n\t]+$/, '' );

		if ( ! text.data ) {
			node.removeChild( text );
		}

		// Only re-insert a space if there's following content that doesn't
		// already start with one (and isn't a line break).
		const nextSibling = getSibling( node, 'next' );
		if (
			nextSibling &&
			nextSibling.nodeName !== 'BR' &&
			! (
				nextSibling.nodeType === node.TEXT_NODE &&
				isFormattingSpace( nextSibling.textContent![ 0 ] )
			)
		) {
			node.parentNode!.insertBefore(
				doc.createTextNode( ' ' ),
				node.nextSibling
			);
		}
	}
}
