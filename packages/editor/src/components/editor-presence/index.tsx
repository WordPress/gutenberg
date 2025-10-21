/**
 * External dependencies
 */
import { type ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'EditorPresence' );

/**
 * Renders the SlotFill for editor presence.
 */
export const EditorPresence: ReactNode = Fill;

export { Slot };
