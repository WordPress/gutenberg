/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const BlockInspectorPreTabsKey = Symbol( 'BlockInspectorPreTabs' );

export const {
	Fill: BlockInspectorPreTabsFill,
	Slot: BlockInspectorPreTabsSlot,
} = createSlotFill( BlockInspectorPreTabsKey );
