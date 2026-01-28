/**
 * External dependencies
 */
import { diffArrays } from 'diff/lib/diff/array';

/**
 * Preserves clientIds from previously rendered blocks to prevent flashing.
 * Uses LCS algorithm to match blocks by name, attributes, and originalContent.
 *
 * This is separate from the visual diff (which compares revision content).
 * This compares the newly parsed blocks against the last rendered blocks
 * to maintain React key stability.
 *
 * @param {Array} newBlocks  Newly parsed blocks with fresh clientIds.
 * @param {Array} prevBlocks Previously rendered blocks with stable clientIds.
 * @return {Array} Blocks with preserved clientIds where possible.
 */
export function preserveClientIds( newBlocks, prevBlocks ) {
	if ( ! prevBlocks?.length || ! newBlocks?.length ) {
		return newBlocks;
	}

	// Create signatures for LCS matching using name, attributes, and originalContent.
	const createSignature = ( block ) =>
		JSON.stringify( {
			name: block.name,
			attributes: block.attributes,
			originalContent: block.originalContent,
		} );
	const newSigs = newBlocks.map( createSignature );
	const prevSigs = prevBlocks.map( createSignature );

	const diffResult = diffArrays( prevSigs, newSigs );

	let newIndex = 0;
	let prevIndex = 0;
	const result = [];

	for ( const chunk of diffResult ) {
		if ( chunk.removed ) {
			// Blocks only in prev render - skip them.
			prevIndex += chunk.count;
		} else if ( chunk.added ) {
			// Blocks only in new render - keep new clientIds.
			for ( let i = 0; i < chunk.count; i++ ) {
				result.push( newBlocks[ newIndex++ ] );
			}
		} else {
			// Matched blocks - preserve clientIds from prev render.
			for ( let i = 0; i < chunk.count; i++ ) {
				const newBlock = newBlocks[ newIndex++ ];
				const prevBlock = prevBlocks[ prevIndex++ ];
				result.push( {
					...newBlock,
					clientId: prevBlock.clientId,
					innerBlocks: preserveClientIds(
						newBlock.innerBlocks,
						prevBlock.innerBlocks
					),
				} );
			}
		}
	}

	return result;
}
