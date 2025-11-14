/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( Symbol( 'CollaborationMode' ) );

/**
 * Renders the SlotFill for collaboration mode.
 */
export const CollaborationMode = Fill;

export { Slot };
