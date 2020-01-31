/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: __experimentalInserterMenuExtension, Slot } = createSlotFill(
	'__experimentalInserterMenuExtension'
);

__experimentalInserterMenuExtension.Slot = Slot;

export default __experimentalInserterMenuExtension;
