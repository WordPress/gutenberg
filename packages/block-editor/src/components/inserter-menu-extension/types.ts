import type { createSlotFill } from '@wordpress/components';

type SlotFill = ReturnType< typeof createSlotFill >;

/**
 * The inserter menu extension fill, which carries its slot as a static.
 */
export type InserterMenuExtension = SlotFill[ 'Fill' ] & {
	Slot: SlotFill[ 'Slot' ];
};
