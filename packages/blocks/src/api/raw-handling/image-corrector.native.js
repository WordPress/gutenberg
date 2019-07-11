// eslint-disable-next-line valid-jsdoc
/**
 * This method check for copy pasted img elements to see if they don't have
 * suspicious attributes.
 *
 * @type {import('./').NodeFilterFunc}
 */
export default function( node ) {
	if ( node.nodeName !== 'IMG' ) {
		return;
	}

	// Remove trackers and hardly visible images.
	if ( node.height === 1 || node.width === 1 ) {
		node.parentNode.removeChild( node );
	}
}
