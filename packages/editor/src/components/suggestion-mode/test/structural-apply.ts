import { describe, expect, it } from 'vitest';
import { planStructuralApply } from '../operations/structural-apply';

function readerFor( attributes: Record< string, any > ) {
	return {
		getBlockAttributes: () => attributes,
		getBlockRootClientId: () => null,
		getBlockName: () => 'core/paragraph',
		getBlockOrder: () => [ 'a' ],
		getBlock: () => null,
	};
}

describe( 'planStructuralApply', () => {
	it( 'clears the marker and removes the block in one store update for an accepted removal', () => {
		/*
		 * One update is one undo level: undoing the accept brings the block
		 * back with its marker, and redo removes it again.
		 */
		const op = { type: 'block-remove', clientId: 'a' } as any;
		const plan = planStructuralApply(
			op,
			[ op ],
			'a',
			readerFor( {
				content: 'A',
				metadata: {
					noteId: [ 4 ],
					suggestion: { type: 'pending-remove' },
				},
			} )
		);

		expect( plan ).toEqual( {
			steps: [ { step: 'bypass', clientId: 'a' } ],
			batched: [
				{
					step: 'updateBlockAttributes',
					clientId: 'a',
					attributes: { metadata: { noteId: [ 4 ] } },
				},
				{ step: 'removeBlock', clientId: 'a' },
			],
		} );
	} );
} );
