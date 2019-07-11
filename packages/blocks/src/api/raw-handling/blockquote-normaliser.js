/**
 * Internal dependencies
 */
import normaliseBlocks from './normalise-blocks';

// eslint-disable-next-line valid-jsdoc
/**
 * @type {import('./').NodeFilterFunc}
 */
export default function( node ) {
	if ( node.nodeName !== 'BLOCKQUOTE' ) {
		return;
	}

	node.innerHTML = normaliseBlocks( node.innerHTML );
}
