export default function headRemover( node ) {
	if (
		node.nodeName !== 'SCRIPT' &&
		node.nodeName !== 'NOSCRIPT' &&
		node.nodeName !== 'TEMPLATE' &&
		node.nodeName !== 'STYLE'
	) {
		return;
	}

	node.parentNode.removeChild( node );
}
