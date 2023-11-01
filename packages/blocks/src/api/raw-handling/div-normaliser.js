/**
 * Internal dependencies
 */
import normaliseBlocks from './normalise-blocks';

export default function divNormaliser( node ) {
	if ( node.nodeName !== 'DIV' ) {
		return;
	}

	node.innerHTML = normaliseBlocks( node.innerHTML );
}
