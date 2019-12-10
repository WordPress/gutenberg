/**
 * Removes trailing br elements from text-level content.
 *
 * @param {Element} node Node to check.
 */
export default function( node ) {
	if ( node.nodeName !== 'P' ) {
		return;
	}

	if ( node.hasChildNodes() ) {
		return;
	}

	node.parentNode.removeChild( node );
}
