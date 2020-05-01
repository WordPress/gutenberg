/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: __experimentalInserterMenuExtension, Slot } = createSlotFill(
	'__experimentalInserterMenuExtension'
);

__experimentalInserterMenuExtension.Slot = Slot;
__experimentalInserterMenuExtension.Slot.slotName =
	'__experimentalInserterMenuExtension';

export default __experimentalInserterMenuExtension;
