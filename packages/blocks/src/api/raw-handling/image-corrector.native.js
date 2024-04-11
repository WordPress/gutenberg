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

	if ( node.src.indexOf( 'file:' ) === 0 ) {
		node.setAttribute( 'src', '' );
	}

	// Remove trackers and hardly visible images.
	if ( node.height === 1 || node.width === 1 ) {
		node.parentNode.removeChild( node );
	}
}
