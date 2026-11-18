import { createSlotFill } from '@wordpress/components';

/**
 * Where the block inspector shows how to edit the entity a synced pattern or
 * template part block renders. The blocks fill it themselves, since those
 * entities are WordPress-specific. Fills receive the `clientId` of the block
 * the inspector shows, so each block renders its fill only for itself.
 */
export const PrivateBlockInspectorEditOriginal = createSlotFill(
	Symbol( 'PrivateBlockInspectorEditOriginal' )
);
