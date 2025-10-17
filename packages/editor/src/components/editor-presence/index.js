/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'EditorsPresence' );

export const EditorsPresenceFill = Fill;

export function EditorsPresence( { children } ) {
	return <Fill>{ children }</Fill>;
}

EditorsPresence.Slot = Slot;
