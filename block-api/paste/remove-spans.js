/**
 * WordPress dependencies
 */
import { nodetypes } from '@wordpress/utils';

const { ELEMENT_NODE } = nodetypes;

/**
 *
 * @param {Node} nodes DOMElements
 * @return {Node} same nodes, just without span tags
 */
export default function( nodes ) {
	return nodes.map( stripSpans );
}

/**
 * Remove span tags
 * This is because spans are worthless junk without ids, classes, or styles
 * @param {Node} node DOM Node
 * @return {Node} same node, just without span tags
 */
function stripSpans( node ) {
	const newNode = node.cloneNode();
	Array.from( node.childNodes ).forEach( child => {
		if ( ELEMENT_NODE === child.nodeType && 'SPAN' === child.nodeName ) {
			Array.from( child.childNodes ).forEach( grandChild =>
				newNode.appendChild( stripSpans( grandChild ) ) );
		} else {
			newNode.appendChild( stripSpans( child ) );
		}
	} );
	return newNode;
}
