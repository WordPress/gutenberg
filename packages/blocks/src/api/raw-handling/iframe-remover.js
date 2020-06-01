/**
 * Removes iframes.
 *
 * @param {Node} node The node to check.
 *
 * @return {void}
 */
export default function iframeRemover( node ) {
	if ( node.nodeName === 'IFRAME' ) {
		const text = node.ownerDocument.createTextNode( node.src );
		node.parentNode.replaceChild( text, node );
	}
}
