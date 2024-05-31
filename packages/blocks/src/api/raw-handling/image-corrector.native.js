/**
 * This method check for copy pasted img elements to see if they don't have suspicious attributes.
 *
 * @param {Node} node The node to check.
 *
 * @return {void}
 */
export default function imageCorrector( node ) {
	if ( node.nodeName !== 'IMG' ) {
		return;
	}

	// For local files makes sure the extension is a valid one, if not it removes the path.
	if ( node.src.startsWith( 'file:' ) && node.src.slice( -1 ) === '/' ) {
		node.setAttribute( 'src', '' );
	}

	// Remove trackers and hardly visible images.
	if ( node.height === 1 || node.width === 1 ) {
		node.parentNode.removeChild( node );
	}
}
