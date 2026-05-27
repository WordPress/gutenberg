/**
 * Internal dependencies
 */
import normaliseBlocks from './normalise-blocks';

export default function divNormaliser( div: Node ): void {
	if ( div.nodeName !== 'DIV' ) {
		return;
	}

	const node = div as HTMLDivElement;

	node.innerHTML = normaliseBlocks( node.innerHTML );
}
