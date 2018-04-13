/**
 * Internal dependencies
 */
import normaliseBlocks from './normalise-blocks';
import { isInlineWrapper } from './utils';

/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

function replace( node, tagName ) {
	const newNode = document.createElement( tagName );

	while ( node.firstChild ) {
		newNode.appendChild( node.firstChild );
	}

	node.parentNode.replaceChild( newNode, node );
}

export default function( node ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	if ( node.nodeName !== 'BLOCKQUOTE' ) {
		return;
	}

	Array.from( node.childNodes ).forEach( ( childNode ) => {
		// Quote component only handle p tag inside blockquote tag
		// normaliseBlocks will not wrap any inline wrapper tag with p so we have to do it manually.
		// If child node is inline wrapper node and not paragraph then convert it to paragraph.
		if ( isInlineWrapper( childNode ) && node.nodeName.toLowerCase() !== 'p' ) {
			replace( childNode, 'p' );
		}
	} );

	node.innerHTML = normaliseBlocks( node.innerHTML );
}
