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

export function isUntransformedIframe( rawTransform, node ) {
	const iframeRegex = /(?:<iframe[^>]*)(?:(?:\/>)|(?:>.*?<\/iframe>))/gi;

	return (
		( ! rawTransform && containsIframe( node, iframeRegex ) ) ||
		( rawTransform &&
			containsCoreHtmlIframeTransform(
				node,
				rawTransform.blockName,
				iframeRegex
			) )
	);
}

function containsIframe( node, iframeRegex ) {
	return node.nodeName === 'IFRAME' || iframeRegex.test( node.innerHTML );
}

function containsCoreHtmlIframeTransform( node, blockName, iframeRegex ) {
	return (
		node.nodeName === 'FIGURE' &&
		blockName === 'core/html' &&
		iframeRegex.test( node.innerHTML )
	);
}
