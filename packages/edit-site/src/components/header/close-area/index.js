/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: __experimentalSiteEditorCloseArea, Slot } = createSlotFill(
	'__experimentalSiteEditorCloseArea'
);

__experimentalSiteEditorCloseArea.Slot = Slot;

export default __experimentalSiteEditorCloseArea;
