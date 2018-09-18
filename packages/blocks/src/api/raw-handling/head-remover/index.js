export default function( node ) {
	if (
		node.nodeName !== 'META' &&
		node.nodeName !== 'STYLE'
	) {
		return;
	}

	node.parentNode.removeChild( node );
}
