/**
 * WordPress dependencies
 */
import { remove } from '@wordpress/dom';

/**
 * Removes iframes.
 *
 * @param {Node} node The node to check.
 *
 * @return {void}
 */
export default function( node ) {
	if ( node.nodeName === 'IFRAME' ) {
		remove( node );
	}
}

export function checkForUntransformedIframe( rawTransform, node ) {
	const frameRegex = /(?:<iframe[^>]*)(?:(?:\/>)|(?:>.*?<\/iframe>))/gi;
	return (
		rawTransform &&
		frameRegex.exec( node.innerHTML ) &&
		rawTransform.blockName === 'core/html'
	);
}
