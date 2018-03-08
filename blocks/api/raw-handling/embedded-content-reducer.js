/**
 * Internal dependencies
 */
import { isEmbedded } from './utils';

/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

/**
 * This filter takes embedded content out of paragraphs.
 *
 * @param {Node} node The node to filter.
 *
 * @return {void}
 */
export default function( node ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	if ( ! isEmbedded( node ) ) {
		return;
	}

	let nodeToInsert = node;
	// if the embedded is an image and its parent is an anchor with just the image
	// take the anchor out instead of just the image
	if (
		'IMG' === node.nodeName &&
		1 === node.parentNode.childNodes.length &&
		'A' === node.parentNode.nodeName
	) {
		nodeToInsert = node.parentNode;
	}

	let wrapper = nodeToInsert;

	while ( wrapper && wrapper.nodeName !== 'P' ) {
		wrapper = wrapper.parentElement;
	}

	if ( wrapper ) {
		wrapper.parentNode.insertBefore( nodeToInsert, wrapper );
	}
}
