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
	const iframeRegex = /(?:<iframe[^>]*)(?:(?:\/>)|(?:>.*?<\/iframe>))/gi;

	return (
		( ! rawTransform &&
			( node.nodeName === 'IFRAME' ||
				iframeRegex.test( node.innerHTML ) ) ) ||
		( rawTransform &&
			node.nodeName === 'FIGURE' &&
			rawTransform.blockName === 'core/html' &&
			iframeRegex.test( node.innerHTML ) )
	);
}
