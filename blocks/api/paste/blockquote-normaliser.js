/**
 * Internal dependencies
 */
import normaliseBlocks from './normalise-blocks';

/**
 * Browser dependencies
 */
const { ELEMENT_NODE } = window.Node;

export default function( node ) {
	if ( node.nodeType !== ELEMENT_NODE ) {
		return;
	}

	if ( node.nodeName !== 'BLOCKQUOTE' ) {
		return;
	}

	node.innerHTML = normaliseBlocks( node.innerHTML );
}
