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

	// For local files makes sure the path doesn't end with an invalid extension.
	// This scenario often happens with content from MS Word and similar text apps.
	// We still need to support local files pasted from the users Media library.
	if ( node.src.startsWith( 'file:' ) && node.src.slice( -1 ) === '/' ) {
		node.setAttribute( 'src', '' );
	}

	// Remove trackers and hardly visible images.
	if ( node.height === 1 || node.width === 1 ) {
		node.parentNode.removeChild( node );
	}
}
