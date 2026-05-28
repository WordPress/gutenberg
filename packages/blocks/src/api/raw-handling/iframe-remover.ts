/**
 * Removes iframes.
 *
 * @param iframe The node to check.
 */
export default function iframeRemover( iframe: Node ) {
	if ( iframe.nodeName === 'IFRAME' ) {
		const node = iframe as HTMLIFrameElement;
		const text = node.ownerDocument!.createTextNode( node.src );
		node.parentNode!.replaceChild( text, node );
	}
}
