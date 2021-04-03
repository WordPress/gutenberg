export default function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}
