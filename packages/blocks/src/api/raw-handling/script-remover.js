export default function scriptRemover( node ) {
	if ( node.nodeName !== 'SCRIPT' ) {
		return;
	}

	node.parentNode.removeChild( node );
}
