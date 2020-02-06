/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { ifBlockEditSelected } from '@wordpress/block-editor';

export const GlobalStylesSlot = createSlotFill( '__GLOBAL_STYLES_SLOT__' );
export const { Slot, Fill: BaseFill } = GlobalStylesSlot;

export const Fill = ifBlockEditSelected( BaseFill );
