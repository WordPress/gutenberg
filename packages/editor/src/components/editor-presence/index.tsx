/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'EditorPresence' );

export const EditorPresenceFill = Fill;

export function EditorPresence( { children } ) {
	return <Fill>{ children }</Fill>;
}

EditorPresence.Slot = Slot;
