
export default function( node ) {
	if ( node.nodeName !== 'IMG' ) {
		return;
	}

	// Remove trackers and hardly visible images.
	if ( node.height === 1 || node.width === 1 ) {
		node.parentNode.removeChild( node );
	}
}
