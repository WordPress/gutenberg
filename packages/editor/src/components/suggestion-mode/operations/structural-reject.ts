/**
 * Plan the block-tree effects of rejecting a structural suggestion.
 *
 * Reject behavior depends on the structural op type:
 *   - block-remove: drop the marker (block stays).
 *   - block-insert-after: remove the block to undo the suggested insertion.
 *     The marker on the live block goes away with the block itself.
 *   - block-move: clear the marker, then move the block back to its pre-move
 *     parent + index, rebuilding or removing the list a list indent or
 *     outdent created or emptied along the way.
 */
import { createBlock } from '@wordpress/blocks';
import { clearSuggestionMarkerAttributes } from './attributes';
import type { SuggestionOperation } from './payload';
import type { BlockPlan, BlockTreeReader, PlanStep } from './plan';

/**
 * Plan the reject of a structural op on a live block.
 *
 * @param structuralOp The structural op.
 * @param clientId     The block the suggestion targets.
 * @param reader       Block tree reader.
 * @return The plan.
 */
export function planStructuralReject(
	structuralOp: SuggestionOperation,
	clientId: string,
	reader: BlockTreeReader
): BlockPlan {
	if ( structuralOp.type === 'block-insert-after' ) {
		return {
			steps: [
				{ step: 'bypass', clientId },
				{ step: 'clearOverlay', clientId },
				{ step: 'removeBlock', clientId },
			],
			batched: [],
		};
	}
	if ( structuralOp.type === 'block-move' ) {
		return planMoveReject( structuralOp, clientId, reader );
	}
	const steps: PlanStep[] = [];
	const clearAttrs = clearSuggestionMarkerAttributes(
		reader.getBlockAttributes( clientId )
	);
	if ( clearAttrs ) {
		steps.push(
			{ step: 'bypass', clientId },
			{ step: 'updateBlockAttributes', clientId, attributes: clearAttrs }
		);
	}
	steps.push( { step: 'clearOverlay', clientId } );
	return { steps, batched: [] };
}

/**
 * Plan putting a moved block back where it came from.
 *
 * @param structuralOp The `block-move` op.
 * @param clientId     The moved block.
 * @param reader       Block tree reader.
 * @return The plan.
 */
function planMoveReject(
	structuralOp: SuggestionOperation,
	clientId: string,
	reader: BlockTreeReader
): BlockPlan {
	const clearAttrs = clearSuggestionMarkerAttributes(
		reader.getBlockAttributes( clientId )
	);
	const liveParent = reader.getBlockRootClientId( clientId ) ?? '';
	/*
	 * The recorded parents are session-local client ids, regenerated whenever
	 * the post is parsed again. A move within one parent needs no recorded id
	 * at all: the block's live parent is the parent it came from. A move
	 * across parents restores to the recorded parent only while that block
	 * still exists; after a reload it cannot be resolved, so the block is
	 * restored within its current parent (a documented limitation).
	 */
	const recordedFrom = structuralOp.fromParentClientId ?? '';
	const recordedTo = structuralOp.toParentClientId ?? '';
	let restoreParent = liveParent;
	if (
		recordedFrom !== recordedTo &&
		( recordedFrom === '' || reader.getBlockAttributes( recordedFrom ) )
	) {
		restoreParent = recordedFrom;
	}
	/*
	 * List indent and outdent create or empty a nested list in the same
	 * update as the move (#73411). An outdent's emptied list is gone, so it
	 * is rebuilt, or reused when an earlier reject already rebuilt it; an
	 * indent's list is removed once the item leaves it empty. The rebuilt
	 * list copies the type and attributes of the list the item sits in now,
	 * never the note payload: the suggester writes the payload, and the
	 * reviewer's reject would otherwise insert whatever block it names.
	 */
	const dissolved = structuralOp.fromParentBlock;
	const carrierName =
		liveParent !== '' ? reader.getBlockName( liveParent ) : null;
	const steps: PlanStep[] = [];
	let rebuiltParent: any = null;
	if (
		recordedFrom !== '' &&
		carrierName &&
		! reader.getBlockAttributes( recordedFrom ) &&
		dissolved &&
		( dissolved.parentClientId === null ||
			reader.getBlockAttributes( dissolved.parentClientId ) )
	) {
		const rebuilt = reader.getBlockOrder( dissolved.parentClientId ?? '' )[
			dissolved.index ?? 0
		];
		if (
			rebuilt &&
			rebuilt !== liveParent &&
			reader.getBlockName( rebuilt ) === carrierName
		) {
			restoreParent = rebuilt;
		} else {
			const moved = reader.getBlock( clientId );
			const { metadata, ...carrierAttributes } =
				reader.getBlockAttributes( liveParent ) ?? {};
			rebuiltParent = createBlock( carrierName, carrierAttributes, [
				{
					...moved,
					attributes: {
						...moved.attributes,
						...clearAttrs,
					},
				},
			] );
			steps.push( { step: 'bypass', clientId: rebuiltParent.clientId } );
		}
	}
	const emptiedParent =
		liveParent !== '' &&
		( rebuiltParent || liveParent !== restoreParent ) &&
		reader.getBlockOrder( liveParent ).length === 1 &&
		! reader.getBlockAttributes( liveParent )?.metadata?.suggestion &&
		reader.getBlockName( liveParent ) ===
			( rebuiltParent
				? carrierName
				: reader.getBlockName( restoreParent ) )
			? liveParent
			: null;
	steps.push(
		{ step: 'bypass', clientId },
		{ step: 'clearOverlay', clientId }
	);
	/*
	 * Batch the marker-clear and the restoring move into ONE store update.
	 * The interceptor recognizes a reject landing by their combination — a
	 * block that moved in the same tick its pending-move marker disappeared —
	 * and adopts it instead of re-capturing the restore as a fresh move
	 * suggestion (which is what happens when the two dispatches fire the
	 * subscriber separately and the reviewer is in Suggesting intent). This
	 * is also the shape a remote reject arrives in through sync.
	 */
	const batched: PlanStep[] = [];
	if ( rebuiltParent ) {
		batched.push(
			{ step: 'removeBlock', clientId, selectPrevious: false },
			{
				step: 'insertBlock',
				block: rebuiltParent,
				index: dissolved.index ?? 0,
				rootClientId: dissolved.parentClientId ?? undefined,
				updateSelection: false,
			}
		);
	} else {
		if ( clearAttrs ) {
			batched.push( {
				step: 'updateBlockAttributes',
				clientId,
				attributes: clearAttrs,
			} );
		}
		batched.push( {
			step: 'moveBlockToPosition',
			clientId,
			/*
			 * `fromRootClientId` must be the block's CURRENT parent: after a
			 * cross-parent move the block lives in the destination parent, and
			 * the reducer looks the block up there. Passing the original parent
			 * for both roots made cross-parent rejects silently no-op.
			 * `moveBlockToPosition` expects '' (not null) for the root.
			 */
			fromRootClientId: liveParent,
			toRootClientId: restoreParent,
			index: structuralOp.fromIndex ?? 0,
		} );
	}
	if ( emptiedParent ) {
		batched.push(
			{ step: 'bypass', clientId: emptiedParent },
			{
				step: 'removeBlock',
				clientId: emptiedParent,
				selectPrevious: false,
			}
		);
	}
	return { steps, batched };
}
