/**
 * WordPress dependencies
 */
import { nodetypes } from '@wordpress/utils';

const { ELEMENT_NODE } = nodetypes;

const UNSUPPORTED_ELS = [ 'SPAN', 'META' ];

/**
 *
 * @param {Node} nodes DOMElements
 * @return {Node} same nodes, just without unsupported tags
 */
export default function( nodes ) {
	return nodes.map( stripElements );
}

const shouldStrip = node => ELEMENT_NODE === node.nodeType && UNSUPPORTED_ELS.includes( node.nodeName );

/**
 * Remove unsupported tags
 * @param {Node} node DOM Node
 * @return {Node} same node, just without unsupported tags
 */
function stripElements( node ) {
	const newNode = node.cloneNode();
	Array.from( node.childNodes ).forEach( child => {
		if ( shouldStrip( child ) ) {
			Array.from( child.childNodes ).forEach( grandChild =>
				newNode.appendChild( stripElements( grandChild ) ) );
		} else {
			newNode.appendChild( stripElements( child ) );
		}
	} );
	return newNode;
}
