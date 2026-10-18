import { getSibling } from './utils';

/**
 * Replaces non-breaking spaces at the start and end of a text node with
 * regular spaces. Browsers insert them where text meets an element, such as
 * before a link, and Word puts them at the end of lines. Spaces left at the
 * end of a line or doubled up are removed by `htmlFormattingRemover`. Text
 * that is nothing but non-breaking spaces, on its own, is left alone.
 *
 * @param node The node to be processed.
 */
export default function nonBreakingSpaceCorrector( node: Node ): void {
	if ( node.nodeType !== node.TEXT_NODE ) {
		return;
	}

	if ( node.parentElement?.closest( 'pre' ) ) {
		return;
	}

	const text = node as Text;

	// Nothing but non-breaking spaces, with nothing around it, is deliberate:
	// a copied one, or a blank line from a word processor.
	if (
		/^\u00a0+$/.test( text.data ) &&
		! getSibling( node, 'previous' ) &&
		! getSibling( node, 'next' )
	) {
		return;
	}

	text.data = text.data.replace( /^\u00a0+|\u00a0+$/g, ' ' );
}
