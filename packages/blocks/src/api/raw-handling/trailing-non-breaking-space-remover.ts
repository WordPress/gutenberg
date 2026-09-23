import { getSibling } from './utils';

/**
 * Removes non-breaking spaces from the end of a line of pasted text.
 *
 * Word processors turn a space typed at the end of a line into `&nbsp;` so
 * that it survives serialisation. Once pasted it is invisible and only pads
 * the end of the paragraph, so it is dropped when the text ends a block or is
 * followed by a line break. Any regular spaces mixed into that trailing run go
 * with it.
 *
 * @param node The node to be processed.
 */
export default function trailingNonBreakingSpaceRemover( node: Node ): void {
	if ( node.nodeType !== node.TEXT_NODE ) {
		return;
	}

	if ( node.parentElement?.closest( 'pre' ) ) {
		return;
	}

	const textNode = node as Text;
	const match = textNode.data.match( /[ \u00a0]+$/ );

	if ( ! match || ! match[ 0 ].includes( '\u00a0' ) ) {
		return;
	}

	const nextSibling = getSibling( node, 'next' );

	if ( nextSibling && nextSibling.nodeName !== 'BR' ) {
		return;
	}

	const newData = textNode.data.slice( 0, -match[ 0 ].length );

	if ( newData ) {
		textNode.data = newData;
		return;
	}

	const previousSibling = getSibling( node, 'previous' );

	// Remove the emptied node so sibling lookups on neighbours stay accurate.
	node.parentNode!.removeChild( node );

	// Without this node, a line break before it may now end the line. It was
	// already visited by `brRemover`, so remove it here.
	if (
		previousSibling?.nodeName === 'BR' &&
		! nextSibling &&
		! getSibling( previousSibling, 'next' )
	) {
		previousSibling.parentNode!.removeChild( previousSibling );
	}
}
