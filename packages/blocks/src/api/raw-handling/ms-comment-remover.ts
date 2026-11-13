import { remove, unwrap } from '@wordpress/dom';

/**
 * Removes Microsoft Word comments from pasted content.
 *
 * Word marks each comment in the text (e.g. `[AB1]`) and lists the comments,
 * with their authors, after the copied content. Both are removed. The text the
 * comment was made on is kept.
 *
 * @param node The node to check.
 */
export default function msCommentRemover( node: Node ): void {
	if ( node.nodeType !== node.ELEMENT_NODE ) {
		return;
	}

	const element = node as HTMLElement;
	const style = element.getAttribute( 'style' ) ?? '';

	// The list of comments, and each comment in it.
	if ( /mso-element:\s*comment/i.test( style ) ) {
		remove( element );
		return;
	}

	// The comment marker in the text, linking to the comment.
	if (
		element.classList.contains( 'MsoCommentReference' ) ||
		element.classList.contains( 'msocomanchor' )
	) {
		remove( element );
		return;
	}

	// The commented text is wrapped in an anchor without a link. An anchor
	// with a link is kept: it is a link the comment was made on.
	if (
		element.nodeName === 'A' &&
		! element.hasAttribute( 'href' ) &&
		/mso-comment-(reference|parent)/i.test( style )
	) {
		unwrap( element );
	}
}
