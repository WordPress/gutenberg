import { isPhrasingContent } from '@wordpress/dom';
import { getSibling } from './utils';

/**
 * Walks back from the end of a line and removes what only pads it: line
 * breaks, non-breaking spaces and the nodes they leave empty. Stops at the
 * first node that keeps content.
 *
 * @param node            The node at the end of the line.
 * @param stopAtLineBreak Whether a line break ends the walk. Two line breaks
 *                        in a row are an empty line and are kept.
 */
function trimLineEnd( node: Node | undefined, stopAtLineBreak: boolean ): void {
	while ( node ) {
		// Step into the last child of inline elements.
		while (
			node.nodeType === node.ELEMENT_NODE &&
			node.nodeName !== 'BR' &&
			isPhrasingContent( node ) &&
			node.lastChild
		) {
			node = node.lastChild;
		}

		if ( node.nodeName === 'BR' ) {
			if ( stopAtLineBreak ) {
				return;
			}
		} else if ( node.nodeType === node.TEXT_NODE ) {
			const text = node as Text;
			const match = text.data.match( /[ \u00a0]+$/ );

			if ( ! match ) {
				return;
			}

			text.data = text.data.slice( 0, -match[ 0 ].length );

			if ( text.data ) {
				return;
			}
		} else {
			return;
		}

		const previous = getSibling( node, 'previous' );
		let parent = node.parentNode!;
		parent.removeChild( node );

		// Remove inline elements the removal left empty.
		while (
			! parent.hasChildNodes() &&
			isPhrasingContent( parent ) &&
			parent.parentNode
		) {
			const grandparent = parent.parentNode;
			grandparent.removeChild( parent );
			parent = grandparent;
		}

		node = previous;
	}
}

/**
 * Removes trailing whitespace from the end of a line: line breaks that
 * nothing follows, and non-breaking spaces before a line break or at the end
 * of a block. Word processors put a non-breaking space where a line ended
 * with a space, and once pasted it is invisible padding.
 *
 * @param node The node to be processed.
 */
export default function trailingWhitespaceRemover( node: Node ): void {
	if ( node.parentElement?.closest( 'pre' ) ) {
		return;
	}

	if ( node.nodeName === 'BR' ) {
		if ( getSibling( node, 'next' ) ) {
			trimLineEnd( getSibling( node, 'previous' ), true );
		} else {
			trimLineEnd( node, false );
		}
	} else if (
		node.nodeType === node.TEXT_NODE &&
		! getSibling( node, 'next' )
	) {
		trimLineEnd( node, false );
	}
}
