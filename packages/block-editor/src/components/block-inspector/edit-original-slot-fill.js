import { createSlotFill } from '@wordpress/components';

/**
 * Where the block inspector shows how to edit the entity a synced pattern or
 * template part block renders. Those entities are WordPress-specific, so the
 * editor package fills it; the fill receives the block's `clientId`.
 */
export const PrivateBlockInspectorEditOriginal = createSlotFill(
	Symbol( 'PrivateBlockInspectorEditOriginal' )
);
