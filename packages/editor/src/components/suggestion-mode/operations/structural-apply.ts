/**
 * Plan the block-tree effects of accepting a structural suggestion.
 */
import { applyOperations, clearSuggestionMarkerAttributes } from './attributes';
import type { SuggestionOperation } from './payload';
import type { BlockPlan, BlockTreeReader } from './plan';

/**
 * Plan the apply of a structural op. Structural ops can't ride the
 * `updateBlockAttributes` path: their apply mutates the tree rather than a
 * single block's attributes.
 *
 * @param structuralOp   The structural op.
 * @param operations     Every operation in the payload.
 * @param targetClientId The block the suggestion targets.
 * @param reader         Block tree reader.
 * @return The plan, or null for an op type with no apply effect.
 */
export function planStructuralApply(
	structuralOp: SuggestionOperation,
	operations: SuggestionOperation[],
	targetClientId: string,
	reader: BlockTreeReader
): BlockPlan | null {
	const plan: BlockPlan = { steps: [], batched: [] };
	if ( structuralOp.type === 'block-remove' ) {
		/*
		 * The marker-clear and the removal are batched into one store update,
		 * so the accept is one undo level: undoing it brings the block back
		 * with its pending-remove marker, which reopens the note, and redo
		 * removes it again. Two updates would let the first undo bring the
		 * block back unmarked, beside a note that still reads as applied.
		 */
		plan.steps.push( { step: 'bypass', clientId: targetClientId } );
		const clearAttrs = clearSuggestionMarkerAttributes(
			reader.getBlockAttributes( targetClientId )
		);
		if ( clearAttrs ) {
			plan.batched.push( {
				step: 'updateBlockAttributes',
				clientId: targetClientId,
				attributes: clearAttrs,
			} );
		}
		plan.batched.push( {
			step: 'removeBlock',
			clientId: targetClientId,
		} );
		return plan;
	}
	if (
		structuralOp.type === 'block-insert-after' ||
		structuralOp.type === 'block-move'
	) {
		// The block is already at its proposed location (the user inserted
		// or moved it during Suggest mode); apply commits the captured edits
		// onto the live block AND clears the pending marker so the block
		// loses its dimmed/outlined treatment.
		//
		// Attribute-set ops in the same payload represent edits the user
		// made between the structural change and auto-save. They never
		// reach the live block on the suggester's side (the interceptor
		// diverts them into the marker's proposal), so the live block is
		// still in the captured shape. Apply must materialize those edits
		// on the live block, otherwise the inserted/moved block ends up in
		// the wrong shape after acceptance.
		const withOpsApplied = applyOperations(
			reader.getBlockAttributes( targetClientId ),
			operations
		);
		const markerCleared = clearSuggestionMarkerAttributes( withOpsApplied );
		plan.steps.push(
			{ step: 'bypass', clientId: targetClientId },
			{
				step: 'updateBlockAttributes',
				clientId: targetClientId,
				attributes: markerCleared
					? { ...withOpsApplied, ...markerCleared }
					: withOpsApplied,
			}
		);
		return plan;
	}
	return null;
}
