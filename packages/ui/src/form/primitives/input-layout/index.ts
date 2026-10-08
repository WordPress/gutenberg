import { InputLayout as _InputLayout } from './input-layout';
import { InputLayoutSlot } from './slot';

/**
 * A low-level component that handles the visual layout of an input-like field,
 * including disabled states and standard prefix/suffix slots.
 */
export const InputLayout = Object.assign( _InputLayout, {
	Slot: InputLayoutSlot,
} );
